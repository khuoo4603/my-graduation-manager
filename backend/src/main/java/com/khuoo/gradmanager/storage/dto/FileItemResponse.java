package com.khuoo.gradmanager.storage.dto;

import java.time.Instant;

// 파일 목록 내부 아이템(row)
public record FileItemResponse(
        long fileId,
        String category,
        String originalFilename,
        long sizeBytes,
        Instant uploadedAt
) {}