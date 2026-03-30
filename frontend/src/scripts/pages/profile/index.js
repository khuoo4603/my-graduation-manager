import { getProfile } from "/src/scripts/api/profile.js";
import { getDepartments, getMajors, getTemplates } from "/src/scripts/api/reference.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";
import { PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";

import { bindProfileEvents } from "./events.js";
import { renderProfilePage } from "./render.js";

const DEFAULT_MAJOR_TYPE = "복수전공";

// Profile 페이지 DOM 수집
function collectProfileElements(pageRoot) {
  return {
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
}

// Profile 페이지 기본 객체 생성
function createProfilePage(elements, authResult) {
  return {
    elements,
    profile: {
      user: {
        id: "",
        name: authResult.profile?.user?.name || "해당 없음",
        email: authResult.profile?.user?.email || "해당 없음",
      },
      department: null,
      template: null,
      majors: [],
    },
    catalogs: {
      departments: [],
      templates: [],
      majors: [],
    },
    draft: {
      departmentId: "",
      templateId: "",
      majors: [],
      majorFormDepartmentId: "",
      majorFormMajorId: "",
      majorFormMajorType: DEFAULT_MAJOR_TYPE,
    },
    pending: {
      isBaseSaving: false,
      isMajorsSaving: false,
    },
    defaultMajorType: DEFAULT_MAJOR_TYPE,
    majorDraftSequence: 0,
    render: null,
    loadProfile: null,
    loadCatalogs: null,
  };
}

// 기본 설정 draft를 서버 기준으로 복원
function syncBaseDraft(page) {
  page.draft.departmentId = page.profile.department?.id || "";
  page.draft.templateId = page.profile.template?.id || "";
}

// 전공 draft를 서버 기준으로 복원
function syncMajorDraft(page) {
  page.draft.majors = page.profile.majors.map((major) => ({
    draftId: `saved-${major.userMajorId}`,
    userMajorId: major.userMajorId,
    id: major.id,
    name: major.name,
    majorType: major.majorType,
  }));
  page.draft.majorFormDepartmentId = "";
  page.draft.majorFormMajorId = "";
  page.draft.majorFormMajorType = page.defaultMajorType;
}

// 프로필 응답을 화면 상태에 반영
function applyProfileResponse(page, response) {
  const user = response?.user ?? {};
  const department = response?.department ?? null;
  const template = response?.template ?? null;
  const majors = Array.isArray(response?.majors) ? response.majors : [];

  page.profile = {
    user: {
      id: user.id == null ? "" : String(user.id),
      name: user.name || "해당 없음",
      email: user.email || "해당 없음",
    },
    department:
      department && department.id != null
        ? {
            id: String(department.id),
            name: department.name || "",
          }
        : null,
    template:
      template && template.id != null
        ? {
            id: String(template.id),
            name: template.name || "",
            applicableYear: template.applicableYear ?? template.year ?? "",
          }
        : null,
    majors: majors
      .map((major) => {
        const majorId = major?.id ?? major?.majorId;
        if (majorId == null) return null;

        return {
          userMajorId: major.userMajorId == null ? "" : String(major.userMajorId),
          id: String(majorId),
          name: major.name || major.majorName || "",
          majorType: major.majorType || "",
        };
      })
      .filter(Boolean),
  };

  syncBaseDraft(page);
  syncMajorDraft(page);
}

// 참조 데이터 로드
async function loadCatalogs(page) {
  const [departmentsResponse, templatesResponse, majorsResponse] = await Promise.all([
    getDepartments(),
    getTemplates(),
    getMajors(),
  ]);

  page.catalogs.departments = Array.isArray(departmentsResponse?.departments)
    ? departmentsResponse.departments
        .map((department) => {
          if (!department || department.id == null) return null;
          return {
            id: String(department.id),
            name: department.name || "",
          };
        })
        .filter(Boolean)
    : [];

  page.catalogs.templates = Array.isArray(templatesResponse?.templates)
    ? templatesResponse.templates
        .map((template) => {
          if (!template || template.id == null) return null;
          return {
            id: String(template.id),
            name: template.name || "",
            applicableYear: template.applicableYear ?? template.year ?? "",
          };
        })
        .filter(Boolean)
    : [];

  page.catalogs.majors = Array.isArray(majorsResponse?.majors)
    ? majorsResponse.majors
        .map((major) => {
          if (!major || major.id == null) return null;
          return {
            id: String(major.id),
            name: major.name || "",
            departmentId: major.departmentId == null ? "" : String(major.departmentId),
          };
        })
        .filter(Boolean)
    : [];
}

// 프로필 데이터 재조회
async function loadProfile(page, initialProfile = null) {
  const response = initialProfile || (await getProfile());
  applyProfileResponse(page, response);
}

// Profile 페이지 초기 데이터 로드
async function loadInitialProfilePageData(page, authResult) {
  await Promise.all([page.loadCatalogs(), page.loadProfile(authResult.profile || null)]);
}

// Profile 페이지 초기화
export async function initProfilePage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.PROFILE,
    userName: authResult.profile?.user?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const page = createProfilePage(collectProfileElements(pageRoot), authResult);

  page.render = () => {
    renderProfilePage(page);
  };

  page.loadCatalogs = async () => {
    await loadCatalogs(page);
  };

  page.loadProfile = async (initialProfile = null) => {
    await loadProfile(page, initialProfile);
  };

  page.render();
  bindProfileEvents(page);

  try {
    await loadInitialProfilePageData(page, authResult);
    page.render();
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  }
}

initProfilePage();
