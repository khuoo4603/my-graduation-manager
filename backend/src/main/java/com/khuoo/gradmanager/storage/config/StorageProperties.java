package com.khuoo.gradmanager.storage.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// 스토리지 루트 경로 (application 값 사용)
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
        String root
) {}