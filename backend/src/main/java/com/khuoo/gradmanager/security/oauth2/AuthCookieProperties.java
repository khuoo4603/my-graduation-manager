package com.khuoo.gradmanager.security.oauth2;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.auth")
public class AuthCookieProperties {
    private String cookieName;          // 쿠키 이름: access_token 고정
    private String cookieDomain;        // 운영 도메인: .khuoo.synology.me
    private long cookieMaxAgeSeconds;   // 만료 7일 고정
    private String redirectUrl;         // OAuth2 성공 후 이동 위치
    private long defaultDepartmentId;   // OAuth2 최초 가입 시 사용자를 어느 학부로 넣을지(기본값)
}