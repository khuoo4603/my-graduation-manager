package com.khuoo.gradmanager.storage.repository;

import java.time.Instant;
import java.util.Optional;


public interface UserStorageUsageRepository {

    // usage row 생성 (이미 있다면 row가 생성되지 않음)
    void ensureRowExists(long userId);

    // 사용자의 Storage 사용량 조회 (Row Rook O)
    Optional<UserStorageUsageRow> findForUpdate(long userId);

    // 사용자의 Storage 사용량 조회 (Row Rook X)
    Optional<UserStorageUsageRow> findByUserId(long userId);

    // 유저 사용량 갱신
    int updateUsedBytes(long userId, long usedBytes);

    // user_storage_usage 조회 Row.
    record UserStorageUsageRow(
            long userId,
            long usedBytes,     // 누적 사용량
            Instant updatedAt   // 마지막 갱신 시각
    ) {}
}