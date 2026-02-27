package com.khuoo.gradmanager.storage.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;


@Repository
@RequiredArgsConstructor
public class UserStorageUsageDao implements UserStorageUsageRepository {

    private final JdbcTemplate jdbcTemplate;

    // usage row 생성 (이미 있다면 row가 생성되지 않음)
    @Override
    public void ensureRowExists(long userId) {
        String sql = """
                INSERT INTO user_storage_usage(user_id, used_bytes)
                VALUES (?, 0)
                ON CONFLICT (user_id) DO NOTHING
                """;
        jdbcTemplate.update(sql, userId);
    }

    // 사용자의 Storage 사용량 조회 (Row Rook O)
    @Override
    public Optional<UserStorageUsageRow> findForUpdate(long userId) {
        String sql = """
                SELECT user_id, used_bytes, updated_at
                FROM user_storage_usage
                WHERE user_id = ?
                FOR UPDATE
                """;

        List<UserStorageUsageRow> rows = jdbcTemplate.query(sql, (rs, rn) -> new UserStorageUsageRow(
                rs.getLong("user_id"),
                rs.getLong("used_bytes"),
                rs.getTimestamp("updated_at").toInstant()
        ), userId);

        return rows.stream().findFirst();
    }

    // 사용자의 Storage 사용량 조회 (Row Rook X)
    @Override
    public Optional<UserStorageUsageRow> findByUserId(long userId) {
        String sql = """
                SELECT user_id, used_bytes, updated_at
                FROM user_storage_usage
                WHERE user_id = ?
                """;

        List<UserStorageUsageRow> rows = jdbcTemplate.query(sql, (rs, rn) -> new UserStorageUsageRow(
                rs.getLong("user_id"),
                rs.getLong("used_bytes"),
                rs.getTimestamp("updated_at").toInstant()
        ), userId);

        return rows.stream().findFirst();
    }

    // 유저 사용량 갱신
    @Override
    public int updateUsedBytes(long userId, long usedBytes) {
        String sql = """
                UPDATE user_storage_usage
                SET used_bytes = ?, updated_at = ?
                WHERE user_id = ?
                """;
        return jdbcTemplate.update(sql, usedBytes, java.sql.Timestamp.from(Instant.now()), userId);
    }
}