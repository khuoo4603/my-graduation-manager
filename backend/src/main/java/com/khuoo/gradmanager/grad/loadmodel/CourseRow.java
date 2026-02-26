package com.khuoo.gradmanager.grad.loadmodel;


// course 테이블 조회 Row
public record CourseRow(
        long courseId,                // 수강ID
        long courseMasterId,          // 과목마스터ID
        int earnedCredits,            // 취득학점
        String grade,                 // 성적 (ex. A+, B0, F, NP)
        String recognitionType,       // 이수구분 (ex. 전공필수, 전공선택, 전공탐색)
        Long majorId,                 // 전공귀속ID / NULL 가능
        Long attributedDepartmentId   // 전공탐색 귀속학부ID / NULL 가능
) {}