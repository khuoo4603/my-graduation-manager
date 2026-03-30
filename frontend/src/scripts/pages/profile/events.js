import { addMajor, deleteMajor, updateDepartment, updateTemplate } from "/src/scripts/api/profile.js";
import { UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";

import { renderBaseSettings, renderMajorForm, renderMajorList, renderPendingState, renderProfilePage } from "./render.js";

const DEPARTMENT_CHANGE_ALERT_MESSAGE =
  "학부를 변경하면 졸업 예정 결과가 달라질 수 있으므로 템플릿과 전공 설정을 다시 확인해야 합니다.";
const DEPARTMENT_REQUIRED_ALERT_MESSAGE = "학부를 선택해 주세요.";
const TEMPLATE_REQUIRED_ALERT_MESSAGE = "템플릿을 선택해 주세요.";
const TEMPLATE_INVALID_ALERT_MESSAGE = "선택한 템플릿을 다시 확인해 주세요.";
const BASE_SETTINGS_EMPTY_ALERT_MESSAGE = "저장할 기본 설정 변경 사항이 없습니다.";
const MAJOR_REQUIRED_ALERT_MESSAGE = "전공을 선택해 주세요.";
const MAJOR_INVALID_ALERT_MESSAGE = "선택한 전공을 다시 확인해 주세요.";
const MAJOR_DUPLICATE_ALERT_MESSAGE = "같은 전공은 중복으로 추가할 수 없습니다.";
const MAJORS_EMPTY_ALERT_MESSAGE = "저장할 전공 변경 사항이 없습니다.";

// Profile 페이지 이벤트 바인딩
export function bindProfileEvents(page) {
  // 기본 설정 카드의 학부 선택 change 이벤트
  page.elements.departmentSelect?.addEventListener("change", (event) => {
    handleDepartmentChange(event, page);
  });

  // 기본 설정 카드의 템플릿 선택 change 이벤트
  page.elements.templateSelect?.addEventListener("change", (event) => {
    const target = event.currentTarget;
    page.draft.templateId = target instanceof HTMLSelectElement ? target.value : "";
  });

  // 기본 설정 카드의 Cancel 버튼 click 이벤트
  page.elements.baseSettingsCancelButton?.addEventListener("click", () => {
    handleBaseSettingsCancel(page);
  });

  // 기본 설정 카드의 Save 버튼 click 이벤트
  page.elements.baseSettingsSaveButton?.addEventListener("click", async () => {
    await handleBaseSettingsSave(page);
  });

  // 전공 추가 폼의 학부 필터 change 이벤트
  page.elements.majorDepartmentSelect?.addEventListener("change", (event) => {
    handleMajorDepartmentChange(event, page);
  });

  // 전공 추가 폼의 전공 선택 change 이벤트
  page.elements.majorSelect?.addEventListener("change", (event) => {
    const target = event.currentTarget;
    page.draft.majorFormMajorId = target instanceof HTMLSelectElement ? target.value : "";
  });

  // 전공 추가 폼의 major type 선택 change 이벤트
  page.elements.majorTypeSelect?.addEventListener("change", (event) => {
    const target = event.currentTarget;
    page.draft.majorFormMajorType = target instanceof HTMLSelectElement ? target.value : page.defaultMajorType;
  });

  // 전공 추가 폼의 Add Major 버튼 click 이벤트
  page.elements.majorAddButton?.addEventListener("click", () => {
    handleMajorAdd(page);
  });

  // 전공 목록의 삭제 버튼 click 이벤트 위임
  page.elements.majorList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const deleteButton = target.closest("[data-major-delete]");
    if (!(deleteButton instanceof HTMLButtonElement)) return;

    handleMajorDelete(deleteButton.dataset.majorDraftId || "", page);
  });

  // 전공 관리 카드의 Cancel 버튼 click 이벤트
  page.elements.majorCancelButton?.addEventListener("click", () => {
    handleMajorsCancel(page);
  });

  // 전공 관리 카드의 Save 버튼 click 이벤트
  page.elements.majorSaveButton?.addEventListener("click", async () => {
    await handleMajorsSave(page);
  });
}

// 기본 설정의 학부 변경 처리
function handleDepartmentChange(event, page) {
  const target = event.currentTarget;
  const nextDepartmentId = target instanceof HTMLSelectElement ? target.value : "";

  if (nextDepartmentId === page.draft.departmentId) return;

  window.alert(DEPARTMENT_CHANGE_ALERT_MESSAGE);
  page.draft.departmentId = nextDepartmentId;
}

// 기본 설정 draft 복원
function handleBaseSettingsCancel(page) {
  page.draft.departmentId = page.profile.department?.id || "";
  page.draft.templateId = page.profile.template?.id || "";
  renderBaseSettings(page);
  renderPendingState(page);
}

// 기본 설정 저장 직전 검증
function validateBaseSettings(page) {
  const currentDepartmentId = page.profile.department?.id || "";
  const currentTemplateId = page.profile.template?.id || "";
  const departmentChanged = page.draft.departmentId !== currentDepartmentId;
  const templateChanged = page.draft.templateId !== currentTemplateId;

  if (!departmentChanged && !templateChanged) {
    window.alert(BASE_SETTINGS_EMPTY_ALERT_MESSAGE);
    return null;
  }

  if (departmentChanged && !page.draft.departmentId) {
    window.alert(DEPARTMENT_REQUIRED_ALERT_MESSAGE);
    page.elements.departmentSelect?.focus();
    return null;
  }

  if (templateChanged && !page.draft.templateId) {
    window.alert(TEMPLATE_REQUIRED_ALERT_MESSAGE);
    page.elements.templateSelect?.focus();
    return null;
  }

  if (page.draft.templateId && !page.catalogs.templates.some((template) => template.id === page.draft.templateId)) {
    window.alert(TEMPLATE_INVALID_ALERT_MESSAGE);
    page.elements.templateSelect?.focus();
    return null;
  }

  return { departmentChanged, templateChanged };
}

// 기본 설정 저장 처리
async function handleBaseSettingsSave(page) {
  if (page.pending.isBaseSaving) return;

  const validation = validateBaseSettings(page);
  if (!validation) return;

  page.pending.isBaseSaving = true;
  renderPendingState(page);

  let hasMutation = false;

  try {
    if (validation.departmentChanged) {
      await updateDepartment(page.draft.departmentId);
      hasMutation = true;
    }

    if (validation.templateChanged) {
      await updateTemplate(page.draft.templateId);
      hasMutation = true;
    }

    await page.loadProfile();
    renderProfilePage(page);
  } catch (error) {
    if (hasMutation) {
      try {
        await page.loadProfile();
        renderProfilePage(page);
      } catch {
        // 부분 반영 후 서버 기준 복구 시도
      }
    }

    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    page.pending.isBaseSaving = false;
    renderPendingState(page);
  }
}

// 전공 추가 폼의 학부 변경 처리
function handleMajorDepartmentChange(event, page) {
  const target = event.currentTarget;
  page.draft.majorFormDepartmentId = target instanceof HTMLSelectElement ? target.value : "";
  page.draft.majorFormMajorId = "";
  renderMajorForm(page);
  renderPendingState(page);
}

// 전공 추가 직전 검증
function validateMajorAdd(page) {
  if (!page.draft.majorFormMajorId) {
    window.alert(MAJOR_REQUIRED_ALERT_MESSAGE);
    page.elements.majorSelect?.focus();
    return null;
  }

  const selectedMajor = page.catalogs.majors.find(
    (major) =>
      major.departmentId === page.draft.majorFormDepartmentId && major.id === page.draft.majorFormMajorId,
  );

  if (!selectedMajor) {
    window.alert(MAJOR_INVALID_ALERT_MESSAGE);
    page.elements.majorSelect?.focus();
    return null;
  }

  if (page.draft.majors.some((major) => major.id === page.draft.majorFormMajorId)) {
    window.alert(MAJOR_DUPLICATE_ALERT_MESSAGE);
    page.elements.majorSelect?.focus();
    return null;
  }

  return selectedMajor;
}

// 전공 draft 추가
function handleMajorAdd(page) {
  if (page.pending.isMajorsSaving) return;

  const selectedMajor = validateMajorAdd(page);
  if (!selectedMajor) return;

  page.majorDraftSequence += 1;
  page.draft.majors.push({
    draftId: `draft-${page.majorDraftSequence}`,
    userMajorId: "",
    id: selectedMajor.id,
    name: selectedMajor.name,
    majorType: page.draft.majorFormMajorType || page.defaultMajorType,
  });

  page.draft.majorFormMajorId = "";
  page.draft.majorFormMajorType = page.defaultMajorType;
  renderMajorForm(page);
  renderMajorList(page);
  renderPendingState(page);
}

// 전공 draft 삭제
function handleMajorDelete(draftId, page) {
  if (page.pending.isMajorsSaving) return;

  page.draft.majors = page.draft.majors.filter((major) => major.draftId !== draftId);
  renderMajorList(page);
  renderPendingState(page);
}

// 전공 draft 복원
function handleMajorsCancel(page) {
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
  renderMajorForm(page);
  renderMajorList(page);
  renderPendingState(page);
}

// 서버 반영 대상 계산
function buildMajorMutationPlan(page) {
  const addedMajors = page.draft.majors.filter((draftMajor) => {
    return !page.profile.majors.some((profileMajor) => {
      return profileMajor.id === draftMajor.id && profileMajor.majorType === draftMajor.majorType;
    });
  });

  const removedMajors = page.profile.majors.filter((profileMajor) => {
    return !page.draft.majors.some((draftMajor) => {
      return draftMajor.id === profileMajor.id && draftMajor.majorType === profileMajor.majorType;
    });
  });

  return { addedMajors, removedMajors };
}

// 전공 저장 처리
async function handleMajorsSave(page) {
  if (page.pending.isMajorsSaving) return;

  const mutationPlan = buildMajorMutationPlan(page);
  if (mutationPlan.addedMajors.length === 0 && mutationPlan.removedMajors.length === 0) {
    window.alert(MAJORS_EMPTY_ALERT_MESSAGE);
    return;
  }

  page.pending.isMajorsSaving = true;
  renderPendingState(page);

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

    await page.loadProfile();
    renderProfilePage(page);
  } catch (error) {
    if (hasMutation) {
      try {
        await page.loadProfile();
        renderProfilePage(page);
      } catch {
        // 부분 반영 후 서버 기준 복구 시도
      }
    }

    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    page.pending.isMajorsSaving = false;
    renderPendingState(page);
  }
}
