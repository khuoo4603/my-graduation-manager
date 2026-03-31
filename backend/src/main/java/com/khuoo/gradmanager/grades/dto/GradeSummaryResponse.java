package com.khuoo.gradmanager.grades.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record GradeSummaryResponse(
        int includedCourseCount,                     // 재수강 전처리 후 최종 반영 과목 수
        int retakeExcludedCourseCount,               // 재수강 전처리로 제외된 과목 수
        int gpaExcludedCourseCount,                  // 최종 반영 과목 중 GPA 계산에서 제외된 과목 수(P/NP)
        GradeDistribution gradeDistribution,         // 최종 반영 과목 기준 성적 분포
        BigDecimal overallGpa,                       // 최종 반영 과목 기준 전체 GPA
        BigDecimal majorGpa,                         // 전공필수/전공선택 기준 전공 GPA
        List<TermSummary> termSummaries              // 최종 반영 과목 기준 연도/학기별 GPA
) {
    // 성적별 과목 수
    @JsonPropertyOrder({"A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "P", "NP"})
    public record GradeDistribution(
            @JsonProperty("A+") int aPlus,
            @JsonProperty("A0") int a0,
            @JsonProperty("B+") int bPlus,
            @JsonProperty("B0") int b0,
            @JsonProperty("C+") int cPlus,
            @JsonProperty("C0") int c0,
            @JsonProperty("D+") int dPlus,
            @JsonProperty("D0") int d0,
            @JsonProperty("F") int f,
            @JsonProperty("P") int p,
            @JsonProperty("NP") int np
    ) {

        // 문자열 map데이터를 응답 Dto로 변경
        public static GradeDistribution from(Map<String, Integer> counts) {
            return new GradeDistribution(
                    counts.getOrDefault("A+", 0),
                    counts.getOrDefault("A0", 0),
                    counts.getOrDefault("B+", 0),
                    counts.getOrDefault("B0", 0),
                    counts.getOrDefault("C+", 0),
                    counts.getOrDefault("C0", 0),
                    counts.getOrDefault("D+", 0),
                    counts.getOrDefault("D0", 0),
                    counts.getOrDefault("F", 0),
                    counts.getOrDefault("P", 0),
                    counts.getOrDefault("NP", 0)
            );
        }
    }

    // 년도/학기별 GPA
    @JsonPropertyOrder({"year", "term", "overallGpa", "majorGpa"})
    public record TermSummary(
            int year,             // 수강 연도
            String term,          // 수강 학기(1/SUMMER/2/WINTER)
            BigDecimal overallGpa, // 해당 학기 전체 GPA
            BigDecimal majorGpa    // 해당 학기 전공 GPA
    ) {}
}
