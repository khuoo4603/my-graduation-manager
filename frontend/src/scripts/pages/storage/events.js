import { renderSelectedUploadFile, renderStorageFiles, renderStorageTabs } from "./render.js";

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

// 드래그 상태 클래스를 초기화
function clearDragState(page) {
  page.dragDepth = 0;
  page.elements.uploadDropzone?.classList.remove("is-dragover");
}

// 모달을 닫거나 다시 열 때 업로드 선택값을 초기화
function resetUploadSelection(page) {
  page.selectedFile = null;
  clearDragState(page);

  // 카테고리 select가 있으면 기본값으로 되돌림
  if (page.elements.uploadCategorySelect) {
    page.elements.uploadCategorySelect.value = "";
  }

  // 파일 input이 있으면 같은 파일 재선택이 가능하도록 값을 비움
  if (page.elements.uploadFileInput) {
    page.elements.uploadFileInput.value = "";
  }

  renderSelectedUploadFile(page);
}

// 현재 선택된 파일 객체를 상태에 반영
function applySelectedFile(file, page) {
  page.selectedFile = file || null;
  renderSelectedUploadFile(page);
}

// 카테고리 탭 변경 시 목록과 활성 상태를 함께 갱신
function handleCategoryChange(categoryId, page) {
  // 잘못된 카테고리이거나 이미 선택된 탭이면 다시 렌더하지 않음
  if (!categoryId || page.activeCategory === categoryId) return;

  page.activeCategory = categoryId;
  renderStorageTabs(page);
  renderStorageFiles(page);
}

// 업로드 모달을 열기 전에 선택 상태를 초기화
function handleUploadModalOpen(page) {
  resetUploadSelection(page);
  toggleUploadModal(page, true);

  requestAnimationFrame(() => {
    page.elements.uploadCategorySelect?.focus();
  });
}

// 업로드 모달을 닫으면서 선택 상태도 함께 정리
function handleUploadModalClose(page) {
  resetUploadSelection(page);
  toggleUploadModal(page, false);
}

// 일반 파일 선택 input에서 첫 번째 파일만 상태에 반영
function handleFileInputChange(event, page) {
  const input = event.currentTarget;
  // 예상한 input 이벤트가 아니면 처리하지 않음
  if (!(input instanceof HTMLInputElement)) return;

  applySelectedFile(input.files?.[0] || null, page);
}

// 드래그가 진입할 때 depth를 올리고 hover 스타일을 적용
function handleDropzoneDragEnter(event, page) {
  event.preventDefault();
  page.dragDepth += 1;
  page.elements.uploadDropzone?.classList.add("is-dragover");
}

// 드래그 중에는 기본 브라우저 동작을 막고 hover 상태를 유지
function handleDropzoneDragOver(event, page) {
  event.preventDefault();
  page.elements.uploadDropzone?.classList.add("is-dragover");
}

// 드래그가 완전히 빠져나갔을 때만 hover 스타일 제거
function handleDropzoneDragLeave(event, page) {
  event.preventDefault();
  page.dragDepth = Math.max(0, page.dragDepth - 1);

  // 중첩 dragleave가 모두 빠진 뒤에만 상태를 해제
  if (page.dragDepth === 0) {
    page.elements.uploadDropzone?.classList.remove("is-dragover");
  }
}

// 드롭된 첫 번째 파일만 선택 파일로 반영
function handleDropzoneDrop(event, page) {
  event.preventDefault();

  const file = event.dataTransfer?.files?.[0] || null;
  clearDragState(page);
  applySelectedFile(file, page);
}

// Storage 페이지에서 사용하는 클릭/드래그/키보드 이벤트를 바인딩
export function bindStorageEvents(page) {
  // 카테고리 탭 클릭 시 현재 활성 탭과 파일 목록을 함께 변경
  page.elements.categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleCategoryChange(button.dataset.storageCategory || "", page);
    });
  });

  // 상단 파일 업로드 버튼 클릭 시 업로드 모달 열기
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

  // 모달 바깥 오버레이 클릭 시 업로드 모달 닫기
  page.elements.uploadModal?.addEventListener("click", (event) => {
    if (event.target === page.elements.uploadModal) {
      handleUploadModalClose(page);
    }
  });

  // 드롭존 내부의 파일 선택 버튼 클릭 시 숨겨진 file input 열기
  page.elements.selectUploadFileButton?.addEventListener("click", () => {
    page.elements.uploadFileInput?.click();
  });

  // 일반 파일 선택 창에서 고른 파일을 현재 선택 파일로 반영
  page.elements.uploadFileInput?.addEventListener("change", (event) => {
    handleFileInputChange(event, page);
  });

  // 드래그한 파일이 드롭존 안으로 들어오면 hover 상태 시작
  page.elements.uploadDropzone?.addEventListener("dragenter", (event) => {
    handleDropzoneDragEnter(event, page);
  });

  // 드롭존 위를 지나가는 동안 기본 동작을 막고 hover 상태 유지
  page.elements.uploadDropzone?.addEventListener("dragover", (event) => {
    handleDropzoneDragOver(event, page);
  });

  // 드래그한 파일이 드롭존 밖으로 나가면 hover 상태 정리
  page.elements.uploadDropzone?.addEventListener("dragleave", (event) => {
    handleDropzoneDragLeave(event, page);
  });

  // 드롭존에 파일을 놓으면 첫 번째 파일을 선택 상태로 반영
  page.elements.uploadDropzone?.addEventListener("drop", (event) => {
    handleDropzoneDrop(event, page);
  });

  // 업로드 모달이 열린 상태에서 Escape 키를 누르면 모달 닫기
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && page.isUploadModalOpen) {
      handleUploadModalClose(page);
    }
  });
}
