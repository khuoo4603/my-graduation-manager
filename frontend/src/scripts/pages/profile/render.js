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

// 사용자 정보 카드 렌더링
export function renderUserInformation(page) {
  if (page.elements.profileNameInput) {
    page.elements.profileNameInput.value = page.draft.userName || "";
  }

  setText(page.elements.profileEmail, page.profile.user.email || "해당 없음");
}

// 기본 설정 카드 렌더링
export function renderBaseSettings(page) {
  const { departmentSelect, templateSelect } = page.elements;

  if (departmentSelect) {
    departmentSelect.innerHTML = `
      <option value="" ${page.draft.departmentId ? "" : "selected"} disabled>학부를 선택해 주세요.</option>
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

  if (templateSelect) {
    templateSelect.innerHTML = `
      <option value="" ${page.draft.templateId ? "" : "selected"} disabled>졸업 템플릿을 선택해 주세요.</option>
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
    // 현재 학부 필터에 없는 전공 id는 선택값에서 제거
    page.draft.majorFormMajorId = "";
  }

  if (majorDepartmentSelect) {
    majorDepartmentSelect.innerHTML = `
      <option value="" ${page.draft.majorFormDepartmentId ? "" : "selected"} disabled>학부를 선택해 주세요.</option>
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

  if (majorSelect) {
    majorSelect.innerHTML = `
      <option value="" ${page.draft.majorFormMajorId ? "" : "selected"} disabled>전공을 선택해 주세요.</option>
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

  if (majorTypeSelect) {
    majorTypeSelect.value = page.draft.majorFormMajorType || page.defaultMajorType;
  }
}

// 전공 목록 렌더링
export function renderMajorList(page) {
  const { majorList, majorEmpty } = page.elements;
  if (!majorList || !majorEmpty) return;

  if (page.draft.majors.length === 0) {
    // 담아둔 전공이 없으면 목록을 비우고 empty 문구 노출
    clearChildren(majorList);
    majorEmpty.hidden = false;
    return;
  }

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
            aria-label="전공 삭제"
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

// 계정 삭제 확인 모달 open 상태 렌더링
export function renderAccountDeleteModal(page) {
  const { accountDeleteModal } = page.elements;
  if (!accountDeleteModal) return;

  const isOpen = Boolean(page.ui.isDeleteModalOpen);
  accountDeleteModal.hidden = !isOpen;
  accountDeleteModal.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("is-modal-open", isOpen);
}

// 저장 중 상태 반영
export function renderPendingState(page) {
  const { elements, pending, draft } = page;
  const isUserNameDirty = draft.userName !== (page.profile.user.name || "");

  if (elements.profileNameInput) elements.profileNameInput.disabled = pending.isUserSaving;
  if (elements.profileNameCancelButton) {
    elements.profileNameCancelButton.disabled = pending.isUserSaving || !isUserNameDirty;
  }
  if (elements.profileNameSaveButton) {
    elements.profileNameSaveButton.disabled = pending.isUserSaving || !isUserNameDirty;
  }

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

  if (elements.accountDeleteOpenButton) elements.accountDeleteOpenButton.disabled = pending.isAccountDeleting;
  if (elements.accountDeleteCancelButton) elements.accountDeleteCancelButton.disabled = pending.isAccountDeleting;
  if (elements.accountDeleteConfirmButton) elements.accountDeleteConfirmButton.disabled = pending.isAccountDeleting;
}

// Profile 페이지 전체 갱신
export function renderProfilePage(page) {
  renderUserInformation(page);
  renderBaseSettings(page);
  renderMajorForm(page);
  renderMajorList(page);
  renderAccountDeleteModal(page);
  renderPendingState(page);
}
