import { getGraduationStatus } from "/src/scripts/api/grad.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";
import { redirectToErrorPageByError, resolveErrorInfo } from "/src/scripts/utils/error.js";
import { PAGE_PATHS, UI_MESSAGES, isLocalEnv } from "/src/scripts/utils/constants.js";

import { renderGradDashboard, renderGradDashboardLoading } from "./render.js";

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
    dashboardShell: qs("[data-grad-dashboard-shell]", pageRoot),
    statusBadge: qs("[data-grad-status-badge]", pageRoot),
    missingBox: qs("[data-grad-missing-box]", pageRoot),
    missingItems,
    overlay: qs("[data-grad-overlay]", pageRoot),
    overlayMessage: qs("[data-grad-overlay-message]", pageRoot),
    progressItems,
  };
}

// 상단 인사말에 필요한 사용자 표시값 정리
function resolveGradViewer(profile) {
  return {
    name: profile?.user?.name || profile?.name || "unknown",
  };
}

// Dashboard 페이지 상태 객체 생성
function createGradPage(pageRoot, authResult) {
  return {
    elements: collectGradElements(pageRoot),
    viewer: resolveGradViewer(authResult?.profile),
  };
}

// 다른 페이지와 같은 기준으로 local 개발 환경 여부를 판단
function isLocalGradEnvironment() {
  const hostname = window.location.hostname;
  return isLocalEnv || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

// 첫 진입 시 실제 대시보드 데이터를 불러와 화면에 반영
async function loadGradDashboard(page) {
  const isLocalEnvironment = isLocalGradEnvironment();

  // local에서는 API가 없어도 Part 1 기본 화면을 유지하고, 실제 연결 환경에서만 로딩 상태를 노출
  if (!isLocalEnvironment) {
    renderGradDashboardLoading(page);
  }

  try {
    const dashboard = await getGraduationStatus();
    renderGradDashboard(page, dashboard);
  } catch (error) {
    if (isLocalEnvironment) {
      const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
      window.alert(errorInfo.message);
      return;
    }

    // 실제 연결 환경의 API 실패는 공통 에러 페이지 흐름으로 위임
    redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
  }
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
  await loadGradDashboard(page);
}

initGradPage();
