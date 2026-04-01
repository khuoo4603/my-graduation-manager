import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";

import { bindStorageEvents } from "./events.js";
import { renderStoragePage } from "./render.js";

const MOCK_STORAGE_USAGE = {
  usedLabel: "245 MB / 1 GB 사용 중",
  percentLabel: "24.5% 사용 중",
  percent: 24.5,
};

const MOCK_STORAGE_FILES = [
  {
    id: "file-001",
    name: "성적증명서_2024.pdf",
    categoryId: "requirements",
    categoryLabel: "졸업요건",
    sizeLabel: "245 KB",
    uploadedAt: "2024-02-15 14:30",
  },
  {
    id: "file-002",
    name: "졸업신청서.docx",
    categoryId: "documents",
    categoryLabel: "졸업제출서류",
    sizeLabel: "128 KB",
    uploadedAt: "2024-02-10 09:15",
  },
  {
    id: "file-003",
    name: "학점현황.xlsx",
    categoryId: "requirements",
    categoryLabel: "졸업요건",
    sizeLabel: "156 KB",
    uploadedAt: "2024-02-08 11:20",
  },
  {
    id: "file-004",
    name: "캡스톤_발표자료.pptx",
    categoryId: "project",
    categoryLabel: "프로젝트",
    sizeLabel: "2.3 MB",
    uploadedAt: "2024-02-03 17:05",
  },
  {
    id: "file-005",
    name: "SEED_수료증.jpg",
    categoryId: "requirements",
    categoryLabel: "졸업요건",
    sizeLabel: "892 KB",
    uploadedAt: "2024-01-28 16:45",
  },
  {
    id: "file-006",
    name: "프로젝트_데모.mp4",
    categoryId: "project",
    categoryLabel: "프로젝트",
    sizeLabel: "45 MB",
    uploadedAt: "2024-01-21 13:10",
  },
  {
    id: "file-007",
    name: "발표_음성녹음.mp3",
    categoryId: "project",
    categoryLabel: "프로젝트",
    sizeLabel: "8.5 MB",
    uploadedAt: "2024-01-17 10:40",
  },
  {
    id: "file-008",
    name: "소스코드_백업.zip",
    categoryId: "project",
    categoryLabel: "프로젝트",
    sizeLabel: "12 MB",
    uploadedAt: "2024-01-10 18:20",
  },
  {
    id: "file-009",
    name: "main.py",
    categoryId: "class-materials",
    categoryLabel: "수업자료",
    sizeLabel: "15 KB",
    uploadedAt: "2024-01-05 08:55",
  },
  {
    id: "file-010",
    name: "과제제출용.txt",
    categoryId: "class-materials",
    categoryLabel: "수업자료",
    sizeLabel: "3 KB",
    uploadedAt: "2023-12-28 19:10",
  },
  {
    id: "file-011",
    name: "기타자료_원본.bin",
    categoryId: "project",
    categoryLabel: "프로젝트",
    sizeLabel: "4.2 MB",
    uploadedAt: "2023-12-18 15:00",
  },
];

// Storage 페이지에서 사용할 DOM 요소를 한 번에 수집
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

// Storage 페이지에서 공유할 기본 상태 객체 생성
function createStoragePage(elements) {
  return {
    elements,
    usage: MOCK_STORAGE_USAGE,
    files: MOCK_STORAGE_FILES,
    activeCategory: "all",
    selectedFile: null,
    isUploadModalOpen: false,
    dragDepth: 0,
  };
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
  renderStoragePage(page);
  bindStorageEvents(page);
}

initStoragePage();
