package com.khuoo.gradmanager.user.domain;

public record User(
        long userId,
        String email,
        String userName
) {}
