package com.khuoo.gradmanager.course.service;

import com.khuoo.gradmanager.course.dto.CourseCreateRequest;
import com.khuoo.gradmanager.course.dto.CourseCreateResponse;
import com.khuoo.gradmanager.course.dto.CourseItem;
import com.khuoo.gradmanager.course.dto.CourseListResponse;
import com.khuoo.gradmanager.course.dto.CoursePatchRequest;
import com.khuoo.gradmanager.course.repository.CourseMasterLookupDao;
import com.khuoo.gradmanager.course.repository.CourseRepository;
import com.khuoo.gradmanager.course.support.AcademicTermPolicy;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.profile.repository.ProfileRepository;
import com.khuoo.gradmanager.profile.repository.UserMajorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CourseService {
    private static final Set<String> ALLOWED_GRADES = Set.of(
            "A+",
            "A0",
            "B+",
            "B0",
            "C+",
            "C0",
            "D+",
            "D0",
            "F",
            "P",
            "NP"
    );

    private final CourseRepository courseRepository;
    private final CourseMasterLookupDao courseMasterLookupDao;
    private final UserMajorRepository userMajorRepository;
    private final ProfileRepository profileRepository;

    // 수강 내역 등록
    @Transactional
    public CourseCreateResponse create(long userId, CourseCreateRequest req) {

        long courseMasterId = requirePositive(req.courseMasterId()); // 과목 마스터 ID, 0 이하 값은 요청 오류 처리
        CourseMasterLookupDao.CourseMasterSnapshot courseMaster =
                courseMasterLookupDao.findSnapshotById(courseMasterId)
                        .orElseThrow(() -> new ApiException(ErrorCode.COURSE_NOT_FOUND));

        int takenYear = requirePositive(req.takenYear()); // 수강 연도, 0 이하 값은 요청 오류 처리
        String takenTerm = AcademicTermPolicy.normalize(req.takenTerm()); // 수강 학기, 기존 계절학기 문자열을 포함해 표준값으로 정규화

        Long attributedDepartmentId = null;
        // 전공탐색 과목이면 접근 가능 학부 목록과 사용자 학부를 함께 보고 귀속 학부 결정
        if ("전공탐색".equals(normalizeRequired(courseMaster.courseSubcategory()))) {
            List<Long> accessibleDepartmentIds = courseMasterLookupDao.findAccessibleDepartmentIdsByCourseMasterId(courseMasterId);
            // 소속학부가 없는 과목일 경우 오류
            if (accessibleDepartmentIds.isEmpty()) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

            ProfileRepository.ProfileBase profileBase = profileRepository.findProfileBaseByUserId(userId);
            if (profileBase == null) { throw new ApiException(ErrorCode.USER_NOT_FOUND); } // 사용자 프로필 존재 여부 검증
            Long userDepartmentId = profileBase.departmentId(); // 사용자 프로필 학부 ID

            // 사용자 학부가 접근 가능 목록에 있으면 사용자 학부 우선, 없으면 최신 학부 사용
            attributedDepartmentId = accessibleDepartmentIds.contains(userDepartmentId)
                    ? userDepartmentId
                    : accessibleDepartmentIds.get(0);
        }

        // 과목 분류에 맞는 이수구분/전공/귀속학부 저장값 결정
        CourseWriteDecision decision = decideWriteValues(
                courseMaster.courseCategory(),
                courseMaster.courseSubcategory(),
                req.majorId(),
                attributedDepartmentId
        );

        validateOwnedMajor(userId, decision.majorId()); // 전공 귀속이 있으면 본인 전공인지 검증

        // 재수강 원본 과목 검증(존재/소유권/자기참조/원본 여부)
        Long retakeCourseId = validateRetakeCourse(
                req.retakeCourseId(),
                null,
                userId
        );

        validateDuplicate(userId, courseMasterId, takenYear, takenTerm, null); // 동일 과목/연도/학기 중복 등록 방지

        try {
            long courseId = courseRepository.insert(
                    userId,
                    courseMasterId,
                    courseMaster.defaultCredits(), // 최초 등록 시 과목 마스터 기본 학점 사용
                    "A+",                          // 최초 등록 시 기본 성적 부여
                    takenYear,
                    takenTerm,
                    decision.recognitionType(),
                    decision.majorId(),
                    decision.attributedDepartmentId(),
                    retakeCourseId
            );

            return new CourseCreateResponse(courseId);
        } catch (DuplicateKeyException e) {
            throw new ApiException(ErrorCode.DUPLICATE_RESOURCE, e);
        }
    }

    // 수강 내역 수정
    @Transactional
    public void patch(long userId, long courseId, CoursePatchRequest req) {

        long validatedCourseId = requirePositive(courseId);
        CourseRepository.CourseWriteRow current = courseRepository.findWriteRowById(validatedCourseId)
                .orElseThrow(() -> new ApiException(ErrorCode.COURSE_NOT_FOUND));

        // 수강 내역 소유자 검증
        if (current.userId() != userId) { throw new ApiException(ErrorCode.FORBIDDEN); }

        // courseMasterId 수정 요청 포함 여부 검증
        if (req.hasCourseMasterId()) {
            long validatedCourseMasterId = requirePositive(req.courseMasterId());
            // courseMasterId 변경 시도 여부 검증
            if (validatedCourseMasterId != current.courseMasterId()) { throw new ApiException(ErrorCode.INVALID_REQUEST); }
        }

        int earnedCredits = req.hasEarnedCredits() ? requirePositive(req.earnedCredits()) : current.earnedCredits(); // 학점 수정 요청이 없으면 기존 취득학점 유지

        String grade = req.hasGrade() ? normalizeRequired(req.grade()).toUpperCase() : current.grade(); // 성적 수정 요청이 없으면 기존 성적 유지
        if (req.hasGrade() && !ALLOWED_GRADES.contains(grade)) { throw new ApiException(ErrorCode.INVALID_REQUEST); } // 허용된 성적 코드 여부 검증

        int takenYear = req.hasTakenYear() ? requirePositive(req.takenYear()) : current.takenYear(); // 수강 연도 수정 요청이 없으면 기존 수강 연도 유지
        String takenTerm = req.hasTakenTerm() ? AcademicTermPolicy.normalize(req.takenTerm()) : current.takenTerm(); // 수강 학기 수정 요청이 없으면 기존 수강 학기 유지
        Long majorId = req.hasMajorId() ? req.majorId() : current.majorId(); // 전공 귀속 수정 요청이 없으면 기존 전공 귀속 유지
        Long attributedDepartmentId = req.hasAttributedDepartmentId() ? req.attributedDepartmentId() : current.attributedDepartmentId(); // 전공탐색 귀속 학부 수정 요청이 없으면 기존 귀속 학부 유지

        // 과목 분류에 맞는 이수구분/전공/귀속학부 저장값 재계산
        CourseWriteDecision decision = decideWriteValues(
                current.courseCategory(),
                current.courseSubcategory(),
                majorId,
                attributedDepartmentId
        );

        // 전공 귀속 변경 시 본인 전공인지 재검증
        if (req.hasMajorId()) { validateOwnedMajor(userId, decision.majorId()); }

        // 재수강 원본 수정 요청이 없으면 기존 재수강 원본 유지
        Long retakeCourseId = req.hasRetakeCourseId() ? req.retakeCourseId() : current.retakeCourseId();

        // PATCH에서 retakeCourseId가 변경되면 재수강 정책 검증
        retakeCourseId = validateRetakeCourse(
                retakeCourseId,
                validatedCourseId,
                userId
        );
        validateDuplicate(userId, current.courseMasterId(), takenYear, takenTerm, validatedCourseId); // 수정 후에도 동일 과목/연도/학기 중복 방지

        try {
            int updated = courseRepository.update(
                    validatedCourseId,
                    userId,
                    decision.recognitionType(),
                    decision.majorId(),
                    decision.attributedDepartmentId(),
                    earnedCredits,
                    grade,
                    takenYear,
                    takenTerm,
                    retakeCourseId
            );

            // 수정 대상 수강 내역 존재 여부 검증
            if (updated == 0) { throw new ApiException(ErrorCode.COURSE_NOT_FOUND); }
        } catch (DuplicateKeyException e) {
            throw new ApiException(ErrorCode.DUPLICATE_RESOURCE, e);
        }
    }

    // 수강 내역 조회
    @Transactional(readOnly = true)
    public CourseListResponse list(long userId, Integer year, String term) {

        boolean hasYear = (year != null); // 연도 필터 전달 여부
        boolean hasTerm = (term != null && !term.trim().isBlank()); // 학기 필터 전달 여부

        List<CourseItem> items;

        if (!hasYear && !hasTerm) {
            items = courseRepository.findAllByUser(userId); // 필터가 없으면 전체 수강 내역 조회
            return new CourseListResponse(items);
        }

        if (hasYear && hasTerm) {
            int normalizedYear = requirePositive(year); // 연도 필터, 0 이하 값은 요청 오류 처리
            String normalizedTerm = AcademicTermPolicy.normalize(term); // 학기 필터를 표준값으로 정규화
            items = courseRepository.findByUserAndTerm(userId, normalizedYear, normalizedTerm); // 연도/학기 필터가 모두 있으면 해당 학기만 조회
            return new CourseListResponse(items);
        }

        throw new ApiException(ErrorCode.INVALID_REQUEST);
    }

    // 수강 내역 삭제
    @Transactional
    public void delete(long userId, long courseId) {
        long validatedCourseId = requirePositive(courseId); // 0이하의 값 요청 오류 처리
        int affected = courseRepository.deleteByIdAndUser(validatedCourseId, userId);

        // 삭제 대상 수강 내역 존재 여부 검증
        if (affected == 0) { throw new ApiException(ErrorCode.COURSE_NOT_FOUND); }
    }

    // 과목 분류에 따라 저장 가능한 이수구분/전공/귀속학부 값을 결정
    private CourseWriteDecision decideWriteValues(
            String courseCategory,
            String courseSubcategory,
            Long majorId,
            Long attributedDepartmentId
    ) {
        String category = normalizeRequired(courseCategory); // 과목 카테고리, 공백/NULL은 허용하지 않음
        String subcategory = normalizeRequired(courseSubcategory); // 과목 세부 구분, 공백/NULL은 허용하지 않음

        if ("교양".equals(category)) {
            // 교양 과목의 전공/학부 귀속값 입력 금지
            if (majorId != null || attributedDepartmentId != null) { throw new ApiException(ErrorCode.INVALID_REQUEST); }
            return new CourseWriteDecision(null, null, null);
        }

        // 허용된 과목 카테고리 검증
        if (!"전공".equals(category)) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

        if ("전공탐색".equals(subcategory)) {
            // 전공탐색 과목의 전공 귀속값 입력 금지
            if (majorId != null) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

            Long validatedDepartmentId = requirePositive(attributedDepartmentId);
            return new CourseWriteDecision("전공탐색", null, validatedDepartmentId);
        }

        if ("전공필수".equals(subcategory) || "전공선택".equals(subcategory)) {
            // 전공필수/전공선택 과목의 귀속 학부 입력 금지
            if (attributedDepartmentId != null) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

            Long validatedMajorId = requirePositive(majorId);
            return new CourseWriteDecision(subcategory, validatedMajorId, null);
        }

        throw new ApiException(ErrorCode.INVALID_REQUEST);
    }

    // 전공 귀속 값이 현재 사용자 소속 전공인지 검증
    private void validateOwnedMajor(long userId, Long majorId) {
        if (majorId == null) { return; } // 전공 귀속 미입력 검증

        long validatedMajorId = requirePositive(majorId); // 전공 ID, 0 이하 값은 요청 오류 처리
        // 사용자 전공 소유 여부 검증
        if (!userMajorRepository.existsByUserIdAndMajorId(userId, validatedMajorId)) { throw new ApiException(ErrorCode.INVALID_REQUEST); }
    }

    // 재수강 원본 과목 검증
    private Long validateRetakeCourse(
            Long retakeCourseId,
            Long currentCourseId,
            long userId
    ) {
        if (retakeCourseId == null) { return null; } // 재수강 과목 ID null 검증
        long validatedRetakeCourseId = requirePositive(retakeCourseId); // 재수강 원본 수강 ID, 0 이하 값은 요청 오류 처리
        if (currentCourseId != null && validatedRetakeCourseId == currentCourseId) { throw new ApiException(ErrorCode.INVALID_REQUEST); } // 자기 자신을 재수강 원본으로 선택하는지 검증

        CourseRepository.CourseWriteRow retakeCourse = courseRepository.findWriteRowById(validatedRetakeCourseId)
                .orElseThrow(() -> new ApiException(ErrorCode.COURSE_NOT_FOUND));

        // 재수강 원본 과목 소유자 검증
        if (retakeCourse.userId() != userId) { throw new ApiException(ErrorCode.FORBIDDEN); }

        // 재수강 대상은 항상 원본 과목만 허용
        if (retakeCourse.retakeCourseId() != null) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

        return validatedRetakeCourseId;
    }

    // 중복 수강 내역 검증
    private void validateDuplicate(
            long userId,
            long courseMasterId,
            int takenYear,
            String takenTerm,
            Long excludeCourseId
    ) {
        // 동일 과목/연도/학기 중복 수강 여부 검증
        if (courseRepository.existsDuplicate(userId, courseMasterId, takenYear, takenTerm, excludeCourseId)) { throw new ApiException(ErrorCode.DUPLICATE_RESOURCE); }
    }

    // 정수형 데이터 0이하 값인지 검증, 검증된 데이터 반환
    private long requirePositive(Long value) {
        if (value == null || value <= 0) { throw new ApiException(ErrorCode.INVALID_REQUEST); }
        return value;
    }
    private int requirePositive(Integer value) {
        if (value == null || value <= 0) { throw new ApiException(ErrorCode.INVALID_REQUEST); }
        return value;
    }

    // 문자열의 null, 공백 오류 처리 / trim데이터 반환
    private String normalizeRequired(String value) {
        // null은 허용하지 않음
        if (value == null) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

        String trimmed = value.trim();

        // blank 문자열은 허용하지 않음
        if (trimmed.isBlank()) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

        return trimmed;
    }

    // 과목 분류 저장값
    private record CourseWriteDecision(
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId
    ) {}
}
