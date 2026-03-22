package com.khuoo.gradmanager.user.service;

import com.khuoo.gradmanager.course.repository.CourseRepository;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.profile.repository.UserMajorRepository;
import com.khuoo.gradmanager.storage.repository.FileMetadataRepository;
import com.khuoo.gradmanager.storage.repository.UserStorageUsageRepository;
import com.khuoo.gradmanager.storage.service.FileStorageService;
import com.khuoo.gradmanager.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final UserMajorRepository userMajorRepository;
    private final CourseRepository courseRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final UserStorageUsageRepository userStorageUsageRepository;
    private final FileStorageService fileStorageService;

    // 현재 로그인 사용자 계정 삭제
    @Transactional
    public void deleteAccount(long userId) {
        // 삭제 대상 사용자 존재 여부 검증
        userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        List<FileMetadataRepository.FileMetadataRow> fileRows =
                fileMetadataRepository.findAllByUserId(userId, null); // 삭제 대상 사용자 파일 메타데이터 조회

        for (FileMetadataRepository.FileMetadataRow fileRow : fileRows) {
            try {
                // 실제 NAS 파일을 먼저 삭제하고, 파일이 이미 없으면 deleteIfExists가 그대로 통과
                fileStorageService.delete(fileRow.storedPath());
            } catch (ApiException e) {
                // 파일 경로 이상값 또는 스토리지 접근 오류는 의존 시스템 오류로 전파
                if (e.getErrorCode() == ErrorCode.DEPENDENCY_FAILURE) { throw e; }
                throw new ApiException(ErrorCode.DEPENDENCY_FAILURE, e);
            } catch (Exception e) {
                throw new ApiException(ErrorCode.DEPENDENCY_FAILURE, e);
            }
        }

        // FK 제약 순서대로 유저 데이터 삭제
        fileMetadataRepository.deleteByUserId(userId);      // 파일 메타데이터
        userStorageUsageRepository.deleteByUserId(userId);  // 사용자 스토리지
        courseRepository.deleteByUserId(userId);            // 사용자 수강 내역
        userMajorRepository.deleteByUserId(userId);         // 사용자 전공

        int deleted = userRepository.deleteById(userId);    // 사용자 계정
        // 최종 사용자 row 삭제 여부 검증
        if (deleted == 0) { throw new ApiException(ErrorCode.USER_NOT_FOUND); }
    }
}
