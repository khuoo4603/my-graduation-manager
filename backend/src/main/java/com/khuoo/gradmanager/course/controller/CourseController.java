package com.khuoo.gradmanager.course.controller;

import com.khuoo.gradmanager.course.dto.CourseCreateRequest;
import com.khuoo.gradmanager.course.dto.CourseCreateResponse;
import com.khuoo.gradmanager.course.dto.CourseListResponse;
import com.khuoo.gradmanager.course.service.CourseService;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class CourseController {
    private final CourseService courseService;
    private final CurrentUser currentUser;

    // 수강 내역 등록
    @PostMapping("/courses")
    public CourseCreateResponse createCourse(@RequestBody CourseCreateRequest request) {
        long userId = currentUser.userId();

        return courseService.create(userId, request);
    }

    // 수강 내역 조회
    @GetMapping("/courses")
    public CourseListResponse listCourses(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String term
    ) {
        long userId = currentUser.userId();

        return courseService.list(userId, year, term);
    }

    // 수강 내역 삭제
    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable("id") long courseId) {
        long userId = currentUser.userId();

        courseService.delete(userId, courseId);

        // 삭제 성공 시 204 No Content 반환
        return ResponseEntity.noContent().build();
    }
}