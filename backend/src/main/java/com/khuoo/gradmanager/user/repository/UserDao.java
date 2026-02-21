package com.khuoo.gradmanager.user.repository;

import com.khuoo.gradmanager.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserDao implements UserRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<User> rowMapper = (rs, rowNum) -> new User(
            rs.getLong("user_id"),
            rs.getString("email"),
            rs.getString("user_name")
    );

    @Override
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT user_id, email, user_name FROM users WHERE email = ?";
        List<User> list = jdbcTemplate.query(sql, rowMapper, email);
        return list.stream().findFirst();
    }

    @Override
    public Optional<User> findById(long userId) {
        String sql = "SELECT user_id, email, user_name FROM users WHERE user_id = ?";
        List<User> list = jdbcTemplate.query(sql, rowMapper, userId);
        return list.stream().findFirst();
    }

    @Override
    public long insert(String email, String userName, long departmentId) {
        String sql = """
        INSERT INTO users (email, user_name, department_id, role)
        VALUES (?, ?, ?, 'USER')
        RETURNING user_id
        """;

        Long id = jdbcTemplate.queryForObject(
                sql,
                Long.class,
                email,
                userName,
                departmentId
        );

        return id;
    }
}
