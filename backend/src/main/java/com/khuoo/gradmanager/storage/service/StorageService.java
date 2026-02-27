package com.khuoo.gradmanager.storage.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.storage.config.StorageConstants;
import com.khuoo.gradmanager.storage.dto.FileItemResponse;
import com.khuoo.gradmanager.storage.dto.FileListResponse;
import com.khuoo.gradmanager.storage.dto.StorageUsageResponse;
import com.khuoo.gradmanager.storage.dto.UploadResponse;
import com.khuoo.gradmanager.storage.repository.FileMetadataDao;
import com.khuoo.gradmanager.storage.repository.FileMetadataRepository;
import com.khuoo.gradmanager.storage.repository.UserStorageUsageDao;
import com.khuoo.gradmanager.storage.repository.UserStorageUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final FileMetadataRepository fileMetadataRepository;
    private final UserStorageUsageRepository userStorageUsageRepository;
    private final FileStorageService fileStorageService;

    // 파일 업로드
    @Transactional
    public UploadResponse upload(long userId, String category, MultipartFile file) {
        long fileSize = file.getSize();                         // 업로드할 파일의 크기
        String originalFilename = file.getOriginalFilename();   // 파일명(확장자 포함)


        validateCategory(category); // 카테고리가 유효하지 않으면 오류
        if (fileSize < 0) { throw new ApiException(ErrorCode.INVALID_REQUEST); } // 파일 크기를 계산할 수 없는 경우 오류
        userStorageUsageRepository.ensureRowExists(userId); // usage row 생성 (이미 있다면 row가 생성되지 않음)

        // row lock을 획득 -> 실패 시 SQL실행 중 서버오류
        UserStorageUsageDao.UserStorageUsageRow usage = userStorageUsageRepository.findForUpdate(userId)
                        .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR));

        // 현재 사용량 + 업로드 크기가 1GB를 초과하면 오류
        if (usage.usedBytes() + fileSize > StorageConstants.MAX_BYTES) { throw new ApiException(ErrorCode.STORAGE_QUOTA_EXCEEDED); }

        // 파일명이 null/공백이면 오류
        if (originalFilename == null || originalFilename.isBlank()) { throw new ApiException(ErrorCode.INVALID_REQUEST);}

        // 사용자의 파일명이 중복될 경우 오류
        if (fileMetadataRepository.duplicateFilename(userId, originalFilename)) { throw new ApiException(ErrorCode.DUPLICATE_RESOURCE); }


        String storedFilename = generateStoredFilename(originalFilename);           // 파일명 UUID 변환
        String storedPath = buildRelativePath(userId, category, storedFilename);    // 저장 위치
        String contentType = safeContentType(file.getContentType());                // mime
        Instant now = Instant.now();                                                // 파일 업로드 시간

        boolean fileSaved = false; // 실제 파일저장 성공 여부
        try {
            fileStorageService.save(storedPath, file); // 디스크에 파일을 먼저 저장
            fileSaved = true;

            // file_metadata 테이블에 기록
            long fileId = fileMetadataRepository.insert(
                    new FileMetadataDao.FileMetadataInsert(
                            userId,
                            category,
                            originalFilename,
                            storedFilename,
                            storedPath,
                            contentType,
                            fileSize,
                            now
                    )
            );

            // PK를 정상적으로 받지 못한 경우 내부 오류로 처리
            if (fileId <= 0) { throw new ApiException(ErrorCode.INTERNAL_ERROR); }

            // Storage 사용량 증가
            userStorageUsageRepository.updateUsedBytes(userId, (usage.usedBytes() + fileSize));

            return new UploadResponse(fileId, category, originalFilename, fileSize, now);

        } catch (DuplicateKeyException e) { // 저장경로 중복일 경우 (ex. 같은 경로에 uuid 중복)
            throw new ApiException(ErrorCode.DUPLICATE_RESOURCE, e);

        } catch (ApiException e) {
            if (fileSaved) { safeDeleteIgnore(storedPath); } // DB 단계에서 실패한 경우 유령 파일을 남기지 않도록 삭제
            throw e;

        } catch (Exception e) {
            if (fileSaved) { safeDeleteIgnore(storedPath); } // 서버 예외
            throw new ApiException(ErrorCode.INTERNAL_ERROR, e);
        }
    }

    // 파일명 UUID 변환
    private String generateStoredFilename(String originalFilename) {
        int dotIdx = originalFilename.lastIndexOf('.');
        String ext = dotIdx > 0 ? originalFilename.substring(dotIdx) : ""; // 확장자가 없다면 확장자 공백
        return UUID.randomUUID() + ext;
    }

    // 파일 저장 path 빌드
    private String buildRelativePath(long userId, String category, String storedFilename) {
        return "users/%d/%s/%s".formatted(userId, category, storedFilename);
    }

    // contentType null/공백 시 기본 mime저장
    private String safeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) { return "application/octet-stream"; }
        return contentType;
    }

    // 유령 파일 제거
    private void safeDeleteIgnore(String storedPath) {
        try {
            fileStorageService.delete(storedPath);
        } catch (Exception ignore) {
            // 롤백 실패는 추가 예외로 로직을 중지하지 말고 예외 출력
            log.error("Rollback file delete failed: {}", storedPath, ignore);
        }
    }

    // 파일 목록 조회
    public FileListResponse list(long userId, String categoryOrNull) {
        if (categoryOrNull != null) { validateCategory(categoryOrNull); } // 카테고리 유효성 검증

        // 사용자가 가지고 있는 메타데이터 저장
        List<FileMetadataDao.FileMetadataRow> rows = fileMetadataRepository.findAllByUserId(userId, categoryOrNull);

        // 응답용 Dto 구조로 변환
        List<FileItemResponse> items = new ArrayList<>();
        for (FileMetadataDao.FileMetadataRow row : rows) {
            FileItemResponse response = new FileItemResponse(
                    row.fileId(),
                    row.category(),
                    row.originalFilename(),
                    row.sizeBytes(),
                    row.uploadedAt()
            );
            items.add(response);
        }
        return new FileListResponse(items);
    }


    // 다운로드 (다운로드 기초 데이터 가공)
    public DownloadResult Download(long userId, long fileId) {
        try {
            // 다운로드 할 메타데이터를 조회 (없는 파일이면 오류 처리)
            FileMetadataDao.FileMetadataRow meta = fileMetadataRepository.findById(fileId)
                            .orElseThrow(() -> new ApiException(ErrorCode.FILE_NOT_FOUND));

            // 실제 로그인한 사용자의 파일인지 검사
            if (meta.userId() != userId) { throw new ApiException(ErrorCode.FORBIDDEN); }

            // 실제 경로에 파일 존재 여부 확인 (파일이 없을 경우 디스크(마운트) 손상 가능성)
            if (!fileStorageService.exists(meta.storedPath())) { throw new ApiException(ErrorCode.FILE_NOT_FOUND); }

            // 스트리밍 응답 객체 생성 (FileSystemResource)
            Resource resource = fileStorageService.loadAsResource(meta.storedPath());

            return new DownloadResult(
                    resource,
                    meta.originalFilename(),
                    meta.contentType(),
                    meta.sizeBytes()
            );

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, e); // 파일 시스템/DB 예외는 서버 오류 처리
        }
    }

    // 다운로드 시 반환 객체
    public record DownloadResult(
            Resource resource,          // 스트리밍 리소스(FileSystemResource).
            String originalFilename,    // 원본 파일명
            String contentType,         // mime
            long sizeBytes              // 해당 파일의 크기
    ) {}

    // 파일 삭제
    @Transactional
    public void delete(long userId, long fileId) {
        // 다운로드 할 메타데이터를 조회 (없는 파일이면 오류 처리)
        FileMetadataDao.FileMetadataRow meta = fileMetadataRepository.findById(fileId)
                        .orElseThrow(() -> new ApiException(ErrorCode.FILE_NOT_FOUND));

        // 실제 로그인한 사용자의 파일인지 검사
        if (meta.userId() != userId) { throw new ApiException(ErrorCode.FORBIDDEN); }

        try {
            userStorageUsageRepository.ensureRowExists(userId); // usage row가 없다면 생성 (오류 방지)

            // row lock을 획득 -> 실패 시 SQL실행 중 서버오류
            UserStorageUsageDao.UserStorageUsageRow usage = userStorageUsageRepository.findForUpdate(userId)
                            .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR));

            // 실파일을 삭제한다.
            fileStorageService.delete(meta.storedPath());

            // 메타데이터를 삭제한다.
            int deleted = fileMetadataRepository.deleteById(fileId);

            // 삭제한 메타데이터가 없으면 404 (중복된 요청 방지)
            if (deleted == 0) { throw new ApiException(ErrorCode.FILE_NOT_FOUND); }

            // Storag 사용량 (음수 방지)
            long nextUsed =  Math.max(0, (usage.usedBytes() - meta.sizeBytes()));

            // Storag 사용량 감소
            userStorageUsageRepository.updateUsedBytes(userId, nextUsed);

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, e); // 파일 시스템/DB 예외는 서버 오류 처리
        }
    }

    // storage 사용량 조회
    @Transactional(readOnly = true)
    public StorageUsageResponse usage(long userId) {

        // 유저의 storage 사용량 조회
        Optional<UserStorageUsageRepository.UserStorageUsageRow> optional =
                userStorageUsageRepository.findByUserId(userId);

        // row가 없다면 아직 파일이 존재하지 않음. (사용량 0 반환)
        long used = optional.isPresent() ? optional.get().usedBytes() : 0L;

        // 최대 사용량 (1GB)
        long max = StorageConstants.MAX_BYTES;

        // 남은 사용량 (음수 방지)
        long remaining = Math.max(0, max - used);

        return new StorageUsageResponse(used, max, remaining);
    }


    // common
    // 카테고리 허용값 강제
    private void validateCategory(String category) {
        if (category == null || category.isBlank()) { throw new ApiException(ErrorCode.INVALID_REQUEST); } // 카테고리의 null/공백 허용하지 않음

        // 카테고리 허용값 -> 다른 값이면 오류
        switch (category) {
            case "GRAD_REQUIREMENTS", "GRAD_SUBMISSIONS", "PROJECT",
                 "PORTFOLIO", "CLASS_MATERIALS":
                break;

            default:
                throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
    }
}