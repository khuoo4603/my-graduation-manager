package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserMajorDao implements UserMajorRepository {

    private final JdbcTemplate jdbcTemplate;

    // 사용자 동일 전공/전공타입이 이미 존재하는지 확인
    @Override
    public boolean existsByUserIdAndMajorIdAndMajorType(long userId, long majorId, String majorType) {
        String sql = """
                SELECT COUNT(*)
                FROM user_major
                WHERE user_id = ?
                  AND major_id = ?
                  AND major_type = ?
                """;

        // count 결과를 조회한다.
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, majorId, majorType);

        return count != null && count > 0;
    }

    // 사용자 전공 생성 후 id 반환
    @Override
    public long insert(long userId, long majorId, String majorType) {

        String sql = """
            INSERT INTO user_major (user_id, major_id, major_type, created_at)
            VALUES (?, ?, ?, NOW())
            RETURNING user_major_id
            """;

        Long id = jdbcTemplate.queryForObject(
                sql,
                Long.class,
                userId,
                majorId,
                majorType
        );

        // null이면 예외 처리
        if (id == null) {
            throw new IllegalStateException("Failed to create user_major");
        }

        return id;
    }

    // 특정 사용자 전공 1건 조회
    @Override
    public Optional<UserMajorRow> findById(long userMajorId) {
        String sql = """
                SELECT user_major_id, user_id, major_id, major_type
                FROM user_major
                WHERE user_major_id = ?
                """;

        // 결과를 Optional로 반환
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new UserMajorRow(
                        rs.getLong("user_major_id"),
                        rs.getLong("user_id"),
                        rs.getLong("major_id"),
                        rs.getString("major_type")
                ),
                userMajorId
        ).stream().findFirst();
    }

    // 서용자 전공 삭제
    @Override
    public int deleteByIdAndUserId(long userMajorId, long userId) {
        String sql = """
                DELETE FROM user_major
                WHERE user_major_id = ?
                  AND user_id = ?
                """;

        // 삭제된 row 수 반환
        return jdbcTemplate.update(sql, userMajorId, userId);
    }
}