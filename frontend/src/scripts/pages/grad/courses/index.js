import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";

import { bindCoursesPageEvents } from "./events.js";
import {
  COURSE_MAJOR_OPTIONS,
  SEARCH_COURSE_DUMMY_DATA,
  TAKEN_COURSE_DUMMY_DATA,
} from "./mock-data.js";
import { renderEditModal, renderMajorModal, renderSearchResults, renderTakenCourses } from "./render.js";

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
    totalCreditsText: qs("[data-total-credits]", pageRoot),
    takenEmptyPanel: qs("[data-taken-empty-panel]", pageRoot),
    takenTableWrap: qs("[data-taken-table-wrap]", pageRoot),
    takenCourseRows: qs("[data-taken-course-rows]", pageRoot),
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

// Courses 페이지 초기화
export async function initCoursesPage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_COURSES,
    userName: authResult.profile?.user?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const elements = collectCoursesPageElements(pageRoot);
  const currentYear = String(new Date().getFullYear());
  const termSortOrder = {
    1: 1,
    SUMMER: 2,
    2: 3,
    WINTER: 4,
  };

  elements.searchYearInput.value = currentYear;

  const searchCatalog = SEARCH_COURSE_DUMMY_DATA.map((course) => ({ ...course }));
  const takenCourses = TAKEN_COURSE_DUMMY_DATA.map((course) => ({ ...course })).sort((leftCourse, rightCourse) => {
    const yearDiff = Number(rightCourse.takenYear || 0) - Number(leftCourse.takenYear || 0);
    if (yearDiff !== 0) return yearDiff;

    const leftTermOrder = termSortOrder[leftCourse.takenTerm] || 0;
    const rightTermOrder = termSortOrder[rightCourse.takenTerm] || 0;
    return rightTermOrder - leftTermOrder;
  });

  const searchResults = searchCatalog.filter((course) => course.year === currentYear);

  const page = {
    elements,
    searchCatalog,
    searchResults,
    takenCourses,
    mockUserMajors: COURSE_MAJOR_OPTIONS.slice(0, 2).map((major) => ({ ...major })),
    searchStatus: searchResults.length > 0 ? "results" : "empty",
    searchTimerId: 0,
    openEditCourseId: "",
    editCourseDraft: null,
    pendingMajorCourse: null,
    pendingMajorOptions: [],
    selectedMajorId: "",
    termSortOrder,
  };

  renderSearchResults(page);
  renderTakenCourses(page);
  renderEditModal(page);
  renderMajorModal(page);
  bindCoursesPageEvents(page);
}

initCoursesPage();
