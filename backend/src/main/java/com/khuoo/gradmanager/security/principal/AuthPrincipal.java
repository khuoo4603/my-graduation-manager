package com.khuoo.gradmanager.security.principal;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AuthPrincipal {

    private final Long userId;
    private final String email;
}
