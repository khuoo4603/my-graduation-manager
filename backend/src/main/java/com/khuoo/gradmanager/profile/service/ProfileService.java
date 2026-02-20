package com.khuoo.gradmanager.profile.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.profile.dto.ProfileResponse;
import com.khuoo.gradmanager.profile.mapper.ProfileMapper;
import com.khuoo.gradmanager.profile.repository.*;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Profile 도메인 로직
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final CurrentUser currentUser;
    private final ProfileRepository profileRepository;
    private final MajorRepository majorRepository;
    private final UserProfileRepository userProfileRepository;
    private final TemplateRepository templateRepository;
    private final ProfileMapper profileMapper;

    // 내 프로필 조회
    public ProfileResponse getMyProfile() {
        Long userId = currentUser.userId();

        var base = profileRepository.findProfileBaseByUserId(userId); // 사용자 기본 프로필 조회
        if (base == null) {
            throw new ApiException(ErrorCode.USER_NOT_FOUND); // 기본 프로필 조회에서 null = 유저 데이터가 없음
        }

        var majorRows = majorRepository.findMajorsByUserId(userId); // 사용자 전공 조회

        return profileMapper.toProfileResponse(base, majorRows);
    }

    // 내 템플릿 변경
    @Transactional
    public void updateMyTemplate(Long templateId) {

        Long userId = currentUser.userId();

        // 유저가 어떤 학부 소속인지 확인
        Long userDeptId = userProfileRepository.findDepartmentIdByUserId(userId);
        if (userDeptId == null) { // 유저가 존재하지 않음
            throw new ApiException(ErrorCode.USER_NOT_FOUND);
        }

        // 템플릿이 적용받고 있는 학부 조회
        Long templateDeptId = templateRepository.findDepartmentIdByTemplateId(templateId);
        if (templateDeptId == null) { // 템플릿을 찾을 수 없음
            throw new ApiException(ErrorCode.TEMPLATE_NOT_FOUND);
        }

        // update하려는 템플릿의 학부가 유저와 일치하는지 확인
        if (!userDeptId.equals(templateDeptId)) {
            throw new ApiException(ErrorCode.TEMPLATE_DEPT_MISMATCH);
        }

        // user의 템플릿 update
        int updated = userProfileRepository.updateTemplateId(userId, templateId);
        if (updated != 1) {
            throw new ApiException(ErrorCode.USER_NOT_FOUND);
        }
    }
}