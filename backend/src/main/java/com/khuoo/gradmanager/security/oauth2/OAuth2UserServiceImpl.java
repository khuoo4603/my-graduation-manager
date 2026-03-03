package com.khuoo.gradmanager.security.oauth2;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class OAuth2UserServiceImpl extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);

        // email 존재 여부 확인 (없으면 오류)
        String email = extractEmail(user.getAttributes());
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_userinfo", "Google OAuth2 응답에 email이 없습니다.", null)
            );
        }

        // 인증 성공시 -> OAuth2SuccessHandler / 인증 실패 시 -> OAuth2FailureHandler
        return user;
    }

    // Spring Security가 받아온 정보에서 이메일 조회
    private String extractEmail(Map<String, Object> attributes) {
        Object email = attributes.get("email");
        if (email == null) return null;
        return String.valueOf(email);
    }
}