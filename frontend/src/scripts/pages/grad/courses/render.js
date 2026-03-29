// Courses 페이지 화면 갱신 모듈.

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { clearChildren, createElement, setText } from "/src/scripts/utils/dom.js";

import { COURSE_DEPARTMENT_OPTIONS } from "./mock-data.js";

const termLabelMap = {
  1: "1학기",
  SUMMER: "여름 계절학기",
  2: "2학기",
  WINTER: "겨울 계절학기",
};

const categoryLabelMap = {
  Major: "전공",
  "General Education": "교양",
  Chapel: "채플",
  "Lifelong Education": "평생교육",
};

// Search Courses 결과 렌더링
export function renderSearchResults(page) {
  const { searchStatePanel, searchTableWrap, searchCourseRows } = page.elements;

  clearChildren(searchCourseRows);

  if (page.searchStatus === "results") {
    searchStatePanel.hidden = true;
    searchTableWrap.hidden = false;

    page.searchResults.forEach((course) => {
      const row = createElement("tr");

      const codeCell = createElement("td", {
        className: "courses-table__code",
        text: course.code || "",
      });
      const nameCell = createElement("td", {
        className: "courses-table__name",
        text: course.name || "",
      });
      const creditCell = createElement("td", {
        className: "courses-table__number",
        text: String(course.credits ?? ""),
      });
      const categoryCell = createElement("td", {
        text: categoryLabelMap[course.category] || String(course.category || ""),
      });
      const subcategoryCell = createElement("td", {
        text: course.subcategory || "",
      });

      const actionCell = createElement("td", {
        className: "courses-table__action",
      });
      const addButton = createElement("button", {
        className: "btn btn--secondary courses-action-button courses-action-button--add",
        attrs: {
          type: "button",
          title: "과목 추가",
        },
        dataset: {
          searchAddCourse: course.code || "",
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
      row.append(codeCell, nameCell, creditCell, categoryCell, subcategoryCell, actionCell);
      searchCourseRows.append(row);
    });

    return;
  }

  searchTableWrap.hidden = true;
  searchStatePanel.hidden = false;

  if (page.searchStatus === "loading") {
    searchStatePanel.innerHTML = `
      <div class="courses-state-panel__content">
        <div class="loading-state courses-state-panel__loading">
          <span class="loading-state__spinner" aria-hidden="true"></span>
          <span>과목 목록을 검색하고 있습니다.</span>
        </div>
        <p class="courses-state-panel__description">API 연결 없이도 화면 검토가 가능하도록 mock 데이터를 사용합니다.</p>
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

  searchStatePanel.innerHTML = `
    <div class="courses-state-panel__content">
      <p class="courses-state-panel__description">검색 조건을 입력한 뒤 검색 버튼을 눌러주세요.</p>
    </div>
  `;
}

// Taken Courses 목록 렌더링
export function renderTakenCourses(page) {
  const { totalCreditsText, takenEmptyPanel, takenTableWrap, takenCourseRows } = page.elements;
  const totalCredits = page.takenCourses.reduce(
    (creditSum, course) => creditSum + Number(course.earnedCredits || 0),
    0,
  );

  setText(totalCreditsText, String(totalCredits));
  clearChildren(takenCourseRows);

  if (page.takenCourses.length === 0) {
    takenEmptyPanel.hidden = false;
    takenTableWrap.hidden = true;
    takenEmptyPanel.innerHTML = `
      <div class="courses-state-panel__content">
        <p class="courses-state-panel__title">등록된 수강 과목이 없습니다.</p>
        <p class="courses-state-panel__description">mock 모드에서는 더미 수강 이력이 이 영역에 표시됩니다.</p>
      </div>
    `;
    return;
  }

  takenEmptyPanel.hidden = true;
  takenTableWrap.hidden = false;

  page.takenCourses.forEach((course) => {
    const row = createElement("tr", {
      className: "courses-table__row courses-table__row--clickable",
      attrs: {
        title: "행 클릭으로 과목 수정",
      },
      dataset: {
        takenCourseId: course.courseId || "",
      },
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

    const retakeWrap = createElement("span", {
      className: "courses-retake-indicator",
    });
    retakeWrap.append(retakeCheckbox);
    retakeCell.append(retakeWrap);
    row.append(retakeCell);

    const actionCell = createElement("td", {
      className: "courses-table__action",
    });
    const deleteButton = createElement("button", {
      className: "btn btn--ghost btn--icon courses-action-icon courses-action-icon--danger",
      attrs: {
        type: "button",
        title: "과목 삭제",
        "aria-label": `${course.name || "과목"} 삭제`,
      },
      dataset: {
        deleteTakenCourse: course.courseId || "",
      },
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

  const selectedCourse = page.takenCourses.find((course) => course.courseId === page.openEditCourseId);
  if (!selectedCourse) {
    document.body.classList.remove("is-modal-open");
    return;
  }

  editCourseCodeInput.value = page.editCourseDraft.code || "";
  editCourseNameInput.value = page.editCourseDraft.name || "";
  editCourseCreditsInput.value = page.editCourseDraft.credits || "";
  editCourseGradeSelect.value = page.editCourseDraft.grade || "";
  editCourseYearInput.value = page.editCourseDraft.year || "";
  editCourseTermSelect.value = page.editCourseDraft.term || "";
  editCourseSubcategorySelect.value = page.editCourseDraft.subcategory || "";

  const isMajorCourse =
    page.editCourseDraft.subcategory === "전공필수" || page.editCourseDraft.subcategory === "전공선택";
  const isDepartmentCourse = page.editCourseDraft.subcategory === "전공탐색";

  if (!isMajorCourse) {
    page.editCourseDraft.attributedMajorId = "";
  }

  if (!isDepartmentCourse) {
    page.editCourseDraft.attributedDepartmentId = "";
  }

  clearChildren(editCourseMajorSelect);
  editCourseMajorSelect.append(
    createElement("option", {
      attrs: { value: "" },
      text: isMajorCourse ? "전공 선택" : "미지정",
    }),
  );

  page.mockUserMajors.forEach((major) => {
    editCourseMajorSelect.append(
      createElement("option", {
        attrs: { value: major.value || "" },
        text: major.label || "",
      }),
    );
  });

  editCourseMajorSelect.disabled = !isMajorCourse;
  editCourseMajorSelect.value = page.editCourseDraft.attributedMajorId || "";

  clearChildren(editCourseDepartmentSelect);
  editCourseDepartmentSelect.append(
    createElement("option", {
      attrs: { value: "" },
      text: isDepartmentCourse ? "학부 선택" : "미지정",
    }),
  );

  COURSE_DEPARTMENT_OPTIONS.forEach((department) => {
    editCourseDepartmentSelect.append(
      createElement("option", {
        attrs: { value: department.value || "" },
        text: department.label || "",
      }),
    );
  });

  editCourseDepartmentSelect.disabled = !isDepartmentCourse;
  editCourseDepartmentSelect.value = page.editCourseDraft.attributedDepartmentId || "";

  clearChildren(editCourseRetakeSelect);

  const retakeCandidates = page.takenCourses.filter((course) => {
    if (course.courseId === page.openEditCourseId) return false;

    const courseYear = Number(course.takenYear || 0);
    const draftYear = Number(page.editCourseDraft.year || 0);
    if (courseYear !== draftYear) {
      return courseYear < draftYear;
    }

    const courseTermOrder = page.termSortOrder[course.takenTerm] || 0;
    const draftTermOrder = page.termSortOrder[page.editCourseDraft.term] || 0;
    return courseTermOrder < draftTermOrder;
  });

  if (!retakeCandidates.some((course) => course.courseId === page.editCourseDraft.retakeCourseId)) {
    page.editCourseDraft.retakeCourseId = "";
  }

  editCourseRetakeSelect.append(
    createElement("option", {
      attrs: { value: "" },
      text: retakeCandidates.length > 0 ? "없음" : "이전 수강 이력 없음",
    }),
  );

  retakeCandidates.forEach((course) => {
    editCourseRetakeSelect.append(
      createElement("option", {
        attrs: { value: course.courseId || "" },
        text: `${course.takenYear} ${termLabelMap[course.takenTerm] || course.takenTerm || ""} - ${course.name || ""}`,
      }),
    );
  });

  editCourseRetakeSelect.value = page.editCourseDraft.retakeCourseId || "";
  document.body.classList.add("is-modal-open");
}

// Major Select 모달 렌더링
export function renderMajorModal(page) {
  const { majorSelectModal, majorCourseSummary, majorSelectInput } = page.elements;
  const isOpen = Boolean(page.pendingMajorCourse);

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
        attrs: { value: major.value || "" },
        text: major.label || "",
      }),
    );
  });

  majorSelectInput.value = page.selectedMajorId || "";
  document.body.classList.add("is-modal-open");
}
