// Courses 페이지 이벤트와 모달 제어 모듈.

import { addCourse, deleteCourse, patchCourse } from "/src/scripts/api/course.js";
import { UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";

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
    // 버튼 내부 아이콘/텍스트 click까지 함께 처리하기 위한 Element 가드
    if (!(target instanceof Element)) return;

    const addButton = target.closest("[data-search-add-course]");
    // 검색 결과 Add 버튼이 아닌 click 무시
    if (!(addButton instanceof HTMLButtonElement)) return;

    handleAddCourse(addButton.dataset.searchAddCourse || "", page);
  });

  // 수강 목록 행 click 이벤트와 삭제 버튼 click 이벤트
  page.elements.takenCourseRows?.addEventListener("click", (event) => {
    const target = event.target;
    // 행 내부 다양한 자식 노드 click 대응용 Element 가드
    if (!(target instanceof Element)) return;

    const deleteButton = target.closest("[data-delete-taken-course]");
    if (deleteButton instanceof HTMLButtonElement) {
      // 삭제 버튼 click이 행 수정 click으로 이어지지 않게 차단
      event.stopPropagation();
      handleDeleteCourse(deleteButton.dataset.deleteTakenCourse || "", page);
      return;
    }

    const row = target.closest("[data-taken-course-id]");
    // 수강 목록 행 click일 때만 수정 모달 오픈
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
      // 전공 선택 모달이 더 위에 떠 있는 상태 우선 닫기
      closeMajorModal(page);
      return;
    }

    if (page.openEditCourseId) {
      // Edit 모달만 열린 상태면 수정 모달 닫기
      closeEditModal(page);
    }
  });
}

// 검색 submit 처리
async function handleSearchSubmit(event, page) {
  event.preventDefault();

  const searchYear = String(page.elements.searchYearInput.value || "").trim();
  const searchTerm = String(page.elements.searchTermSelect.value || "").trim();
  const searchSubcategory = String(page.elements.searchSubcategorySelect.value || "").trim();
  const searchName = String(page.elements.searchNameInput.value || "").trim();

  // 백엔드 필수 query year 누락 방지
  if (!searchYear) {
    window.alert("연도를 입력해주세요.");
    page.elements.searchYearInput?.focus();
    return;
  }

  // 백엔드 필수 query term 누락 방지
  if (!searchTerm) {
    window.alert("학기를 선택해주세요.");
    page.elements.searchTermSelect?.focus();
    return;
  }

  page.searchStatus = "loading";
  renderSearchResults(page);

  window.clearTimeout(page.searchTimerId);

  page.searchTimerId = window.setTimeout(async () => {
    try {
      // optional query는 값이 있을 때만 전송
      page.searchResults = await page.searchCourseMasters({
        year: Number(searchYear),
        term: searchTerm,
        subcategory: searchSubcategory || undefined,
        name: searchName || undefined,
      });
      page.searchStatus = page.searchResults.length > 0 ? "results" : "empty";
    } catch (error) {
      console.error("[Courses][CourseMasterSearchFailed]", error);
      page.searchResults = [];
      page.searchStatus = "error";
      const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
      window.alert(errorInfo.message);
    }

    renderSearchResults(page);
  }, 220);
}

// Add 버튼 처리
async function handleAddCourse(courseMasterId, page) {
  const selectedCourse = page.searchResults.find((course) => String(course.courseMasterId) === String(courseMasterId));
  // 화면과 서버 식별자를 맞추기 위한 courseMasterId 기준 조회
  if (!selectedCourse) return;

  const takenYear = String(page.elements.searchYearInput.value || "").trim();
  const takenTerm = String(page.elements.searchTermSelect.value || "").trim();

  // 검색 폼의 year/term이 등록 year/term으로 그대로 사용되는 구조
  if (!takenYear || !takenTerm) {
    window.alert("연도와 학기를 먼저 확인해주세요.");
    return;
  }

  // 전공필수/전공선택만 majorId 결정이 필요한 분기 대상
  const needsMajorChoice =
    selectedCourse.subcategory === "전공필수" || selectedCourse.subcategory === "전공선택";

  if (!needsMajorChoice) {
    // 교양/전공탐색은 majorId 없이 바로 등록
    await submitAddCourse(
      {
        courseMasterId: Number(selectedCourse.courseMasterId),
        takenYear: Number(takenYear),
        takenTerm,
        majorId: null,
        retakeCourseId: null,
      },
      page,
      `${selectedCourse.name} 과목이 등록되었습니다.`,
    );
    return;
  }

  // 전공이 없으면 서버 요청 전에 등록 차단
  if (page.userMajors.length === 0) {
    window.alert("전공 과목을 등록하려면 먼저 프로필에서 전공을 선택해주세요.");
    return;
  }

  // 전공이 하나면 자동 귀속 처리
  if (page.userMajors.length === 1) {
    await submitAddCourse(
      {
        courseMasterId: Number(selectedCourse.courseMasterId),
        takenYear: Number(takenYear),
        takenTerm,
        majorId: Number(page.userMajors[0].majorId),
        retakeCourseId: null,
      },
      page,
      `${selectedCourse.name} 과목이 등록되었습니다.`,
    );
    return;
  }

  // 전공이 여러 개면 사용자가 직접 선택
  openMajorModal(selectedCourse, page.userMajors, page);
}

// 과목 등록 요청 처리
async function submitAddCourse(payload, page, successMessage) {
  try {
    await addCourse(payload);
    closeMajorModal(page);
    window.alert(successMessage);
    await page.refreshTakenCourses();
  } catch (error) {
    console.error("[Courses][AddCourseFailed]", error);
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

// 삭제 버튼 처리
async function handleDeleteCourse(courseId, page) {
  const selectedCourse = page.takenCourses.find((course) => String(course.courseId) === String(courseId));
  // 삭제 대상 이름 표시를 위한 courseId 기준 조회
  if (!selectedCourse) return;

  const isConfirmed = window.confirm(`${selectedCourse.name} 과목을 삭제하시겠습니까?`);
  // 확인 취소 시 삭제 요청 중단
  if (!isConfirmed) return;

  try {
    await deleteCourse(Number(courseId));
    window.alert("과목이 삭제되었습니다.");
    await page.refreshTakenCourses();
  } catch (error) {
    console.error("[Courses][DeleteCourseFailed]", error);
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

// Edit Course 폼 입력 반영
function handleEditCourseFieldChange(event, page) {
  const target = event.target;
  // form 바깥 이벤트나 예상하지 않은 input 타입 무시
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  // 현재 열린 모달 draft에만 반영
  if (!page.editCourseDraft || !target.name || !(target.name in page.editCourseDraft)) return;

  page.editCourseDraft[target.name] = target.value;

  if (target.name === "subcategory") {
    // 세부 구분 정책에 따라 함께 쓰면 안 되는 귀속 값 초기화
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
    // 세부 구분/연도/학기 변경 시 select 활성화와 재수강 후보 재계산 필요
    renderEditModal(page);
  }
}

// 수정 모달 열기
function openEditModal(courseId, page) {
  const selectedCourse = page.takenCourses.find((course) => String(course.courseId) === String(courseId));
  // 실제 수강 이력 courseId 기준으로 수정 대상 확정
  if (!selectedCourse) return;

  page.openEditCourseId = String(courseId);
  page.editCourseDraft = {
    code: selectedCourse.code || "",
    name: selectedCourse.name || "",
    credits: String(selectedCourse.earnedCredits ?? ""),
    grade: selectedCourse.grade || "",
    year: selectedCourse.takenYear || "",
    term: selectedCourse.takenTerm || "",
    subcategory: selectedCourse.courseSubcategory || "",
    attributedMajorId: selectedCourse.majorId || "",
    attributedDepartmentId: selectedCourse.attributedDepartmentId || "",
    retakeCourseId: selectedCourse.retakeCourseId || "",
  };

  renderEditModal(page);

  requestAnimationFrame(() => {
    page.elements.editCourseCreditsInput?.focus();
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
async function handleMajorModalSubmit(page) {
  if (!page.pendingMajorCourse) {
    // 대상 과목 정보가 없으면 모달 상태만 정리
    closeMajorModal(page);
    return;
  }

  const selectedMajor = page.pendingMajorOptions.find((major) => String(major.majorId) === String(page.selectedMajorId));
  // majorId를 선택하지 않은 submit 방지
  if (!selectedMajor) {
    window.alert("등록할 전공을 먼저 선택해주세요.");
    page.elements.majorSelectInput?.focus();
    return;
  }

  await submitAddCourse(
    {
      courseMasterId: Number(page.pendingMajorCourse.courseMasterId),
      takenYear: Number(page.elements.searchYearInput.value),
      takenTerm: page.elements.searchTermSelect.value,
      majorId: Number(selectedMajor.majorId),
      retakeCourseId: null,
    },
    page,
    `${page.pendingMajorCourse.name} 과목이 등록되었습니다.`,
  );
}

// PATCH payload 작성
function buildCoursePatchPayload(originalCourse, draft) {
  const payload = {};

  // 숫자 input은 문자열 비교 뒤 실제 전송 시 Number 변환
  if (String(originalCourse.earnedCredits) !== String(draft.credits).trim()) {
    payload.earnedCredits = Number(draft.credits);
  }

  if (String(originalCourse.grade || "") !== String(draft.grade || "")) {
    payload.grade = draft.grade;
  }

  if (String(originalCourse.takenYear || "") !== String(draft.year || "").trim()) {
    payload.takenYear = Number(draft.year);
  }

  if (String(originalCourse.takenTerm || "") !== String(draft.term || "")) {
    payload.takenTerm = draft.term;
  }

  if (String(originalCourse.courseSubcategory || "") !== String(draft.subcategory || "")) {
    payload.courseSubcategory = draft.subcategory;
  }

  // 선택값이 비면 null로 보내 귀속 해제 의도 전달
  const originalMajorId = String(originalCourse.majorId || "");
  const draftMajorId = String(draft.attributedMajorId || "");
  if (originalMajorId !== draftMajorId) {
    payload.majorId = draftMajorId ? Number(draftMajorId) : null;
  }

  const originalDepartmentId = String(originalCourse.attributedDepartmentId || "");
  const draftDepartmentId = String(draft.attributedDepartmentId || "");
  if (originalDepartmentId !== draftDepartmentId) {
    payload.attributedDepartmentId = draftDepartmentId ? Number(draftDepartmentId) : null;
  }

  // 재수강 대상도 변경된 경우에만 포함
  const originalRetakeCourseId = String(originalCourse.retakeCourseId || "");
  const draftRetakeCourseId = String(draft.retakeCourseId || "");
  if (originalRetakeCourseId !== draftRetakeCourseId) {
    payload.retakeCourseId = draftRetakeCourseId ? Number(draftRetakeCourseId) : null;
  }

  return payload;
}

// 수정 저장 처리
async function handleSaveCourseEdit(page) {
  if (!page.openEditCourseId || !page.editCourseDraft) {
    // 모달 상태가 비정상이면 화면만 닫고 종료
    closeEditModal(page);
    return;
  }

  const originalCourse = page.takenCourses.find((course) => String(course.courseId) === String(page.openEditCourseId));
  if (!originalCourse) {
    // 목록에서 대상을 찾지 못하면 저장 진행 불가
    closeEditModal(page);
    return;
  }

  // PATCH 필수 입력 검증
  if (!page.editCourseDraft.credits) {
    window.alert("학점을 입력해주세요.");
    page.elements.editCourseCreditsInput?.focus();
    return;
  }

  if (!page.editCourseDraft.grade) {
    window.alert("성적을 선택해주세요.");
    page.elements.editCourseGradeSelect?.focus();
    return;
  }

  if (!page.editCourseDraft.year) {
    window.alert("연도를 입력해주세요.");
    page.elements.editCourseYearInput?.focus();
    return;
  }

  if (!page.editCourseDraft.term) {
    window.alert("학기를 선택해주세요.");
    page.elements.editCourseTermSelect?.focus();
    return;
  }

  const isMajorCategory = originalCourse.courseCategory === "전공";
  // 전공 과목만 세부 구분 변경 허용
  if (isMajorCategory && !page.editCourseDraft.subcategory) {
    window.alert("세부 구분을 선택해주세요.");
    page.elements.editCourseSubcategorySelect?.focus();
    return;
  }

  if (
    (page.editCourseDraft.subcategory === "전공필수" || page.editCourseDraft.subcategory === "전공선택") &&
    !page.editCourseDraft.attributedMajorId
  ) {
    // 전공필수/전공선택은 전공 귀속이 필수
    window.alert("귀속 전공을 선택해주세요.");
    page.elements.editCourseMajorSelect?.focus();
    return;
  }

  if (page.editCourseDraft.subcategory === "전공탐색" && !page.editCourseDraft.attributedDepartmentId) {
    // 전공탐색은 학부 귀속이 필수
    window.alert("귀속 학부를 선택해주세요.");
    page.elements.editCourseDepartmentSelect?.focus();
    return;
  }

  const payload = buildCoursePatchPayload(originalCourse, page.editCourseDraft);
  // 변경점이 없으면 PATCH 요청 생략
  if (Object.keys(payload).length === 0) {
    window.alert("변경된 내용이 없습니다.");
    return;
  }

  try {
    await patchCourse(Number(page.openEditCourseId), payload);
    closeEditModal(page);
    window.alert("과목 정보가 수정되었습니다.");
    await page.refreshTakenCourses();
  } catch (error) {
    console.error("[Courses][PatchCourseFailed]", error);
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}
