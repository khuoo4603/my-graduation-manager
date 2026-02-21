package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class MajorDao implements MajorRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<UserMajorRow> USER_MAJOR_ROW_MAPPER =
            (rs, rowNum) -> new UserMajorRow(
                    rs.getLong("major_id"),     // 전공 PK
                    rs.getString("major_name"), // 전공 이름
                    rs.getString("major_type")  // 심화전공/주전공/부전공/복수전공
            );

    //특정 사용자 전공 목록 조회
    @Override
    public List<UserMajorRow> findMajorsByUserId(Long userId) {

        String sql = """
                select
                    m.major_id,
                    m.major_name,
                    um.major_type
                from user_major um
                inner join major m
                    on m.major_id = um.major_id
                where um.user_id = ?
                order by um.user_major_id asc
                """;

        // 심화전공이 아닐 경우 전공이 2개 이므로 list그대로 반환
        return jdbcTemplate.query(sql, USER_MAJOR_ROW_MAPPER, userId);
    }
}