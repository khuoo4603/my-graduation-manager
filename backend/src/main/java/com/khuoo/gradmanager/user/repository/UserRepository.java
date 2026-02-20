package com.khuoo.gradmanager.user.repository;

import com.khuoo.gradmanager.user.domain.User;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findById(long userId);
    long insert(String email, String userName, long departmentId);
}
