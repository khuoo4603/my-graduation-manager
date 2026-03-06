package com.khuoo.gradmanager.profile.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.profile.dto.AddUserMajorRequest;
import com.khuoo.gradmanager.profile.dto.AddUserMajorResponse;
import com.khuoo.gradmanager.profile.repository.UserMajorRepository;
import com.khuoo.gradmanager.reference.major.repository.MajorRepository;
import com.khuoo.gradmanager.reference.majorrule.repository.ReferenceMajorCreditRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfileMajorService {
    // 허용된 전공 타입
    private static final Set<String> ALLOWED_MAJOR_TYPES = Set.of(
            "심화전공",
            "주전공",
            "부전공",
            "복수전공"
    );
    private final UserMajorRepository userMajorRepository;
    private final MajorRepository majorRepository;
    private final ReferenceMajorCreditRuleRepository referenceMajorCreditRuleRepository;

    // 사용자 전공 추가
    @Transactional
    public AddUserMajorResponse addUserMajor(long userId, AddUserMajorRequest request) {
        // userId가 0 이하이면 비정상 요청 처리
        if (userId <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 요청 본문 majorId가 없거나 0이하면 오류
        if (request.majorId() == null || request.majorId() <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // majorType이 null이거나 공백이면 요청 오류
        if (request.majorType() == null || request.majorType().isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 입력 문자열의 앞뒤 공백 제거
        String normalizedMajorType = request.majorType().trim();

        // 허용되지 않은 전공 타입이면 요청 오류 처리
        if (!ALLOWED_MAJOR_TYPES.contains(normalizedMajorType)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 존재하지 않는 전공이면 404 처리
        if (!majorRepository.existsById(request.majorId())) {
            throw new ApiException(ErrorCode.MAJOR_NOT_FOUND);
        }

        // major_credit_rule에 없는 전공/전공타입 조합이면 요청 오류 처리
        if (!referenceMajorCreditRuleRepository.existsByMajorIdAndMajorType(request.majorId(), normalizedMajorType)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 동일 사용자에 동일 전공/전공타입이 이미 있으면 409 처리
        if (userMajorRepository.existsByUserIdAndMajorIdAndMajorType(userId, request.majorId(), normalizedMajorType)) {
            throw new ApiException(ErrorCode.DUPLICATE_RESOURCE);
        }

        try {
            long userMajorId = userMajorRepository.insert(userId, request.majorId(), normalizedMajorType);
            return new AddUserMajorResponse(userMajorId);
        } catch (DuplicateKeyException e) {
            // 동시 요청으로 UNIQUE 충돌이 나면 409 처리
            throw new ApiException(ErrorCode.DUPLICATE_RESOURCE);
        }
    }

    // 사용자 전공 삭제
    @Transactional
    public void deleteUserMajor(long userId, long userMajorId) {
        // userId, userMajorId가 0 이하이면 비정상 요청으로 처리
        if (userId <= 0 || userMajorId <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 전공이 실제로 있는지 존재 여부 확인
        UserMajorRepository.UserMajorRow row = userMajorRepository.findById(userMajorId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_MAJOR_NOT_FOUND));

        // 로그인 사용자와 소유자가 다르면 403으로 처리
        if (row.userId() != userId) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        // 삭제 후 삭제된 row 갯수를 반환값으로 받음
        int deleted = userMajorRepository.deleteByIdAndUserId(userMajorId, userId);

        // row=0이면 이미 없는 상태이므로 404로 처리
        if (deleted == 0) {
            throw new ApiException(ErrorCode.USER_MAJOR_NOT_FOUND);
        }
    }
}