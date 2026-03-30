import { renderHeader } from "/src/scripts/components/header.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";

import { renderGradDashboard } from "./render.js";

// Dashboard 페이지 DOM 참조 수집
function collectGradElements(pageRoot) {
  const progressItems = {};

  pageRoot.querySelectorAll("[data-progress-item]").forEach((item) => {
    const key = item.dataset.progressKey;
    if (!key) return;

    progressItems[key] = {
      root: item,
      value: qs("[data-progress-value]", item),
      bar: qs("[data-progress-bar]", item),
    };
  });

  const missingItems = Array.from(pageRoot.querySelectorAll("[data-grad-missing-item]")).map((item) => ({
    root: item,
    text: qs("[data-grad-missing-text]", item),
  }));

  return {
    pageRoot,
    userGreeting: qs("[data-grad-user-greeting]", pageRoot),
    userDepartment: qs("[data-grad-user-department]", pageRoot),
    dashboardShell: qs("[data-grad-dashboard-shell]", pageRoot),
    statusBadge: qs("[data-grad-status-badge]", pageRoot),
    missingItems,
    overlay: qs("[data-grad-overlay]", pageRoot),
    overlayMessage: qs("[data-grad-overlay-message]", pageRoot),
    progressItems,
  };
}

// 상단 인사말 표시값 정리
function resolveGradViewer(profile) {
  return {
    name: profile?.user?.name || profile?.name || "unknown",
    department: profile?.department?.name || "졸업요건의 요약 내용입니다.",
  };
}

// 데모 미리보기 상태 판별
function resolveGradDemoView(pageRoot) {
  const preview = new URLSearchParams(window.location.search).get("preview");

  // 쿼리스트링 미리보기가 있으면 HTML 기본값보다 우선
  if (preview === "blocked") return "blocked";

  return pageRoot.dataset.gradDemoView === "blocked" ? "blocked" : "summary";
}

// Dashboard 페이지 상태 객체 생성
function createGradPage(pageRoot, authResult) {
  return {
    elements: collectGradElements(pageRoot),
    viewer: resolveGradViewer(authResult?.profile),
    demoView: resolveGradDemoView(pageRoot),
  };
}

// Dashboard 페이지 초기화
export async function initGradPage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD,
    userName: authResult.profile?.user?.name || authResult.profile?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const page = createGradPage(pageRoot, authResult);
  renderGradDashboard(page);
}

initGradPage();
