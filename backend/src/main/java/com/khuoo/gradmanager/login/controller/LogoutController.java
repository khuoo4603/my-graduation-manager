package com.khuoo.gradmanager.login.controller;

import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
public class LogoutController {

    private final AuthCookieProperties authCookieProperties;

    @PostMapping("/api/v1/auth/logout")
    public void logout(HttpServletResponse response) {

        // 로그아웃은 쿠키를 만료시키는 시스템으로 구현
        ResponseCookie cookie = ResponseCookie.from(authCookieProperties.getCookieName(), "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO) // 쿠키 삭제는 Max-Age=0으로 즉시 만료
                .domain(authCookieProperties.getCookieDomain())
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        response.setStatus(204);
    }
}