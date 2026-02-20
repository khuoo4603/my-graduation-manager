package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ProfileRepositoryDao implements ProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    // query에서 데이터를 받을 rowMapper
    private static final RowMapper<ProfileBase> PROFILE_BASE_ROW_MAPPER =
            (rs, rowNum) -> new ProfileBase(
                    rs.getLong("user_id"),
                    rs.getString("email"),
                    rs.getString("user_name"),
                    rs.getLong("department_id"),
                    rs.getString("department_name"),
                    rs.getObject("template_id", Long.class),        // Null 허용
                    rs.getString("template_name"),
                    rs.getObject("applicable_year", Integer.class)  // Null 변환 방지
            );

    // 사용자 기본정보(id, email, name, 학부, 학번 등 조회)
    @Override
    public ProfileBase findProfileBaseByUserId(Long userId) {

        //users, department, graduation_template 3개 테이블 조인
        String sql = """
                select
                    u.user_id,
                    u.email,
                    u.user_name,
                    d.department_id,
                    d.department_name,
                    gt.template_id,
                    gt.template_name,
                    gt.applicable_year
                from users u
                inner join department d
                    on d.department_id = u.department_id
                left join graduation_template gt
                    on gt.template_id = u.template_id
                where u.user_id = ?
                """;

        // 예외 직접 구현으로 query사용, 단일 결과값, 결과가 없다면 null반환
        return jdbcTemplate.query(sql, PROFILE_BASE_ROW_MAPPER, userId)
                .stream()
                .findFirst()
                .orElse(null);
    }
}