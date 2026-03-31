package com.khuoo.gradmanager.course.support;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@NoArgsConstructor
public final class AcademicTermPolicy {

    private static final Set<String> ALLOWED_TERMS = Set.of("1", "SUMMER", "2", "WINTER"); // DB/API에서 허용하는 학기 표준값

    // 입력값을 표준 학기값으로 정규화하고 허용값 여부를 검증
    public static String normalize(String term) {
        if (term == null) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        String trimmed = term.trim();
        if (trimmed.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        String canonical = trimmed.toUpperCase(Locale.ROOT);
        if (!ALLOWED_TERMS.contains(canonical)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        return canonical;
    }

    // 기존 grad와 grades가 함께 사용하는 재수강 전처리 결과를 계산
    public static CourseSelectionResult selectCourses(List<CourseRow> rawCourses) {
        Map<Long, CourseRow> courseById = new HashMap<>();
        for (CourseRow course : rawCourses) {
            courseById.put(course.courseId(), course);
        }

        List<CourseRow> activeCourses;
        if (courseById.isEmpty()) {
            activeCourses = rawCourses; // 수강 이력이 없으면 전처리 없이 빈 목록 그대로 사용
        } else {
            Map<Long, CourseRow> latestCoursesByGroup = new HashMap<>();
            for (CourseRow course : rawCourses) {
                Long originalCourseId = course.retakeCourseId();
                Set<Long> visitedCourseIds = new HashSet<>();

                // 재수강 원본 과목을 따라가며 최종 재수강 그룹을 완성
                while (originalCourseId != null) {
                    // 이미 방문한 course_id면 순환 참조로 보고 가장 작은 id를 그룹 키로 사용
                    if (!visitedCourseIds.add(originalCourseId)) {
                        originalCourseId = visitedCourseIds.stream()
                                .min(Long::compareTo)
                                .orElse(course.courseId());
                        break;
                    }

                    CourseRow originalCourse = courseById.get(originalCourseId);
                    // 원본 과목이 없거나 재수강한 과목이 아니면 종료
                    if (originalCourse == null || originalCourse.retakeCourseId() == null) {
                        break;
                    }

                    // 현재 원본 후보도 재수강이면 한 단계 더 이전 원본으로 이동
                    originalCourseId = originalCourse.retakeCourseId();
                }

                long groupKey = originalCourseId == null ? course.courseId() : originalCourseId;
                CourseRow currentLatest = latestCoursesByGroup.get(groupKey);

                // 아직 그룹에 과목이 없으면 현재 과목을 판정용 데이터로 입력
                if (currentLatest == null) {
                    latestCoursesByGroup.put(groupKey, course);
                    continue;
                }

                // 수강 연도가 더 큰 과목을 최신 수강 이력을 판정용 데이터로 입력
                if (course.takenYear() != currentLatest.takenYear()) {
                    if (course.takenYear() > currentLatest.takenYear()) {
                        latestCoursesByGroup.put(groupKey, course);
                    }
                    continue;
                }

                int candidateTermOrder = sortOrder(course.takenTerm());
                int currentTermOrder = sortOrder(currentLatest.takenTerm());

                // 같은 연도에서는 더 뒤 학기에 수강한 과목을 판정용 데이터로 입력
                if (candidateTermOrder != currentTermOrder) {
                    if (candidateTermOrder > currentTermOrder) {
                        latestCoursesByGroup.put(groupKey, course);
                    }
                    continue;
                }

                // 연도와 학기까지 같으면 course_id가 더 큰 수강 이력을 판정용 데이터로 입력
                if (course.courseId() > currentLatest.courseId()) {
                    latestCoursesByGroup.put(groupKey, course);
                }
            }

            activeCourses = new ArrayList<>(latestCoursesByGroup.values()); // 같은 원본 과목 묶음에서 최신 수강 이력만 최종 평가 대상으로 사용
        }

        return new CourseSelectionResult(
                rawCourses,
                activeCourses,
                Math.max(0, rawCourses.size() - activeCourses.size()) // 재수강 전처리로 제외된 과목 수
        );
    }

    // 같은 연도 내 학기 정렬과 최신 수강 과목 판별에 사용하는 학기 순서
    public static int sortOrder(String takenTerm) {
        return switch (normalize(takenTerm)) {
            case "1" -> 1;
            case "SUMMER" -> 2;
            case "2" -> 3;
            case "WINTER" -> 4;
            default -> 0;
        };
    }

    public record CourseSelectionResult(
            List<CourseRow> rawCourses,      // 원본 수강 이력 전체 목록
            List<CourseRow> activeCourses,   // 재수강 전처리 후 최종 반영 과목 목록
            int retakeExcludedCourseCount    // 재수강 전처리로 제외된 과목 수
    ) {}
}
