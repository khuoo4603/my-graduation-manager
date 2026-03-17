import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/profile.css";

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import {
  addMajor,
  deleteMajor,
  getProfile,
  updateDepartment,
  updateTemplate,
} from "/src/scripts/api/profile.js";
import { getDepartments, getMajors, getTemplates } from "/src/scripts/api/reference.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { qs, qsa, setText } from "/src/scripts/utils/dom.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";

const DEPARTMENT_CHANGE_ALERT_MESSAGE =
  "학부를 변경하면 졸업 판정 결과가 달라질 수 있으므로 템플릿과 전공 설정을 다시 확인해야 합니다.";
const DEPARTMENT_REQUIRED_ALERT_MESSAGE = "학부를 선택해 주세요.";
const TEMPLATE_REQUIRED_ALERT_MESSAGE = "템플릿을 선택해 주세요.";
const TEMPLATE_INVALID_ALERT_MESSAGE = "선택한 템플릿을 다시 확인해 주세요.";
const SAVE_EMPTY_ALERT_MESSAGE = "저장할 변경 사항이 없습니다.";
const MAJOR_REQUIRED_ALERT_MESSAGE = "전공을 선택해 주세요.";
const MAJOR_INVALID_ALERT_MESSAGE = "선택한 전공을 다시 확인해 주세요.";
const MAJOR_DUPLICATE_ALERT_MESSAGE = "같은 전공은 중복으로 추가할 수 없습니다.";
const MAJOR_DELETE_INVALID_ALERT_MESSAGE = "삭제할 전공을 다시 확인해 주세요.";
const DEFAULT_MAJOR_TYPE = "복수전공";
const EMPTY_VALUE_TEXT = "선택되지 않음";

const MAJOR_TYPE_OPTIONS = [
  { value: "심화전공", label: "심화전공" },
  { value: "주전공", label: "주전공" },
  { value: "부전공", label: "부전공" },
  { value: "복수전공", label: "복수전공" },
];

// HTML 문자열 삽입 전 사용자 입력을 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 프로필 초기 표시용 빈 응답 객체를 생성
function createEmptyProfile() {
  return {
    user: {
      id: "",
      name: "해당 없음",
      email: "해당 없음",
    },
    department: null,
    template: null,
    majors: [],
  };
}

// 프로필 페이지 전역 상태의 초기값을 생성
function createInitialProfileState() {
  return {
    profile: createEmptyProfile(),
    catalogs: {
      departments: [],
      templates: [],
      majors: [],
    },
    draft: {
      departmentId: "",
      templateId: "",
      majorId: "",
      majorType: DEFAULT_MAJOR_TYPE,
    },
    pending: {
      isBaseSaving: false,
      isMajorAdding: false,
      deletingMajorIds: new Set(),
    },
    elements: {},
  };
}

// 학부 참조 응답을 셀렉트용 형태로 정규화
function normalizeDepartment(item) {
  if (!item || item.id === undefined || item.id === null) return null;

  return {
    id: String(item.id),
    name: item.name || "",
  };
}

// 템플릿 참조 응답을 화면 상태 형태로 정규화
function normalizeTemplate(item) {
  if (!item || item.id === undefined || item.id === null) return null;

  return {
    id: String(item.id),
    name: item.name || "",
    applicableYear: item.applicableYear ?? item.year ?? null,
    departmentId:
      item.departmentId === undefined || item.departmentId === null ? "" : String(item.departmentId),
  };
}

// 전공 참조 응답을 셀렉트용 형태로 정규화
function normalizeCatalogMajor(item) {
  if (!item || item.id === undefined || item.id === null) return null;

  return {
    id: String(item.id),
    name: item.name || "",
    departmentId:
      item.departmentId === undefined || item.departmentId === null ? "" : String(item.departmentId),
  };
}

// 현재 사용자 전공 응답을 목록 렌더링용 형태로 정규화
function normalizeProfileMajor(item) {
  if (!item) return null;

  const majorId = item.id ?? item.majorId;
  if (majorId === undefined || majorId === null) return null;

  return {
    userMajorId:
      item.userMajorId === undefined || item.userMajorId === null ? "" : String(item.userMajorId),
    id: String(majorId),
    name: item.name || item.majorName || "",
    majorType: item.majorType || "",
  };
}

// 프로필 조회 응답을 페이지 공통 상태 형태로 정규화
function normalizeProfile(profile) {
  const user = profile?.user ?? {};

  return {
    user: {
      id: user.id === undefined || user.id === null ? "" : String(user.id),
      name: user.name || "해당 없음",
      email: user.email || "해당 없음",
    },
    department: normalizeDepartment(profile?.department),
    template: normalizeTemplate(profile?.template),
    majors: Array.isArray(profile?.majors) ? profile.majors.map(normalizeProfileMajor).filter(Boolean) : [],
  };
}

// 서버 프로필 값을 기준으로 draft 초기값을 동기화
function syncDraftFromProfile(state) {
  state.draft.departmentId = state.profile.department?.id || "";
  state.draft.templateId = state.profile.template?.id || "";
  state.draft.majorId = "";
  state.draft.majorType = DEFAULT_MAJOR_TYPE;
}

// 공통 select option HTML 문자열을 조립
function buildSelectOptionsHtml(options, selectedValue, config = {}) {
  const { valueKey = "value", labelKey = "label", labelBuilder = null } = config;

  return options
    .map((option) => {
      const optionValue = option?.[valueKey] ?? "";
      const optionLabel = typeof labelBuilder === "function" ? labelBuilder(option) : option?.[labelKey] ?? "";
      const isSelected = String(optionValue) === String(selectedValue ?? "") ? " selected" : "";
      return `<option value="${escapeHtml(optionValue)}"${isSelected}>${escapeHtml(optionLabel)}</option>`;
    })
    .join("");
}

// 현재 등록된 전공 목록 항목 HTML을 조립
function buildCurrentMajorItemHtml(item, state) {
  const isDeleting = state.pending.deletingMajorIds.has(String(item.userMajorId));
  const disabledAttribute = isDeleting ? " disabled" : "";

  return `
    <li class="profile-major-item" data-user-major-id="${escapeHtml(item.userMajorId)}">
      <span class="profile-major-item__icon" aria-hidden="true">
        <img src="${getFluentIconPath("person")}" alt="" />
      </span>
      <span class="profile-major-chip profile-major-chip--name">${escapeHtml(item.name)}</span>
      <span class="profile-major-chip profile-major-chip--type">${escapeHtml(item.majorType)}</span>
      <button
        class="btn btn--ghost btn--icon profile-major-item__remove"
        type="button"
        aria-label="Remove major"
        data-major-delete
        data-user-major-id="${escapeHtml(item.userMajorId)}"${disabledAttribute}
      >
        <img src="${getFluentIconPath("delete")}" alt="" />
      </button>
    </li>
  `;
}

// 프로필 페이지 기본 레이아웃과 DOM 포인트를 렌더링
function renderProfilePage(pageRoot, state) {
  pageRoot.innerHTML = `
    <section class="profile-page" data-profile-page>
      <header class="profile-page__header">
        <h1 class="profile-page__title">Profile</h1>
        <p class="profile-page__subtitle">졸업 예정에 필요한 기본 설정과 전공 정보를 조회하고 선택 상태를 수정합니다.</p>
      </header>

      <section class="card profile-card" data-profile-summary>
        <div class="profile-card__header">
          <h2 class="profile-card__title">User Information</h2>
        </div>
        <div class="profile-field-stack">
          <div class="field">
            <span class="field__label">Name</span>
            <div class="profile-value" data-profile-name>${escapeHtml(state.profile.user.name)}</div>
          </div>
          <div class="field">
            <span class="field__label">Email</span>
            <div class="profile-value" data-profile-email>${escapeHtml(state.profile.user.email)}</div>
          </div>
          <div class="field">
            <span class="field__label">현재 학부</span>
            <div class="profile-value" data-profile-current-department>${EMPTY_VALUE_TEXT}</div>
          </div>
          <div class="field">
            <span class="field__label">현재 템플릿</span>
            <div class="profile-value" data-profile-current-template>${EMPTY_VALUE_TEXT}</div>
          </div>
        </div>
      </section>

      <section class="card profile-card" data-base-settings>
        <div class="profile-card__header">
          <h2 class="profile-card__title">Department &amp; Template Draft</h2>
        </div>
        <div class="profile-field-stack">
          <label class="field">
            <span class="field__label">Department</span>
            <select class="select" data-department-select>
              <option value="">학부를 선택해 주세요.</option>
            </select>
          </label>
          <label class="field">
            <span class="field__label">Graduation Template</span>
            <select class="select" data-template-select>
              <option value="">템플릿을 선택해 주세요.</option>
            </select>
          </label>
        </div>
        <div class="profile-card__actions">
          <button class="btn btn--primary" type="button" data-base-settings-save>기본 설정 저장</button>
        </div>
      </section>

      <section class="card profile-card" data-major-management>
        <div class="profile-card__header">
          <h2 class="profile-card__title">Majors</h2>
        </div>

        <div class="profile-major-builder">
          <label class="field">
            <span class="field__label">Major Candidate</span>
            <select class="select" data-major-select>
              <option value="">전공을 선택해 주세요.</option>
            </select>
          </label>
          <label class="field">
            <span class="field__label">Major Type</span>
            <select class="select" data-major-type-select>
              ${buildSelectOptionsHtml(MAJOR_TYPE_OPTIONS, state.draft.majorType)}
            </select>
          </label>
          <div class="profile-major-builder__action">
            <button class="btn btn--primary" type="button" data-major-add>
              <img class="btn__icon-image" src="${getFluentIconPath("add")}" alt="" aria-hidden="true" />
              <span>Add Major</span>
            </button>
          </div>
        </div>

        <p class="profile-empty" data-major-empty hidden>등록된 전공이 없습니다.</p>
        <ul class="profile-major-list" data-major-list></ul>
      </section>

      <footer class="profile-page__footer">
        <button class="btn btn--secondary" type="button" data-profile-cancel>Cancel</button>
      </footer>
    </section>
  `;
}

// 프로필 페이지에서 재사용할 DOM 요소를 수집
function collectProfileElements(pageRoot) {
  return {
    profileName: qs("[data-profile-name]", pageRoot),
    profileEmail: qs("[data-profile-email]", pageRoot),
    profileCurrentDepartment: qs("[data-profile-current-department]", pageRoot),
    profileCurrentTemplate: qs("[data-profile-current-template]", pageRoot),
    departmentSelect: qs("[data-department-select]", pageRoot),
    templateSelect: qs("[data-template-select]", pageRoot),
    baseSettingsSaveButton: qs("[data-base-settings-save]", pageRoot),
    majorSelect: qs("[data-major-select]", pageRoot),
    majorTypeSelect: qs("[data-major-type-select]", pageRoot),
    majorAddButton: qs("[data-major-add]", pageRoot),
    majorList: qs("[data-major-list]", pageRoot),
    majorEmpty: qs("[data-major-empty]", pageRoot),
    profileCancelButton: qs("[data-profile-cancel]", pageRoot),
  };
}

// 현재 선택된 템플릿이 현 학부 카탈로그에 존재하는지 확인
function hasTemplateInCurrentCatalog(state, templateId) {
  return state.catalogs.templates.some((template) => template.id === String(templateId));
}

// 현재 선택된 전공이 현 학부 카탈로그에 존재하는지 확인
function hasMajorInCurrentCatalog(state, majorId) {
  return state.catalogs.majors.some((major) => major.id === String(majorId));
}

// 현재 프로필 전공 목록에서 같은 majorId가 이미 있는지 확인
function hasDuplicateProfileMajor(state, majorId) {
  return state.profile.majors.some((major) => major.id === String(majorId));
}

// 비동기 동작 상태에 따라 버튼과 입력 요소를 비활성화
function renderPendingState(state) {
  const { elements, pending } = state;
  const isBusy = pending.isBaseSaving || pending.isMajorAdding || pending.deletingMajorIds.size > 0;

  if (elements.departmentSelect) {
    elements.departmentSelect.disabled = pending.isBaseSaving;
  }

  if (elements.templateSelect) {
    elements.templateSelect.disabled = pending.isBaseSaving;
  }

  if (elements.baseSettingsSaveButton) {
    elements.baseSettingsSaveButton.disabled = pending.isBaseSaving;
  }

  if (elements.majorSelect) {
    elements.majorSelect.disabled = pending.isMajorAdding;
  }

  if (elements.majorTypeSelect) {
    elements.majorTypeSelect.disabled = pending.isMajorAdding;
  }

  if (elements.majorAddButton) {
    elements.majorAddButton.disabled = pending.isMajorAdding;
  }

  if (elements.profileCancelButton) {
    elements.profileCancelButton.disabled = isBusy;
  }

  qsa("[data-major-delete]", elements.majorList).forEach((button) => {
    const userMajorId = button.getAttribute("data-user-major-id") || "";
    button.disabled = pending.deletingMajorIds.has(userMajorId);
  });
}

// 사용자 기본 정보와 현재 저장값 영역을 렌더링
function renderProfileSummary(state) {
  const { elements, profile } = state;

  setText(elements.profileName, profile.user.name || "해당 없음");
  setText(elements.profileEmail, profile.user.email || "해당 없음");
  setText(elements.profileCurrentDepartment, profile.department?.name || EMPTY_VALUE_TEXT);
  setText(elements.profileCurrentTemplate, profile.template?.name || EMPTY_VALUE_TEXT);
}

// 학부 셀렉트 옵션과 선택값을 렌더링
function renderDepartmentSelect(state) {
  const { departmentSelect } = state.elements;
  if (!departmentSelect) return;

  departmentSelect.innerHTML = `
    <option value="">학부를 선택해 주세요.</option>
    ${buildSelectOptionsHtml(state.catalogs.departments, state.draft.departmentId, {
      valueKey: "id",
      labelKey: "name",
    })}
  `;

  departmentSelect.value = state.draft.departmentId;
}

// 템플릿 셀렉트 옵션과 선택값을 렌더링
function renderTemplateSelect(state) {
  const { templateSelect } = state.elements;
  if (!templateSelect) return;

  templateSelect.innerHTML = `
    <option value="">템플릿을 선택해 주세요.</option>
    ${buildSelectOptionsHtml(state.catalogs.templates, state.draft.templateId, {
      valueKey: "id",
      labelBuilder: (item) => {
        if (!item?.applicableYear) return item?.name || "";
        return `${item.name} (${item.applicableYear})`;
      },
    })}
  `;

  templateSelect.value = state.draft.templateId;
}

// 전공 후보 셀렉트 옵션과 선택값을 렌더링
function renderMajorSelect(state) {
  const { majorSelect } = state.elements;
  if (!majorSelect) return;

  majorSelect.innerHTML = `
    <option value="">전공을 선택해 주세요.</option>
    ${buildSelectOptionsHtml(state.catalogs.majors, state.draft.majorId, {
      valueKey: "id",
      labelKey: "name",
    })}
  `;

  majorSelect.value = state.draft.majorId;
}

// 전공 타입 셀렉트 값을 현재 draft 기준으로 렌더링
function renderMajorTypeSelect(state) {
  const { majorTypeSelect } = state.elements;
  if (!majorTypeSelect) return;

  majorTypeSelect.innerHTML = buildSelectOptionsHtml(MAJOR_TYPE_OPTIONS, state.draft.majorType);
  majorTypeSelect.value = state.draft.majorType;
}

// 현재 서버 기준 전공 목록과 빈 상태를 렌더링
function renderCurrentMajorList(state) {
  const { majorList, majorEmpty } = state.elements;
  if (!majorList || !majorEmpty) return;

  majorList.innerHTML = state.profile.majors.map((item) => buildCurrentMajorItemHtml(item, state)).join("");
  majorEmpty.hidden = state.profile.majors.length > 0;
}

// 현재 상태를 바탕으로 프로필 페이지 전 영역을 갱신
function renderProfileState(state) {
  renderProfileSummary(state);
  renderDepartmentSelect(state);
  renderTemplateSelect(state);
  renderMajorSelect(state);
  renderMajorTypeSelect(state);
  renderCurrentMajorList(state);
  renderPendingState(state);
}

// 학부 의존 카탈로그를 초기화해 이전 학부 데이터를 비움
function clearDepartmentCatalogs(state) {
  state.catalogs.templates = [];
  state.catalogs.majors = [];
}

// 학부 목록 참조 데이터를 조회해 상태에 반영
async function loadDepartments(state) {
  const response = await getDepartments();
  state.catalogs.departments = Array.isArray(response?.departments)
    ? response.departments.map(normalizeDepartment).filter(Boolean)
    : [];
}

// 현재 사용자 프로필을 조회해 상태와 draft를 동기화
async function loadProfile(state) {
  const response = await getProfile();
  state.profile = normalizeProfile(response);
  syncDraftFromProfile(state);
}

// 선택된 학부 기준 템플릿/전공 카탈로그를 재조회
async function loadDepartmentCatalogs(state, departmentId) {
  if (!departmentId) {
    clearDepartmentCatalogs(state);
    return;
  }

  const [templatesResponse, majorsResponse] = await Promise.all([
    getTemplates(departmentId),
    getMajors(departmentId),
  ]);

  state.catalogs.templates = Array.isArray(templatesResponse?.templates)
    ? templatesResponse.templates.map(normalizeTemplate).filter(Boolean)
    : [];

  state.catalogs.majors = Array.isArray(majorsResponse?.majors)
    ? majorsResponse.majors.map(normalizeCatalogMajor).filter(Boolean)
    : [];
}

// 서버 기준 최신 프로필과 의존 카탈로그를 다시 적재
async function loadLatestProfileState(state) {
  await loadProfile(state);

  if (state.profile.department?.id) {
    await loadDepartmentCatalogs(state, state.profile.department.id);
  } else {
    clearDepartmentCatalogs(state);
  }

  renderProfileState(state);
}

// 학부 변경 시 alert 후 의존 카탈로그를 다시 조회
async function handleDepartmentChange(event, state) {
  const nextDepartmentId = event.currentTarget?.value ?? "";

  if (nextDepartmentId === state.draft.departmentId) return;

  window.alert(DEPARTMENT_CHANGE_ALERT_MESSAGE);

  state.draft.departmentId = nextDepartmentId;
  clearDepartmentCatalogs(state);
  renderProfileState(state);

  try {
    await loadDepartmentCatalogs(state, nextDepartmentId);
    renderProfileState(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

// 기본 설정 저장 전 draft 값의 유효성을 검증
function validateBaseSettingsDraft(state) {
  const currentDepartmentId = state.profile.department?.id || "";
  const currentTemplateId = state.profile.template?.id || "";
  const nextDepartmentId = state.draft.departmentId;
  const nextTemplateId = state.draft.templateId;
  const departmentChanged = nextDepartmentId !== currentDepartmentId;
  const templateChanged = nextTemplateId !== currentTemplateId;
  const requiresTemplateCheck = departmentChanged || templateChanged || Boolean(nextTemplateId);

  if (!nextDepartmentId) {
    window.alert(DEPARTMENT_REQUIRED_ALERT_MESSAGE);
    state.elements.departmentSelect?.focus();
    return null;
  }

  if (!departmentChanged && !templateChanged) {
    window.alert(SAVE_EMPTY_ALERT_MESSAGE);
    return null;
  }

  if (requiresTemplateCheck && !nextTemplateId) {
    window.alert(TEMPLATE_REQUIRED_ALERT_MESSAGE);
    state.elements.templateSelect?.focus();
    return null;
  }

  if (requiresTemplateCheck && !hasTemplateInCurrentCatalog(state, nextTemplateId)) {
    window.alert(TEMPLATE_INVALID_ALERT_MESSAGE);
    state.elements.templateSelect?.focus();
    return null;
  }

  return {
    departmentChanged,
    templateChanged,
    nextDepartmentId,
    nextTemplateId,
  };
}

// 기본 설정 저장 버튼 클릭 시 학부와 템플릿을 순차 저장
async function handleBaseSettingsSave(state) {
  if (state.pending.isBaseSaving) return;

  const validatedDraft = validateBaseSettingsDraft(state);
  if (!validatedDraft) return;

  state.pending.isBaseSaving = true;
  renderPendingState(state);

  try {
    if (validatedDraft.departmentChanged) {
      await updateDepartment(validatedDraft.nextDepartmentId);
    }

    if (validatedDraft.templateChanged) {
      await updateTemplate(validatedDraft.nextTemplateId);
    }

    await loadLatestProfileState(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    state.pending.isBaseSaving = false;
    renderPendingState(state);
  }
}

// Cancel 버튼 클릭 시 draft와 전공 추가 폼을 서버 기준으로 복원
async function handleCancel(state) {
  syncDraftFromProfile(state);

  try {
    if (state.profile.department?.id) {
      await loadDepartmentCatalogs(state, state.profile.department.id);
    } else {
      clearDepartmentCatalogs(state);
    }

    renderProfileState(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

// 전공 추가 버튼 클릭 시 중복 검증 후 서버에 전공을 추가
async function handleMajorAdd(state) {
  if (state.pending.isMajorAdding) return;

  const nextMajorId = state.draft.majorId;
  const nextMajorType = state.draft.majorType || DEFAULT_MAJOR_TYPE;

  if (!nextMajorId) {
    window.alert(MAJOR_REQUIRED_ALERT_MESSAGE);
    state.elements.majorSelect?.focus();
    return;
  }

  if (!hasMajorInCurrentCatalog(state, nextMajorId)) {
    window.alert(MAJOR_INVALID_ALERT_MESSAGE);
    state.elements.majorSelect?.focus();
    return;
  }

  if (hasDuplicateProfileMajor(state, nextMajorId)) {
    window.alert(MAJOR_DUPLICATE_ALERT_MESSAGE);
    state.elements.majorSelect?.focus();
    return;
  }

  state.pending.isMajorAdding = true;
  renderPendingState(state);

  try {
    await addMajor({
      majorId: nextMajorId,
      majorType: nextMajorType,
    });

    await loadLatestProfileState(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    state.pending.isMajorAdding = false;
    renderPendingState(state);
  }
}

// 전공 삭제 버튼 클릭 시 userMajorId 기준으로 서버에서 삭제
async function handleMajorDelete(userMajorId, state) {
  if (!userMajorId) {
    window.alert(MAJOR_DELETE_INVALID_ALERT_MESSAGE);
    return;
  }

  if (state.pending.deletingMajorIds.has(userMajorId)) return;

  state.pending.deletingMajorIds.add(userMajorId);
  renderPendingState(state);

  try {
    await deleteMajor(userMajorId);
    await loadLatestProfileState(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    state.pending.deletingMajorIds.delete(userMajorId);
    renderPendingState(state);
  }
}

// 프로필 페이지에서 사용하는 사용자 인터랙션 이벤트를 등록
function bindProfilePageEvents(state) {
  const { elements } = state;

  // 학부 선택이 바뀌면 안내 alert 후 의존 카탈로그를 다시 조회
  elements.departmentSelect?.addEventListener("change", async (event) => {
    await handleDepartmentChange(event, state);
  });

  // 템플릿 셀렉트 변경값을 draft 상태에만 반영
  elements.templateSelect?.addEventListener("change", (event) => {
    state.draft.templateId = event.currentTarget?.value ?? "";
  });

  // 기본 설정 저장 버튼 클릭 시 학부와 템플릿을 순차 저장
  elements.baseSettingsSaveButton?.addEventListener("click", async () => {
    await handleBaseSettingsSave(state);
  });

  // 전공 후보 셀렉트 변경값을 draft 상태에만 반영
  elements.majorSelect?.addEventListener("change", (event) => {
    state.draft.majorId = event.currentTarget?.value ?? "";
  });

  // 전공 타입 셀렉트 변경값을 draft 상태에만 반영
  elements.majorTypeSelect?.addEventListener("change", (event) => {
    state.draft.majorType = event.currentTarget?.value ?? DEFAULT_MAJOR_TYPE;
  });

  // 전공 추가 버튼 클릭 시 서버에 전공을 추가
  elements.majorAddButton?.addEventListener("click", async () => {
    await handleMajorAdd(state);
  });

  // 전공 목록의 삭제 버튼 클릭은 이벤트 위임으로 처리
  elements.majorList?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const deleteButton = target.closest("[data-major-delete]");
    if (!(deleteButton instanceof HTMLButtonElement)) return;

    const userMajorId = deleteButton.getAttribute("data-user-major-id") || "";
    await handleMajorDelete(userMajorId, state);
  });

  // Cancel 버튼 클릭 시 draft 선택값을 서버 기준 현재 상태로 복원
  elements.profileCancelButton?.addEventListener("click", async () => {
    await handleCancel(state);
  });
}

// 프로필 페이지 초기 조회 데이터를 순서대로 적재
async function loadProfilePageData(state) {
  await loadDepartments(state);
  await loadLatestProfileState(state);
}

// 프로필 페이지 보호 접근 확인과 초기 렌더링을 수행
export async function initProfilePage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.PROFILE,
    userName: authResult.profile?.user?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const state = createInitialProfileState();
  renderProfilePage(pageRoot, state);

  state.elements = collectProfileElements(pageRoot);
  bindProfilePageEvents(state);

  try {
    await loadProfilePageData(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

initProfilePage();
