// Courses 페이지 화면 렌더링 모듈

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { clearChildren, setText } from "/src/scripts/utils/dom.js";

const termLabelMap = {
  1: "1학기",
  SUMMER: "여름 계절학기",
  2: "2학기",
  WINTER: "겨울 계절학기",
};

const COURSE_MAJOR_EDIT_SUBCATEGORY_OPTIONS = [
  { value: "전공필수", label: "전공필수" },
  { value: "전공선택", label: "전공선택" },
  { value: "전공탐색", label: "전공탐색" },
];

// HTML 문자열 주입 전 특수문자 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Search Courses 결과 렌더링
export function renderSearchResults(page) {
  const { searchStatePanel, searchTableWrap, searchCourseRows } = page.elements;
  const hasSearchResults = page.searchStatus === "results" && page.searchResults.length > 0;

  clearChildren(searchCourseRows);

  searchStatePanel.hidden = hasSearchResults;
  searchStatePanel.setAttribute("aria-hidden", String(hasSearchResults));
  searchTableWrap.hidden = !hasSearchResults;
  searchTableWrap.setAttribute("aria-hidden", String(!hasSearchResults));

  // 검색 결과가 있으면 상태 패널 대신 결과 테이블 행 렌더링
  if (hasSearchResults) {
    searchStatePanel.innerHTML = "";
    searchCourseRows.innerHTML = page.searchResults
      .map((course) => {
        return `
          <tr>
            <td class="courses-table__code">${escapeHtml(course.code)}</td>
            <td class="courses-table__name">${escapeHtml(course.name)}</td>
            <td class="courses-table__number">${escapeHtml(String(course.credits ?? ""))}</td>
            <td>${escapeHtml(course.category)}</td>
            <td>${escapeHtml(course.subcategory)}</td>
            <td class="courses-table__action">
              <button
                type="button"
                class="btn btn--secondary courses-action-button courses-action-button--add"
                title="과목 추가"
                data-search-add-course="${escapeHtml(String(course.courseMasterId || ""))}"
              >
                <img
                  class="courses-action-button__icon"
                  src="${getFluentIconPath("add")}"
                  alt=""
                  aria-hidden="true"
                />
                <span>추가</span>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
    return;
  }

  searchTableWrap.hidden = true;
  searchTableWrap.setAttribute("aria-hidden", "true");
  searchStatePanel.hidden = false;
  searchStatePanel.setAttribute("aria-hidden", "false");

  // 검색 중에는 스피너가 있는 로딩 패널 렌더링
  if (page.searchStatus === "loading") {
    searchStatePanel.innerHTML = `
      <div class="courses-state-panel__content">
        <div class="loading-state courses-state-panel__loading">
          <span class="loading-state__spinner" aria-hidden="true"></span>
          <span>과목 목록을 검색하고 있습니다.</span>
        </div>
      </div>
    `;
    return;
  }

  // 검색은 완료됐지만 결과가 없으면 empty 패널 렌더링
  if (page.searchStatus === "empty") {
    searchStatePanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">조건에 맞는 과목이 없습니다.</p>
        <p class="courses-state-panel__description">연도, 학기, 세부 구분 또는 과목명을 다시 확인해주세요.</p>
      </div>
    `;
    return;
  }

  // API 실패나 예외가 나면 에러 패널 렌더링
  if (page.searchStatus === "error") {
    searchStatePanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">과목 목록을 불러오지 못했습니다.</p>
        <p class="courses-state-panel__description">잠시 후 다시 시도해주세요.</p>
      </div>
    `;
    return;
  }

  // 아직 검색 전이면 기본 안내 패널 렌더링
  searchStatePanel.innerHTML = `
    <div class="courses-state-panel__content">
      <p class="courses-state-panel__description">검색 조건을 입력한 뒤 검색 버튼을 눌러주세요.</p>
    </div>
  `;
}

// Taken Courses 목록 렌더링
export function renderTakenCourses(page) {
  const { totalCreditsText, takenEmptyPanel, takenTableWrap, takenCourseRows } = page.elements;
  const totalCredits = page.takenCourses.reduce((creditSum, course) => creditSum + Number(course.earnedCredits || 0), 0);
  const hasTakenResults = page.takenStatus === "results" && page.takenCourses.length > 0;

  setText(totalCreditsText, String(totalCredits));
  clearChildren(takenCourseRows);

  takenEmptyPanel.hidden = hasTakenResults;
  takenEmptyPanel.setAttribute("aria-hidden", String(hasTakenResults));
  takenTableWrap.hidden = !hasTakenResults;
  takenTableWrap.setAttribute("aria-hidden", String(!hasTakenResults));

  // 초기 조회 또는 재조회 중에는 로딩 패널 렌더링
  if (page.takenStatus === "loading") {
    takenEmptyPanel.hidden = false;
    takenEmptyPanel.setAttribute("aria-hidden", "false");
    takenTableWrap.hidden = true;
    takenTableWrap.setAttribute("aria-hidden", "true");
    takenEmptyPanel.innerHTML = `
      <div class="courses-state-panel__content">
        <div class="loading-state courses-state-panel__loading">
          <span class="loading-state__spinner" aria-hidden="true"></span>
          <span>수강 과목 목록을 불러오고 있습니다.</span>
        </div>
      </div>
    `;
    return;
  }

  // 수강 목록 조회 실패 시 에러 패널 렌더링
  if (page.takenStatus === "error") {
    takenEmptyPanel.hidden = false;
    takenEmptyPanel.setAttribute("aria-hidden", "false");
    takenTableWrap.hidden = true;
    takenTableWrap.setAttribute("aria-hidden", "true");
    takenEmptyPanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">수강 과목 목록을 불러오지 못했습니다.</p>
        <p class="courses-state-panel__description">잠시 후 다시 시도해주세요.</p>
      </div>
    `;
    return;
  }

  // 수강 이력이 비어 있으면 empty 패널 렌더링
  if (page.takenStatus === "empty") {
    takenEmptyPanel.hidden = false;
    takenEmptyPanel.setAttribute("aria-hidden", "false");
    takenTableWrap.hidden = true;
    takenTableWrap.setAttribute("aria-hidden", "true");
    takenEmptyPanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">등록된 수강 과목이 없습니다.</p>
      </div>
    `;
    return;
  }

  takenEmptyPanel.hidden = true;
  takenEmptyPanel.setAttribute("aria-hidden", "true");
  takenEmptyPanel.innerHTML = "";
  takenTableWrap.hidden = false;
  takenTableWrap.setAttribute("aria-hidden", "false");

  // 조회 결과가 있으면 수강 목록 테이블 행 렌더링
  takenCourseRows.innerHTML = page.takenCourses
    .map((course) => {
      const termLabel = termLabelMap[course.takenTerm] || String(course.takenTerm || "");

      return `
        <tr
          class="courses-table__row courses-table__row--clickable"
          title="행 클릭으로 과목 수정"
          data-taken-course-id="${escapeHtml(String(course.courseId || ""))}"
        >
          <td class="courses-table__code">${escapeHtml(course.code)}</td>
          <td class="courses-table__name">${escapeHtml(course.name)}</td>
          <td class="courses-table__number">${escapeHtml(String(course.earnedCredits ?? ""))}</td>
          <td class="courses-table__number">${escapeHtml(course.takenYear)}</td>
          <td>${escapeHtml(termLabel)}</td>
          <td>${escapeHtml(course.courseSubcategory)}</td>
          <td>
            <span class="courses-retake-indicator">
              <input type="checkbox" disabled ${course.isRetake ? "checked" : ""} />
            </span>
          </td>
          <td class="courses-table__action">
            <button
              type="button"
              class="btn btn--ghost btn--icon courses-action-icon courses-action-icon--danger"
              title="과목 삭제"
              aria-label="${escapeHtml(course.name || "과목")} 삭제"
              data-delete-taken-course="${escapeHtml(String(course.courseId || ""))}"
            >
              <img src="${getFluentIconPath("delete")}" alt="" aria-hidden="true" />
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Edit Course 모달 렌더링
export function renderEditModal(page) {
  const {
    editCourseModal,
    editCourseCodeInput,
    editCourseNameInput,
    editCourseCreditsInput,
    editCourseGradeSelect,
    editCourseYearInput,
    editCourseTermSelect,
    editCourseSubcategorySelect,
    editCourseMajorSelect,
    editCourseDepartmentSelect,
    editCourseRetakeSelect,
  } = page.elements;

  const isOpen = Boolean(page.openEditCourseId && page.editCourseDraft);
  editCourseModal.hidden = !isOpen;
  editCourseModal.setAttribute("aria-hidden", String(!isOpen));
  editCourseModal.classList.toggle("is-open", isOpen);

  if (!isOpen) {
    document.body.classList.toggle("is-modal-open", Boolean(page.pendingMajorCourse));
    return;
  }

  const selectedCourse = page.takenCourses.find((course) => String(course.courseId) === String(page.openEditCourseId));
  if (!selectedCourse) {
    editCourseModal.hidden = true;
    editCourseModal.setAttribute("aria-hidden", "true");
    editCourseModal.classList.remove("is-open");
    document.body.classList.toggle("is-modal-open", Boolean(page.pendingMajorCourse));
    return;
  }

  editCourseCodeInput.value = page.editCourseDraft.code || "";
  editCourseNameInput.value = page.editCourseDraft.name || "";
  editCourseCreditsInput.value = page.editCourseDraft.credits || "";
  editCourseGradeSelect.value = page.editCourseDraft.grade || "";
  editCourseYearInput.value = page.editCourseDraft.year || "";
  editCourseTermSelect.value = page.editCourseDraft.term || "";

  const isMajorCategory = selectedCourse.courseCategory === "전공";
  // 전공 과목이면 수정 가능한 세부 구분 옵션 전체 렌더링
  if (isMajorCategory) {
    editCourseSubcategorySelect.innerHTML = `
      <option value="">세부 구분 선택</option>
      ${COURSE_MAJOR_EDIT_SUBCATEGORY_OPTIONS.map((option) => {
        return `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`;
      }).join("")}
    `;
    editCourseSubcategorySelect.disabled = false;
  // 교양 계열이면 현재 세부 구분만 보여주고 변경 비활성화
  } else {
    editCourseSubcategorySelect.innerHTML = `
      <option value="${escapeHtml(selectedCourse.courseSubcategory || "")}">
        ${escapeHtml(selectedCourse.courseSubcategory || "")}
      </option>
    `;
    editCourseSubcategorySelect.disabled = true;
  }
  editCourseSubcategorySelect.value = page.editCourseDraft.subcategory || "";

  const isMajorChoice =
    page.editCourseDraft.subcategory === "전공필수" || page.editCourseDraft.subcategory === "전공선택";
  const isDepartmentChoice = page.editCourseDraft.subcategory === "전공탐색";

  editCourseMajorSelect.innerHTML = `
    <option value="">${isMajorChoice ? "전공 선택" : "미지정"}</option>
    ${page.userMajors
      .map((major) => {
        return `<option value="${escapeHtml(String(major.majorId))}">${escapeHtml(major.label || "")}</option>`;
      })
      .join("")}
  `;
  editCourseMajorSelect.disabled = !isMajorChoice;
  editCourseMajorSelect.value = page.editCourseDraft.attributedMajorId || "";

  const canChooseDepartment = isDepartmentChoice && page.departmentsStatus === "ready" && page.departments.length > 0;
  const departmentPlaceholder = canChooseDepartment
    ? "학부 선택"
    : isDepartmentChoice
      ? "학부 목록 없음"
      : "미지정";

  let departmentOptionsHtml = `
    <option value="">${departmentPlaceholder}</option>
    ${page.departments
      .map((department) => {
        return `<option value="${escapeHtml(String(department.departmentId))}">${escapeHtml(department.label || "")}</option>`;
      })
      .join("")}
  `;

  // 학부 목록 조회 실패 상태라도 기존 귀속 학부 값은 확인 가능하게 유지
  if (isDepartmentChoice && !canChooseDepartment && selectedCourse.attributedDepartmentId) {
    departmentOptionsHtml += `
      <option value="${escapeHtml(String(selectedCourse.attributedDepartmentId))}">
        ${escapeHtml(selectedCourse.attributedDepartmentLabel || "현재 귀속 학부")}
      </option>
    `;
  }

  editCourseDepartmentSelect.innerHTML = departmentOptionsHtml;
  editCourseDepartmentSelect.disabled = !canChooseDepartment;
  editCourseDepartmentSelect.value = page.editCourseDraft.attributedDepartmentId || "";

  const retakeCandidates = page.takenCourses.filter((course) => {
    if (course.courseId === selectedCourse.courseId) return false;
    if (course.retakeCourseId) return false;

    const courseYear = Number(course.takenYear || 0);
    const draftYear = Number(page.editCourseDraft.year || 0);
    if (courseYear !== draftYear) return courseYear < draftYear;

    const courseTermOrder = page.termSortOrder[course.takenTerm] || 0;
    const draftTermOrder = page.termSortOrder[page.editCourseDraft.term] || 0;
    return courseTermOrder < draftTermOrder;
  });

  // 현재 과목보다 이전인 수강 이력만 재수강 후보 option으로 렌더링
  editCourseRetakeSelect.innerHTML = `
    <option value="">${retakeCandidates.length > 0 ? "없음" : "이전 수강 이력 없음"}</option>
    ${retakeCandidates
      .map((course) => {
        const termLabel = termLabelMap[course.takenTerm] || course.takenTerm || "";
        return `
          <option value="${escapeHtml(String(course.courseId))}">
            ${escapeHtml(`${course.takenYear} ${termLabel} - ${course.name || ""}`)}
          </option>
        `;
      })
      .join("")}
  `;

  if (!retakeCandidates.some((course) => String(course.courseId) === String(page.editCourseDraft.retakeCourseId || ""))) {
    page.editCourseDraft.retakeCourseId = "";
  }

  editCourseRetakeSelect.value = page.editCourseDraft.retakeCourseId || "";
  document.body.classList.add("is-modal-open");
}

// Major Select 모달 렌더링
export function renderMajorModal(page) {
  const { majorSelectModal, majorCourseSummary, majorSelectInput } = page.elements;
  const isOpen = Boolean(page.pendingMajorCourse);

  // 선택 대기 과목이 없으면 전공 선택 모달 숨김
  majorSelectModal.hidden = !isOpen;
  majorSelectModal.setAttribute("aria-hidden", String(!isOpen));
  majorSelectModal.classList.toggle("is-open", isOpen);

  if (!isOpen) {
    document.body.classList.toggle("is-modal-open", Boolean(page.openEditCourseId && page.editCourseDraft));
    return;
  }

  setText(majorCourseSummary, `${page.pendingMajorCourse.code || ""} · ${page.pendingMajorCourse.name || ""}`);
  // 전공 선택 대상 과목이 생기면 전공 option 목록 렌더링
  majorSelectInput.innerHTML = `
    <option value="">전공 선택</option>
    ${page.pendingMajorOptions
      .map((major) => {
        return `<option value="${escapeHtml(String(major.majorId))}">${escapeHtml(major.label || "")}</option>`;
      })
      .join("")}
  `;
  majorSelectInput.value = page.selectedMajorId || "";
  document.body.classList.add("is-modal-open");
}
