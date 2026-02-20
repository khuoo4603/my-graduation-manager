package com.khuoo.gradmanager.dev.dto;

public record DevTokenResponse(
        String token,
        long userId,
        String email
) {}
