import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { clearChildren, setText } from "/src/scripts/utils/dom.js";

// HTML 문자열 주입 전 특수문자 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 사용자 정보 렌더링
export function renderProfileSummary(page) {
  setText(page.elements.profileName, page.profile.user.name || "해당 없음");
  setText(page.elements.profileEmail, page.profile.user.email || "해당 없음");
}

// 기본 설정 카드 렌더링
export function renderBaseSettings(page) {
  const { departmentSelect, templateSelect } = page.elements;

  // 학부 select가 있으면 서버 기준 학부 option 목록 렌더링
  if (departmentSelect) {
    departmentSelect.innerHTML = `
      <option value="" ${page.draft.departmentId ? "" : "selected"} disabled>학부를 선택하세요.</option>
      ${page.catalogs.departments
        .map((department) => {
          return `
            <option value="${escapeHtml(department.id)}">
              ${escapeHtml(department.name || "")}
            </option>
          `;
        })
        .join("")}
    `;
    departmentSelect.value = page.draft.departmentId;
  }

  // 템플릿 select가 있으면 서버 기준 템플릿 option 목록 렌더링
  if (templateSelect) {
    templateSelect.innerHTML = `
      <option value="" ${page.draft.templateId ? "" : "selected"} disabled>졸업 템플릿을 선택하세요.</option>
      ${page.catalogs.templates
        .map((template) => {
          const label = template.applicableYear ? `${template.name} (${template.applicableYear})` : template.name || "";
          return `
            <option value="${escapeHtml(template.id)}">
              ${escapeHtml(label)}
            </option>
          `;
        })
        .join("")}
    `;
    templateSelect.value = page.draft.templateId;
  }
}

// 전공 추가 폼 렌더링
export function renderMajorForm(page) {
  const { majorDepartmentSelect, majorSelect, majorTypeSelect } = page.elements;
  const filteredMajors = page.draft.majorFormDepartmentId
    ? page.catalogs.majors.filter((major) => major.departmentId === page.draft.majorFormDepartmentId)
    : [];

  if (!filteredMajors.some((major) => major.id === page.draft.majorFormMajorId)) {
    page.draft.majorFormMajorId = "";
  }

  // 전공 추가 폼의 학부 select option 목록 렌더링
  if (majorDepartmentSelect) {
    majorDepartmentSelect.innerHTML = `
      <option value="" ${page.draft.majorFormDepartmentId ? "" : "selected"} disabled>학부를 선택하세요.</option>
      ${page.catalogs.departments
        .map((department) => {
          return `
            <option value="${escapeHtml(department.id)}">
              ${escapeHtml(department.name || "")}
            </option>
          `;
        })
        .join("")}
    `;
    majorDepartmentSelect.value = page.draft.majorFormDepartmentId;
  }

  // 선택한 학부에 속한 전공만 전공 select option으로 렌더링
  if (majorSelect) {
    majorSelect.innerHTML = `
      <option value="" ${page.draft.majorFormMajorId ? "" : "selected"} disabled>전공을 선택하세요.</option>
      ${filteredMajors
        .map((major) => {
          return `
            <option value="${escapeHtml(major.id)}">
              ${escapeHtml(major.name || "")}
            </option>
          `;
        })
        .join("")}
    `;
    majorSelect.value = page.draft.majorFormMajorId;
  }

  // 전공 유형 select는 현재 draft 값을 그대로 반영
  if (majorTypeSelect) {
    majorTypeSelect.value = page.draft.majorFormMajorType || page.defaultMajorType;
  }
}

// 전공 목록 렌더링
export function renderMajorList(page) {
  const { majorList, majorEmpty } = page.elements;
  if (!majorList || !majorEmpty) return;

  // 담아둔 전공이 없으면 목록을 비우고 empty 문구 노출
  if (page.draft.majors.length === 0) {
    clearChildren(majorList);
    majorEmpty.hidden = false;
    return;
  }

  // draft에 담긴 전공이 있으면 카드형 목록으로 렌더링
  majorList.innerHTML = page.draft.majors
    .map((major) => {
      return `
        <li class="profile-major-item" data-major-draft-id="${escapeHtml(major.draftId)}">
          <span class="profile-major-item__icon" aria-hidden="true">
            <img src="${getFluentIconPath("person")}" alt="" />
          </span>
          <span class="profile-major-chip profile-major-chip--name">${escapeHtml(major.name || "")}</span>
          <span class="profile-major-chip profile-major-chip--type">${escapeHtml(major.majorType || "")}</span>
          <button
            type="button"
            class="btn btn--ghost btn--icon profile-major-item__remove"
            aria-label="Remove major"
            data-major-delete
            data-major-draft-id="${escapeHtml(major.draftId)}"
          >
            <img src="${getFluentIconPath("delete")}" alt="" />
          </button>
        </li>
      `;
    })
    .join("");

  majorEmpty.hidden = true;
}

// 저장 중 상태 반영
export function renderPendingState(page) {
  const { elements, pending, draft } = page;

  if (elements.departmentSelect) elements.departmentSelect.disabled = pending.isBaseSaving;
  if (elements.templateSelect) elements.templateSelect.disabled = pending.isBaseSaving;
  if (elements.baseSettingsCancelButton) elements.baseSettingsCancelButton.disabled = pending.isBaseSaving;
  if (elements.baseSettingsSaveButton) elements.baseSettingsSaveButton.disabled = pending.isBaseSaving;

  if (elements.majorDepartmentSelect) elements.majorDepartmentSelect.disabled = pending.isMajorsSaving;
  if (elements.majorSelect) elements.majorSelect.disabled = pending.isMajorsSaving || !draft.majorFormDepartmentId;
  if (elements.majorTypeSelect) elements.majorTypeSelect.disabled = pending.isMajorsSaving;
  if (elements.majorAddButton) elements.majorAddButton.disabled = pending.isMajorsSaving;
  if (elements.majorCancelButton) elements.majorCancelButton.disabled = pending.isMajorsSaving;
  if (elements.majorSaveButton) elements.majorSaveButton.disabled = pending.isMajorsSaving;

  Array.from(elements.majorList?.querySelectorAll("[data-major-delete]") || []).forEach((button) => {
    button.disabled = pending.isMajorsSaving;
  });
}

// Profile 페이지 전체 갱신
export function renderProfilePage(page) {
  renderProfileSummary(page);
  renderBaseSettings(page);
  renderMajorForm(page);
  renderMajorList(page);
  renderPendingState(page);
}
