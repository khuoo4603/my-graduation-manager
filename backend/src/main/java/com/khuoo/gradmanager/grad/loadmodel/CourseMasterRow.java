package com.khuoo.gradmanager.grad.loadmodel;


// course_master 테이블 조회 Row
public record CourseMasterRow(
        long courseMasterId,         // 과목마스터ID
        String courseCategory,       // 구분 (ex. 교양, 전공)
        String courseSubcategory,    // 이수구분 (ex. SEED, 전공필수)
        String seedArea              // SEED 영역명 (ex. Science, Economy) / NULL 가능
) {}