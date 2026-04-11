// Courses 페이지 화면 렌더링 모듈

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { clearChildren, setText } from "/src/scripts/utils/dom.js";

const termLabelMap = {
  1: "1학기",
  SUMMER: "여름 계절학기",
  2: "2학기",
  WINTER: "겨울 계절학기",
};

// HTML 문자열 주입 전 특수문자 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMobileMetaItems(items) {
  return items
    .filter((item) => String(item || "").trim())
    .map((item) => `<span class="courses-mobile-card__meta-item">${escapeHtml(item)}</span>`)
    .join("");
}

function formatTakenSemesterLabel(year, term) {
  const termLabel = termLabelMap[term] || String(term || "").trim();
  if (!year || !termLabel) return "";
  return `${year}.${termLabel}`;
}

function renderSearchCourseTableRows(courses) {
  return courses
    .map((course) => {
      return `
        <tr>
          <td class="courses-table__code">${escapeHtml(course.code)}</td>
          <td class="courses-table__name">${escapeHtml(course.name)}</td>
          <td class="courses-table__number">${escapeHtml(String(course.credits ?? ""))}</td>
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
}

function renderSearchCourseMobileCards(courses) {
  return courses
    .map((course) => {
      const metaHtml = renderMobileMetaItems([
        course.code,
        `${String(course.credits ?? "")}학점`,
        course.subcategory || "세부구분 없음",
      ]);

      return `
        <article class="courses-mobile-card">
          <div class="courses-mobile-card__top">
            <h3 class="courses-mobile-card__title">${escapeHtml(course.name)}</h3>
          </div>
          <div class="courses-mobile-card__bottom">
            <div class="courses-mobile-card__meta">${metaHtml}</div>
            <button
              type="button"
              class="courses-mobile-card__text-action"
              data-search-add-course="${escapeHtml(String(course.courseMasterId || ""))}"
            >
              <span>+ 추가</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTakenCourseTableRows(courses) {
  return courses
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
          <td>${escapeHtml(course.grade || "")}</td>
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

function renderTakenCourseMobileCards(courses) {
  return courses
    .map((course) => {
      const courseId = escapeHtml(String(course.courseId || ""));
      const metaHtml = renderMobileMetaItems([
        course.code,
        formatTakenSemesterLabel(course.takenYear, course.takenTerm),
        `${String(course.earnedCredits ?? "")}학점`,
        course.courseSubcategory || "-",
        course.isRetake ? "재수강" : "",
      ]);

      return `
        <article
          class="courses-mobile-card courses-mobile-card--taken courses-mobile-card--clickable"
          data-taken-course-id="${courseId}"
          role="button"
          tabindex="0"
          aria-label="${escapeHtml(course.name || "과목")} 수정 열기"
        >
          <div class="courses-mobile-card__top">
            <div class="courses-mobile-card__heading">
              <h3 class="courses-mobile-card__title">${escapeHtml(course.name)}</h3>
            </div>
            <div class="courses-mobile-card__tools">
              <span class="courses-mobile-card__badge badge badge--blue">${escapeHtml(course.grade || "-")}</span>
              <button
                type="button"
                class="btn btn--ghost btn--icon courses-mobile-card__icon-action courses-mobile-card__icon-action--danger"
                aria-label="${escapeHtml(course.name || "과목")} 삭제"
                data-delete-taken-course="${courseId}"
              >
                <img src="${getFluentIconPath("delete")}" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="courses-mobile-card__meta">${metaHtml}</div>
        </article>
      `;
    })
    .join("");
}

// Search Courses 결과 렌더링
export function renderSearchResults(page) {
  const { searchStatePanel, searchTableWrap, searchCourseRows, searchMobileList } = page.elements;
  const hasSearchResults = page.searchStatus === "results" && page.searchResults.length > 0;

  clearChildren(searchCourseRows);
  clearChildren(searchMobileList);

  searchStatePanel.hidden = hasSearchResults;
  searchStatePanel.setAttribute("aria-hidden", String(hasSearchResults));
  searchTableWrap.hidden = !hasSearchResults;
  searchTableWrap.setAttribute("aria-hidden", String(!hasSearchResults));
  searchMobileList.hidden = !hasSearchResults;
  searchMobileList.setAttribute("aria-hidden", String(!hasSearchResults));

  // 검색 결과가 있으면 상태 패널 대신 결과 테이블 행 렌더링
  if (hasSearchResults) {
    searchStatePanel.innerHTML = "";
    searchCourseRows.innerHTML = renderSearchCourseTableRows(page.searchResults);
    searchMobileList.innerHTML = renderSearchCourseMobileCards(page.searchResults);
    return;
  }

  searchTableWrap.hidden = true;
  searchTableWrap.setAttribute("aria-hidden", "true");
  searchMobileList.hidden = true;
  searchMobileList.setAttribute("aria-hidden", "true");
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
        <p class="courses-state-panel__description">연도, 학기, 세부구분, 과목명을 다시 확인해 주세요.</p>
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
  const { totalCreditsText, takenEmptyPanel, takenTableWrap, takenCourseRows, takenMobileList } = page.elements;
  const totalCredits = page.takenCourses.reduce(
    (creditSum, course) => creditSum + Number(course.earnedCredits || 0),
    0,
  );
  const hasTakenResults = page.takenStatus === "results" && page.takenCourses.length > 0;

  setText(totalCreditsText, String(totalCredits));
  clearChildren(takenCourseRows);
  clearChildren(takenMobileList);

  takenEmptyPanel.hidden = hasTakenResults;
  takenEmptyPanel.setAttribute("aria-hidden", String(hasTakenResults));
  takenTableWrap.hidden = !hasTakenResults;
  takenTableWrap.setAttribute("aria-hidden", String(!hasTakenResults));
  takenMobileList.hidden = !hasTakenResults;
  takenMobileList.setAttribute("aria-hidden", String(!hasTakenResults));

  // 초기 조회 또는 재조회 중에는 로딩 패널 렌더링
  if (page.takenStatus === "loading") {
    takenEmptyPanel.hidden = false;
    takenEmptyPanel.setAttribute("aria-hidden", "false");
    takenTableWrap.hidden = true;
    takenTableWrap.setAttribute("aria-hidden", "true");
    takenMobileList.hidden = true;
    takenMobileList.setAttribute("aria-hidden", "true");
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
    takenMobileList.hidden = true;
    takenMobileList.setAttribute("aria-hidden", "true");
    takenEmptyPanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">수강 과목 목록을 불러오지 못했습니다.</p>
        <p class="courses-state-panel__description">잠시 뒤 다시 시도해 주세요.</p>
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
    takenMobileList.hidden = true;
    takenMobileList.setAttribute("aria-hidden", "true");
    takenEmptyPanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">등록된 수강 과목이 없습니다.</p>
      </div>
    `;
    return;
  }

  // 조회 결과가 있으면 수강 목록 테이블 행 렌더링
  takenEmptyPanel.hidden = true;
  takenEmptyPanel.setAttribute("aria-hidden", "true");
  takenEmptyPanel.innerHTML = "";
  takenTableWrap.hidden = false;
  takenTableWrap.setAttribute("aria-hidden", "false");
  takenMobileList.hidden = false;
  takenMobileList.setAttribute("aria-hidden", "false");
  takenCourseRows.innerHTML = renderTakenCourseTableRows(page.takenCourses);
  takenMobileList.innerHTML = renderTakenCourseMobileCards(page.takenCourses);
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
  editCourseSubcategorySelect.disabled = false;
  editCourseSubcategorySelect.value = page.editCourseDraft.subcategory || "";

  const needsMajor = page.editCourseDraft.subcategory === "전공필수" || page.editCourseDraft.subcategory === "전공선택";
  const needsDepartment = page.editCourseDraft.subcategory === "전공탐색";
  const majorField = editCourseMajorSelect.closest(".field");
  const departmentField = editCourseDepartmentSelect.closest(".field");

  if (majorField) {
    // 전공필수/전공선택에서만 전공 귀속 입력 노출
    majorField.hidden = !needsMajor;
  }

  if (departmentField) {
    // 전공탐색에서만 학부 귀속 입력 노출
    departmentField.hidden = !needsDepartment;
  }

  editCourseMajorSelect.innerHTML = `
    <option value="">${needsMajor ? "전공 선택" : "미사용"}</option>
    ${page.userMajors
      .map((major) => {
        return `<option value="${escapeHtml(String(major.majorId))}">${escapeHtml(major.label || "")}</option>`;
      })
      .join("")}
  `;
  editCourseMajorSelect.disabled = !needsMajor || page.userMajors.length === 0;
  editCourseMajorSelect.value = page.editCourseDraft.attributedMajorId || "";

  const canChooseDepartment = needsDepartment && page.departmentsStatus === "ready" && page.departments.length > 0;
  const departmentPlaceholder = canChooseDepartment ? "학부 선택" : needsDepartment ? "학부 목록 없음" : "미사용";

  let departmentOptionsHtml = `
    <option value="">${departmentPlaceholder}</option>
    ${page.departments
      .map((department) => {
        return `<option value="${escapeHtml(String(department.departmentId))}">${escapeHtml(department.label || "")}</option>`;
      })
      .join("")}
  `;

  // 학부 목록 조회 실패 상태라도 기존 귀속 학부 값은 확인 가능하게 유지
  if (needsDepartment && !canChooseDepartment && selectedCourse.attributedDepartmentId) {
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
    // 자기 자신은 재수강 대상으로 고를 수 없음
    if (course.courseId === selectedCourse.courseId) return false;
    // 이미 다른 과목의 재수강 대상으로 묶인 과목은 제외
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

  // 연도/학기 변경으로 후보군이 바뀌면 기존 재수강 선택값 정리
  if (
    !retakeCandidates.some((course) => String(course.courseId) === String(page.editCourseDraft.retakeCourseId || ""))
  ) {
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

  setText(majorCourseSummary, `${page.pendingMajorCourse.code || ""} / ${page.pendingMajorCourse.name || ""}`);
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
