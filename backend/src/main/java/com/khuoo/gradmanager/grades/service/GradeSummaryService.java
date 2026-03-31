package com.khuoo.gradmanager.grades.service;

import com.khuoo.gradmanager.course.support.AcademicTermPolicy;
import com.khuoo.gradmanager.course.support.AcademicTermPolicy.CourseSelectionResult;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.repository.GradQueryRepository;
import com.khuoo.gradmanager.grades.dto.GradeSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GradeSummaryService {
    private static final BigDecimal ZERO_GPA = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP); // GPA 계산 대상 과목이 하나도 없을 때 반환할 기본값 0.00
    private static final Set<String> MAJOR_GPA_SUBCATEGORIES = Set.of("전공필수", "전공선택"); // 전공 GPA 계산에 포함할 세부 구분
    private static final Set<String> GPA_EXCLUDED_GRADES = Set.of("P", "NP"); // GPA 계산에서 제외할 성적
    private static final Map<String, BigDecimal> GRADE_POINTS = Map.of( // GPA 계산용 성적 -> 평점 점수 매핑
            "A+", BigDecimal.valueOf(4.5),
            "A0", BigDecimal.valueOf(4.0),
            "B+", BigDecimal.valueOf(3.5),
            "B0", BigDecimal.valueOf(3.0),
            "C+", BigDecimal.valueOf(2.5),
            "C0", BigDecimal.valueOf(2.0),
            "D+", BigDecimal.valueOf(1.5),
            "D0", BigDecimal.valueOf(1.0),
            "F", BigDecimal.ZERO
    );

    private final GradQueryRepository gradQueryRepository;

    // 사용자 성적 요약 전체를 계산해서 응답 DTO로 반환
    @Transactional(readOnly = true)
    public GradeSummaryResponse getSummary(long userId) {
        GradLoadData loadData = gradQueryRepository.load(userId); // 사용자 수강이력 데이터
        CourseSelectionResult selectionResult = AcademicTermPolicy.selectCourses(loadData.courses()); // 재수강 전처리 적용
        List<CourseRow> activeCourses = selectionResult.activeCourses(); // 재수강 전처리 후 실제 성적 요약 계산에 사용할 최종 반영 과목 목록
        GpaAccumulator totalGpaAccumulator = new GpaAccumulator(); // 전체 누적 GPA 계산 객체

        // 최종 반영 과목 중 GPA 계산 제외 과목 수
        int gpaExcludedCourseCount = 0;

        // 성적 분포 집계를 위한 map
        Map<String, Integer> gradeCounts = new LinkedHashMap<>();
        gradeCounts.put("A+", 0);
        gradeCounts.put("A0", 0);
        gradeCounts.put("B+", 0);
        gradeCounts.put("B0", 0);
        gradeCounts.put("C+", 0);
        gradeCounts.put("C0", 0);
        gradeCounts.put("D+", 0);
        gradeCounts.put("D0", 0);
        gradeCounts.put("F", 0);
        gradeCounts.put("P", 0);
        gradeCounts.put("NP", 0);

        // 학기별 GPA 계산용 map(key(year, term), value(평점 누적 계산 객체))
        Map<TermKey, GpaAccumulator> termGpaAccumulators = new HashMap<>();

        // 최종 반영 과목(activeCourses)에서 평점 계산 및 분포/과목 수 계산
        for (CourseRow course : activeCourses) {
            String term = AcademicTermPolicy.normalize(course.takenTerm()); // 학기 데이터 정규화
            TermKey termKey = new TermKey(course.takenYear(), term); // 현재 과목이 속한 년도/학기 그룹 키 생성

            // 년도/학기 데이터가 없다면 map에 데이터 추가
            if (!termGpaAccumulators.containsKey(termKey)) {
                termGpaAccumulators.put(termKey, new GpaAccumulator());
            }


            // 성적 형식 검사, 지원하지 않는 형식일 경우 예외
            String grade = course.grade(); // 현재 과목 성적
            if (!gradeCounts.containsKey(grade)) {
                throw new ApiException(ErrorCode.INTERNAL_ERROR);
            }

            // 최종 반영 과목 기준 성적 분포 1 증가
            gradeCounts.put(grade, gradeCounts.get(grade) + 1);

            // P, NP는 계산에서 제외, 과목 수만 증가시키고 다음 과목으로 넘어감
            if (GPA_EXCLUDED_GRADES.contains(grade)) {
                gpaExcludedCourseCount++;
                continue;
            }

            // GPA 계산 가능한 성적에 대해 평점 점수 조회
            BigDecimal gradePoint = GRADE_POINTS.get(grade);

            // 전체 누적 GPA 계산 객체에 현재 과목 반영
            totalGpaAccumulator.add(course, gradePoint);

            // 해당 학기 GPA 계산 객체에 현재 과목 반영
            termGpaAccumulators.get(termKey).add(course, gradePoint);
        }

        // 학기별 GPA 맵을 응답용 리스트로 변환
        List<Map.Entry<TermKey, GpaAccumulator>> sortedEntries = new ArrayList<>(termGpaAccumulators.entrySet());

        // 년도 오름차순, 학기 오름차순 정렬
        sortedEntries.sort((entry1, entry2) -> {
            TermKey key1 = entry1.getKey();
            TermKey key2 = entry2.getKey();

            if (key1.year() != key2.year()) { return Integer.compare(key1.year(), key2.year()); }

            return Integer.compare(
                    AcademicTermPolicy.sortOrder(key1.term()),
                    AcademicTermPolicy.sortOrder(key2.term())
            );
        });

        // 응답 DTO 리스트로 변환
        List<GradeSummaryResponse.TermSummary> termSummaries = new ArrayList<>();
        for (Map.Entry<TermKey, GpaAccumulator> entry : sortedEntries) {
            TermKey termKey = entry.getKey();
            GpaAccumulator accumulator = entry.getValue();

            termSummaries.add(new GradeSummaryResponse.TermSummary(
                    termKey.year(),
                    termKey.term(),
                    accumulator.overallGpa(),
                    accumulator.majorGpa()
            ));
        }

        return new GradeSummaryResponse(
                activeCourses.size(), // 최종 반영 과목 수
                selectionResult.retakeExcludedCourseCount(), // 재수강 전처리로 제외된 과목 수
                gpaExcludedCourseCount, // GPA 계산 제외 과목 수(P/NP)
                GradeSummaryResponse.GradeDistribution.from(gradeCounts), // 성적 분포
                totalGpaAccumulator.overallGpa(), // 누적 전체 GPA
                totalGpaAccumulator.majorGpa(), // 누적 전공 GPA
                termSummaries // 학기별 GPA 요약 리스트
        );
    }

    // 학기별 GPA 그룹화용 key
    private record TermKey(
            int year,
            String term
    ) {}

    // GPA 계산에 필요한 평점, 학점 누적 계산 객체
    private static final class GpaAccumulator {
        private BigDecimal overallTotalPoints = BigDecimal.ZERO; // 전체 GPA 계산용 평점 합계
        private int overallTotalCredits = 0; // 전체 GPA 계산용 학점 합계
        private BigDecimal majorTotalPoints = BigDecimal.ZERO; // 전공 GPA 계산용 평점 합계
        private int majorTotalCredits = 0; // 전공 GPA 계산용 학점 합계

        // 과목 1건을 GPA 누적기에 반영한다.
        private void add(CourseRow course, BigDecimal gradePoint) {
            // 과목별 평점 합계 = 학점 × 성적
            BigDecimal coursePoints = BigDecimal.valueOf(course.earnedCredits()).multiply(gradePoint);

            // 전체 GPA에는 GPA 계산 대상 과목이면 모두 반영
            overallTotalPoints = overallTotalPoints.add(coursePoints);
            overallTotalCredits += course.earnedCredits();

            // 전공 GPA는 전공필수 / 전공선택만 반영
            if (MAJOR_GPA_SUBCATEGORIES.contains(course.courseSubcategory())) {
                majorTotalPoints = majorTotalPoints.add(coursePoints);
                majorTotalCredits += course.earnedCredits();
            }
        }

        // 누적된 전체 GPA 계산
        private BigDecimal overallGpa() {
            // 계산 대상 학점이 없으면 0.00 반환
            if (overallTotalCredits == 0) { return ZERO_GPA; }

            // 전체 GPA = 전체 평점 합계 / 전체 학점 합계
            return overallTotalPoints.divide(
                    BigDecimal.valueOf(overallTotalCredits),
                    2,
                    RoundingMode.HALF_UP
            );
        }

        // 누적된 전공 GPA 계산
        private BigDecimal majorGpa() {
            // 계산 대상 전공 학점이 없으면 0.00 반환
            if (majorTotalCredits == 0) { return ZERO_GPA; }

            // 전공 GPA = 전공 평점 합계 / 전공 학점 합계
            return majorTotalPoints.divide(
                    BigDecimal.valueOf(majorTotalCredits),
                    2,
                    RoundingMode.HALF_UP
            );
        }
    }
}
