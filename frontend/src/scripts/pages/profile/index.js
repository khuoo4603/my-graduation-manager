import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/profile.css";

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";

const DEPARTMENT_CHANGE_ALERT_MESSAGE =
  "학과를 변경하면 졸업 예정 결과가 달라질 수 있으므로 템플릿과 전공 설정을 다시 확인해야 합니다.";
const MAJOR_REQUIRED_ALERT_MESSAGE = "전공을 선택해 주세요.";
const DEFAULT_MAJOR_TYPE = "복수전공";

const TEMP_CATALOGS = {
  departments: [{ id: "104", name: "IT융합자율학부" }],
  templates: [{ id: "2023104", name: "IT융합자율학부 23학번 이후" }],
  majors: [
    { id: "1041", name: "소프트웨어공학전공" },
    { id: "1042", name: "컴퓨터공학전공" },
  ],
};

const TEMP_MAJOR_ITEMS = [
  { userMajorId: "101", majorId: "1011", majorType: "주전공", majorName: "소프트웨어공학전공" },
  { userMajorId: "102", majorId: "1021", majorType: "부전공", majorName: "컴퓨터공학전공" },
];

const MAJOR_TYPE_OPTIONS = [
  { value: "심화전공", label: "심화전공" },
  { value: "주전공", label: "주전공" },
  { value: "부전공", label: "부전공" },
  { value: "복수전공", label: "복수전공" },
];

// HTML 삽입용 텍스트 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 프로필 페이지 초기 state 생성
function createInitialProfileState(profile) {
  return {
    profile: {
      name: profile?.name || "해당 없음",
      email: profile?.email || "해당 없음",
    },
    catalogs: {
      departments: TEMP_CATALOGS.departments.map((item) => ({ ...item })),
      templates: TEMP_CATALOGS.templates.map((item) => ({ ...item })),
      majors: TEMP_CATALOGS.majors.map((item) => ({ ...item })),
    },
    majors: TEMP_MAJOR_ITEMS.map((item) => ({ ...item })),
    draft: {
      departmentId: "",
      templateId: "",
      majorId: "",
      majorType: DEFAULT_MAJOR_TYPE,
    },
  };
}

// 전공 목록 항목 HTML 조립
function buildMajorItemHtml(item) {
  return `
    <li class="profile-major-item" data-major-item data-user-major-id="${escapeHtml(item.userMajorId)}">
      <span class="profile-major-item__icon" aria-hidden="true">
        <img src="${getFluentIconPath("person")}" alt="" />
      </span>
      <span class="profile-major-chip profile-major-chip--name">${escapeHtml(item.majorName)}</span>
      <span class="profile-major-chip profile-major-chip--type">${escapeHtml(item.majorType)}</span>
      <button
        class="btn btn--ghost btn--icon profile-major-item__remove"
        type="button"
        aria-label="Remove major"
        data-major-delete
        data-user-major-id="${escapeHtml(item.userMajorId)}"
      >
        <img src="${getFluentIconPath("delete")}" alt="" />
      </button>
    </li>
  `;
}

// select option HTML 조립
function buildSelectOptionsHtml(options, selectedValue, config = {}) {
  const { valueKey = "value", labelKey = "label" } = config;

  return options
    .map((option) => {
      const optionValue = option?.[valueKey] ?? "";
      const optionLabel = option?.[labelKey] ?? "";
      const isSelected = String(optionValue) === String(selectedValue ?? "") ? " selected" : "";
      return `<option value="${escapeHtml(optionValue)}"${isSelected}>${escapeHtml(optionLabel)}</option>`;
    })
    .join("");
}

// 프로필 페이지 전체 레이아웃 렌더링
function renderProfilePage(pageRoot, state) {
  pageRoot.innerHTML = `
    <section class="profile-page" data-profile-page>
      <header class="profile-page__header">
        <h1 class="profile-page__title">Profile</h1>
        <p class="profile-page__subtitle">졸업 예정에 필요한 기본 설정과 전공 정보를 관리합니다.</p>
      </header>

      <section class="card profile-card" data-profile-summary>
        <div class="profile-card__header">
          <h2 class="profile-card__title">User Information</h2>
        </div>
        <div class="profile-field-stack">
          <div class="field">
            <span class="field__label">Name</span>
            <div class="profile-value" data-profile-name>${escapeHtml(state.profile.name)}</div>
          </div>
          <div class="field">
            <span class="field__label">Email</span>
            <div class="profile-value" data-profile-email>${escapeHtml(state.profile.email)}</div>
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
              <option value="">학과를 선택해 주세요.</option>
              ${buildSelectOptionsHtml(state.catalogs.departments, state.draft.departmentId, {
                valueKey: "id",
                labelKey: "name",
              })}
            </select>
          </label>
          <label class="field">
            <span class="field__label">Graduation Template</span>
            <select class="select" data-template-select>
              <option value="">템플릿을 선택해 주세요.</option>
              ${buildSelectOptionsHtml(state.catalogs.templates, state.draft.templateId, {
                valueKey: "id",
                labelKey: "name",
              })}
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
            <span class="field__label">Major</span>
            <select class="select" data-major-select>
              <option value="">전공을 선택해 주세요.</option>
              ${buildSelectOptionsHtml(state.catalogs.majors, state.draft.majorId, {
                valueKey: "id",
                labelKey: "name",
              })}
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
        <ul class="profile-major-list" data-major-list>
          ${state.majors.map(buildMajorItemHtml).join("")}
        </ul>
      </section>

      <footer class="profile-page__footer">
        <button class="btn btn--secondary" type="button" data-profile-cancel>Cancel</button>
        <button class="btn btn--primary" type="button" data-profile-save-all>Save Changes</button>
      </footer>
    </section>
  `;
}

// 프로필 페이지 DOM 요소 수집
function collectProfileElements(pageRoot) {
  return {
    departmentSelect: qs("[data-department-select]", pageRoot),
    templateSelect: qs("[data-template-select]", pageRoot),
    majorSelect: qs("[data-major-select]", pageRoot),
    majorTypeSelect: qs("[data-major-type-select]", pageRoot),
    majorAddButton: qs("[data-major-add]", pageRoot),
    majorList: qs("[data-major-list]", pageRoot),
    majorEmpty: qs("[data-major-empty]", pageRoot),
  };
}

// 전공 목록 및 빈 상태 렌더링
function renderMajorList(elements, state) {
  if (!elements.majorList || !elements.majorEmpty) return;

  elements.majorList.innerHTML = state.majors.map(buildMajorItemHtml).join("");
  elements.majorEmpty.hidden = state.majors.length > 0;
}

// 다음 userMajorId 계산
function getNextUserMajorId(majorItems) {
  const maxUserMajorId = majorItems.reduce((currentMax, item) => {
    const parsedUserMajorId = Number.parseInt(String(item.userMajorId), 10);
    if (Number.isNaN(parsedUserMajorId)) return currentMax;
    return Math.max(currentMax, parsedUserMajorId);
  }, 0);

  return String(maxUserMajorId + 1);
}

// 학과 변경 처리
function handleDepartmentChange(event, state, elements) {
  const nextDepartmentId = event.currentTarget.value;

  if (nextDepartmentId !== state.draft.departmentId) {
    window.alert(DEPARTMENT_CHANGE_ALERT_MESSAGE);
  }

  state.draft.departmentId = nextDepartmentId;
}

// 전공 항목 추가 처리
function handleMajorAdd(state, elements) {
  if (!state.draft.majorId) {
    window.alert(MAJOR_REQUIRED_ALERT_MESSAGE);
    elements.majorSelect?.focus();
    return;
  }

  const selectedMajor = state.catalogs.majors.find((major) => major.id === state.draft.majorId);
  if (!selectedMajor) return;

  state.majors.push({
    userMajorId: getNextUserMajorId(state.majors),
    majorId: selectedMajor.id,
    majorType: state.draft.majorType,
    majorName: selectedMajor.name,
  });

  state.draft.majorId = "";
  if (elements.majorSelect) {
    elements.majorSelect.value = "";
  }

  renderMajorList(elements, state);
}

// 전공 항목 삭제 처리
function handleMajorDelete(event, state, elements) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const deleteButton = target.closest("[data-major-delete]");
  if (!deleteButton) return;

  const userMajorId = deleteButton.getAttribute("data-user-major-id");
  if (!userMajorId) return;

  state.majors = state.majors.filter((major) => String(major.userMajorId) !== userMajorId);
  renderMajorList(elements, state);
}

// 프로필 페이지 이벤트 등록
function bindProfilePageEvents(elements, state) {
  elements.departmentSelect?.addEventListener("change", (event) => {
    handleDepartmentChange(event, state, elements);
  });

  elements.templateSelect?.addEventListener("change", (event) => {
    state.draft.templateId = event.currentTarget.value;
  });

  elements.majorSelect?.addEventListener("change", (event) => {
    state.draft.majorId = event.currentTarget.value;
  });

  elements.majorTypeSelect?.addEventListener("change", (event) => {
    state.draft.majorType = event.currentTarget.value;
  });

  elements.majorAddButton?.addEventListener("click", () => {
    handleMajorAdd(state, elements);
  });

  elements.majorList?.addEventListener("click", (event) => {
    handleMajorDelete(event, state, elements);
  });
}

// 프로필 페이지 초기 진입 처리
export async function initProfilePage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.PROFILE,
    userName: authResult.profile?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const state = createInitialProfileState(authResult.profile);
  renderProfilePage(pageRoot, state);

  const elements = collectProfileElements(pageRoot);
  renderMajorList(elements, state);
  bindProfilePageEvents(elements, state);
}

initProfilePage();
