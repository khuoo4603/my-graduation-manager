import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/profile.css";

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { addMajor, deleteMajor, getProfile, updateDepartment, updateTemplate } from "/src/scripts/api/profile.js";
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
const BASE_SETTINGS_EMPTY_ALERT_MESSAGE = "저장할 기본 설정 변경 사항이 없습니다.";
const MAJOR_REQUIRED_ALERT_MESSAGE = "전공을 선택해 주세요.";
const MAJOR_INVALID_ALERT_MESSAGE = "선택한 전공을 다시 확인해 주세요.";
const MAJOR_DUPLICATE_ALERT_MESSAGE = "같은 전공은 중복으로 추가할 수 없습니다.";
const MAJORS_EMPTY_ALERT_MESSAGE = "저장할 전공 변경 사항이 없습니다.";
const DEFAULT_MAJOR_TYPE = "복수전공";

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

// placeholder와 일반 option을 공통 방식으로 렌더링
function buildOptionHtml(value, label, { isSelected = false, isDisabled = false } = {}) {
  return `<option value="${escapeHtml(value)}"${isDisabled ? " disabled" : ""}${isSelected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

// option 객체 배열을 공통 option HTML로 변환
function buildSelectOptionsHtml(options, selectedValue, config = {}) {
  const { valueKey = "value", labelKey = "label", labelBuilder = null } = config;

  return options
    .map((option) => {
      const optionValue = option?.[valueKey] ?? "";
      const optionLabel = typeof labelBuilder === "function" ? labelBuilder(option) : (option?.[labelKey] ?? "");
      return buildOptionHtml(optionValue, optionLabel, {
        isSelected: String(optionValue) === String(selectedValue ?? ""),
      });
    })
    .join("");
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
  };
}

// 전공 참조 응답을 셀렉트용 형태로 정규화
function normalizeCatalogMajor(item) {
  if (!item || item.id === undefined || item.id === null) return null;

  return {
    id: String(item.id),
    name: item.name || "",
    departmentId: item.departmentId === undefined || item.departmentId === null ? "" : String(item.departmentId),
  };
}

// 현재 사용자 전공 응답을 목록 렌더링용 형태로 정규화
function normalizeProfileMajor(item) {
  if (!item) return null;

  const majorId = item.id ?? item.majorId;
  if (majorId === undefined || majorId === null) return null;

  return {
    userMajorId: item.userMajorId === undefined || item.userMajorId === null ? "" : String(item.userMajorId),
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

// 서버 전공 목록을 카드 draft 목록 형태로 변환
function createMajorDraftItems(profileMajors) {
  return profileMajors.map((major) => ({
    draftId: `saved-${major.userMajorId}`,
    userMajorId: major.userMajorId,
    id: major.id,
    name: major.name,
    majorType: major.majorType,
  }));
}

// Base Settings 카드 draft를 profile 기준으로 복원
function syncBaseSettingsDraft(state) {
  state.draft.baseSettings.departmentId = state.profile.department?.id || "";
  state.draft.baseSettings.templateId = state.profile.template?.id || "";
}

// Majors 카드 draft와 form을 profile 기준으로 복원
function syncMajorsDraft(state) {
  state.draft.majors = createMajorDraftItems(state.profile.majors);
  state.draft.majorForm.departmentId = "";
  state.draft.majorForm.majorId = "";
  state.draft.majorForm.majorType = DEFAULT_MAJOR_TYPE;
}

// Major 카드 학부 필터 기준으로 전공 후보만 추린다
function getFilteredCatalogMajors(state) {
  const selectedDepartmentId = state.draft.majorForm.departmentId;
  if (!selectedDepartmentId) return [];

  return state.catalogs.majors.filter((major) => major.departmentId === selectedDepartmentId);
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
      baseSettings: {
        departmentId: "",
        templateId: "",
      },
      majors: [],
      majorForm: {
        departmentId: "",
        majorId: "",
        majorType: DEFAULT_MAJOR_TYPE,
      },
    },
    pending: {
      isBaseSaving: false,
      isMajorsSaving: false,
    },
    majorDraftSequence: 0,
    elements: {},
  };
}

// 프로필 페이지 기본 레이아웃과 DOM 포인트를 렌더링
function renderProfilePage(pageRoot, state) {
  pageRoot.innerHTML = `
    <section class="profile-page" data-profile-page>
      <header class="profile-page__header">
        <h1 class="profile-page__title">Profile</h1>
        <p class="profile-page__subtitle">사용자 정보 확인과 학부/졸업 템플릿/전공 변경이 가능합니다.</p>
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
        </div>
      </section>

      <section class="card profile-card" data-base-settings>
        <div class="profile-card__header">
          <h2 class="profile-card__title">Department &amp; Template</h2>
        </div>
        <div class="profile-field-stack">
          <label class="field">
            <span class="field__label">Department</span>
            <select class="select" data-department-select>
              ${buildOptionHtml("", "학부를 선택하세요", { isSelected: true, isDisabled: true })}
            </select>
          </label>
          <label class="field">
            <span class="field__label">Graduation Template</span>
            <select class="select" data-template-select>
              ${buildOptionHtml("", "졸업 템플릿을 선택하세요", { isSelected: true, isDisabled: true })}
            </select>
          </label>
        </div>
        <div class="profile-card__actions">
          <button class="btn btn--secondary" type="button" data-base-settings-cancel>Cancel</button>
          <button class="btn btn--primary" type="button" data-base-settings-save>Save</button>
        </div>
      </section>

      <section class="card profile-card" data-major-management>
        <div class="profile-card__header">
          <h2 class="profile-card__title">Majors</h2>
        </div>
        <div class="profile-major-builder">
          <label class="field">
            <span class="field__label">학부 필터</span>
            <select class="select" data-major-department-select>
              ${buildOptionHtml("", "학부를 선택하세요", { isSelected: true, isDisabled: true })}
            </select>
          </label>
          <label class="field">
            <span class="field__label">전공</span>
            <select class="select" data-major-select>
              ${buildOptionHtml("", "전공을 선택하세요", { isSelected: true, isDisabled: true })}
            </select>
          </label>
          <label class="field">
            <span class="field__label">Major Type</span>
            <select class="select" data-major-type-select>
              ${buildSelectOptionsHtml(MAJOR_TYPE_OPTIONS, state.draft.majorForm.majorType)}
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
        <div class="profile-card__actions">
          <button class="btn btn--secondary" type="button" data-major-cancel>Cancel</button>
          <button class="btn btn--primary" type="button" data-major-save>Save</button>
        </div>
      </section>
    </section>
  `;
}

// 프로필 요약 정보를 현재 profile 기준으로 렌더링
function renderProfileSummary(state) {
  const { elements, profile } = state;

  setText(elements.profileName, profile.user.name || "해당 없음");
  setText(elements.profileEmail, profile.user.email || "해당 없음");
}

// Base Settings 카드를 현재 draft와 전체 카탈로그 기준으로 렌더링
function renderBaseSettingsCard(state) {
  const { departmentSelect, templateSelect } = state.elements;

  if (departmentSelect) {
    // 실제 선택 후에도 placeholder는 비활성 상태로만 유지
    departmentSelect.innerHTML = `
      ${buildOptionHtml("", "학부를 선택하세요", {
        isSelected: !state.draft.baseSettings.departmentId,
        isDisabled: true,
      })}
      ${buildSelectOptionsHtml(state.catalogs.departments, state.draft.baseSettings.departmentId, {
        valueKey: "id",
        labelKey: "name",
      })}
    `;

    departmentSelect.value = state.draft.baseSettings.departmentId;
  }

  if (templateSelect) {
    // 템플릿도 같은 방식으로 placeholder를 비활성 유지
    templateSelect.innerHTML = `
      ${buildOptionHtml("", "졸업 템플릿을 선택하세요", {
        isSelected: !state.draft.baseSettings.templateId,
        isDisabled: true,
      })}
      ${buildSelectOptionsHtml(state.catalogs.templates, state.draft.baseSettings.templateId, {
        valueKey: "id",
        labelBuilder: (item) => {
          if (!item?.applicableYear) return item?.name || "";
          return `${item.name} (${item.applicableYear})`;
        },
      })}
    `;

    templateSelect.value = state.draft.baseSettings.templateId;
  }
}

// 전공 draft 목록 항목 HTML을 조립
function buildMajorDraftItemHtml(item, isMajorsSaving) {
  const disabledAttribute = isMajorsSaving ? " disabled" : "";

  return `
    <li class="profile-major-item" data-major-draft-id="${escapeHtml(item.draftId)}">
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
        data-major-draft-id="${escapeHtml(item.draftId)}"${disabledAttribute}
      >
        <img src="${getFluentIconPath("delete")}" alt="" />
      </button>
    </li>
  `;
}

// Majors 카드를 현재 draft 목록과 form 기준으로 렌더링
function renderMajorsCard(state) {
  const { majorDepartmentSelect, majorSelect, majorTypeSelect, majorList, majorEmpty } = state.elements;
  const filteredMajors = getFilteredCatalogMajors(state);
  const hasDepartmentFilter = Boolean(state.draft.majorForm.departmentId);

  if (majorDepartmentSelect) {
    // Major 카드 학부 필터는 별도 draft 상태로 관리
    majorDepartmentSelect.innerHTML = `
      ${buildOptionHtml("", "학부를 선택하세요", {
        isSelected: !state.draft.majorForm.departmentId,
        isDisabled: true,
      })}
      ${buildSelectOptionsHtml(state.catalogs.departments, state.draft.majorForm.departmentId, {
        valueKey: "id",
        labelKey: "name",
      })}
    `;

    majorDepartmentSelect.value = state.draft.majorForm.departmentId;
  }

  if (majorSelect) {
    if (!filteredMajors.some((major) => major.id === state.draft.majorForm.majorId)) {
      state.draft.majorForm.majorId = "";
    }

    // 현재 학부 필터 기준으로 전공 목록을 다시 구성
    majorSelect.innerHTML = `
      ${buildOptionHtml("", "전공을 선택하세요", {
        isSelected: !state.draft.majorForm.majorId,
        isDisabled: true,
      })}
      ${
        hasDepartmentFilter
          ? buildSelectOptionsHtml(filteredMajors, state.draft.majorForm.majorId, {
              valueKey: "id",
              labelKey: "name",
            })
          : ""
      }
    `;

    majorSelect.value = state.draft.majorForm.majorId;
  }

  if (majorTypeSelect) {
    majorTypeSelect.innerHTML = buildSelectOptionsHtml(MAJOR_TYPE_OPTIONS, state.draft.majorForm.majorType);
    majorTypeSelect.value = state.draft.majorForm.majorType;
  }

  if (majorList && majorEmpty) {
    majorList.innerHTML = state.draft.majors
      .map((item) => buildMajorDraftItemHtml(item, state.pending.isMajorsSaving))
      .join("");
    majorEmpty.hidden = state.draft.majors.length > 0;
  }
}

// 비동기 동작 상태에 따라 카드별 입력과 버튼을 비활성화
function renderPendingState(state) {
  const { elements, pending } = state;

  if (elements.departmentSelect) {
    elements.departmentSelect.disabled = pending.isBaseSaving;
  }

  if (elements.templateSelect) {
    elements.templateSelect.disabled = pending.isBaseSaving;
  }

  if (elements.baseSettingsCancelButton) {
    elements.baseSettingsCancelButton.disabled = pending.isBaseSaving;
  }

  if (elements.baseSettingsSaveButton) {
    elements.baseSettingsSaveButton.disabled = pending.isBaseSaving;
  }

  if (elements.majorDepartmentSelect) {
    elements.majorDepartmentSelect.disabled = pending.isMajorsSaving;
  }

  if (elements.majorSelect) {
    elements.majorSelect.disabled = pending.isMajorsSaving || !state.draft.majorForm.departmentId;
  }

  if (elements.majorTypeSelect) {
    elements.majorTypeSelect.disabled = pending.isMajorsSaving;
  }

  if (elements.majorAddButton) {
    elements.majorAddButton.disabled = pending.isMajorsSaving;
  }

  if (elements.majorCancelButton) {
    elements.majorCancelButton.disabled = pending.isMajorsSaving;
  }

  if (elements.majorSaveButton) {
    elements.majorSaveButton.disabled = pending.isMajorsSaving;
  }

  qsa("[data-major-delete]", elements.majorList).forEach((button) => {
    button.disabled = pending.isMajorsSaving;
  });
}

// 현재 상태를 바탕으로 프로필 페이지 전 영역을 갱신
function renderProfileState(state) {
  renderProfileSummary(state);
  renderBaseSettingsCard(state);
  renderMajorsCard(state);
  renderPendingState(state);
}

// 전체 카탈로그를 한 번에 조회해 상태에 반영
async function loadCatalogs(state) {
  const [departmentsResponse, templatesResponse, majorsResponse] = await Promise.all([
    getDepartments(),
    getTemplates(),
    getMajors(),
  ]);

  state.catalogs.departments = Array.isArray(departmentsResponse?.departments)
    ? departmentsResponse.departments.map(normalizeDepartment).filter(Boolean)
    : [];

  state.catalogs.templates = Array.isArray(templatesResponse?.templates)
    ? templatesResponse.templates.map(normalizeTemplate).filter(Boolean)
    : [];

  state.catalogs.majors = Array.isArray(majorsResponse?.majors)
    ? majorsResponse.majors.map(normalizeCatalogMajor).filter(Boolean)
    : [];
}

// 현재 사용자 프로필을 조회해 상태와 카드별 draft를 동기화
async function loadProfile(state) {
  const response = await getProfile();
  state.profile = normalizeProfile(response);
  syncBaseSettingsDraft(state);
  syncMajorsDraft(state);
}

// 프로필 페이지 초기 조회 데이터를 병렬로 적재
async function loadProfilePageData(state) {
  await Promise.all([loadCatalogs(state), loadProfile(state)]);
  renderProfileState(state);
}

// 학부 변경 시 alert 후 Base Settings draft 값만 갱신
function handleDepartmentChange(event, state) {
  const nextDepartmentId = event.currentTarget?.value ?? "";

  if (nextDepartmentId === state.draft.baseSettings.departmentId) return;

  window.alert(DEPARTMENT_CHANGE_ALERT_MESSAGE);
  state.draft.baseSettings.departmentId = nextDepartmentId;
}

// Base Settings Save 직전 draft 유효성을 검증
function validateBaseSettingsSave(state) {
  const currentDepartmentId = state.profile.department?.id || "";
  const currentTemplateId = state.profile.template?.id || "";
  const nextDepartmentId = state.draft.baseSettings.departmentId;
  const nextTemplateId = state.draft.baseSettings.templateId;
  const departmentChanged = nextDepartmentId !== currentDepartmentId;
  const templateChanged = nextTemplateId !== currentTemplateId;

  if (!departmentChanged && !templateChanged) {
    window.alert(BASE_SETTINGS_EMPTY_ALERT_MESSAGE);
    return null;
  }

  if (departmentChanged && !nextDepartmentId) {
    window.alert(DEPARTMENT_REQUIRED_ALERT_MESSAGE);
    state.elements.departmentSelect?.focus();
    return null;
  }

  if (templateChanged && !nextTemplateId) {
    window.alert(TEMPLATE_REQUIRED_ALERT_MESSAGE);
    state.elements.templateSelect?.focus();
    return null;
  }

  if (nextTemplateId && !state.catalogs.templates.some((template) => template.id === nextTemplateId)) {
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

// Base Settings 카드 Cancel 클릭 시 카드 draft만 profile 기준으로 복원
function handleBaseSettingsCancel(state) {
  syncBaseSettingsDraft(state);
  renderBaseSettingsCard(state);
}

// Base Settings 카드 Save 클릭 시 학부와 템플릿을 순차 저장
async function handleBaseSettingsSave(state) {
  if (state.pending.isBaseSaving) return;

  const validatedDraft = validateBaseSettingsSave(state);
  if (!validatedDraft) return;

  state.pending.isBaseSaving = true;
  renderPendingState(state);

  let hasMutation = false;

  try {
    if (validatedDraft.departmentChanged) {
      await updateDepartment(validatedDraft.nextDepartmentId);
      hasMutation = true;
    }

    if (validatedDraft.templateChanged) {
      await updateTemplate(validatedDraft.nextTemplateId);
      hasMutation = true;
    }

    await loadProfile(state);
    renderProfileState(state);
  } catch (error) {
    if (hasMutation) {
      try {
        await loadProfile(state);
        renderProfileState(state);
      } catch {
        // 부분 반영 상황에서는 다음 진입 시 서버 기준으로 복구
      }
    }

    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    state.pending.isBaseSaving = false;
    renderPendingState(state);
  }
}

// Major draft form 입력값을 추가 직전에 검증
function validateMajorDraftForm(state) {
  const nextMajorId = state.draft.majorForm.majorId;
  const filteredMajors = getFilteredCatalogMajors(state);

  if (!nextMajorId) {
    window.alert(MAJOR_REQUIRED_ALERT_MESSAGE);
    state.elements.majorSelect?.focus();
    return null;
  }

  const majorCatalogItem = filteredMajors.find((major) => major.id === nextMajorId) || null;
  if (!majorCatalogItem) {
    window.alert(MAJOR_INVALID_ALERT_MESSAGE);
    state.elements.majorSelect?.focus();
    return null;
  }

  if (state.draft.majors.some((major) => major.id === nextMajorId)) {
    window.alert(MAJOR_DUPLICATE_ALERT_MESSAGE);
    state.elements.majorSelect?.focus();
    return null;
  }

  return {
    majorCatalogItem,
    majorType: state.draft.majorForm.majorType || DEFAULT_MAJOR_TYPE,
  };
}

// Add Major 클릭 시 서버 저장 없이 Majors draft 목록에만 추가
function handleMajorAdd(state) {
  if (state.pending.isMajorsSaving) return;

  const validatedMajorForm = validateMajorDraftForm(state);
  if (!validatedMajorForm) return;

  state.majorDraftSequence += 1;
  state.draft.majors.push({
    draftId: `draft-${state.majorDraftSequence}`,
    userMajorId: "",
    id: validatedMajorForm.majorCatalogItem.id,
    name: validatedMajorForm.majorCatalogItem.name,
    majorType: validatedMajorForm.majorType,
  });

  state.draft.majorForm.majorId = "";
  state.draft.majorForm.majorType = DEFAULT_MAJOR_TYPE;
  renderMajorsCard(state);
  renderPendingState(state);
}

// 삭제 버튼 클릭 시 Majors draft 목록에서만 항목을 제거
function handleMajorDelete(draftId, state) {
  if (state.pending.isMajorsSaving) return;

  state.draft.majors = state.draft.majors.filter((major) => major.draftId !== draftId);
  renderMajorsCard(state);
  renderPendingState(state);
}

// profile과 Majors draft의 차이를 추가/삭제 목록으로 계산
function buildMajorMutationPlan(state) {
  const profileMajors = state.profile.majors;
  const draftMajors = state.draft.majors;

  const addedMajors = draftMajors.filter((draftMajor) => {
    const draftKey = `${draftMajor.id}|${draftMajor.majorType}`;
    return !profileMajors.some((profileMajor) => `${profileMajor.id}|${profileMajor.majorType}` === draftKey);
  });

  const removedMajors = profileMajors.filter((profileMajor) => {
    const profileKey = `${profileMajor.id}|${profileMajor.majorType}`;
    return !draftMajors.some((draftMajor) => `${draftMajor.id}|${draftMajor.majorType}` === profileKey);
  });

  return { addedMajors, removedMajors };
}

// Majors 카드 Cancel 클릭 시 카드 draft와 form만 profile 기준으로 복원
function handleMajorsCancel(state) {
  syncMajorsDraft(state);
  renderMajorsCard(state);
  renderPendingState(state);
}

// Majors 카드 Save 클릭 시 draft와 profile 차이를 서버에 일괄 반영
async function handleMajorsSave(state) {
  if (state.pending.isMajorsSaving) return;

  const mutationPlan = buildMajorMutationPlan(state);
  if (mutationPlan.addedMajors.length === 0 && mutationPlan.removedMajors.length === 0) {
    window.alert(MAJORS_EMPTY_ALERT_MESSAGE);
    return;
  }

  state.pending.isMajorsSaving = true;
  renderPendingState(state);

  let hasMutation = false;

  try {
    for (const removedMajor of mutationPlan.removedMajors) {
      await deleteMajor(removedMajor.userMajorId);
      hasMutation = true;
    }

    for (const addedMajor of mutationPlan.addedMajors) {
      await addMajor({
        majorId: addedMajor.id,
        majorType: addedMajor.majorType,
      });
      hasMutation = true;
    }

    await loadProfile(state);
    renderProfileState(state);
  } catch (error) {
    if (hasMutation) {
      try {
        await loadProfile(state);
        renderProfileState(state);
      } catch {
        // 부분 반영 상황에서는 다음 진입 시 서버 기준으로 복구
      }
    }

    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    state.pending.isMajorsSaving = false;
    renderPendingState(state);
  }
}

// 프로필 페이지에서 사용하는 사용자 인터랙션 이벤트를 등록
function bindProfilePageEvents(state) {
  const { elements } = state;

  // 학부 선택이 바뀌면 alert 후 Base Settings draft 값만 갱신
  elements.departmentSelect?.addEventListener("change", (event) => {
    handleDepartmentChange(event, state);
  });

  // 템플릿 셀렉트 변경값을 Base Settings draft에 반영
  elements.templateSelect?.addEventListener("change", (event) => {
    state.draft.baseSettings.templateId = event.currentTarget?.value ?? "";
  });

  // Base Settings 카드 Cancel 클릭 시 카드 draft만 profile 기준으로 복원
  elements.baseSettingsCancelButton?.addEventListener("click", () => {
    handleBaseSettingsCancel(state);
  });

  // Base Settings 카드 Save 클릭 시 학부와 템플릿을 순차 저장
  elements.baseSettingsSaveButton?.addEventListener("click", async () => {
    await handleBaseSettingsSave(state);
  });

  // 전공 후보 셀렉트 변경값을 Major draft form에 반영
  elements.majorDepartmentSelect?.addEventListener("change", (event) => {
    state.draft.majorForm.departmentId = event.currentTarget?.value ?? "";
    state.draft.majorForm.majorId = "";
    renderMajorsCard(state);
    renderPendingState(state);
  });

  elements.majorSelect?.addEventListener("change", (event) => {
    state.draft.majorForm.majorId = event.currentTarget?.value ?? "";
  });

  // 전공 타입 셀렉트 변경값을 Major draft form에 반영
  elements.majorTypeSelect?.addEventListener("change", (event) => {
    state.draft.majorForm.majorType = event.currentTarget?.value ?? DEFAULT_MAJOR_TYPE;
  });

  // Add Major 클릭 시 서버 저장 없이 Majors draft 목록에만 추가
  elements.majorAddButton?.addEventListener("click", () => {
    handleMajorAdd(state);
  });

  // 삭제 버튼 클릭은 이벤트 위임으로 처리해 Majors draft 목록에서만 제거
  elements.majorList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const deleteButton = target.closest("[data-major-delete]");
    if (!(deleteButton instanceof HTMLButtonElement)) return;

    const draftId = deleteButton.getAttribute("data-major-draft-id") || "";
    handleMajorDelete(draftId, state);
  });

  // Majors 카드 Cancel 클릭 시 카드 draft와 form만 profile 기준으로 복원
  elements.majorCancelButton?.addEventListener("click", () => {
    handleMajorsCancel(state);
  });

  // Majors 카드 Save 클릭 시 draft와 profile 차이를 서버에 일괄 반영
  elements.majorSaveButton?.addEventListener("click", async () => {
    await handleMajorsSave(state);
  });
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

  state.elements = {
    profileName: qs("[data-profile-name]", pageRoot),
    profileEmail: qs("[data-profile-email]", pageRoot),
    departmentSelect: qs("[data-department-select]", pageRoot),
    templateSelect: qs("[data-template-select]", pageRoot),
    baseSettingsCancelButton: qs("[data-base-settings-cancel]", pageRoot),
    baseSettingsSaveButton: qs("[data-base-settings-save]", pageRoot),
    majorDepartmentSelect: qs("[data-major-department-select]", pageRoot),
    majorSelect: qs("[data-major-select]", pageRoot),
    majorTypeSelect: qs("[data-major-type-select]", pageRoot),
    majorAddButton: qs("[data-major-add]", pageRoot),
    majorList: qs("[data-major-list]", pageRoot),
    majorEmpty: qs("[data-major-empty]", pageRoot),
    majorCancelButton: qs("[data-major-cancel]", pageRoot),
    majorSaveButton: qs("[data-major-save]", pageRoot),
  };

  bindProfilePageEvents(state);

  try {
    await loadProfilePageData(state);
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

initProfilePage();
