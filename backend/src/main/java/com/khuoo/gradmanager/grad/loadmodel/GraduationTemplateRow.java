package com.khuoo.gradmanager.grad.loadmodel;


// graduation_template 테이블 조회 Row
public record GraduationTemplateRow(
        long templateId,                  // 템플릿ID
        long departmentId,                // 학부ID
        String templateName,              // 템플릿 이름 (ex. IT융합자율학부(23년도))
        int applicableYear,               // 적용년도 (ex. 2023)
        int totalRequiredCredits,         // 졸업 총필요학점
        int totalCultureCredits,          // 교양 총필요학점
        int totalMajorExplorationCredits  // 전공탐색 필요학점
) {}