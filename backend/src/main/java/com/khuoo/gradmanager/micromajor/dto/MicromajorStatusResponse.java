package com.khuoo.gradmanager.micromajor.dto;

import java.util.List;

/**
 * @param microMajors eligibility를 통과한 마이크로전공 상태 목록
 */
public record MicromajorStatusResponse(
        List<MicroMajorStatus> microMajors // eligibility를 통과한 마이크로전공 카드 목록
) {
    // 마이크로전공 카드 1개의 응답 단위
    public record MicroMajorStatus(
            long id,                                    // 마이크로전공 PK
            String name,                                // 마이크로전공명
            String category,                            // 마이크로전공 유형(교양 / 전공 / 융합)
            String operatingUnitNames,                  // 운영 주체명
            String status,                              // 이수 상태(이수대상아님 / 이수중 / 이수완료)
            int requiredCourseCount,                    // 전체 필요 과목 수
            int earnedCourseCount,                      // 인정된 슬롯 수
            int remainingCourseCount,                   // 남은 필요 과목 수
            List<GroupStatus> groups,                   // 그룹별 충족 현황 목록
            List<RecognizedCourse> recognizedCourses,   // 실제로 인정된 이수 과목 목록
            List<MissingCourse> missingCourses          // 아직 남아 있는 슬롯의 대표 과목 목록
    ) {}

    // 요구 그룹별 충족 현황
    public record GroupStatus(
            int groupNo,                // 그룹 번호
            String groupName,           // 그룹명
            int requiredCourseCount,    // 그룹 필요 과목 수
            int earnedCourseCount,      // 그룹에서 충족된 슬롯 수
            int remainingCourseCount,   // 그룹에서 남은 필요 과목 수
            boolean isSatisfied         // 그룹 충족 여부
    ) {}

    // 실제로 인정된 이수 과목
    public record RecognizedCourse(
            long courseId,          // 수강 내역 PK
            String courseCode,      // 실제 이수한 과목 코드
            String courseName,      // 실제 이수한 과목명
            int earnedCredits       // 실제 이수한 과목의 취득 학점
    ) {}

    // 아직 남아 있는 슬롯의 대표 과목
    public record MissingCourse(
            String courseCode,      // 대표 과목 코드(NULL 가능)
            String courseName       // 대표 과목명
    ) {}
}
