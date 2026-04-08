import { deleteAccount } from "/src/scripts/api/auth.js";
import { addMajor, deleteMajor, updateDepartment, updateName, updateTemplate } from "/src/scripts/api/profile.js";
import { PAGE_PATHS, SESSION_STORAGE_KEYS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";

import {
  renderAccountDeleteModal,
  renderBaseSettings,
  renderBaseSettingsFeedback,
  renderMajorFeedback,
  renderMajorForm,
  renderMajorList,
  renderPendingState,
  renderUserInformation,
  renderUserInformationFeedback,
} from "./render.js";

const MAX_NAME_LENGTH = 50;

const USER_NAME_REQUIRED_ALERT_MESSAGE = "이름을 입력해 주세요.";
const USER_NAME_LENGTH_ALERT_MESSAGE = "이름은 50자 이하로 입력해 주세요.";
const USER_INFO_EMPTY_ALERT_MESSAGE = "저장할 사용자 정보 변경 사항이 없습니다.";
const USER_INFO_SAVED_MESSAGE = "변경사항이 저장되었습니다.";
const DEPARTMENT_CHANGE_ALERT_MESSAGE =
  "학부를 변경하면 졸업 판정 결과가 달라질 수 있으므로 템플릿과 전공 설정을 다시 확인해야 합니다.";
const DEPARTMENT_REQUIRED_ALERT_MESSAGE = "학부를 선택해 주세요.";
const TEMPLATE_REQUIRED_ALERT_MESSAGE = "졸업 템플릿을 선택해 주세요.";
const TEMPLATE_INVALID_ALERT_MESSAGE = "선택한 졸업 템플릿을 다시 확인해 주세요.";
const BASE_SETTINGS_EMPTY_ALERT_MESSAGE = "저장할 기본 설정 변경 사항이 없습니다.";
const BASE_SETTINGS_SAVED_MESSAGE = "저장 완료했습니다.";
const MAJOR_REQUIRED_ALERT_MESSAGE = "전공을 선택해 주세요.";
const MAJOR_INVALID_ALERT_MESSAGE = "선택한 전공을 다시 확인해 주세요.";
const MAJOR_DUPLICATE_ALERT_MESSAGE = "같은 전공은 중복으로 추가할 수 없습니다.";
const MAJORS_EMPTY_ALERT_MESSAGE = "저장할 전공 변경 사항이 없습니다.";
const MAJOR_DELETE_CONFIRM_MESSAGE = "정말로 삭제하시겠습니까?";
const MAJOR_DELETED_MESSAGE = "삭제 완료했습니다.";
const MAJORS_SAVED_MESSAGE = "저장 완료했습니다.";

function clearUserNameFeedback(page) {
  if (!page.ui.userNameFeedbackMessage) return;

  page.ui.userNameFeedbackMessage = "";
  renderUserInformationFeedback(page);
}

function clearBaseSettingsFeedback(page) {
  if (!page.ui.baseSettingsFeedbackMessage) return;

  page.ui.baseSettingsFeedbackMessage = "";
  renderBaseSettingsFeedback(page);
}

function clearMajorFeedback(page) {
  if (!page.ui.majorFeedbackMessage) return;

  page.ui.majorFeedbackMessage = "";
  renderMajorFeedback(page);
}

function persistUserNameSavedMessage() {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.PROFILE_NAME_SAVE_SUCCESS, USER_INFO_SAVED_MESSAGE);
  } catch {
    // 세션 스토리지를 쓸 수 없는 환경에서는 새로고침만 진행
  }
}

// Profile 페이지 이벤트 바인딩
export function bindProfileEvents(page) {
  // 이름 입력 필드 input 이벤트
  page.elements.profileNameInput?.addEventListener("input", (event) => {
    const target = event.currentTarget;
    page.draft.userName = target instanceof HTMLInputElement ? target.value : "";
    clearUserNameFeedback(page);
    renderPendingState(page);
  });

  // 이름 취소 버튼 click 이벤트
  page.elements.profileNameCancelButton?.addEventListener("click", () => {
    handleUserInformationCancel(page);
  });

  // 이름 저장 버튼 click 이벤트
  page.elements.profileNameSaveButton?.addEventListener("click", async () => {
    await handleUserInformationSave(page);
  });

  // 학부 선택 select change 이벤트
  page.elements.departmentSelect?.addEventListener("change", (event) => {
    clearBaseSettingsFeedback(page);
    handleDepartmentChange(event, page);
    renderPendingState(page);
  });

  // 템플릿 선택 select change 이벤트
  page.elements.templateSelect?.addEventListener("change", (event) => {
    const target = event.currentTarget;
    page.draft.templateId = target instanceof HTMLSelectElement ? target.value : "";
    clearBaseSettingsFeedback(page);
    renderPendingState(page);
  });

  // 기본 설정 취소 버튼 click 이벤트
  page.elements.baseSettingsCancelButton?.addEventListener("click", () => {
    handleBaseSettingsCancel(page);
  });

  // 기본 설정 저장 버튼 click 이벤트
  page.elements.baseSettingsSaveButton?.addEventListener("click", async () => {
    await handleBaseSettingsSave(page);
  });

  // 전공 추가용 학부 필터 select change 이벤트
  page.elements.majorDepartmentSelect?.addEventListener("change", (event) => {
    clearMajorFeedback(page);
    handleMajorDepartmentChange(event, page);
  });

  // 전공 선택 select change 이벤트
  page.elements.majorSelect?.addEventListener("change", (event) => {
    const target = event.currentTarget;
    page.draft.majorFormMajorId = target instanceof HTMLSelectElement ? target.value : "";
    clearMajorFeedback(page);
  });

  // 전공 구분 select change 이벤트
  page.elements.majorTypeSelect?.addEventListener("change", (event) => {
    const target = event.currentTarget;
    page.draft.majorFormMajorType = target instanceof HTMLSelectElement ? target.value : page.defaultMajorType;
    clearMajorFeedback(page);
  });

  // 전공 추가 버튼 click 이벤트
  page.elements.majorAddButton?.addEventListener("click", () => {
    handleMajorAdd(page);
  });

  // 전공 목록 내부 삭제 버튼 click 이벤트 위임
  page.elements.majorList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // data-major-delete가 달린 삭제 버튼 클릭만 전공 삭제로 처리
    const deleteButton = target.closest("[data-major-delete]");
    if (!(deleteButton instanceof HTMLButtonElement)) return;

    handleMajorDelete(deleteButton.dataset.majorDraftId || "", page);
  });

  // 전공 취소 버튼 click 이벤트
  page.elements.majorCancelButton?.addEventListener("click", () => {
    handleMajorsCancel(page);
  });

  // 전공 저장 버튼 click 이벤트
  page.elements.majorSaveButton?.addEventListener("click", async () => {
    await handleMajorsSave(page);
  });

  // 계정 삭제 카드 버튼 click 이벤트
  page.elements.accountDeleteOpenButton?.addEventListener("click", () => {
    handleAccountDeleteModalOpen(page);
  });

  // 계정 삭제 모달 취소 버튼 click 이벤트
  page.elements.accountDeleteCancelButton?.addEventListener("click", () => {
    handleAccountDeleteModalClose(page);
  });

  // 계정 삭제 모달 확인 버튼 click 이벤트
  page.elements.accountDeleteConfirmButton?.addEventListener("click", async () => {
    await handleAccountDeleteConfirm(page);
  });

  // 계정 삭제 모달 오버레이 click 이벤트
  page.elements.accountDeleteModal?.addEventListener("click", (event) => {
    // 오버레이 자체를 클릭했을 때만 삭제 확인 모달 닫기
    if (event.target !== page.elements.accountDeleteModal) return;
    handleAccountDeleteModalClose(page);
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

// 사용자 정보 카드의 이름 입력값 복원
function handleUserInformationCancel(page) {
  page.draft.userName = page.profile.user.name || "";
  clearUserNameFeedback(page);
  renderUserInformation(page);
  renderPendingState(page);
}

// 이름 저장 직전 입력값 검증
function validateUserInformation(page) {
  const normalizedName = String(page.draft.userName || "").trim();
  const currentName = String(page.profile.user.name || "").trim();

  if (normalizedName === currentName) {
    window.alert(USER_INFO_EMPTY_ALERT_MESSAGE);
    return null;
  }

  if (!normalizedName) {
    window.alert(USER_NAME_REQUIRED_ALERT_MESSAGE);
    page.elements.profileNameInput?.focus();
    return null;
  }

  if (normalizedName.length > MAX_NAME_LENGTH) {
    window.alert(USER_NAME_LENGTH_ALERT_MESSAGE);
    page.elements.profileNameInput?.focus();
    return null;
  }

  return normalizedName;
}

// 사용자 정보 카드의 이름 저장 처리
async function handleUserInformationSave(page) {
  if (page.pending.isUserSaving) return;

  const normalizedName = validateUserInformation(page);
  if (!normalizedName) return;

  page.pending.isUserSaving = true;
  renderPendingState(page);

  try {
    await updateName(normalizedName);
    persistUserNameSavedMessage();
    window.location.reload();
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    page.pending.isUserSaving = false;
    renderPendingState(page);
  }
}

// 기본 설정 draft 복원
function handleBaseSettingsCancel(page) {
  page.draft.departmentId = page.profile.department?.id || "";
  page.draft.templateId = page.profile.template?.id || "";
  clearBaseSettingsFeedback(page);
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
    page.ui.baseSettingsFeedbackMessage = BASE_SETTINGS_SAVED_MESSAGE;
    page.render();
  } catch (error) {
    if (hasMutation) {
      try {
        await page.loadProfile();
        page.render();
      } catch {
        // 최신 상태 복구 시도 실패
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
      // 선택한 학부 id와 전공 id가 모두 일치하는 항목만 추가 대상으로 인정
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

  clearMajorFeedback(page);
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
  if (!window.confirm(MAJOR_DELETE_CONFIRM_MESSAGE)) return;

  clearMajorFeedback(page);
  page.draft.majors = page.draft.majors.filter((major) => major.draftId !== draftId);
  page.ui.majorFeedbackMessage = MAJOR_DELETED_MESSAGE;
  renderMajorList(page);
  renderMajorFeedback(page);
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
  clearMajorFeedback(page);
  renderMajorForm(page);
  renderMajorList(page);
  renderPendingState(page);
}

// 서버 반영 대상 계산
function buildMajorMutationPlan(page) {
  const addedMajors = page.draft.majors.filter((draftMajor) => {
    return !page.profile.majors.some((profileMajor) => {
      // 전공 id와 전공 구분이 모두 같으면 이미 저장된 전공으로 본다
      return profileMajor.id === draftMajor.id && profileMajor.majorType === draftMajor.majorType;
    });
  });

  const removedMajors = page.profile.majors.filter((profileMajor) => {
    return !page.draft.majors.some((draftMajor) => {
      // 서버 기준 전공 id / 전공 구분이 draft에 없으면 삭제 대상으로 본다
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
    page.ui.majorFeedbackMessage = MAJORS_SAVED_MESSAGE;
    page.render();
  } catch (error) {
    if (hasMutation) {
      try {
        await page.loadProfile();
        page.render();
      } catch {
        // 최신 상태 복구 시도 실패
      }
    }

    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    page.pending.isMajorsSaving = false;
    renderPendingState(page);
  }
}

// 삭제 확인 모달 열기
function handleAccountDeleteModalOpen(page) {
  if (page.pending.isAccountDeleting) return;

  page.ui.isDeleteModalOpen = true;
  renderAccountDeleteModal(page);
  renderPendingState(page);
}

// 삭제 확인 모달 닫기
function handleAccountDeleteModalClose(page) {
  if (page.pending.isAccountDeleting) return;

  page.ui.isDeleteModalOpen = false;
  renderAccountDeleteModal(page);
  renderPendingState(page);
}

// 계정 삭제 API 호출 처리
async function handleAccountDeleteConfirm(page) {
  if (page.pending.isAccountDeleting) return;

  page.pending.isAccountDeleting = true;
  renderPendingState(page);

  try {
    await deleteAccount();
    window.location.href = PAGE_PATHS.HOME;
  } catch (error) {
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    window.alert(errorInfo.message);
  } finally {
    page.pending.isAccountDeleting = false;
    renderPendingState(page);
  }
}
