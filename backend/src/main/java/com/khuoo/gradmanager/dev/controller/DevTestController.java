package com.khuoo.gradmanager.dev.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Profile("local")
@RestController
@RequestMapping("/test")
public class DevTestController {

    // local환경 테스트
    @GetMapping
    public String test() { return "Test OK"; }

    // JSON 반환 테스트
    @GetMapping("/sample")
    public Map<String, Object> sample() {
        return Map.of(
                "message", "Hello GradManager",
                "status", "SUCCESS"
        );
    }

}
