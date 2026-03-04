package com.khuoo.gradmanager.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {
    @Value("${app.swagger.server-url:https://api.khuoo.synology.me}")
    private String serverUrl;

    @Bean
    public OpenAPI openAPI() {

        String cookieSchemeName = "CookieAuth";

        return new OpenAPI()
                // Swagger가 호출할 서버 고정
                .servers(List.of(new Server().url(serverUrl)))

                // authorizations 설명 추가
                .components(new Components().addSecuritySchemes(cookieSchemeName,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("access_token")
                ))

                .addSecurityItem(new SecurityRequirement().addList(cookieSchemeName))

                // 문서 메타데이터
                .info(new Info()
                        .title("My Graduation Manager API")
                        .description("".trim())
                        .version("v1")
                        .contact(new Contact().name("khuoo"))
                );
    }
}