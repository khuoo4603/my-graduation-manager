package com.khuoo.gradmanager.user.controller;

import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import com.khuoo.gradmanager.user.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class AccountController {

    private final AccountService accountService;
    private final CurrentUser currentUser;
    private final AuthCookieProperties authCookieProperties;

    // 현재 로그인 사용자 계정 삭제
    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount() {
        long userId = currentUser.userId();
        accountService.deleteAccount(userId);

        // 계정 삭제 성공 시 기존 인증 쿠키도 즉시 만료시켜 로그아웃 상태로 전환
        ResponseCookie cookie = ResponseCookie.from(authCookieProperties.getCookieName(), "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .domain(authCookieProperties.getCookieDomain())
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }
}
