package com.khuoo.gradmanager.course.service;

import com.khuoo.gradmanager.course.dto.CourseCreateRequest;
import com.khuoo.gradmanager.course.dto.CourseCreateResponse;
import com.khuoo.gradmanager.course.dto.CourseItem;
import com.khuoo.gradmanager.course.dto.CourseListResponse;
import com.khuoo.gradmanager.course.repository.CourseMasterLookupDao;
import com.khuoo.gradmanager.course.repository.CourseRepository;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMasterLookupDao courseMasterLookupDao;

    // 수강 내역 입력
    @Transactional
    public CourseCreateResponse create(long userId, CourseCreateRequest req) {

        long courseMasterId = requirePositive(req.courseMasterId()); // 강의ID, 0 이하 값은 요청 오류 처리
        // 강의 목록에 강의ID의 강의가 있어야함.
        CourseMasterLookupDao.CourseMasterSnapshot cm =
                courseMasterLookupDao.findSnapshotById(courseMasterId)
                        .orElseThrow(() -> new ApiException(ErrorCode.COURSE_NOT_FOUND));
        int earnedCredits = requirePositive(req.earnedCredits()); // 학점, 0 이하 값은 요청 오류 처리
        String grade = normalizeRequired(req.grade()); // 성적, 공백/NULL은 허용하지 않음
        int takenYear = requirePositive(req.takenYear()); // 수강 연도, 0 이하 값은 요청 오류 처리
        String takenTerm = normalizeRequired(req.takenTerm()); // 공백/NULL은 허용하지 않음

        // 교양/전공 판정 및 DB CHECK 제약을 만족하는 값으로 강제 결정 (cm:{카테고리 전공/교양, 세부카테고리}, 전공ID, 학부ID)
        CourseInsertDecision decision = decideInsertValues(cm, req.majorId(), req.attributedDepartmentId());

        long courseId = courseRepository.insert(
                userId,
                courseMasterId,
                earnedCredits,
                grade,
                takenYear,
                takenTerm,
                decision.recognitionType,
                decision.majorId,
                decision.attributedDepartmentId
        );

        return new CourseCreateResponse(courseId);
    }

    private CourseInsertDecision decideInsertValues(
            CourseMasterLookupDao.CourseMasterSnapshot cm,
            Long majorId,
            Long attributedDepartmentId
    ) {
        // course_master 기반으로 교양/전공 및 recognition_type을 서버에서 강제 결정
        String category = normalizeRequired(cm.courseCategory()); // 교양/전공, 공백/NULL은 허용하지 않음
        String subcategory = normalizeRequired(cm.courseSubcategory()); // 세부 카테고리, 공백/NULL은 허용하지 않음

        // 교양 과목은 recognition_type/major_id/attributed_department_id 허용하지 않음
        if ("교양".equals(category)) {
            if (majorId != null || attributedDepartmentId != null) {
                throw new ApiException(ErrorCode.INVALID_REQUEST);
            }
            return new CourseInsertDecision(null, null, null);
        }

        // 위에서 교양과목 종료, 아래는 전공 과목만 검사 (전공 과목이 아니라면 오류)
        if (!"전공".equals(category)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 전공탐색은 majorId 허용하지 않음, attributedDepartmentId 필수
        if ("전공탐색".equals(subcategory)) {

            if (majorId != null) { // majorId가 있으면 요청 오류로 처리
                throw new ApiException(ErrorCode.INVALID_REQUEST);
            }

            Long vDeptId = requirePositive(attributedDepartmentId); // 학부ID, null/0 이하 값은 요청 오류 처리

            return new CourseInsertDecision("전공탐색", null, vDeptId);
        }

        // 전공필수/전공선택은 majorId 필수, attributedDepartmentId 허용하지 않음
        if ("전공필수".equals(subcategory) || "전공선택".equals(subcategory)) {

            if (attributedDepartmentId != null) { // attributedDepartmentId 오면 요청 오류로 처리
                throw new ApiException(ErrorCode.INVALID_REQUEST);
            }

            Long vMajorId = requirePositive(majorId); // 전공ID, null/0 이하 값은 요청 오류 처리

            return new CourseInsertDecision(subcategory, vMajorId, null);
        }

        // 전공인데 전공필수/전공탐색/전공선택 외 값은 등록을 허용하지 않음
        throw new ApiException(ErrorCode.INVALID_REQUEST);
    }

    // decideInsertValues 반환 객체
    private record CourseInsertDecision(
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId
    ) {
    }

    // 수강 내역 조회
    @Transactional(readOnly = true)
    public CourseListResponse list(long userId, Integer year, String term) {

        boolean hasYear = (year != null);
        boolean hasTerm = (term != null && !term.trim().isBlank());

        List<CourseItem> items;

        // year/term이 모두 없으면 전체 조회
        if (!hasYear && !hasTerm) {
            items = courseRepository.findAllByUser(userId);
            return new CourseListResponse(items);
        }

        // year/term이 모두 있을 경우 해당 년도/학기 조회
        if (hasYear && hasTerm) {
            int normalizedYear = requirePositive(year); // 0이하의 값 요청 오류 처리
            String normalizedTerm = normalizeRequired(term); // null/공백 요청 오류 처리
            items = courseRepository.findByUserAndTerm(userId, normalizedYear, normalizedTerm);
            return new CourseListResponse(items);
        }

        // 한쪽만 존재하면 요청 오류로 처리 (년도 조회, 학기 조회 제공X)
        throw new ApiException(ErrorCode.INVALID_REQUEST);
    }

    // 수강 내역 삭제
    @Transactional
    public void delete(long userId, long courseId) {

        long VAL_courseId = requirePositive(courseId); // 0이하의 값 요청 오류 처리

        int affected = courseRepository.deleteByIdAndUser(VAL_courseId, userId);

        // 사용자의 수강내역 중 courseId와 일치하는 row가 없음.
        if (affected == 0) {
            throw new ApiException(ErrorCode.COURSE_NOT_FOUND);
        }
    }



    // 정수형 데이터 0이하 값인지 검증, 검증된 데이터 반환
    private long requirePositive(long value) {
        // 0 이하 값은 허용하지 않음
        if (value <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return value;
    }

    // 위와 동일
    private int requirePositive(Integer value) {
        // null 또는 0 이하 값은 허용하지 않음
        if (value == null || value <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return value;
    }

    // 문자열의 null, 공백 오류 처리 / trim데이터 반환
    private String normalizeRequired(String value) {
        // null은 허용하지 않음
        if (value == null) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        String trimmed = value.trim();

        // blank 문자열은 허용하지 않음
        if (trimmed.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        return trimmed;
    }


}