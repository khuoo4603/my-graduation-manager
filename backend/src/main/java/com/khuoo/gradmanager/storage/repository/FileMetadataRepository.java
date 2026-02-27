package com.khuoo.gradmanager.storage.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FileMetadataRepository {

    // 메타데이터 단건 조회. (fileId 기준)
    Optional<FileMetadataRow> findById(long fileId);

    // 메타데이터 조회 (userId 기준) / categoryOrNull -> 선택
    List<FileMetadataRow> findAllByUserId(long userId, String categoryOrNull);
    record FileMetadataRow(
            long fileId,
            long userId,
            String category,        // 카테고리
            String originalFilename,// 실제 파일명
            String storedFilename,  // UUID 파일명
            String storedPath,      // root 기준 상대경로(users/{userId}/{category}/{uuid}.ext)
            String contentType,     // mime
            long sizeBytes,         // 저장 용량
            Instant uploadedAt      // 업데이트 시각
    ) {}

    // 동일 사용자 기준 동일 파일명 존재 여부
    boolean duplicateFilename(long userId, String originalFilename);

    // 파일 메타데이터 저장
    long insert(FileMetadataInsert insert);
    record FileMetadataInsert(
            long userId,
            String category,        // 카테고리
            String originalFilename,// 실제 파일명
            String storedFilename,  // UUID 파일명
            String storedPath,      // root 기준 상대경로(users/{userId}/{category}/{uuid}.ext)
            String contentType,     // mime
            long sizeBytes,         // 저장 용량
            Instant uploadedAt      // 업로드 완료 시각
    ) {}

    // 메타데이터 삭제
    int deleteById(long fileId);



}