import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/profile.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { getFluentIconPath } from "/src/scripts/components/icon-map.js";

const DEPARTMENT_CHANGE_ALERT_MESSAGE =
  "학부 변경 시 졸업판정 결과가 달라질 수 있으니 템플릿과 전공 설정도 다시 확인해야 합니다.";
const MAJOR_REQUIRED_ALERT_MESSAGE = "전공을 선택하세요.";

const MOCK_MAJOR_ITEMS = [
  { userMajorId: "101", majorType: "주전공", majorName: "Computer Science" },
  { userMajorId: "102", majorType: "복수전공", majorName: "Business Administration" },
];

// 텍스트 주입 전 HTML 이스케이프 처리
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 사용자 기본 정보 placeholder 정규화
function resolveSummaryValues(profile) {
  return {
    name: profile?.name || "정보 없음",
    email: profile?.email || "정보 없음",
  };
}

// 페이지 상단 소개 블록 HTML
function createPageHeaderHtml() {
  return `
    <header class="profile-page__header">
      <h1 class="profile-page__title">Profile</h1>
      <p class="profile-page__subtitle">졸업 판정에 필요한 기본 설정을 관리합니다.</p>
    </header>
  `;
}

// 사용자 정보 섹션 HTML
function createSummarySectionHtml(summary) {
  return `
    <section class="card profile-card" data-profile-summary>
      <div class="profile-card__header">
        <h2 class="profile-card__title">User Information</h2>
      </div>
      <div class="profile-field-stack">
        <div class="field">
          <span class="field__label">Name</span>
          <div class="profile-value" data-profile-name>${escapeHtml(summary.name)}</div>
        </div>
        <div class="field">
          <span class="field__label">Email</span>
          <div class="profile-value" data-profile-email>${escapeHtml(summary.email)}</div>
        </div>
      </div>
    </section>
  `;
}

// 학부/템플릿 설정 섹션 HTML
function createBaseSettingsSectionHtml() {
  return `
    <section class="card profile-card" data-base-settings>
      <div class="profile-card__header">
        <h2 class="profile-card__title">Department &amp; Template</h2>
      </div>
      <div class="profile-field-stack">
        <label class="field">
          <span class="field__label">Department</span>
          <select class="select" data-department-select>
            <option value="">학부를 선택하세요</option>
            <option value="it-convergence">IT Convergence Department</option>
          </select>
        </label>
        <label class="field">
          <span class="field__label">Graduation Template</span>
          <select class="select" data-template-select>
            <option value="">템플릿을 선택하세요</option>
            <option value="2020">2020 Curriculum</option>
          </select>
        </label>
      </div>
      <div class="profile-message-stack">
        <p class="profile-message profile-message--info" data-base-settings-message hidden></p>
        <p class="profile-message profile-message--success" data-base-settings-success hidden></p>
        <p class="profile-message profile-message--error" data-base-settings-error hidden></p>
      </div>
      <div class="profile-card__actions">
        <button class="btn btn--primary" type="button" data-base-settings-save>기본 설정 저장</button>
      </div>
    </section>
  `;
}

// 전공 목록 행 HTML
function createMajorItemHtml(item) {
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

// 전공 관리 섹션 HTML
function createMajorsSectionHtml() {
  return `
    <section class="card profile-card" data-major-management>
      <div class="profile-card__header">
        <h2 class="profile-card__title">Majors</h2>
      </div>

      <div class="profile-major-builder">
        <label class="field">
          <span class="field__label">Major</span>
          <select class="select" data-major-select>
            <option value="">전공을 선택하세요</option>
            <option value="cs">Computer Science</option>
            <option value="business">Business Administration</option>
          </select>
        </label>
        <label class="field">
          <span class="field__label">Major Type</span>
          <select class="select" data-major-type-select>
            <option value="심화전공">심화전공</option>
            <option value="주전공">주전공</option>
            <option value="부전공">부전공</option>
            <option value="복수전공">복수전공</option>
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
        ${MOCK_MAJOR_ITEMS.map(createMajorItemHtml).join("")}
      </ul>
    </section>
  `;
}

// 페이지 하단 액션 영역 HTML
function createFooterActionsHtml() {
  return `
    <footer class="profile-page__footer">
      <button class="btn btn--secondary" type="button" data-profile-cancel>Cancel</button>
      <button class="btn btn--primary" type="button" data-profile-save-all>Save Changes</button>
    </footer>
  `;
}

// 프로필 페이지 스켈레톤 HTML
function createProfilePageHtml(summary) {
  return `
    <section class="profile-page" data-profile-page>
      ${createPageHeaderHtml()}
      ${createSummarySectionHtml(summary)}
      ${createBaseSettingsSectionHtml()}
      ${createMajorsSectionHtml()}
      ${createFooterActionsHtml()}
    </section>
  `;
}

// 추후 API 바인딩용 슬롯 조회
function collectProfileSlots(pageRoot) {
  return {
    summaryRoot: qs("[data-profile-summary]", pageRoot),
    departmentSelect: qs("[data-department-select]", pageRoot),
    templateSelect: qs("[data-template-select]", pageRoot),
    baseSaveButton: qs("[data-base-settings-save]", pageRoot),
    baseMessage: qs("[data-base-settings-message]", pageRoot),
    majorSelect: qs("[data-major-select]", pageRoot),
    majorTypeSelect: qs("[data-major-type-select]", pageRoot),
    majorAddButton: qs("[data-major-add]", pageRoot),
    majorList: qs("[data-major-list]", pageRoot),
    majorEmpty: qs("[data-major-empty]", pageRoot),
  };
}

// 학부 변경 경고 알럿 바인딩
function bindDepartmentChangeAlert(slots) {
  const departmentSelect = slots.departmentSelect;
  if (!departmentSelect) return;

  let previousValue = departmentSelect.value;
  departmentSelect.addEventListener("change", () => {
    const nextValue = departmentSelect.value;
    if (nextValue !== previousValue) {
      window.alert(DEPARTMENT_CHANGE_ALERT_MESSAGE);
    }
    previousValue = nextValue;
  });
}

// 전공 목록 렌더링 처리
function renderMajorList(slots, majorItems) {
  if (!slots.majorList || !slots.majorEmpty) return;

  if (majorItems.length === 0) {
    slots.majorList.innerHTML = "";
    slots.majorEmpty.hidden = false;
    return;
  }

  slots.majorList.innerHTML = majorItems.map(createMajorItemHtml).join("");
  slots.majorEmpty.hidden = true;
}

// 전공 항목 ID 생성기
function createMajorIdGenerator(items) {
  const maxId = items.reduce((acc, item) => {
    const parsed = Number.parseInt(String(item.userMajorId), 10);
    if (Number.isNaN(parsed)) return acc;
    return Math.max(acc, parsed);
  }, 0);

  let current = maxId;
  return function nextId() {
    current += 1;
    return String(current);
  };
}

// 전공 추가/삭제 이벤트 바인딩
function bindMajorActions(slots) {
  if (!slots.majorAddButton || !slots.majorList || !slots.majorSelect || !slots.majorTypeSelect) return;

  const majorItems = MOCK_MAJOR_ITEMS.map((item) => ({ ...item }));
  const nextMajorId = createMajorIdGenerator(majorItems);

  renderMajorList(slots, majorItems);

  slots.majorAddButton.addEventListener("click", () => {
    const selectedMajorOption = slots.majorSelect.options[slots.majorSelect.selectedIndex];
    const majorValue = slots.majorSelect.value;
    const majorName = selectedMajorOption?.textContent?.trim() || "";
    const majorType = slots.majorTypeSelect.value;

    if (!majorValue) {
      window.alert(MAJOR_REQUIRED_ALERT_MESSAGE);
      slots.majorSelect.focus();
      return;
    }

    majorItems.push({
      userMajorId: nextMajorId(),
      majorType,
      majorName,
    });

    slots.majorSelect.value = "";
    renderMajorList(slots, majorItems);
  });

  slots.majorList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const deleteButton = target.closest("[data-major-delete]");
    if (!deleteButton) return;

    const userMajorId = deleteButton.getAttribute("data-user-major-id");
    if (!userMajorId) return;

    const deleteIndex = majorItems.findIndex((item) => String(item.userMajorId) === userMajorId);
    if (deleteIndex < 0) return;

    majorItems.splice(deleteIndex, 1);
    renderMajorList(slots, majorItems);
  });
}

// Profile 페이지 초기화
export async function initProfilePage() {
  // 보호 페이지 인증 확인
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.PROFILE,
    userName: authResult.profile?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const summary = resolveSummaryValues(authResult.profile);
  clearChildren(pageRoot);
  pageRoot.innerHTML = createProfilePageHtml(summary);

  const slots = collectProfileSlots(pageRoot);
  bindDepartmentChangeAlert(slots);
  bindMajorActions(slots);
}

initProfilePage();
