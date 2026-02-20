package com.khuoo.gradmanager.dev.controller;

import com.khuoo.gradmanager.security.jwt.JwtTokenProvider;
import com.khuoo.gradmanager.user.domain.User;
import com.khuoo.gradmanager.user.repository.UserRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@Profile("local")
@ConditionalOnProperty(
        prefix = "app.dev-token",
        name = "enabled",
        havingValue = "true"
)
@RestController
@RequestMapping("/api/v1/dev")
public class DevTokenController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final long defaultDepartmentId;

    public DevTokenController(
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            @Value("${app.dev-token.default-department-id}") long defaultDepartmentId
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.defaultDepartmentId = defaultDepartmentId;
    }

    @PostMapping("/token")
    public DevTokenResponse issue(@RequestParam("email") String email) {

        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("email is required");
        }

        // 이메일로 사용자 조회
        Optional<User> optionalUser = userRepository.findByEmail(email);

        User user;

        // 없으면 신규 생성
        if (optionalUser.isEmpty()) {

            long newId = userRepository.insert(
                    email,
                    "DEV_USER",
                    defaultDepartmentId
            );

            user = userRepository.findById(newId)
                    .orElseThrow(() -> new IllegalStateException("Inserted user not found"));

        } else {
            user = optionalUser.get();
        }

        // JWT 발급
        String token = jwtTokenProvider.createToken(user.userId(), user.email());

        return new DevTokenResponse(token, user.userId(), user.email());
    }

    public record DevTokenResponse(
            String token,
            long userId,
            String email
    ) {}
}
