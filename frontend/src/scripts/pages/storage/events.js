import { ApiError } from "/src/scripts/api/client.js";
import { buildStorageDownloadUrl, deleteStorageFile, uploadStorageFile } from "/src/scripts/api/storage.js";
import { UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { redirectToErrorPageByError } from "/src/scripts/utils/error.js";

import { renderSelectedUploadFile, renderStorageFiles, renderStorageTabs, renderUploadPendingState } from "./render.js";

const DELETE_CONFIRM_MESSAGE = "이 파일을 삭제하시겠습니까?\n삭제 후 되돌릴 수 없습니다.";
const UPLOAD_SUCCESS_MESSAGE = "파일이 업로드되었습니다.";
const DELETE_SUCCESS_MESSAGE = "파일이 삭제되었습니다.";
const UPLOAD_CATEGORY_REQUIRED_MESSAGE = "카테고리를 선택해 주세요.";
const UPLOAD_FILE_REQUIRED_MESSAGE = "업로드할 파일을 선택해 주세요.";
const DUPLICATE_FILE_ALERT_MESSAGE = "같은 이름의 파일이 이미 존재합니다. 파일명을 바꿔 다시 업로드해 주세요.";
const UPLOAD_LIMIT_ALERT_MESSAGE = "파일 업로드 제한을 초과했습니다.";
const DELETE_FAILURE_ALERT_MESSAGE = "파일을 삭제할 수 없습니다.";
const DOWNLOAD_FAILURE_ALERT_MESSAGE = "파일을 다운로드할 수 없습니다.";

// 업로드 모달 열림 상태와 body 스크롤 잠금을 함께 제어
function toggleUploadModal(page, isOpen) {
  page.isUploadModalOpen = isOpen;

  // 모달 요소가 있으면 hidden/aria/class 상태를 같이 갱신
  if (page.elements.uploadModal) {
    page.elements.uploadModal.hidden = !isOpen;
    page.elements.uploadModal.setAttribute("aria-hidden", String(!isOpen));
    page.elements.uploadModal.classList.toggle("is-open", isOpen);
  }

  document.body.classList.toggle("is-modal-open", isOpen);
}

// 드래그 상태 누적 값을 초기화
function clearDragState(page) {
  page.dragDepth = 0;
  page.elements.uploadDropzone?.classList.remove("is-dragover");
}

// 모달을 닫을 때 업로드 선택값을 초기화
function resetUploadSelection(page) {
  page.selectedFile = null;
  clearDragState(page);

  // 카테고리 select가 있으면 기본값으로 되돌림
  if (page.elements.uploadCategorySelect) {
    page.elements.uploadCategorySelect.value = "";
  }

  // 파일 input이 있으면 같은 파일 재선택이 가능하도록 비움
  if (page.elements.uploadFileInput) {
    page.elements.uploadFileInput.value = "";
  }

  renderSelectedUploadFile(page);
}

// 모달 닫기 공통 처리
function closeUploadModal(page) {
  resetUploadSelection(page);
  toggleUploadModal(page, false);
}

// 현재 선택된 파일 객체를 상태에 반영
function applySelectedFile(file, page) {
  page.selectedFile = file || null;
  renderSelectedUploadFile(page);
}

// 권한/서버/네트워크 계열 오류를 공통 에러 페이지로 보낼지 판별
function shouldRedirectStorageError(error) {
  // ApiError 형태가 아니면 공통 에러 페이지 기준으로 처리
  if (!(error instanceof ApiError)) return true;

  // 네트워크 실패는 페이지 내부에서 복구하지 않음
  if (error.code === "NETWORK_ERROR" || error.status === 0) {
    return true;
  }

  return error.status === 401 || error.status === 403 || error.status >= 500;
}

// 업로드 실패 응답을 사용자용 문구로 변환
function resolveUploadErrorMessage(error) {
  const errorCode = error instanceof ApiError ? error.data?.code || error.code : "";

  // 중복 파일명은 정책 문구로 고정
  if (errorCode === "DUPLICATE_RESOURCE") {
    return DUPLICATE_FILE_ALERT_MESSAGE;
  }

  // 업로드 용량 초과는 서버 응답을 사용자용 안내 문구로 치환
  if (errorCode === "STORAGE_QUOTA_EXCEEDED" || errorCode === "PAYLOAD_TOO_LARGE") {
    return UPLOAD_LIMIT_ALERT_MESSAGE;
  }

  // 서버가 전달한 message가 있으면 안내 문구로 우선 사용
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return UI_MESSAGES.COMMON_ERROR;
}

// 삭제 실패 응답을 사용자용 문구로 변환
function resolveDeleteErrorMessage(error) {
  // 서버가 전달한 message가 있으면 안내 문구로 우선 사용
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return DELETE_FAILURE_ALERT_MESSAGE;
}

// 카테고리 탭 클릭 시 서버 목록을 다시 조회
async function handleCategoryChange(categoryId, page) {
  // 같은 탭이거나 이미 조회 중이면 다시 요청하지 않음
  if (!categoryId || page.activeCategory === categoryId || page.pending.isFilesLoading) return;

  const previousCategory = page.activeCategory;
  page.pending.isFilesLoading = true;
  page.activeCategory = categoryId;
  renderStorageTabs(page);

  try {
    await page.loadFiles(categoryId);
  } catch (error) {
    // local 네트워크 오류면 alert만 띄우고 기존 화면을 유지
    if (page.isLocalNetworkError?.(error)) {
      page.activeCategory = previousCategory;
      window.alert(UI_MESSAGES.NETWORK_ERROR);
      return;
    }

    redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
  } finally {
    page.pending.isFilesLoading = false;
    renderStorageTabs(page);
    renderStorageFiles(page);
  }
}

// 업로드 모달을 열기 전에 선택 상태를 초기화
function handleUploadModalOpen(page) {
  // 저장 용량이 꽉 찼거나 업로드 중이면 모달을 열지 않음
  if (page.usage.isLimitReached || page.pending.isUploadSubmitting) return;

  resetUploadSelection(page);
  toggleUploadModal(page, true);

  requestAnimationFrame(() => {
    page.elements.uploadCategorySelect?.focus();
  });
}

// 업로드 모달 닫기 버튼/취소 버튼 공통 처리
function handleUploadModalClose(page) {
  // 업로드 전송 중에는 모달 닫기를 막음
  if (page.pending.isUploadSubmitting) return;

  closeUploadModal(page);
}

// 일반 파일 선택 input에서 첫 번째 파일만 상태에 반영
function handleFileInputChange(event, page) {
  const input = event.currentTarget;
  // 예상한 input 이벤트가 아니면 처리하지 않음
  if (!(input instanceof HTMLInputElement)) return;

  applySelectedFile(input.files?.[0] || null, page);
}

// 드래그가 진입하면 depth를 올리고 hover 스타일을 적용
function handleDropzoneDragEnter(event, page) {
  event.preventDefault();

  // 업로드 중에는 드래그 상호작용을 받지 않음
  if (page.pending.isUploadSubmitting) return;

  page.dragDepth += 1;
  page.elements.uploadDropzone?.classList.add("is-dragover");
}

// 드래그 중에는 기본 브라우저 동작을 막고 hover 상태를 유지
function handleDropzoneDragOver(event, page) {
  event.preventDefault();

  // 업로드 중에는 hover 상태만 갱신하지 않음
  if (page.pending.isUploadSubmitting) return;

  page.elements.uploadDropzone?.classList.add("is-dragover");
}

// 드래그가 완전히 빠져나간 경우에만 hover 상태를 해제
function handleDropzoneDragLeave(event, page) {
  event.preventDefault();

  // 업로드 중에는 남은 hover 상태만 정리
  if (page.pending.isUploadSubmitting) {
    clearDragState(page);
    return;
  }

  page.dragDepth = Math.max(0, page.dragDepth - 1);

  // 중첩 dragleave가 모두 빠진 뒤에만 상태를 해제
  if (page.dragDepth === 0) {
    page.elements.uploadDropzone?.classList.remove("is-dragover");
  }
}

// 드롭한 첫 번째 파일만 선택 파일로 반영
function handleDropzoneDrop(event, page) {
  event.preventDefault();

  // 업로드 중에는 drop으로 파일을 바꾸지 않음
  if (page.pending.isUploadSubmitting) return;

  const file = event.dataTransfer?.files?.[0] || null;
  clearDragState(page);
  applySelectedFile(file, page);
}

// 업로드 버튼 클릭 시 입력 검증 후 실제 업로드 요청
async function handleUploadSubmit(page) {
  // 이미 업로드 요청을 보내는 중이면 중복 제출을 막음
  if (page.pending.isUploadSubmitting) return;

  const categoryId = page.elements.uploadCategorySelect?.value || "";
  const category = page.categoryOptions[categoryId]?.apiValue || "";

  // 카테고리를 고르지 않았으면 업로드를 막음
  if (!category) {
    window.alert(UPLOAD_CATEGORY_REQUIRED_MESSAGE);
    page.elements.uploadCategorySelect?.focus();
    return;
  }

  // 파일을 고르지 않았으면 업로드를 막음
  if (!page.selectedFile) {
    window.alert(UPLOAD_FILE_REQUIRED_MESSAGE);
    page.elements.selectUploadFileButton?.focus();
    return;
  }

  page.pending.isUploadSubmitting = true;
  renderUploadPendingState(page);

  try {
    await uploadStorageFile(category, page.selectedFile);
    closeUploadModal(page);
    await page.reloadStorageData();
    window.alert(UPLOAD_SUCCESS_MESSAGE);
  } catch (error) {
    // local 네트워크 오류면 모달/화면을 유지하고 alert만 표시
    if (page.isLocalNetworkError?.(error)) {
      window.alert(UI_MESSAGES.NETWORK_ERROR);
      return;
    }

    // local이 아닌 권한/서버 오류는 공통 에러 페이지로 이동
    if (shouldRedirectStorageError(error)) {
      redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
      return;
    }

    window.alert(resolveUploadErrorMessage(error));
  } finally {
    page.pending.isUploadSubmitting = false;
    renderUploadPendingState(page);
  }
}

// 브라우저 다운로드 흐름에 맞춰 파일을 내려받음
async function handleFileDownload(fileId, page) {
  // fileId가 없으면 다운로드 요청을 보내지 않음
  if (!fileId) return;

  const file = page.files.find((item) => item.id === String(fileId));
  const url = buildStorageDownloadUrl(fileId);
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
  } catch (error) {
    const networkError = new ApiError("Network request failed", {
      status: 0,
      code: "NETWORK_ERROR",
      url,
      method: "GET",
      data: { cause: error instanceof Error ? error.message : String(error) },
    });

    // local 네트워크 오류면 alert만 띄우고 현재 화면을 유지
    if (page.isLocalNetworkError?.(networkError)) {
      window.alert(UI_MESSAGES.NETWORK_ERROR);
      return;
    }

    redirectToErrorPageByError(networkError, UI_MESSAGES.COMMON_ERROR);
    return;
  }

  // 인증/서버 오류는 공통 에러 페이지로 넘김
  if (!response.ok) {
    const downloadError = new ApiError(response.statusText || "Download request failed", {
      status: response.status,
      code:
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 403
            ? "FORBIDDEN"
            : response.status >= 500
              ? "SERVER_ERROR"
              : "HTTP_ERROR",
      url,
      method: "GET",
    });

    // 인증/권한/서버 오류는 공통 에러 페이지로 이동
    if (shouldRedirectStorageError(downloadError)) {
      redirectToErrorPageByError(downloadError, UI_MESSAGES.COMMON_ERROR);
      return;
    }

    window.alert(file ? `${file.name} ${DOWNLOAD_FAILURE_ALERT_MESSAGE}` : DOWNLOAD_FAILURE_ALERT_MESSAGE);
    return;
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = file?.name || "";
  link.style.display = "none";

  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

// 삭제 확인 후 실제 삭제 요청을 보내고 목록/usage를 다시 조회
async function handleFileDelete(fileId, page) {
  // fileId가 없거나 이미 삭제 중이면 요청을 막음
  if (!fileId || page.pending.deletingFileId) return;

  // 사용자가 삭제를 취소하면 요청하지 않음
  if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return;

  page.pending.deletingFileId = String(fileId);
  renderStorageFiles(page);

  try {
    await deleteStorageFile(fileId);
    await page.reloadStorageData();
    window.alert(DELETE_SUCCESS_MESSAGE);
  } catch (error) {
    // local 네트워크 오류면 alert만 띄우고 현재 화면을 유지
    if (page.isLocalNetworkError?.(error)) {
      window.alert(UI_MESSAGES.NETWORK_ERROR);
      return;
    }

    // local이 아닌 권한/서버 오류는 공통 에러 페이지로 이동
    if (shouldRedirectStorageError(error)) {
      redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
      return;
    }

    window.alert(resolveDeleteErrorMessage(error));
  } finally {
    page.pending.deletingFileId = "";
    renderStorageFiles(page);
  }
}

// Storage 페이지에서 사용하는 클릭/드래그/업로드 이벤트를 바인딩
export function bindStorageEvents(page) {
  // 카테고리 탭 클릭 시 해당 enum 기준으로 파일 목록을 다시 조회
  page.elements.categoryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleCategoryChange(button.dataset.storageCategory || "", page);
    });
  });

  // 상단 파일 업로드 버튼 클릭 시 업로드 모달을 열기
  page.elements.openUploadModalButton?.addEventListener("click", () => {
    handleUploadModalOpen(page);
  });

  // 모달 헤더의 닫기 버튼 클릭 시 업로드 모달 닫기
  page.elements.closeUploadModalButton?.addEventListener("click", () => {
    handleUploadModalClose(page);
  });

  // 모달 하단 취소 버튼 클릭 시 업로드 모달 닫기
  page.elements.cancelUploadButton?.addEventListener("click", () => {
    handleUploadModalClose(page);
  });

  // 모달 바깥 오버레이를 클릭하면 업로드 모달 닫기
  page.elements.uploadModal?.addEventListener("click", (event) => {
    // 오버레이 자체를 클릭한 경우에만 모달을 닫음
    if (event.target === page.elements.uploadModal) {
      handleUploadModalClose(page);
    }
  });

  // 파일 선택 버튼 클릭 시 숨겨진 file input 열기
  page.elements.selectUploadFileButton?.addEventListener("click", () => {
    // 업로드 중이 아닐 때만 파일 선택 창을 열기
    if (!page.pending.isUploadSubmitting) {
      page.elements.uploadFileInput?.click();
    }
  });

  // 일반 파일 선택 창에서 고른 파일을 현재 선택 파일로 반영
  page.elements.uploadFileInput?.addEventListener("change", (event) => {
    handleFileInputChange(event, page);
  });

  // 드래그한 파일이 드롭존 안으로 들어오면 hover 상태 시작
  page.elements.uploadDropzone?.addEventListener("dragenter", (event) => {
    handleDropzoneDragEnter(event, page);
  });

  // 드롭존 위를 지나는 동안 기본 동작을 막고 hover 상태 유지
  page.elements.uploadDropzone?.addEventListener("dragover", (event) => {
    handleDropzoneDragOver(event, page);
  });

  // 드래그한 파일이 드롭존 밖으로 나가면 hover 상태 정리
  page.elements.uploadDropzone?.addEventListener("dragleave", (event) => {
    handleDropzoneDragLeave(event, page);
  });

  // 드롭존에 파일을 놓으면 첫 번째 파일을 업로드 선택 상태로 반영
  page.elements.uploadDropzone?.addEventListener("drop", (event) => {
    handleDropzoneDrop(event, page);
  });

  // 모달의 업로드 버튼 클릭 시 실제 multipart 업로드 요청 전송
  page.elements.uploadSubmitButton?.addEventListener("click", async () => {
    await handleUploadSubmit(page);
  });

  // 파일 목록의 다운로드/삭제 버튼 클릭을 이벤트 위임으로 처리
  page.elements.fileRows?.addEventListener("click", async (event) => {
    const target = event.target;
    // 버튼이 아닌 영역 클릭은 무시
    if (!(target instanceof Element)) return;

    const downloadButton = target.closest("[data-storage-download]");
    // 다운로드 버튼이면 다운로드 흐름만 처리하고 종료
    if (downloadButton instanceof HTMLButtonElement) {
      await handleFileDownload(downloadButton.dataset.storageDownload || "", page);
      return;
    }

    const deleteButton = target.closest("[data-storage-delete]");
    // 삭제 버튼이면 삭제 확인 흐름을 처리
    if (deleteButton instanceof HTMLButtonElement) {
      await handleFileDelete(deleteButton.dataset.storageDelete || "", page);
    }
  });

  // 업로드 모달이 열린 상태에서 Escape를 누르면 모달 닫기
  document.addEventListener("keydown", (event) => {
    // 모달이 열려 있을 때만 Escape로 닫기
    if (event.key === "Escape" && page.isUploadModalOpen) {
      handleUploadModalClose(page);
    }
  });
}
