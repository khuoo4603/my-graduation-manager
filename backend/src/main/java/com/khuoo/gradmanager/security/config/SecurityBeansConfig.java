package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;


// @ConfigurationProperties 바인딩 전용 설정.
@Configuration
@EnableConfigurationProperties(AuthCookieProperties.class)
public class SecurityBeansConfig {
}