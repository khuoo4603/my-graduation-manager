// Courses 페이지 화면 렌더링 모듈.

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { clearChildren, createElement, setText } from "/src/scripts/utils/dom.js";

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

// Search Courses 결과 렌더링
export function renderSearchResults(page) {
  const { searchStatePanel, searchTableWrap, searchCourseRows } = page.elements;
  const hasSearchResults = page.searchStatus === "results" && page.searchResults.length > 0;

  clearChildren(searchCourseRows);

  // 결과 테이블이 보일 때는 loading/idle 패널이 남지 않도록 먼저 숨김 처리
  searchStatePanel.hidden = hasSearchResults;
  searchStatePanel.setAttribute("aria-hidden", String(hasSearchResults));
  searchTableWrap.hidden = !hasSearchResults;
  searchTableWrap.setAttribute("aria-hidden", String(!hasSearchResults));

  // 검색 성공 시에만 테이블 영역 노출
  if (hasSearchResults) {
    searchStatePanel.innerHTML = "";

    page.searchResults.forEach((course) => {
      const row = createElement("tr");

      row.append(
        createElement("td", {
          className: "courses-table__code",
          text: course.code || "",
        }),
        createElement("td", {
          className: "courses-table__name",
          text: course.name || "",
        }),
        createElement("td", {
          className: "courses-table__number",
          text: String(course.credits ?? ""),
        }),
        createElement("td", {
          text: course.category || "",
        }),
        createElement("td", {
          text: course.subcategory || "",
        }),
      );

      const actionCell = createElement("td", { className: "courses-table__action" });
      const addButton = createElement("button", {
        className: "btn btn--secondary courses-action-button courses-action-button--add",
        attrs: {
          type: "button",
          title: "과목 추가",
        },
        dataset: {
          searchAddCourse: String(course.courseMasterId || ""),
        },
      });

      addButton.append(
        createElement("img", {
          className: "courses-action-button__icon",
          attrs: {
            src: getFluentIconPath("add"),
            alt: "",
            "aria-hidden": "true",
          },
        }),
        createElement("span", { text: "추가" }),
      );

      actionCell.append(addButton);
      row.append(actionCell);
      searchCourseRows.append(row);
    });

    return;
  }

  searchTableWrap.hidden = true;
  searchTableWrap.setAttribute("aria-hidden", "true");
  searchStatePanel.hidden = false;
  searchStatePanel.setAttribute("aria-hidden", "false");

  // 검색 전/로딩/빈 결과/에러는 상태 패널로 분기
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

  if (page.searchStatus === "empty") {
    searchStatePanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">조건에 맞는 과목이 없습니다.</p>
        <p class="courses-state-panel__description">연도, 학기, 세부 구분 또는 과목명을 다시 확인해주세요.</p>
      </div>
    `;
    return;
  }

  if (page.searchStatus === "error") {
    searchStatePanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">과목 목록을 불러오지 못했습니다.</p>
        <p class="courses-state-panel__description">잠시 후 다시 시도해주세요.</p>
      </div>
    `;
    return;
  }

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

  // 현재 화면에 보이는 수강 이력 기준 총 취득학점 계산
  setText(totalCreditsText, String(totalCredits));
  clearChildren(takenCourseRows);

  // 목록 테이블이 보일 때는 loading/empty/error 패널이 남지 않도록 먼저 숨김 처리
  takenEmptyPanel.hidden = hasTakenResults;
  takenEmptyPanel.setAttribute("aria-hidden", String(hasTakenResults));
  takenTableWrap.hidden = !hasTakenResults;
  takenTableWrap.setAttribute("aria-hidden", String(!hasTakenResults));

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

  page.takenCourses.forEach((course) => {
    const row = createElement("tr", {
      className: "courses-table__row courses-table__row--clickable",
      attrs: { title: "행 클릭으로 과목 수정" },
      dataset: { takenCourseId: String(course.courseId || "") },
    });

    row.append(
      createElement("td", { className: "courses-table__code", text: course.code || "" }),
      createElement("td", { className: "courses-table__name", text: course.name || "" }),
      createElement("td", { className: "courses-table__number", text: String(course.earnedCredits ?? "") }),
      createElement("td", { className: "courses-table__number", text: course.takenYear || "" }),
      createElement("td", { text: termLabelMap[course.takenTerm] || String(course.takenTerm || "") }),
      createElement("td", { text: course.courseSubcategory || "" }),
    );

    const retakeCell = createElement("td");
    const retakeCheckbox = createElement("input", {
      attrs: {
        type: "checkbox",
        disabled: "disabled",
      },
    });
    retakeCheckbox.checked = Boolean(course.isRetake);

    const retakeWrap = createElement("span", { className: "courses-retake-indicator" });
    retakeWrap.append(retakeCheckbox);
    retakeCell.append(retakeWrap);
    row.append(retakeCell);

    const actionCell = createElement("td", { className: "courses-table__action" });
    const deleteButton = createElement("button", {
      className: "btn btn--ghost btn--icon courses-action-icon courses-action-icon--danger",
      attrs: {
        type: "button",
        title: "과목 삭제",
        "aria-label": `${course.name || "과목"} 삭제`,
      },
      dataset: { deleteTakenCourse: String(course.courseId || "") },
    });

    deleteButton.append(
      createElement("img", {
        attrs: {
          src: getFluentIconPath("delete"),
          alt: "",
          "aria-hidden": "true",
        },
      }),
    );

    actionCell.append(deleteButton);
    row.append(actionCell);
    takenCourseRows.append(row);
  });
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

  // 열린 모달의 원본 course를 다시 찾아 정책 기준으로 select 상태 계산
  const selectedCourse = page.takenCourses.find(
    (course) => String(course.courseId) === String(page.openEditCourseId),
  );
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

  clearChildren(editCourseSubcategorySelect);

  // 교양은 현재 값만 보여주고, 전공 과목만 세부 구분 변경 허용
  const isMajorCategory = selectedCourse.courseCategory === "전공";
  if (isMajorCategory) {
    editCourseSubcategorySelect.append(
      createElement("option", {
        attrs: { value: "" },
        text: "세부 구분 선택",
      }),
    );

    COURSE_MAJOR_EDIT_SUBCATEGORY_OPTIONS.forEach((option) => {
      editCourseSubcategorySelect.append(
        createElement("option", {
          attrs: { value: option.value },
          text: option.label,
        }),
      );
    });

    editCourseSubcategorySelect.disabled = false;
  } else {
    editCourseSubcategorySelect.append(
      createElement("option", {
        attrs: { value: selectedCourse.courseSubcategory || "" },
        text: selectedCourse.courseSubcategory || "",
      }),
    );

    editCourseSubcategorySelect.disabled = true;
  }

  editCourseSubcategorySelect.value = page.editCourseDraft.subcategory || "";

  // 세부 구분에 따라 전공 귀속/학부 귀속 활성화 정책 분기
  const isMajorChoice = page.editCourseDraft.subcategory === "전공필수" || page.editCourseDraft.subcategory === "전공선택";
  const isDepartmentChoice = page.editCourseDraft.subcategory === "전공탐색";

  clearChildren(editCourseMajorSelect);
  editCourseMajorSelect.append(
    createElement("option", {
      attrs: { value: "" },
      text: isMajorChoice ? "전공 선택" : "미지정",
    }),
  );

  page.userMajors.forEach((major) => {
    editCourseMajorSelect.append(
      createElement("option", {
        attrs: { value: String(major.majorId) },
        text: major.label || "",
      }),
    );
  });

  editCourseMajorSelect.disabled = !isMajorChoice;
  editCourseMajorSelect.value = page.editCourseDraft.attributedMajorId || "";

  clearChildren(editCourseDepartmentSelect);
  const canChooseDepartment = isDepartmentChoice && page.departmentsStatus === "ready" && page.departments.length > 0;
  editCourseDepartmentSelect.append(
    createElement("option", {
      attrs: { value: "" },
      text: canChooseDepartment ? "학부 선택" : isDepartmentChoice ? "학부 목록 없음" : "미지정",
    }),
  );

  page.departments.forEach((department) => {
    editCourseDepartmentSelect.append(
      createElement("option", {
        attrs: { value: String(department.departmentId) },
        text: department.label || "",
      }),
    );
  });

  if (isDepartmentChoice && !canChooseDepartment && selectedCourse.attributedDepartmentId) {
    editCourseDepartmentSelect.append(
      createElement("option", {
        attrs: { value: String(selectedCourse.attributedDepartmentId) },
        text: selectedCourse.attributedDepartmentLabel || "현재 귀속 학부",
      }),
    );
  }

  editCourseDepartmentSelect.disabled = !canChooseDepartment;
  editCourseDepartmentSelect.value = page.editCourseDraft.attributedDepartmentId || "";

  clearChildren(editCourseRetakeSelect);

  // 재수강 후보는 현재 과목보다 이전에 들은 본인 수강 이력만 보여주고, 서버가 막는 후보는 제외
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

  editCourseRetakeSelect.append(
    createElement("option", {
      attrs: { value: "" },
      text: retakeCandidates.length > 0 ? "없음" : "이전 수강 이력 없음",
    }),
  );

  retakeCandidates.forEach((course) => {
    editCourseRetakeSelect.append(
      createElement("option", {
        attrs: { value: String(course.courseId) },
        text: `${course.takenYear} ${termLabelMap[course.takenTerm] || course.takenTerm || ""} - ${course.name || ""}`,
      }),
    );
  });

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

  // 전공 선택 대상 과목이 있을 때만 모달 오픈
  majorSelectModal.hidden = !isOpen;
  majorSelectModal.setAttribute("aria-hidden", String(!isOpen));
  majorSelectModal.classList.toggle("is-open", isOpen);

  if (!isOpen) {
    document.body.classList.toggle("is-modal-open", Boolean(page.openEditCourseId && page.editCourseDraft));
    return;
  }

  setText(majorCourseSummary, `${page.pendingMajorCourse.code || ""} · ${page.pendingMajorCourse.name || ""}`);

  clearChildren(majorSelectInput);
  majorSelectInput.append(
    createElement("option", {
      attrs: { value: "" },
      text: "전공 선택",
    }),
  );

  page.pendingMajorOptions.forEach((major) => {
    majorSelectInput.append(
      createElement("option", {
        attrs: { value: String(major.majorId) },
        text: major.label || "",
      }),
    );
  });

  majorSelectInput.value = page.selectedMajorId || "";
  document.body.classList.add("is-modal-open");
}
