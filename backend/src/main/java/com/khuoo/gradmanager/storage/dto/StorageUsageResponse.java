package com.khuoo.gradmanager.storage.dto;

// storage 사용량 조회 응답 DTO
public record StorageUsageResponse(
        long usedBytes,
        long maxBytes,
        long remainingBytes
) {}