import { getCourseMasters, getCourses } from "/src/scripts/api/course.js";
import { getProfile } from "/src/scripts/api/profile.js";
import { getDepartments } from "/src/scripts/api/reference.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { initTutorial } from "/src/scripts/components/tutorial.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";

import { bindCoursesPageEvents } from "./events.js";
import {
  renderEditModal,
  renderMajorModal,
  renderSearchResults,
  renderTakenCourses,
  syncCoursesMobileListScroll,
} from "./render.js";

function createCoursesSimpleOnboardingSteps() {
  return [
    {
      target: '[data-tutorial="courses-search-card"]',
      title: "과목검색",
      description: "과목을 검색해 수강내역으로 추가합니다.",
      warning: "연도/학기는 필수 선택입니다.",
    },
    {
      target: '[data-tutorial="courses-taken-card"]',
      title: "수강내역",
      description: [
        "등록한 과목을 확인하고 수정하거나 삭제할 수 있습니다.",
        "과목을 클릭하면 과목 수정 모달에서 수정이 가능합니다.",
      ],
      actionType: "navigate",
      actionLabel: "졸업 현황으로 이동",
      actionHref: PAGE_PATHS.GRAD_STATUS,
      nextOnboardingPageKey: "status",
      nextOnboardingStepIndex: 0,
    },
  ];
}

function createCoursesDetailedTutorialSteps() {
  return [
    {
      target: '[data-tutorial="courses-search-card"]',
      title: "과목 검색 카드",
      description: [
        "수강할 과목을 연도와 학기로 검색해서 추가하는 영역입니다.",
        "세부구분과 과목명까지 함께 사용하면 더 빠르게 찾을 수 있습니다.",
      ],
      warning: "연도/학기는 필수 선택입니다.",
    },
    {
      target: '[data-tutorial="courses-taken-filter"]',
      title: "수강 내역 필터",
      description: [
        "필터 적용없이 검색 시 모든 수강내역을 확인할 수 있습니다.",
        "필터 적용을 통해 필요한 학기의 정보만 확인 가능합니다.",
      ],
    },
    {
      target: '[data-tutorial="courses-taken-card"]',
      title: "수강 테이블",
      description: [
        "등록된 과목의 학점, 성적, 학기 정보를 표로 확인합니다.",
        "표가 비어 있어도 다음 온보딩 단계로는 계속 진행할 수 있습니다.",
      ],
    },
    {
      target: '[data-tutorial="courses-taken-card"]',
      title: "수정과 삭제",
      description: [
        "행을 클릭하면 수정 모달이 열리고, 우측 버튼으로 삭제할 수 있습니다.",
        "과목 수정 시 재수강 과목은 해당 과목의 이전 학기의 과목들만 선택할 수 있습니다.",
      ],
      warning: "재수강은 가장 처음 수강했던, 재수강으로 대체하고 싶은 과목을 선택해야합니다.",
      actionType: "close",
      actionLabel: "튜토리얼 종료",
    },
  ];
}

// Courses 페이지 DOM 참조 수집
function collectCoursesPageElements(pageRoot) {
  return {
    searchForm: qs("[data-search-form]", pageRoot),
    searchYearInput: qs("[data-search-year-input]", pageRoot),
    searchTermSelect: qs("[data-search-term-select]", pageRoot),
    searchSubcategorySelect: qs("[data-search-subcategory-select]", pageRoot),
    searchNameInput: qs("[data-search-name-input]", pageRoot),
    searchStatePanel: qs("[data-search-state-panel]", pageRoot),
    searchTableWrap: qs("[data-search-table-wrap]", pageRoot),
    searchCourseRows: qs("[data-search-course-rows]", pageRoot),
    searchMobileList: qs("[data-search-mobile-list]", pageRoot),
    totalCreditsText: qs("[data-total-credits]", pageRoot),
    takenFilterForm: qs("[data-taken-filter-form]", pageRoot),
    takenYearInput: qs("[data-taken-year-input]", pageRoot),
    takenTermSelect: qs("[data-taken-term-select]", pageRoot),
    takenFilterResetButton: qs("[data-taken-filter-reset-button]", pageRoot),
    takenEmptyPanel: qs("[data-taken-empty-panel]", pageRoot),
    takenTableWrap: qs("[data-taken-table-wrap]", pageRoot),
    takenCourseRows: qs("[data-taken-course-rows]", pageRoot),
    takenMobileList: qs("[data-taken-mobile-list]", pageRoot),
    editCourseModal: qs("[data-edit-course-modal]", pageRoot),
    editCourseForm: qs("[data-edit-course-form]", pageRoot),
    editCourseCodeInput: qs("[data-edit-course-code-input]", pageRoot),
    editCourseNameInput: qs("[data-edit-course-name-input]", pageRoot),
    editCourseCreditsInput: qs("[data-edit-course-credits-input]", pageRoot),
    editCourseGradeSelect: qs("[data-edit-course-grade-select]", pageRoot),
    editCourseYearInput: qs("[data-edit-course-year-input]", pageRoot),
    editCourseTermSelect: qs("[data-edit-course-term-select]", pageRoot),
    editCourseSubcategorySelect: qs("[data-edit-course-subcategory-select]", pageRoot),
    editCourseMajorSelect: qs("[data-edit-course-major-select]", pageRoot),
    editCourseDepartmentSelect: qs("[data-edit-course-department-select]", pageRoot),
    editCourseRetakeSelect: qs("[data-edit-course-retake-select]", pageRoot),
    editCourseCloseButton: qs("[data-close-edit-course]", pageRoot),
    editCourseCancelButton: qs("[data-cancel-edit-course]", pageRoot),
    majorSelectModal: qs("[data-major-select-modal]", pageRoot),
    majorSelectForm: qs("[data-major-select-form]", pageRoot),
    majorCourseSummary: qs("[data-major-course-summary]", pageRoot),
    majorSelectInput: qs("[data-major-select-input]", pageRoot),
    majorSelectCloseButton: qs("[data-close-major-select]", pageRoot),
    majorSelectCancelButton: qs("[data-cancel-major-select]", pageRoot),
  };
}

// Courses 페이지 기본 객체 생성
function createCoursesPageState(elements, authResult) {
  return {
    elements,
    profile: authResult.profile || null,
    userMajors: [],
    departments: [],
    departmentsStatus: "loading",
    searchResults: [],
    takenCourses: [],
    takenFilters: {
      year: "",
      term: "",
    },
    searchStatus: "idle",
    takenStatus: "loading",
    searchTimerId: 0,
    openEditCourseId: "",
    editCourseDraft: null,
    pendingMajorCourse: null,
    pendingMajorOptions: [],
    selectedMajorId: "",
    termSortOrder: {
      1: 1,
      SUMMER: 2,
      2: 3,
      WINTER: 4,
    },
    searchCourseMasters: null,
    refreshTakenCourses: null,
    tutorial: null,
  };
}

// 전공 응답 정규화
function normalizeUserMajor(item) {
  // profile 전공 목록에 id가 없는 잘못된 항목 제외
  if (!item || item.id === undefined || item.id === null) return null;

  return {
    majorId: Number(item.id),
    label: item.name || "",
  };
}

// 학부 응답 정규화
function normalizeDepartment(item) {
  // reference 학부 목록에서 식별자가 없는 항목 제외
  if (!item || item.id === undefined || item.id === null) return null;

  return {
    departmentId: Number(item.id),
    label: item.name || "",
  };
}

// Course Master 응답 정규화
function normalizeCourseMaster(item) {
  // 검색 결과는 courseMasterId 기준으로만 Add 흐름 연결 가능
  if (!item || item.courseMasterId === undefined || item.courseMasterId === null) return null;

  return {
    courseMasterId: Number(item.courseMasterId),
    code: item.courseCode || "",
    name: item.courseName || "",
    credits: Number(item.defaultCredits || 0),
    category: item.courseCategory || "",
    subcategory: item.courseSubcategory || "",
  };
}

// 수강 이력 응답 정규화
function normalizeTakenCourse(item) {
  // 수강 이력은 courseId가 실제 수정/삭제 식별자
  if (!item || item.courseId === undefined || item.courseId === null) return null;

  return {
    courseId: Number(item.courseId),
    courseMasterId: Number(item.courseMasterId || 0),
    code: item.courseCode || "",
    name: item.courseName || "",
    earnedCredits: Number(item.earnedCredits || 0),
    takenYear: String(item.takenYear || ""),
    takenTerm: item.takenTerm || "",
    courseCategory: item.courseCategory || "",
    courseSubcategory: item.courseSubcategory || "",
    grade: item.grade || "",
    majorId: item.majorId == null ? "" : String(item.majorId),
    majorLabel: item.majorName || "",
    attributedDepartmentId: item.departmentId == null ? "" : String(item.departmentId),
    attributedDepartmentLabel: item.departmentName || "",
    retakeCourseId: item.retakeCourseId == null ? "" : String(item.retakeCourseId),
    isRetake: Boolean(item.retakeCourseId),
  };
}

// 수강 이력 최신순 정렬
function sortTakenCourses(courses, termSortOrder) {
  return [...courses].sort((leftCourse, rightCourse) => {
    // 최신 연도 우선 정렬
    const yearDiff = Number(rightCourse.takenYear || 0) - Number(leftCourse.takenYear || 0);
    if (yearDiff !== 0) return yearDiff;

    // 같은 연도 안에서는 겨울 > 2학기 > 여름 > 1학기 순으로 최신 처리
    const leftTermOrder = termSortOrder[leftCourse.takenTerm] || 0;
    const rightTermOrder = termSortOrder[rightCourse.takenTerm] || 0;
    if (leftTermOrder !== rightTermOrder) {
      return rightTermOrder - leftTermOrder;
    }

    return Number(rightCourse.courseId || 0) - Number(leftCourse.courseId || 0);
  });
}

// 현재 적용 중인 Taken Courses 필터를 API query로 변환
function buildTakenCoursesParams(page) {
  // 연도/학기가 모두 비어 있으면 전체 학기 조회
  if (!page.takenFilters.year || !page.takenFilters.term) {
    return {};
  }

  return {
    year: Number(page.takenFilters.year),
    term: page.takenFilters.term,
  };
}

// 프로필과 전공 목록 반영
function applyProfileToPage(page, profile) {
  page.profile = profile || null;
  // Courses에서는 userMajorId가 아니라 실제 majorId만 사용
  page.userMajors = Array.isArray(profile?.majors) ? profile.majors.map(normalizeUserMajor).filter(Boolean) : [];
}

// 초기 데이터 로드
async function loadInitialCoursesPageData(page, authResult) {
  page.takenStatus = "loading";
  page.departmentsStatus = "loading";
  renderTakenCourses(page);

  // 인증 확인 결과에 profile이 없으면 실제 profile API 한 번 더 조회
  const profile = authResult.profile || (await getProfile());
  applyProfileToPage(page, profile);

  const [departmentsResult, coursesResult] = await Promise.allSettled([
    getDepartments(),
    getCourses(buildTakenCoursesParams(page)),
  ]);
  let coursesLoadError = null;

  if (departmentsResult.status === "fulfilled") {
    page.departments = Array.isArray(departmentsResult.value?.departments)
      ? departmentsResult.value.departments.map(normalizeDepartment).filter(Boolean)
      : [];
    page.departmentsStatus = "ready";
  } else {
    console.error("[Courses][DepartmentsLoadFailed]", departmentsResult.reason);
    page.departments = [];
    page.departmentsStatus = "error";
  }

  // 메인 목록인 taken courses 성공 여부로 페이지 메인 상태 결정
  if (coursesResult.status === "fulfilled") {
    const items = Array.isArray(coursesResult.value?.items) ? coursesResult.value.items : [];
    page.takenCourses = sortTakenCourses(items.map(normalizeTakenCourse).filter(Boolean), page.termSortOrder);
    page.takenStatus = page.takenCourses.length > 0 ? "results" : "empty";
  } else {
    console.error("[Courses][TakenCoursesLoadFailed]", coursesResult.reason);
    page.takenCourses = [];
    page.takenStatus = "error";
    coursesLoadError = coursesResult.reason;
  }

  renderTakenCourses(page);

  // departments 실패는 보조 데이터 제한으로만 처리하고, courses 실패만 상위 에러로 전달
  if (coursesLoadError) {
    throw coursesLoadError;
  }
}

// Courses 페이지 초기화
export async function initCoursesPage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_COURSES,
    userName: authResult.profile?.user?.name || "",
    profile: authResult.profile,
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const page = createCoursesPageState(collectCoursesPageElements(pageRoot), authResult);
  const currentYear = String(new Date().getFullYear());
  page.elements.searchYearInput.value = currentYear;
  if (page.elements.takenYearInput) {
    page.elements.takenYearInput.value = currentYear;
  }
  page.takenFilters.year = currentYear;

  // Search Courses는 검색 시점마다 서버 응답을 정규화해서 사용
  page.searchCourseMasters = async (params) => {
    const response = await getCourseMasters(params);
    const items = Array.isArray(response?.items) ? response.items : [];
    return items.map(normalizeCourseMaster).filter(Boolean);
  };

  // 수정/삭제 후에도 현재 학기 필터를 유지한 채 다시 조회
  page.refreshTakenCourses = async () => {
    page.takenStatus = "loading";
    renderTakenCourses(page);

    try {
      const response = await getCourses(buildTakenCoursesParams(page));
      const items = Array.isArray(response?.items) ? response.items : [];
      page.takenCourses = sortTakenCourses(items.map(normalizeTakenCourse).filter(Boolean), page.termSortOrder);
      page.takenStatus = page.takenCourses.length > 0 ? "results" : "empty";
    } catch (error) {
      console.error("[Courses][TakenCoursesReloadFailed]", error);
      // 재조회 실패 시 기존 성공 상태를 남기지 않고 에러 패널 노출
      page.takenCourses = [];
      page.takenStatus = "error";
    }

    renderTakenCourses(page);
  };

  renderSearchResults(page);
  renderTakenCourses(page);
  renderEditModal(page);
  renderMajorModal(page);
  bindCoursesPageEvents(page);
  window.addEventListener("resize", () => {
    syncCoursesMobileListScroll(page);
  });
  page.tutorial = initTutorial({
    pageKey: "courses",
    simpleOnboardingSteps: createCoursesSimpleOnboardingSteps(),
    detailedTutorialSteps: createCoursesDetailedTutorialSteps(),
    getContext: () => ({
      profile: page.profile,
    }),
  });

  try {
    await loadInitialCoursesPageData(page, authResult);
    page.tutorial?.refresh({ skipScroll: true });
  } catch (error) {
    console.error("[Courses][InitialLoadFailed]", error);
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    page.takenStatus = "error";
    renderTakenCourses(page);
    page.tutorial?.refresh({ skipScroll: true });
    window.alert(errorInfo.message);
  }
}

initCoursesPage();
