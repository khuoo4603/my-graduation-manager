package com.khuoo.gradmanager.security.oauth2;

import com.khuoo.gradmanager.security.jwt.JwtTokenProvider;
import com.khuoo.gradmanager.user.domain.User;
import com.khuoo.gradmanager.user.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieProperties authCookieProperties;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        // OAuth2에서 반환된 객체가 맞는지 확인
        if (!(authentication.getPrincipal() instanceof OAuth2User oAuth2User)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Map<String, Object> attrs = oAuth2User.getAttributes();

        // 사용자 식별자는 email로 고정
        String email = getString(attrs, "email");
        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 사용자 이름은 google name을 사용
        String userName = getString(attrs, "name");
        if (userName == null || userName.isBlank()) {
            userName = email;
        }


        // DB에 email 여부 확인 후 사용자 생성 여부 선택
        Optional<User> existing = userRepository.findByEmail(email);
        long userId;
        if (existing.isPresent()) {
            // 이미 가입된 사용자면 기존 userId 사용
            userId = existing.get().userId();
        } else {
            // 없으면 신규 생성 후 생성된 userId 사용
            userId = userRepository.insert(email, userName);
        }

        // JWT 7일 만료
        String token = jwtTokenProvider.createToken(userId, email);

        // HttpOnly 방식 사용
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(authCookieProperties.getCookieName(), token)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(authCookieProperties.getCookieMaxAgeSeconds()));

        String cookieDomain = authCookieProperties.getCookieDomain();

        // local 등 cookie-domain이 비어있으면 host-only cookie로 처리 (domain없이 쿠기 생성)
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        ResponseCookie cookie = builder.build();

        // Set-Cookie 헤더를 명시적으로 추가
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 성공 후 리다이랙트 위치로 이동
        response.sendRedirect(authCookieProperties.getRedirectUrl());
    }

    private String getString(Map<String, Object> attrs, String key) {
        Object value = attrs.get(key);
        return value == null ? null : String.valueOf(value);
    }
}
