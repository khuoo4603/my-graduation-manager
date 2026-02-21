package com.khuoo.gradmanager.reference.course.controller;

import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchResponse;
import com.khuoo.gradmanager.reference.course.service.CourseMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class CourseMasterController {

    private final CourseMasterService courseMasterService;

    // 강의목록 조회 (개설년도, 개설학기 필수)
    @GetMapping("/course-masters")
    public CourseMasterSearchResponse searchCourseMasters(
            @RequestParam int year,
            @RequestParam String term,

            // 검색 파라미터는 모두 선택
            @RequestParam(required = false) String code,        // 과목 코드
            @RequestParam(required = false) String name,        // 과목 이름
            @RequestParam(required = false) String category,    // 전공/교양
            @RequestParam(required = false) String subcategory, // 전공필수/교양필수/전공선택/소양
            @RequestParam(required = false) String deptName     // 학부이름
    ) {
        return courseMasterService.search(year, term, code, name, category, subcategory, deptName);
    }
}