package com.khuoo.gradmanager.grad.dto;

import java.util.List;


// 졸업판정 최종 응답 DTO
public record GraduationStatusResponse(
        Template template,             // 적용 템플릿 정보(id/name/year)
        Overall overall,               // 전체 졸업 충족 여부 + 총학점 요약(required/earned/shortage)
        Culture culture,               // 교양 요약 (SEED는 총학점 등 요약정보만)
        Seed seed,                     // SEED 요약
        Major major,                   // 전공 요약(전공별 필수/선택/총학점)
        MajorExploration majorExploration, // 전공탐색 요약(본인학부 3학점)
        List<MissingItem> missing      // 부족 항목
) {

    // 적용 템플릿 정보
    public record Template(
            long id,        // 템플릿 ID
            String name,    // 템플릿 이름
            int year        // 적용 연도
    ) {}

    // 전체 요약
    public record Overall(
            boolean isSatisfied, // 전체 졸업 충족 여부 (TOTAL/CULTURE/SEED/MAJOR/MAJOR_EXPLORATION 모두 만족)
            int required,        // 총필요학점
            int earned,          // 총취득학점 (F/NP 제외 합산)
            int shortage         // 부족학점 
    ) {}

    // 교양 요약
    public record Culture(
            int required,              // 교양 총 필요학점
            int earned,                // 교양 총 취득학점 (교양 과목 합산, F/NP 제외)
            int shortage,              // 부족학점
            boolean isSatisfied,       // 교양총학점 + rules[] 만족 여부
            List<CultureRule> rules    // 이수구분 별 (교양필수/채플/SEED 등) 충족 현황
    ) {
        public record CultureRule(
                String category,     // 이수구분
                int required,        // 해당 영역 필요학점
                int earned,          // 해당 영역 취득학점
                int shortage,        // 해당 영역 부족학점
                boolean isSatisfied  // 필요학점 충족 여부
        ) {}
    }

    // SEED 요약
    public record Seed(
            int required,                 // SEED 전체 필요학점
            int earned,                   // SEED 전체 취득학점
            int shortage,                 // SEED 전체 부족학점
            List<String> requiredAreas,   // 필요영역 리스트(Science/Economy/Environment/Diversity)
            int minAreaCredits,           // 필요영역 최소학점(3학점 고정)
            List<SeedAreaCredits> areas,  // 영역별 요약
            boolean isAreaSatisfied,      // 필요영역 중 하나에서 3학점 이상 이수 여부
            boolean isTotalSatisfied,     // SEED 총학점 충족 여부
            boolean isSatisfied           // 최종 조건 충족 여부
    ) {
        public record SeedAreaCredits(
                String area, // SEED 영역명(Science/Economy/Environment/Diversity)
                int earned   // 해당 영역 취득학점
        ) {}
    }

    // 전공 요약
    public record Major(
            boolean hasMajors,          // 사용자 전공 존재 여부
            boolean isSatisfied,        // 사용자 전공 전체 졸업요건 충족 여부
            List<MajorItem> majors      // 전공별 요약
    ) {
        public record MajorItem(
                long id,              // 전공ID
                String name,          // 전공명
                String type,          // 전공타입 (심화전공/주전공/복수전공/부전공)
                int requiredTotal,    // 전공 총 필요학점
                int requiredCore,     // 전공필수 최소 필요학점
                int earnedCore,       // 전공필수 취득학점
                int earnedElective,   // 전공선택 취득학점
                int earnedTotal,      // 전공 총 취득학점
                boolean isSatisfied   // 전공필수 충족 여부 And 전공 총 필요 학점 충족 여부
        ) {}
    }

    // 전공탐색 요약
    public record MajorExploration(
            int required,         // 전공탐색 필요학점
            int earned,           // 전공탐색 취득학점
            int shortage,         // 부족학점
            int requiredMyDept,   // 본인학부 전공탐색 최소 필요학점(3 고정)
            int earnedMyDept,     // 본인학부 전공탐색 취득학점(attributed_department_id==user.department_id)
            int shortageMyDept,   // 부족학점(max(0, requiredMyDept-earnedMyDept))
            boolean isSatisfied   // 전탐 총 필요 학점 AND 본인학부 3학점 요건 만족 여부
    ) {}

    // 졸업요건 미충족 영역 요약
    public record MissingItem(
            String domain,   // 부족 영역 (총학점/교양/SEED/전공과정/전공탐색 등)
            String message,  // 졸업 미충족 사유
            int required,    // 해당 부족 항목 기준 필요학점
            int earned,      // 해당 부족 항목 기준 취득학점
            int shortage     // 부족학점
    ) {}
}