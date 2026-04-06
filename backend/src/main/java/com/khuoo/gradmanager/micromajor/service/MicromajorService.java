package com.khuoo.gradmanager.micromajor.service;

import com.khuoo.gradmanager.course.support.AcademicTermPolicy;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.micromajor.dto.MicromajorStatusResponse;
import com.khuoo.gradmanager.micromajor.loadmodel.EligibilityRow;
import com.khuoo.gradmanager.micromajor.loadmodel.MicroMajorRow;
import com.khuoo.gradmanager.micromajor.loadmodel.MicromajorLoadData;
import com.khuoo.gradmanager.micromajor.loadmodel.RequirementCourseRow;
import com.khuoo.gradmanager.micromajor.loadmodel.RequirementGroupRow;
import com.khuoo.gradmanager.micromajor.loadmodel.UserCourseRow;
import com.khuoo.gradmanager.micromajor.loadmodel.UserMajorRow;
import com.khuoo.gradmanager.micromajor.repository.MicromajorQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MicromajorService {
    private final MicromajorQueryRepository micromajorQueryRepository;

    // 인정 후보 묶음
    private record MatchedSlotCandidate(
            RequirementCourseRow requirementCourse, // 인정 과목 정보
            UserCourseRow userCourse,               // 사용자 수강 과목 정보
            int matchPriority                       // 1: 과목 코드 일치, 2: 이름 일치
    ) {
    }

    public MicromajorStatusResponse getStatus(long userId) {
        MicromajorLoadData loadData = micromajorQueryRepository.load(userId);

        // 마이크로전공이 없다면 빈 배열 응답
        if (loadData.microMajors().isEmpty()) {
            return new MicromajorStatusResponse(List.of());
        }

        // microMajorId 기준 요구 그룹 목록, 같은 마이크로전공의 그룹 묶음
        Map<Long, List<RequirementGroupRow>> groupsByMicroMajorId = new LinkedHashMap<>();
        for (RequirementGroupRow requirementGroup : loadData.requirementGroups()) {
            Long microMajorId = requirementGroup.microMajorId();
            List<RequirementGroupRow> groupedRequirements = groupsByMicroMajorId.get(microMajorId);
            if (groupedRequirements == null) {
                groupedRequirements = new ArrayList<>();
                groupsByMicroMajorId.put(microMajorId, groupedRequirements);
            }
            groupedRequirements.add(requirementGroup);
        }

        // requirementGroupId 기준 인정 과목 목록, 그룹별 슬롯 판정용 과목 묶음
        Map<Long, List<RequirementCourseRow>> coursesByGroupId = new LinkedHashMap<>();
        for (RequirementCourseRow requirementCourse : loadData.requirementCourses()) {
            Long requirementGroupId = requirementCourse.requirementGroupId();
            List<RequirementCourseRow> courses = coursesByGroupId.get(requirementGroupId);
            if (courses == null) {
                courses = new ArrayList<>();
                coursesByGroupId.put(requirementGroupId, courses);
            }
            courses.add(requirementCourse);
        }

        // microMajorId 기준 인정 소속 목록, 같은 마이크로전공의 eligibility 조건 묶음
        Map<Long, List<EligibilityRow>> eligibilityByMicroMajorId = new LinkedHashMap<>();
        for (EligibilityRow eligibilityRow : loadData.eligibilityRows()) {
            Long microMajorId = eligibilityRow.microMajorId();
            List<EligibilityRow> eligibilityRows = eligibilityByMicroMajorId.get(microMajorId);
            if (eligibilityRows == null) {
                eligibilityRows = new ArrayList<>();
                eligibilityByMicroMajorId.put(microMajorId, eligibilityRows);
            }
            eligibilityRows.add(eligibilityRow);
        }

        // 사용자 전공 PK 집합, MAJOR 조건 비교용 목록
        Set<Long> userMajorIds = new HashSet<>();
        for (UserMajorRow userMajor : loadData.userMajors()) {
            userMajorIds.add(userMajor.majorId());
        }

        // 유효 수강 과목 목록, 재수강 최신 반영과 F/NP 제외 결과
        List<UserCourseRow> validCourses = selectValidCourses(loadData.userCourses());

        // 응답 목록
        List<MicromajorStatusResponse.MicroMajorStatus> microMajors = new ArrayList<>();

        // 마이크로전공별 상태 계산
        for (MicroMajorRow microMajor : loadData.microMajors()) {
            // 요구 그룹 목록, 그룹이 없다면 해당 마이크로전공 패스
            List<RequirementGroupRow> groups =
                    groupsByMicroMajorId.getOrDefault(microMajor.microMajorId(), List.of());
            if (groups.isEmpty()) {
                continue;
            }

            // 인정 과목 존재 여부, 인정 과목이 없다면 해당 마이크로전공 패스
            boolean hasRequirementCourse = false;
            for (RequirementGroupRow group : groups) {
                if (!coursesByGroupId.getOrDefault(group.requirementGroupId(), List.of()).isEmpty()) {
                    hasRequirementCourse = true;
                    break;
                }
            }
            if (!hasRequirementCourse) {
                continue;
            }

            // 인정 소속 목록, 인정 소속이 없다면 해당 마이크로전공 패스
            List<EligibilityRow> eligibilityRows =
                    eligibilityByMicroMajorId.getOrDefault(microMajor.microMajorId(), List.of());
            if (eligibilityRows.isEmpty()) {
                continue;
            }

            // eligibility 그룹 충족 여부, 같은 groupNo 내부 OR 결과 저장
            Map<Integer, Boolean> matchedByGroupNo = new LinkedHashMap<>();
            for (EligibilityRow eligibilityRow : eligibilityRows) {
                matchedByGroupNo.putIfAbsent(eligibilityRow.eligibilityGroupNo(), false);

                // DEPARTMENT 조건 비교, departmentId 1은 전체 허용
                boolean isDepartmentType = "DEPARTMENT".equals(eligibilityRow.eligibilityType());
                boolean isOpenLiberalArtsDepartment = Long.valueOf(1L).equals(eligibilityRow.departmentId());
                boolean isSameDepartment = loadData.userDepartmentId() != null
                        && loadData.userDepartmentId().equals(eligibilityRow.departmentId());
                if (isDepartmentType && (isOpenLiberalArtsDepartment || isSameDepartment)) {
                    matchedByGroupNo.put(eligibilityRow.eligibilityGroupNo(), true);
                }

                // MAJOR 조건 비교, 사용자 전공 포함 여부 확인
                boolean isMajorType = "MAJOR".equals(eligibilityRow.eligibilityType());
                boolean isIncludedUserMajor = userMajorIds.contains(eligibilityRow.majorId());
                if (isMajorType && isIncludedUserMajor) {
                    matchedByGroupNo.put(eligibilityRow.eligibilityGroupNo(), true);
                }
            }

            // eligibility 최종 결과, 그룹 하나라도 미충족이면 해당 마이크로전공 패스
            boolean isEligible = true;
            for (boolean matched : matchedByGroupNo.values()) {
                if (!matched) {
                    isEligible = false;
                    break;
                }
            }
            if (!isEligible) {
                continue;
            }

            List<MicromajorStatusResponse.GroupStatus> groupStatuses = new ArrayList<>();          // 그룹 상태 목록
            List<MicromajorStatusResponse.RecognizedCourse> recognizedCourses = new ArrayList<>(); // 이수 과목 목록
            List<MicromajorStatusResponse.MissingCourse> missingCourses = new ArrayList<>();       // 미이수 과목 목록
            int earnedCourseCount = 0;                                                             // 전체 인정 슬롯 수
            int earnedCredits = 0;                                                                 // 전체 인정 학점 수
            boolean hasMatchedCourse = false;                                                      // 인정 과목 이수 여부
            boolean allGroupsSatisfied = true;                                                     // 전체 그룹 충족 여부

            // 그룹별 슬롯 판정
            for (RequirementGroupRow group : groups) {
                // slotKey 기준 과목 묶음, 같은 slotKey 과목을 하나의 슬롯으로 처리
                LinkedHashMap<String, List<RequirementCourseRow>> slotCoursesByKey = new LinkedHashMap<>();
                for (RequirementCourseRow requirementCourse :
                        coursesByGroupId.getOrDefault(group.requirementGroupId(), List.of())) {
                    String slotKey = requirementCourse.requirementSlotKey();
                    List<RequirementCourseRow> slotCourses = slotCoursesByKey.get(slotKey);
                    if (slotCourses == null) {
                        slotCourses = new ArrayList<>();
                        slotCoursesByKey.put(slotKey, slotCourses);
                    }
                    slotCourses.add(requirementCourse);
                }

                int groupEarnedCourseCount = 0;

                // 슬롯별 이수 여부 판정, 후보 수집 후 대표 1건 선택
                for (List<RequirementCourseRow> slotCourses : slotCoursesByKey.values()) {
                    RequirementCourseRow representativeCourse = slotCourses.get(0);
                    List<MatchedSlotCandidate> candidates =
                            collectMatchedCandidates(slotCourses, validCourses, microMajor);

                    // 미이수 슬롯이면 대표 과목 1건을 missingCourses에 추가
                    if (candidates.isEmpty()) {
                        missingCourses.add(new MicromajorStatusResponse.MissingCourse(
                                representativeCourse.recognizedCourseCode(),
                                representativeCourse.recognizedCourseName()
                        ));
                        continue;
                    }

                    // 이수 슬롯이면 대표 후보 1건만 인정 과목으로 반영
                    MatchedSlotCandidate bestCandidate = pickBestCandidate(candidates);
                    groupEarnedCourseCount++;
                    earnedCourseCount++;
                    earnedCredits += bestCandidate.userCourse().earnedCredits();
                    hasMatchedCourse = true;

                    // recognizedCourses에는 실제 이수 과목 정보 추가
                    recognizedCourses.add(new MicromajorStatusResponse.RecognizedCourse(
                            bestCandidate.userCourse().courseId(),
                            bestCandidate.userCourse().courseCodeSnapshot(),
                            bestCandidate.userCourse().courseNameSnapshot(),
                            bestCandidate.userCourse().earnedCredits()
                    ));
                }

                // 그룹 충족 여부 계산, 남은 과목 수와 충족 여부 집계
                int remainingCourseCount = Math.max(0, group.requiredCourseCount() - groupEarnedCourseCount);
                boolean isSatisfied = groupEarnedCourseCount >= group.requiredCourseCount();
                if (!isSatisfied) {
                    allGroupsSatisfied = false;
                }

                // 그룹 상태 응답 추가
                groupStatuses.add(new MicromajorStatusResponse.GroupStatus(
                        group.groupNo(),
                        group.groupName(),
                        group.requiredCourseCount(),
                        groupEarnedCourseCount,
                        remainingCourseCount,
                        isSatisfied
                ));
            }

            // 전체 남은 과목 수 계산
            int remainingCourseCount = Math.max(0, microMajor.requiredCourseCount() - earnedCourseCount);

            // 전체 완료 여부 계산, 그룹·과목 수·학점 조건 모두 충족 필요
            boolean isCompleted = allGroupsSatisfied
                    && earnedCourseCount >= microMajor.requiredCourseCount()
                    && earnedCredits >= microMajor.requiredCredits();

            // 상태 응답 추가
            microMajors.add(new MicromajorStatusResponse.MicroMajorStatus(
                    microMajor.microMajorId(),
                    microMajor.microMajorName(),
                    microMajor.microMajorCategory(),
                    microMajor.operatingUnitNames(),
                    isCompleted ? "이수완료" : hasMatchedCourse ? "이수중" : "이수대상아님",
                    microMajor.requiredCourseCount(),
                    earnedCourseCount,
                    remainingCourseCount,
                    groupStatuses,
                    recognizedCourses,
                    missingCourses
            ));
        }

        return new MicromajorStatusResponse(microMajors);
    }

    // 슬롯 후보 수집, 적용 시작 시점과 코드·이름 exact match 조건 통과 행만 저장
    private List<MatchedSlotCandidate> collectMatchedCandidates(
            List<RequirementCourseRow> slotCourses,
            List<UserCourseRow> validCourses,
            MicroMajorRow microMajor
    ) {
        List<MatchedSlotCandidate> candidates = new ArrayList<>();

        for (RequirementCourseRow requirementCourse : slotCourses) {
            int validFromYear = requirementCourse.validFromYearOverride() != null
                    ? requirementCourse.validFromYearOverride()
                    : microMajor.validFromYear();
            String validFromTerm = requirementCourse.validFromTermOverride() != null
                    ? requirementCourse.validFromTermOverride()
                    : microMajor.validFromTerm();
            int validFromTermOrder = AcademicTermPolicy.sortOrder(validFromTerm);

            String recognizedCourseCode = requirementCourse.recognizedCourseCode();
            // 인정 과목 코드 공백 정리
            if (recognizedCourseCode != null) {
                recognizedCourseCode = recognizedCourseCode.trim();
                // 빈 코드는 null 처리
                if (recognizedCourseCode.isEmpty()) {
                    recognizedCourseCode = null;
                }
            }

            String recognizedCourseName = requirementCourse.recognizedCourseName();
            // 인정 과목명 공백 정리
            if (recognizedCourseName != null) {
                recognizedCourseName = recognizedCourseName.trim();
                // 빈 이름은 null 처리
                if (recognizedCourseName.isEmpty()) {
                    recognizedCourseName = null;
                }
            }

            // 유효 수강 과목 비교, 적용 시점과 코드·이름 exact match 확인
            for (UserCourseRow userCourse : validCourses) {
                // 적용 시작 연도 이전 과목 제외
                if (userCourse.takenYear() < validFromYear) {
                    continue;
                }

                // 적용 시작 학기 이전 과목 제외
                if (userCourse.takenYear() == validFromYear
                        && AcademicTermPolicy.sortOrder(userCourse.takenTerm()) < validFromTermOrder) {
                    continue;
                }

                int matchPriority = 0;

                String courseCode = userCourse.courseCodeSnapshot();
                // 수강 과목 코드 공백 정리
                if (courseCode != null) {
                    courseCode = courseCode.trim();
                    // 빈 코드는 null 처리
                    if (courseCode.isEmpty()) {
                        courseCode = null;
                    }
                }

                // 코드 우선 매칭
                if (recognizedCourseCode != null && courseCode != null) {
                    if (recognizedCourseCode.equals(courseCode)) {
                        matchPriority = 1;
                    }
                } else {
                    String courseName = userCourse.courseNameSnapshot();
                    // 수강 과목명 공백 정리
                    if (courseName != null) {
                        courseName = courseName.trim();
                        // 빈 이름은 null 처리
                        if (courseName.isEmpty()) {
                            courseName = null;
                        }
                    }

                    // 이름 보조 매칭
                    if (recognizedCourseName != null
                            && courseName != null
                            && recognizedCourseName.equals(courseName)) {
                        matchPriority = 2;
                    }
                }

                // 매칭 실패 조합 제외
                if (matchPriority == 0) {
                    continue;
                }

                candidates.add(new MatchedSlotCandidate(requirementCourse, userCourse, matchPriority));
            }
        }

        // 후보 목록 반환
        return candidates;
    }

    // 대표 후보 선택, 우선순위 기준 가장 좋은 후보 1건 반환
    private MatchedSlotCandidate pickBestCandidate(List<MatchedSlotCandidate> candidates) {
        MatchedSlotCandidate bestCandidate = candidates.get(0);

        for (int index = 1; index < candidates.size(); index++) {
            MatchedSlotCandidate candidate = candidates.get(index);

            // 코드 일치 우선
            if (candidate.matchPriority() != bestCandidate.matchPriority()) {
                if (candidate.matchPriority() < bestCandidate.matchPriority()) {
                    bestCandidate = candidate;
                }
                continue;
            }

            // 학점 큰 과목 우선
            if (candidate.userCourse().earnedCredits() != bestCandidate.userCourse().earnedCredits()) {
                if (candidate.userCourse().earnedCredits() > bestCandidate.userCourse().earnedCredits()) {
                    bestCandidate = candidate;
                }
                continue;
            }

            // displayOrder 앞선 과목 우선
            if (candidate.requirementCourse().displayOrder() != bestCandidate.requirementCourse().displayOrder()) {
                if (candidate.requirementCourse().displayOrder() < bestCandidate.requirementCourse().displayOrder()) {
                    bestCandidate = candidate;
                }
                continue;
            }

            // 더 최근 연도 우선
            if (candidate.userCourse().takenYear() != bestCandidate.userCourse().takenYear()) {
                if (candidate.userCourse().takenYear() > bestCandidate.userCourse().takenYear()) {
                    bestCandidate = candidate;
                }
                continue;
            }

            int candidateTermOrder = AcademicTermPolicy.sortOrder(candidate.userCourse().takenTerm());
            int bestTermOrder = AcademicTermPolicy.sortOrder(bestCandidate.userCourse().takenTerm());
            // 같은 연도면 더 최근 학기 우선
            if (candidateTermOrder != bestTermOrder) {
                if (candidateTermOrder > bestTermOrder) {
                    bestCandidate = candidate;
                }
                continue;
            }

            // 마지막으로 courseId 큰 과목 우선
            if (candidate.userCourse().courseId() > bestCandidate.userCourse().courseId()) {
                bestCandidate = candidate;
            }
        }

        // 대표 후보 반환
        return bestCandidate;
    }

    // 유효 수강 과목 선택, 재수강 최신 반영과 F·NP 제외 결과 복원
    private List<UserCourseRow> selectValidCourses(List<UserCourseRow> rawCourses) {
        // 수강 과목이 없으면 빈 목록 반환
        if (rawCourses.isEmpty()) {
            return List.of();
        }

        // AcademicTermPolicy 입력용 목록 변환
        List<CourseRow> coursesForSelection = new ArrayList<>();
        Map<Long, UserCourseRow> rawCourseById = new HashMap<>();
        for (UserCourseRow rawCourse : rawCourses) {
            rawCourseById.put(rawCourse.courseId(), rawCourse);
            coursesForSelection.add(new CourseRow(
                    rawCourse.courseId(),
                    null,
                    rawCourse.courseCodeSnapshot(),
                    rawCourse.courseNameSnapshot(),
                    null,
                    null,
                    null,
                    rawCourse.earnedCredits(),
                    rawCourse.grade(),
                    rawCourse.takenYear(),
                    rawCourse.takenTerm(),
                    rawCourse.retakeCourseId(),
                    null,
                    null,
                    null
            ));
        }

        // 유효 수강 과목 복원
        List<UserCourseRow> validCourses = new ArrayList<>();
        for (CourseRow activeCourse : AcademicTermPolicy.selectCourses(coursesForSelection).activeCourses()) {
            // F, NP 과목 제외
            if ("F".equals(activeCourse.grade()) || "NP".equals(activeCourse.grade())) {
                continue;
            }

            UserCourseRow rawCourse = rawCourseById.get(activeCourse.courseId());
            // 원본 과목이 있으면 최종 목록에 추가
            if (rawCourse != null) {
                validCourses.add(rawCourse);
            }
        }

        return validCourses;
    }
}
