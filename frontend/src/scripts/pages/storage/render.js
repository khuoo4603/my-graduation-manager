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

// 파일 한 행에 필요한 아이콘과 텍스트 UI를 함께 생성
function buildStorageFileRow(file) {
  const extension =
    String(file.name || "")
      .split(".")
      .pop()
      ?.toLowerCase() || "";
  let fileType = "generic";

  // 확장별 문서 아이콘 선택
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
            data-storage-download="${escapeHtml(file.id)}"
          >
            ${DOWNLOAD_ICON_SVG}
          </button>
          <button
            class="btn btn--ghost btn--icon storage-action-button storage-action-button--danger"
            type="button"
            aria-label="삭제"
            title="삭제"
            data-storage-delete="${escapeHtml(file.id)}"
          >
            ${DELETE_ICON_SVG}
          </button>
        </div>
      </td>
    </tr>
  `;
}

// 저장 용량 카드의 더미 수치와 진행률을 반영
export function renderStorageUsage(page) {
  setText(page.elements.usageValue, page.usage.usedLabel);
  setText(page.elements.usageCaption, page.usage.percentLabel);

  // 프로그레스 바가 있으면 퍼센트 값만큼 너비를 갱신
  if (page.elements.progressBar) {
    page.elements.progressBar.style.width = `${page.usage.percent}%`;
  }
}

// 현재 선택된 카테고리 탭 스타일을 갱신
export function renderStorageTabs(page) {
  page.elements.categoryButtons.forEach((button) => {
    const isActive = button.dataset.storageCategory === page.activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

// 현재 탭 기준 파일 목록과 empty 상태를 함께 렌더링
export function renderStorageFiles(page) {
  let visibleFiles = page.files;

  // 전체 탭이 아니면 선택된 카테고리 파일만 추려서 보여줌
  if (page.activeCategory !== "all") {
    visibleFiles = page.files.filter((file) => file.categoryId === page.activeCategory);
  }

  const hasFiles = visibleFiles.length > 0;

  setText(page.elements.fileCount, String(visibleFiles.length));

  // 파일 목록 영역이 있으면 행 HTML을 한 번에 갱신
  if (page.elements.fileRows) {
    page.elements.fileRows.innerHTML = hasFiles ? visibleFiles.map(buildStorageFileRow).join("") : "";
  }

  // 현재 탭에 파일이 없으면 empty 문구를 노출
  if (page.elements.emptyState) {
    page.elements.emptyState.hidden = hasFiles;
  }

  // 테이블 래퍼는 파일이 있을 때만 보이게 처리
  if (page.elements.tableWrap) {
    page.elements.tableWrap.hidden = !hasFiles;
    page.elements.tableWrap.setAttribute("aria-hidden", String(!hasFiles));
  }
}

// 업로드 모달에서 현재 선택된 파일명을 표시
export function renderSelectedUploadFile(page) {
  const fileName = page.selectedFile?.name || "선택된 파일이 없습니다.";
  setText(page.elements.uploadFileName, fileName);
}

// Storage 페이지의 동적 UI를 한 번에 갱신
export function renderStoragePage(page) {
  renderStorageUsage(page);
  renderStorageTabs(page);
  renderStorageFiles(page);
  renderSelectedUploadFile(page);
}
