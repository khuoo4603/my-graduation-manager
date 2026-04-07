package com.khuoo.gradmanager.security.oauth2;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.auth")
public class AuthCookieProperties {
    private String cookieName;          // 쿠키 이름: access_token 고정
    private String cookieDomain;        // 운영 도메인: .khuoo.synology.me
    private boolean cookieSecure = true;// https만 허용
    private long cookieMaxAgeSeconds;   // 만료 7일 고정
    private String redirectUrl;         // OAuth2 성공 후 이동 위치
    private List<String> allowedOrigins = List.of();
}
