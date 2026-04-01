import { ApiError } from "/src/scripts/api/client.js";
import { getStorageFiles, getStorageUsage } from "/src/scripts/api/storage.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { isLocalEnv, PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";
import { redirectToErrorPageByError } from "/src/scripts/utils/error.js";

import { bindStorageEvents } from "./events.js";
import { renderStoragePage } from "./render.js";

const STORAGE_MAX_BYTES = 1_073_741_824;

const STORAGE_CATEGORIES = {
  all: { label: "전체", apiValue: "" },
  requirements: { label: "졸업요건", apiValue: "GRAD_REQUIREMENTS" },
  documents: { label: "졸업제출서류", apiValue: "GRAD_SUBMISSIONS" },
  project: { label: "프로젝트", apiValue: "PROJECT" },
  portfolio: { label: "포트폴리오", apiValue: "PORTFOLIO" },
  "class-materials": { label: "수업자료", apiValue: "CLASS_MATERIALS" },
};

const STORAGE_CATEGORY_LABELS = {
  GRAD_REQUIREMENTS: "졸업요건",
  GRAD_SUBMISSIONS: "졸업제출서류",
  PROJECT: "프로젝트",
  PORTFOLIO: "포트폴리오",
  CLASS_MATERIALS: "수업자료",
};

// Storage 페이지에서 사용하는 DOM 요소를 한 번에 수집
function collectStorageElements(pageRoot) {
  return {
    usageValue: qs("[data-storage-usage-value]", pageRoot),
    usageCaption: qs("[data-storage-usage-caption]", pageRoot),
    progressBar: qs("[data-storage-progress-bar]", pageRoot),
    categoryButtons: Array.from(pageRoot.querySelectorAll("[data-storage-category]")),
    fileCount: qs("[data-storage-file-count]", pageRoot),
    fileRows: qs("[data-storage-file-rows]", pageRoot),
    emptyState: qs("[data-storage-empty]", pageRoot),
    tableWrap: qs("[data-storage-table-wrap]", pageRoot),
    openUploadModalButton: qs("[data-open-upload-modal]", pageRoot),
    uploadModal: qs("[data-storage-upload-modal]", pageRoot),
    closeUploadModalButton: qs("[data-close-upload-modal]", pageRoot),
    cancelUploadButton: qs("[data-cancel-upload-modal]", pageRoot),
    uploadCategorySelect: qs("[data-upload-category-select]", pageRoot),
    uploadDropzone: qs("[data-upload-dropzone]", pageRoot),
    selectUploadFileButton: qs("[data-select-upload-file]", pageRoot),
    uploadFileInput: qs("[data-upload-file-input]", pageRoot),
    uploadFileName: qs("[data-upload-file-name]", pageRoot),
    uploadSubmitButton: qs("[data-upload-submit]", pageRoot),
  };
}

// 바이트 값을 화면 표시용 단위 문자열로 변환
function formatBytes(bytes) {
  const normalizedBytes = Number(bytes);

  // 숫자가 아니거나 0 이하이면 0 B로 고정
  if (!Number.isFinite(normalizedBytes) || normalizedBytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = normalizedBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 || value >= 10 ? 0 : 1;
  const formattedValue = value.toFixed(digits).replace(/\.0$/, "");
  return `${formattedValue} ${units[unitIndex]}`;
}

// 사용률 값을 소수 첫째 자리까지 맞춰 표시
function formatPercent(percent) {
  const normalizedPercent = Number(percent);

  // 비정상 값이면 0으로 보정
  if (!Number.isFinite(normalizedPercent) || normalizedPercent <= 0) {
    return "0";
  }

  return normalizedPercent.toFixed(1).replace(/\.0$/, "");
}

// local 네트워크 fallback에 사용하는 기본 usage 상태 생성
function createFallbackStorageUsage() {
  return {
    usedBytes: 0,
    maxBytes: STORAGE_MAX_BYTES,
    percent: 0,
    usedLabel: `0 B / ${formatBytes(STORAGE_MAX_BYTES)} 사용 중`,
    percentLabel: "0% 사용 중",
    isLimitReached: false,
  };
}

// 서버의 ISO 시각을 YYYY-MM-DD HH:mm 형식으로 변환
function formatUploadedAt(value) {
  const date = new Date(value);

  // 날짜 파싱이 불가능하면 원본 문자열을 그대로 사용
  if (Number.isNaN(date.getTime())) {
    return String(value || "");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// storage usage 응답을 화면에서 바로 쓸 수 있는 형태로 정리
function normalizeStorageUsage(response) {
  const usedBytes = Math.max(0, Number(response?.usedBytes) || 0);
  const maxBytes = Math.max(1, Number(response?.maxBytes) || STORAGE_MAX_BYTES);
  const clampedPercent = Math.min(100, (usedBytes / maxBytes) * 100);

  return {
    usedBytes,
    maxBytes,
    percent: clampedPercent,
    usedLabel: `${formatBytes(usedBytes)} / ${formatBytes(STORAGE_MAX_BYTES)} 사용 중`,
    percentLabel: `${formatPercent(clampedPercent)}% 사용 중`,
    isLimitReached: usedBytes >= STORAGE_MAX_BYTES || clampedPercent >= 100,
  };
}

// local 환경에서만 네트워크 오류를 페이지 내부 fallback으로 처리
function isLocalStorageNetworkError(error) {
  // local 환경이 아니면 네트워크 fallback을 적용하지 않음
  if (!isLocalEnv) return false;

  return error instanceof ApiError && (error.code === "NETWORK_ERROR" || error.status === 0);
}

// local 네트워크 오류가 나면 storage 화면을 빈 상태 fallback으로 유지
function handleLocalStorageNetworkFallback(page) {
  window.alert(UI_MESSAGES.NETWORK_ERROR);
  page.usage = createFallbackStorageUsage();
  page.files = [];
  renderStoragePage(page);
}

// storage 파일 목록 응답을 테이블 렌더링용 구조로 정리
function normalizeStorageFiles(response) {
  const items = Array.isArray(response?.items) ? response.items : [];

  return items
    .map((item) => {
      const fileId = item?.fileId;
      // fileId가 없으면 테이블 row로 렌더링하지 않음
      if (fileId == null) return null;

      const uploadedAtValue = item?.uploadedAt || "";
      return {
        id: String(fileId),
        name: item?.originalFilename || "",
        category: item?.category || "",
        categoryLabel: STORAGE_CATEGORY_LABELS[item?.category] || item?.category || "",
        sizeBytes: Math.max(0, Number(item?.sizeBytes) || 0),
        sizeLabel: formatBytes(item?.sizeBytes),
        uploadedAt: formatUploadedAt(uploadedAtValue),
        uploadedAtValue,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = new Date(left.uploadedAtValue).getTime();
      const rightTime = new Date(right.uploadedAtValue).getTime();
      const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
      const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0;

      // 업로드 일시는 최신순으로 우선 정렬
      if (safeLeftTime !== safeRightTime) {
        return safeRightTime - safeLeftTime;
      }

      // 같은 시각이면 파일명을 오름차순으로 정렬
      return left.name.localeCompare(right.name, "ko");
    });
}

// Storage 페이지에서 공유하는 기본 상태 객체 생성
function createStoragePage(elements) {
  return {
    elements,
    categoryOptions: STORAGE_CATEGORIES,
    activeCategory: "all",
    usage: createFallbackStorageUsage(),
    files: [],
    selectedFile: null,
    isUploadModalOpen: false,
    dragDepth: 0,
    pending: {
      isFilesLoading: false,
      isUploadSubmitting: false,
      deletingFileId: "",
    },
    loadUsage: null,
    loadFiles: null,
    reloadStorageData: null,
    isLocalNetworkError: null,
    applyLocalNetworkFallback: null,
  };
}

// 상단 저장 용량 카드 데이터만 다시 조회
async function loadStorageUsage(page) {
  const response = await getStorageUsage();
  page.usage = normalizeStorageUsage(response);
  renderStoragePage(page);
}

// 현재 탭 기준 파일 목록을 다시 조회
async function loadStorageFiles(page, categoryId = page.activeCategory) {
  const nextCategoryId = page.categoryOptions[categoryId] ? categoryId : "all";
  const category = page.categoryOptions[nextCategoryId].apiValue;
  const response = await getStorageFiles(category);

  page.activeCategory = nextCategoryId;
  page.files = normalizeStorageFiles(response);
  renderStoragePage(page);
}

// 업로드/삭제 이후 usage와 파일 목록을 함께 다시 조회
async function reloadStorageData(page) {
  const category = page.categoryOptions[page.activeCategory]?.apiValue || "";

  const [usageResponse, filesResponse] = await Promise.all([getStorageUsage(), getStorageFiles(category)]);

  page.usage = normalizeStorageUsage(usageResponse);
  page.files = normalizeStorageFiles(filesResponse);
  renderStoragePage(page);
}

// Storage 페이지 초기 진입 처리
export async function initStoragePage() {
  const authResult = await ensureProtectedPageAccess();
  // 로그인되지 않았으면 페이지 초기화를 중단
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.STORAGE,
    userName: authResult.profile?.user?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  // 페이지 루트가 없으면 렌더링을 진행하지 않음
  if (!pageRoot) return;

  const page = createStoragePage(collectStorageElements(pageRoot));
  page.loadUsage = async () => {
    await loadStorageUsage(page);
  };
  page.loadFiles = async (categoryId = page.activeCategory) => {
    await loadStorageFiles(page, categoryId);
  };
  page.reloadStorageData = async () => {
    await reloadStorageData(page);
  };
  page.isLocalNetworkError = (error) => isLocalStorageNetworkError(error);
  page.applyLocalNetworkFallback = () => {
    handleLocalStorageNetworkFallback(page);
  };

  renderStoragePage(page);
  bindStorageEvents(page);

  try {
    await Promise.all([page.loadUsage(), page.loadFiles(page.activeCategory)]);
  } catch (error) {
    // local 네트워크 오류는 alert + fallback 화면으로 유지
    if (page.isLocalNetworkError(error)) {
      page.applyLocalNetworkFallback();
      return;
    }

    redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
  }
}

initStoragePage();
