// Courses 페이지 이벤트와 모달 제어 모듈.

import { COURSE_MAJOR_OPTIONS } from "./mock-data.js";
import { renderEditModal, renderMajorModal, renderSearchResults, renderTakenCourses } from "./render.js";

// Courses 페이지 이벤트 바인딩
export function bindCoursesPageEvents(page) {
  // 검색 폼 submit 이벤트
  page.elements.searchForm?.addEventListener("submit", (event) => {
    handleSearchSubmit(event, page);
  });

  // 검색 결과 Add 버튼 click 이벤트
  page.elements.searchCourseRows?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const addButton = target.closest("[data-search-add-course]");
    if (!(addButton instanceof HTMLButtonElement)) return;

    handleAddCourse(addButton.dataset.searchAddCourse || "", page);
  });

  // 수강 목록 행 click 이벤트와 삭제 버튼 click 이벤트
  page.elements.takenCourseRows?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const deleteButton = target.closest("[data-delete-taken-course]");
    if (deleteButton instanceof HTMLButtonElement) {
      event.stopPropagation();
      handleDeleteCourse(deleteButton.dataset.deleteTakenCourse || "", page);
      return;
    }

    const row = target.closest("[data-taken-course-id]");
    if (!(row instanceof HTMLTableRowElement)) return;

    openEditModal(row.dataset.takenCourseId || "", page);
  });

  // 수정 모달 input 이벤트
  page.elements.editCourseForm?.addEventListener("input", (event) => {
    handleEditCourseFieldChange(event, page);
  });

  // 수정 모달 change 이벤트
  page.elements.editCourseForm?.addEventListener("change", (event) => {
    handleEditCourseFieldChange(event, page);
  });

  // 수정 모달 submit 이벤트
  page.elements.editCourseForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSaveCourseEdit(page);
  });

  // 수정 모달 닫기 버튼 click 이벤트
  page.elements.editCourseCloseButton?.addEventListener("click", () => {
    closeEditModal(page);
  });

  // 수정 모달 취소 버튼 click 이벤트
  page.elements.editCourseCancelButton?.addEventListener("click", () => {
    closeEditModal(page);
  });

  // 수정 모달 오버레이 click 이벤트
  page.elements.editCourseModal?.addEventListener("click", (event) => {
    if (event.target === page.elements.editCourseModal) {
      closeEditModal(page);
    }
  });

  // 전공 선택 select change 이벤트
  page.elements.majorSelectInput?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    page.selectedMajorId = target.value;
  });

  // 전공 선택 모달 submit 이벤트
  page.elements.majorSelectForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    handleMajorModalSubmit(page);
  });

  // 전공 선택 모달 닫기 버튼 click 이벤트
  page.elements.majorSelectCloseButton?.addEventListener("click", () => {
    closeMajorModal(page);
  });

  // 전공 선택 모달 취소 버튼 click 이벤트
  page.elements.majorSelectCancelButton?.addEventListener("click", () => {
    closeMajorModal(page);
  });

  // 전공 선택 모달 오버레이 click 이벤트
  page.elements.majorSelectModal?.addEventListener("click", (event) => {
    if (event.target === page.elements.majorSelectModal) {
      closeMajorModal(page);
    }
  });

  // ESC 키 기반 모달 닫기 이벤트
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (page.pendingMajorCourse) {
      closeMajorModal(page);
      return;
    }

    if (page.openEditCourseId) {
      closeEditModal(page);
    }
  });
}

// 검색 submit 처리
function handleSearchSubmit(event, page) {
  event.preventDefault();

  const searchYear = String(page.elements.searchYearInput.value || "").trim();
  const searchTerm = String(page.elements.searchTermSelect.value || "");
  const searchSubcategory = String(page.elements.searchSubcategorySelect.value || "");
  const searchKeyword = String(page.elements.searchNameInput.value || "")
    .trim()
    .toLowerCase();

  page.searchStatus = "loading";
  renderSearchResults(page);

  window.clearTimeout(page.searchTimerId);

  page.searchTimerId = window.setTimeout(() => {
    page.searchResults = page.searchCatalog.filter((course) => {
      if (searchYear && course.year !== searchYear) return false;
      if (searchTerm && course.term !== searchTerm) return false;
      if (searchSubcategory && course.subcategory !== searchSubcategory) return false;

      if (!searchKeyword) return true;

      return (
        String(course.code || "")
          .toLowerCase()
          .includes(searchKeyword) ||
        String(course.name || "")
          .toLowerCase()
          .includes(searchKeyword)
      );
    });

    page.searchStatus = page.searchResults.length > 0 ? "results" : "empty";
    renderSearchResults(page);
  }, 220);
}

// Add 버튼 처리
function handleAddCourse(courseCode, page) {
  const selectedCourse = page.searchCatalog.find((course) => course.code === courseCode);
  if (!selectedCourse) return;

  const needsMajorChoice = selectedCourse.subcategory === "전공필수" || selectedCourse.subcategory === "전공선택";

  if (!needsMajorChoice) {
    window.alert(`${selectedCourse.name} 과목 등록 요청이 실행되었습니다.`);
    return;
  }

  let availableMajors = [];

  if (selectedCourse.majorSelectionMode === "single") {
    availableMajors = COURSE_MAJOR_OPTIONS.slice(0, 1).map((major) => ({ ...major }));
  } else if (selectedCourse.majorSelectionMode === "multiple") {
    availableMajors = COURSE_MAJOR_OPTIONS.slice(0, 2).map((major) => ({ ...major }));
  }

  if (availableMajors.length === 0) {
    window.alert("전공 과목을 등록하려면 먼저 프로필에서 전공을 선택해주세요.");
    return;
  }

  if (availableMajors.length === 1) {
    window.alert(`${availableMajors[0].label} 전공으로 ${selectedCourse.name} 과목 등록 요청이 실행되었습니다.`);
    return;
  }

  openMajorModal(selectedCourse, availableMajors, page);
}

// 삭제 버튼 처리
function handleDeleteCourse(courseId, page) {
  const selectedCourse = page.takenCourses.find((course) => course.courseId === courseId);
  if (!selectedCourse) return;

  window.alert(`${selectedCourse.name} 과목 삭제 요청이 실행되었습니다.`);
}

// Edit Course 폼 입력 반영
function handleEditCourseFieldChange(event, page) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (!page.editCourseDraft || !target.name || !(target.name in page.editCourseDraft)) return;

  page.editCourseDraft[target.name] = target.value;

  if (target.name === "subcategory") {
    if (target.value === "전공필수" || target.value === "전공선택") {
      page.editCourseDraft.attributedDepartmentId = "";
    } else if (target.value === "전공탐색") {
      page.editCourseDraft.attributedMajorId = "";
    } else {
      page.editCourseDraft.attributedMajorId = "";
      page.editCourseDraft.attributedDepartmentId = "";
    }
  }

  if (target.name === "subcategory" || target.name === "year" || target.name === "term") {
    renderEditModal(page);
  }
}

// 수정 모달 열기
function openEditModal(courseId, page) {
  const selectedCourse = page.takenCourses.find((course) => course.courseId === courseId);
  if (!selectedCourse) return;

  page.openEditCourseId = courseId;
  page.editCourseDraft = {
    code: selectedCourse.code || "",
    name: selectedCourse.name || "",
    credits: String(selectedCourse.earnedCredits ?? ""),
    grade: selectedCourse.grade || "",
    year: selectedCourse.takenYear || "",
    term: selectedCourse.takenTerm || "",
    subcategory: selectedCourse.courseSubcategory || "",
    attributedMajorId: selectedCourse.attributedMajorId || "",
    attributedDepartmentId: selectedCourse.attributedDepartmentId || "",
    retakeCourseId: selectedCourse.retakeCourseId || "",
  };

  renderEditModal(page);

  requestAnimationFrame(() => {
    page.elements.editCourseNameInput?.focus();
  });
}

// 수정 모달 닫기
function closeEditModal(page) {
  page.openEditCourseId = "";
  page.editCourseDraft = null;
  renderEditModal(page);
}

// 전공 선택 모달 열기
function openMajorModal(course, availableMajors, page) {
  page.pendingMajorCourse = course;
  page.pendingMajorOptions = availableMajors;
  page.selectedMajorId = "";
  renderMajorModal(page);

  requestAnimationFrame(() => {
    page.elements.majorSelectInput?.focus();
  });
}

// 전공 선택 모달 닫기
function closeMajorModal(page) {
  page.pendingMajorCourse = null;
  page.pendingMajorOptions = [];
  page.selectedMajorId = "";
  renderMajorModal(page);
}

// 전공 선택 모달 submit 처리
function handleMajorModalSubmit(page) {
  if (!page.pendingMajorCourse) {
    closeMajorModal(page);
    return;
  }

  const selectedMajor = page.pendingMajorOptions.find((major) => major.value === page.selectedMajorId);
  if (!selectedMajor) {
    window.alert("등록할 전공을 먼저 선택해주세요.");
    page.elements.majorSelectInput?.focus();
    return;
  }

  const courseName = page.pendingMajorCourse.name || "선택한 과목";
  closeMajorModal(page);
  window.alert(`${selectedMajor.label} 전공으로 ${courseName} 과목 등록 요청이 실행되었습니다.`);
}

// 수정 저장 처리
function handleSaveCourseEdit(page) {
  if (!page.openEditCourseId || !page.editCourseDraft) {
    closeEditModal(page);
    return;
  }

  const targetIndex = page.takenCourses.findIndex((course) => course.courseId === page.openEditCourseId);
  if (targetIndex < 0) {
    closeEditModal(page);
    return;
  }

  const updatedCourse = {
    ...page.takenCourses[targetIndex],
    name: String(page.editCourseDraft.name || "").trim(),
    earnedCredits: Number(page.editCourseDraft.credits || 0),
    grade: page.editCourseDraft.grade,
    takenYear: String(page.editCourseDraft.year || "").trim(),
    takenTerm: page.editCourseDraft.term,
    courseSubcategory: page.editCourseDraft.subcategory,
    attributedMajorId: page.editCourseDraft.attributedMajorId,
    attributedDepartmentId: page.editCourseDraft.attributedDepartmentId,
    retakeCourseId: page.editCourseDraft.retakeCourseId,
    isRetake: Boolean(page.editCourseDraft.retakeCourseId),
  };

  page.takenCourses[targetIndex] = updatedCourse;
  page.takenCourses.sort((leftCourse, rightCourse) => {
    const yearDiff = Number(rightCourse.takenYear || 0) - Number(leftCourse.takenYear || 0);
    if (yearDiff !== 0) return yearDiff;

    const leftTermOrder = page.termSortOrder[leftCourse.takenTerm] || 0;
    const rightTermOrder = page.termSortOrder[rightCourse.takenTerm] || 0;
    return rightTermOrder - leftTermOrder;
  });

  closeEditModal(page);
  renderTakenCourses(page);
  window.alert(`${updatedCourse.name || "선택한 과목"} 수정 요청이 실행되었습니다.`);
}
