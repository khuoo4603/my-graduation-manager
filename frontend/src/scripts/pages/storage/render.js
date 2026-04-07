import { setText } from "/src/scripts/utils/dom.js";

const DOWNLOAD_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 4.75V13.25M12 13.25L8.75 10M12 13.25L15.25 10M5.75 15.75V17C5.75 18.5188 6.98122 19.75 8.5 19.75H15.5C17.0188 19.75 18.25 18.5188 18.25 17V15.75"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

const DELETE_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9.5 5.75H14.5M4.75 7.5H19.25M18 7.5L17.31 17.16C17.2 18.67 15.94 19.84 14.43 19.84H9.57C8.06 19.84 6.8 18.67 6.69 17.16L6 7.5M10 10.5V15.5M14 10.5V15.5"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

const FILE_TYPE_ICON_SVGS = {
  pdf: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75H13.25L17.5 9V18.5C17.5 19.3284 16.8284 20 16 20H8C7.17157 20 6.5 19.3284 6.5 18.5V6.25C6.5 5.42157 7.17157 4.75 8 4.75Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M13 4.75V9H17.25M9.25 12H14.75M9.25 15H14.75M9.25 18H12.75"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  word: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75H13.25L17.5 9V18.5C17.5 19.3284 16.8284 20 16 20H8C7.17157 20 6.5 19.3284 6.5 18.5V6.25C6.5 5.42157 7.17157 4.75 8 4.75Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M13 4.75V9H17.25M9.25 12V17M11.75 12H14.75M11.75 14.5H14.75M11.75 17H14.75"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  excel: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75H13.25L17.5 9V18.5C17.5 19.3284 16.8284 20 16 20H8C7.17157 20 6.5 19.3284 6.5 18.5V6.25C6.5 5.42157 7.17157 4.75 8 4.75Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M13 4.75V9H17.25M9 12.25H15M9 15H15M11.5 12V17.75M9 17.75H15"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  powerpoint: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75H13.25L17.5 9V18.5C17.5 19.3284 16.8284 20 16 20H8C7.17157 20 6.5 19.3284 6.5 18.5V6.25C6.5 5.42157 7.17157 4.75 8 4.75Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M13 4.75V9H17.25M9.25 17V12.25H12.25C13.2165 12.25 14 13.0335 14 14C14 14.9665 13.2165 15.75 12.25 15.75H9.25"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M14.75 12.75V17M16.75 14.75H14.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </svg>
  `,
  image: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="6.25" width="14" height="11.5" rx="2.25" stroke="currentColor" stroke-width="1.7" />
      <circle cx="10" cy="10" r="1.35" fill="currentColor" />
      <path
        d="M7.5 16L11 12.5L13.75 15.25L15.25 13.75L17.5 16"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  video: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="7" width="14" height="10" rx="2.25" stroke="currentColor" stroke-width="1.7" />
      <path d="M11 10L15 12L11 14V10Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
    </svg>
  `,
  audio: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9.5V15.5M12 7.75V17.25M15 10.75V14.25" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
      <path d="M6.5 12H17.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.45" />
    </svg>
  `,
  archive: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V7Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M7 7L8.25 4.75H15.75L17 7M12 9.25V17.25M12 10.75H12.01M12 13.5H12.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  text: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75H13.25L17.5 9V18.5C17.5 19.3284 16.8284 20 16 20H8C7.17157 20 6.5 19.3284 6.5 18.5V6.25C6.5 5.42157 7.17157 4.75 8 4.75Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M13 4.75V9H17.25M9.25 12H14.75M9.25 15H14.75M9.25 18H13"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  code: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.25 9L6.5 12L9.25 15M14.75 9L17.5 12L14.75 15M13.1 7.5L10.9 16.5"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  generic: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75H13.25L17.5 9V18.5C17.5 19.3284 16.8284 20 16 20H8C7.17157 20 6.5 19.3284 6.5 18.5V6.25C6.5 5.42157 7.17157 4.75 8 4.75Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M13 4.75V9H17.25" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
};

// innerHTML로 주입할 텍스트를 안전하게 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveFilePresentation(file) {
  const extension =
    String(file.name || "")
      .split(".")
      .pop()
      ?.toLowerCase() || "";

  let fileType = "generic";

  // 확장자 기준 파일 아이콘 선택
  if (extension === "pdf") {
    fileType = "pdf";
  } else if (["doc", "docx", "hwp", "hwpx"].includes(extension)) {
    fileType = "word";
  } else if (["xls", "xlsx", "csv", "cell"].includes(extension)) {
    fileType = "excel";
  } else if (["ppt", "pptx", "show"].includes(extension)) {
    fileType = "powerpoint";
  } else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    fileType = "image";
  } else if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    fileType = "video";
  } else if (["mp3", "wav", "m4a", "aac", "ogg"].includes(extension)) {
    fileType = "audio";
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    fileType = "archive";
  } else if (["txt", "md"].includes(extension)) {
    fileType = "text";
  } else if (["js", "ts", "jsx", "tsx", "json", "html", "css", "py", "java", "c", "cpp"].includes(extension)) {
    fileType = "code";
  }

  const className = `storage-file-icon--${fileType}`;
  const iconSvg = FILE_TYPE_ICON_SVGS[fileType] || FILE_TYPE_ICON_SVGS.generic;

  return {
    className,
    iconSvg,
  };
}

function buildStorageMetaItems(items) {
  return items
    .filter((item) => String(item || "").trim())
    .map((item) => `<span class="storage-mobile-card__meta-item">${escapeHtml(item)}</span>`)
    .join("");
}

// 파일 타입에 맞는 아이콘과 관리 버튼을 포함한 row HTML 생성
function buildStorageFileRow(file, isActionDisabled) {
  const { className, iconSvg } = resolveFilePresentation(file);
  const disabledAttr = isActionDisabled ? " disabled" : "";

  return `
    <tr>
      <td>
        <div class="storage-file-cell">
          <span class="storage-file-icon ${className}" aria-hidden="true">${iconSvg}</span>
          <span class="storage-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
        </div>
      </td>
      <td>
        <span class="badge badge--blue storage-category-badge">${escapeHtml(file.categoryLabel)}</span>
      </td>
      <td class="storage-table__meta">${escapeHtml(file.sizeLabel)}</td>
      <td class="storage-table__meta">${escapeHtml(file.uploadedAt)}</td>
      <td>
        <div class="storage-table__actions">
          <button
            class="btn btn--ghost btn--icon storage-action-button"
            type="button"
            aria-label="다운로드"
            title="다운로드"
            data-storage-download="${escapeHtml(file.id)}"${disabledAttr}
          >
            ${DOWNLOAD_ICON_SVG}
          </button>
          <button
            class="btn btn--ghost btn--icon storage-action-button storage-action-button--danger"
            type="button"
            aria-label="삭제"
            title="삭제"
            data-storage-delete="${escapeHtml(file.id)}"${disabledAttr}
          >
            ${DELETE_ICON_SVG}
          </button>
        </div>
      </td>
    </tr>
  `;
}

function buildStorageFileCard(file, isActionDisabled) {
  const { className, iconSvg } = resolveFilePresentation(file);
  const disabledAttr = isActionDisabled ? " disabled" : "";
  const metaHtml = buildStorageMetaItems([file.categoryLabel, file.sizeLabel, file.uploadedAtCompact || file.uploadedAt]);

  return `
    <article class="storage-mobile-card">
      <div class="storage-mobile-card__top">
        <div class="storage-mobile-card__main">
          <span class="storage-file-icon ${className}" aria-hidden="true">${iconSvg}</span>
          <strong class="storage-mobile-card__title" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
        </div>
        <div class="storage-mobile-card__actions">
          <button
            class="btn btn--ghost btn--icon storage-action-button"
            type="button"
            aria-label="다운로드"
            title="다운로드"
            data-storage-download="${escapeHtml(file.id)}"${disabledAttr}
          >
            ${DOWNLOAD_ICON_SVG}
          </button>
          <button
            class="btn btn--ghost btn--icon storage-action-button storage-action-button--danger"
            type="button"
            aria-label="삭제"
            title="삭제"
            data-storage-delete="${escapeHtml(file.id)}"${disabledAttr}
          >
            ${DELETE_ICON_SVG}
          </button>
        </div>
      </div>
      <div class="storage-mobile-card__meta">${metaHtml}</div>
    </article>
  `;
}

// 상단 저장 용량 카드의 문구와 진행률을 반영
export function renderStorageUsage(page) {
  setText(page.elements.usageValue, page.usage.usedLabel);
  setText(page.elements.usageCaption, page.usage.percentLabel);

  // 진행률 바가 있으면 현재 퍼센트만큼 너비를 갱신
  if (page.elements.progressBar) {
    page.elements.progressBar.style.width = `${page.usage.percent}%`;
  }

  // 용량이 꽉 찼거나 업로드 중이면 업로드 버튼을 비활성화
  if (page.elements.openUploadModalButton) {
    const isDisabled = page.usage.isLimitReached || page.pending.isUploadSubmitting;
    page.elements.openUploadModalButton.disabled = isDisabled;
    page.elements.openUploadModalButton.setAttribute("aria-disabled", String(isDisabled));
    page.elements.openUploadModalButton.title = page.usage.isLimitReached ? "저장 용량이 가득 찼습니다." : "";
  }
}

// 현재 선택된 카테고리 탭의 활성 상태를 갱신
export function renderStorageTabs(page) {
  page.elements.categoryButtons.forEach((button) => {
    const isActive = button.dataset.storageCategory === page.activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = page.pending.isFilesLoading;
  });
}

// 현재 서버에서 받아온 파일 목록과 empty 상태를 렌더링
export function renderStorageFiles(page) {
  const visibleFiles = page.files;
  const hasFiles = visibleFiles.length > 0;
  const isActionDisabled = Boolean(page.pending.deletingFileId);

  setText(page.elements.fileCount, String(visibleFiles.length));

  // 파일 목록 영역이 있으면 현재 row HTML로 한 번에 갱신
  if (page.elements.fileRows) {
    page.elements.fileRows.innerHTML = hasFiles
      ? visibleFiles.map((file) => buildStorageFileRow(file, isActionDisabled)).join("")
      : "";
  }

  if (page.elements.mobileList) {
    page.elements.mobileList.innerHTML = hasFiles
      ? visibleFiles.map((file) => buildStorageFileCard(file, isActionDisabled)).join("")
      : "";
    page.elements.mobileList.hidden = !hasFiles;
    page.elements.mobileList.setAttribute("aria-hidden", String(!hasFiles));
  }

  // 빈 목록이면 empty 문구를 노출
  if (page.elements.emptyState) {
    page.elements.emptyState.hidden = hasFiles;
  }

  // 테이블 래퍼는 파일이 있을 때만 보여줌
  if (page.elements.tableWrap) {
    page.elements.tableWrap.hidden = !hasFiles;
    page.elements.tableWrap.setAttribute("aria-hidden", String(!hasFiles));
    page.elements.tableWrap.setAttribute("aria-busy", String(page.pending.isFilesLoading));
  }
}

// 업로드 모달에서 현재 선택된 파일명을 표시
export function renderSelectedUploadFile(page) {
  const fileName = page.selectedFile?.name || "선택된 파일이 없습니다.";
  setText(page.elements.uploadFileName, fileName);
}

// 업로드 중 여부에 따라 모달 버튼과 입력 상태를 갱신
export function renderUploadPendingState(page) {
  const isUploading = page.pending.isUploadSubmitting;
  const defaultLabel = page.elements.uploadSubmitButton?.dataset.defaultLabel || "업로드";

  // 업로드 버튼 기본 라벨을 최초 한 번 저장
  if (page.elements.uploadSubmitButton && !page.elements.uploadSubmitButton.dataset.defaultLabel) {
    page.elements.uploadSubmitButton.dataset.defaultLabel = defaultLabel;
  }

  // 카테고리 select는 업로드 중에 변경하지 못하도록 잠금
  if (page.elements.uploadCategorySelect) {
    page.elements.uploadCategorySelect.disabled = isUploading;
  }

  // 파일 선택 버튼은 업로드 중에 다시 누르지 못하도록 잠금
  if (page.elements.selectUploadFileButton) {
    page.elements.selectUploadFileButton.disabled = isUploading;
  }

  // 숨겨진 file input도 같은 기준으로 비활성화
  if (page.elements.uploadFileInput) {
    page.elements.uploadFileInput.disabled = isUploading;
  }

  // 업로드 전송 중에는 취소 버튼 사용을 막음
  if (page.elements.cancelUploadButton) {
    page.elements.cancelUploadButton.disabled = isUploading;
  }

  // 헤더 닫기 버튼도 업로드 중에는 잠가 모달 종료를 막음
  if (page.elements.closeUploadModalButton) {
    page.elements.closeUploadModalButton.disabled = isUploading;
  }

  // 드롭존은 업로드 중 여부에 따라 비활성 스타일과 aria 상태를 갱신
  if (page.elements.uploadDropzone) {
    page.elements.uploadDropzone.classList.toggle("is-disabled", isUploading);
    page.elements.uploadDropzone.setAttribute("aria-busy", String(isUploading));
  }

  // 업로드 버튼은 스피너와 문구를 포함한 진행 상태로 전환
  if (page.elements.uploadSubmitButton) {
    page.elements.uploadSubmitButton.disabled = isUploading;
    page.elements.uploadSubmitButton.innerHTML = isUploading
      ? `<span class="loading-state__spinner" aria-hidden="true"></span><span>업로드 중...</span>`
      : escapeHtml(defaultLabel);
  }
}

// Storage 페이지의 동적 UI를 한 번에 갱신
export function renderStoragePage(page) {
  renderStorageUsage(page);
  renderStorageTabs(page);
  renderStorageFiles(page);
  renderSelectedUploadFile(page);
  renderUploadPendingState(page);
}
