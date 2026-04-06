package com.khuoo.gradmanager.micromajor.loadmodel;

// course 조회 Row
public record UserCourseRow(
        long courseId,                // 수강 내역 PK
        String courseCodeSnapshot,    // 판정용 과목코드 스냅샷
        String courseNameSnapshot,    // 판정용 과목명 스냅샷
        int earnedCredits,            // 취득 학점
        String grade,                 // 성적
        int takenYear,                // 수강 연도
        String takenTerm,             // 수강 학기
        Long retakeCourseId           // 재수강 대상 원본 수강 PK / NULL 가능
) {}
