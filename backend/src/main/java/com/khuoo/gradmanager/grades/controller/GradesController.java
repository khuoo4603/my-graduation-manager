package com.khuoo.gradmanager.grades.controller;

import com.khuoo.gradmanager.grades.dto.GradeSummaryResponse;
import com.khuoo.gradmanager.grades.service.GradeSummaryService;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/grades")
public class GradesController {

    private final CurrentUser currentUser;
    private final GradeSummaryService gradeSummaryService;

    // 성적 요약 조회
    @GetMapping("/summary")
    public GradeSummaryResponse summary() {
        long userId = currentUser.userId();
        return gradeSummaryService.getSummary(userId);
    }
}
