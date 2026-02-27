package com.khuoo.gradmanager.storage.dto;

import java.time.Instant;

// 파일 업로드 성공 응답 DTO
public record UploadResponse(
        long fileId,
        String category,
        String originalFilename,
        long sizeBytes,
        Instant uploadedAt
) {}