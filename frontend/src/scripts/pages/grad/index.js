import { getGraduationStatus, getGradeSummary } from "/src/scripts/api/grad.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { initTutorial } from "/src/scripts/components/tutorial.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";
import { resolveErrorInfo } from "/src/scripts/utils/error.js";
import { PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";

import {
  initGradeSummarySection,
  renderGradDashboard,
  renderGradDashboardError,
  renderGradDashboardLoading,
  renderGradeSummarySection,
} from "./render.js";

function createDashboardSimpleOnboardingSteps() {
  return [
    {
      target: '[data-tutorial="dashboard-title"]',
      title: "사용 시작 안내",
      description: [
        "SKHU Track는 졸업에 필요한 요건 관리, 자료 정리 시스템입니다.",
        "먼저 프로필에서 학부 및 템플릿을 설정해야 원할한 진행이 가능합니다.",
      ],
      actionType: "navigate",
      actionLabel: "프로필 설정하러 가기",
      actionHref: PAGE_PATHS.PROFILE,
      nextOnboardingPageKey: "profile",
      nextOnboardingStepIndex: 0,
    },
    {
      target: '[data-tutorial="dashboard-title"]',
      title: "대시보드 소개",
      description: [
        "대시보드에서는 학업 정보 통계를 확인할 수 있습니다.",
        "더 자세한 설명은 각 페이지의 '튜토리얼 보기'에서 확인할 수 있습니다.",
      ],
      actionType: "close",
      actionLabel: "튜토리얼 종료",
    },
  ];
}

function createDashboardDetailedTutorialSteps() {
  return [
    {
      target: '[data-tutorial="dashboard-gpa-summary"]',
      title: "평점 요약과 추이",
      description: [
        "전체 평점과 전공 평점을 한눈에 확인할 수 있습니다.",
        "학기별 추이 차트로 최근 성적 흐름도 빠르게 볼 수 있습니다.",
      ],
    },
    {
      target: '[data-tutorial="dashboard-grade-distribution"]',
      title: "성적 분포",
      description: [
        "반영된 과목들의 성적 분포를 등급별로 보여 줍니다.",
        "어느 성적 구간에 과목이 몰려 있는지 빠르게 파악할 때 유용합니다.",
      ],
    },
    {
      target: '[data-tutorial="dashboard-policy"]',
      title: "산출 기준",
      description: [
        "재수강, F/NP 제외, 전공 평점 반영 기준 같은 계산 규칙을 확인할 수 있습니다.",
        "숫자가 어떻게 계산되는지 이해할 때 먼저 보면 좋습니다.",
      ],
    },
    {
      target: '[data-tutorial="dashboard-status"]',
      title: "졸업 현황 카드",
      description: [
        "총학점, 교양, 전공, 전공탐색 진행률을 요약해서 보여 줍니다.",
        "부족한 항목이 있으면 상세 졸업 현황 페이지에서 더 자세히 확인할 수 있습니다.",
      ],
      actionType: "close",
      actionLabel: "튜토리얼 종료",
    },
  ];
}

// 성적 요약 실패 시 사용할 빈 응답 형태 생성
function createEmptyGradeSummaryData() {
  return {
    includedCourseCount: 0,
    retakeExcludedCourseCount: 0,
    gpaExcludedCourseCount: 0,
    gradeDistribution: {
      "A+": 0,
      A0: 0,
      "B+": 0,
      B0: 0,
      "C+": 0,
      C0: 0,
      "D+": 0,
      D0: 0,
      F: 0,
      P: 0,
      NP: 0,
    },
    overallGpa: 0,
    majorGpa: 0,
    termSummaries: [],
  };
}

// local 브라우저 환경에서만 네트워크 alert 노출
function shouldAlertGradeSummaryNetworkError() {
  const hostname = String(window.location.hostname || "")
    .trim()
    .toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
}

// 성적 요약 섹션 DOM 참조 수집
function collectGradeSummaryElements(pageRoot) {
  const root = qs("[data-grade-summary-root]", pageRoot);

  // 성적 요약 섹션이 없으면 후속 렌더를 생략
  if (!root) return null;

  const panels = {};
  root.querySelectorAll("[data-grade-summary-panel]").forEach((panel) => {
    const key = panel.dataset.gradeSummaryPanel;

    // 상태 키가 없는 패널은 매핑 대상에서 제외
    if (!key) return;
    panels[key] = panel;
  });

  const gpaValues = {};
  root.querySelectorAll("[data-grade-gpa-metric]").forEach((metric) => {
    const key = metric.dataset.gradeGpaMetric;

    // 평점 종류가 없는 항목은 렌더 맵에서 제외
    if (!key) return;
    gpaValues[key] = qs("[data-grade-gpa-value]", metric);
  });

  const summaryStats = {};
  root.querySelectorAll("[data-grade-summary-stat]").forEach((item) => {
    const key = item.dataset.gradeSummaryStat;

    // 통계 키가 없는 항목은 렌더 맵에서 제외
    if (!key) return;
    summaryStats[key] = qs("[data-grade-summary-stat-value]", item);
  });

  const chartLines = {};
  root.querySelectorAll("[data-grade-trend-line]").forEach((line) => {
    const key = line.dataset.gradeTrendLine;

    // 선 종류가 없는 path는 렌더 맵에서 제외
    if (!key) return;
    chartLines[key] = line;
  });

  const chartTooltipValues = {};
  root.querySelectorAll("[data-grade-trend-tooltip-value]").forEach((item) => {
    const key = item.dataset.gradeTrendTooltipValue;

    // 툴팁 값 키가 없는 노드는 렌더 맵에서 제외
    if (!key) return;
    chartTooltipValues[key] = item;
  });

  return {
    root,
    panels,
    gpaValues,
    summaryStats,
    chartSvg: qs("[data-grade-trend-svg]", root),
    chartPlot: qs("[data-grade-trend-plot]", root),
    chartPlotInner: qs("[data-grade-trend-plot-inner]", root),
    chartGrid: qs("[data-grade-trend-grid]", root),
    chartAxes: {
      x: qs('[data-grade-trend-axis="x"]', root),
      y: qs('[data-grade-trend-axis="y"]', root),
    },
    chartArea: qs("[data-grade-trend-area]", root),
    chartLines,
    chartLabels: qs("[data-grade-trend-labels]", root),
    chartPoints: qs("[data-grade-trend-points]", root),
    chartEmpty: qs("[data-grade-trend-empty]", root),
    chartTooltip: qs("[data-grade-trend-tooltip]", root),
    chartTooltipLabel: qs("[data-grade-trend-tooltip-label]", root),
    chartTooltipValues,
    distributionSegments: qs("[data-grade-distribution-segments]", root),
    distributionEmpty: qs("[data-grade-distribution-empty]", root),
    distributionLegend: qs("[data-grade-distribution-legend]", root),
    distributionTotal: qs("[data-grade-distribution-total]", root),
    errorTitle: qs("[data-grade-error-title]", root),
    errorDescription: qs("[data-grade-error-description]", root),
  };
}

// /grad/ 페이지 전체 DOM 참조 수집
function collectGradElements(pageRoot) {
  const progressItems = {};

  pageRoot.querySelectorAll("[data-progress-item]").forEach((item) => {
    const key = item.dataset.progressKey;

    // 진행률 키가 없는 항목은 상태 맵에서 제외
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
    statusProgressList: qs("[data-grad-status-progress-list]", pageRoot),
    statusStatePanel: qs("[data-grad-status-panel]", pageRoot),
    statusStateTitle: qs("[data-grad-status-panel-title]", pageRoot),
    statusStateDescription: qs("[data-grad-status-panel-description]", pageRoot),
    statusStateAction: qs("[data-grad-status-panel-action]", pageRoot),
    missingBox: qs("[data-grad-missing-box]", pageRoot),
    missingItems,
    overlay: qs("[data-grad-overlay]", pageRoot),
    overlayMessage: qs("[data-grad-overlay-message]", pageRoot),
    progressItems,
    gradeSummary: collectGradeSummaryElements(pageRoot),
  };
}

// 상단 인사말에 표시할 사용자 정보 정리
function resolveGradViewerName(profile) {
  const rawName = String(profile?.user?.name || profile?.name || "").trim();

  if (!rawName || rawName.toLowerCase() === "unknown") return "";
  return rawName;
}

function resolveGradViewer(profile) {
  return {
    name: resolveGradViewerName(profile),
  };
}

// /grad/ 페이지 상태 객체 생성
function createGradPage(pageRoot, authResult) {
  return {
    elements: collectGradElements(pageRoot),
    viewer: resolveGradViewer(authResult?.profile),
    profile: authResult?.profile || null,
    lastGradeSummaryPayload: null,
    gradeSummaryResizeTimerId: 0,
    tutorial: null,
  };
}

// 졸업 현황 카드 데이터 로드
async function loadGraduationStatusSection(page) {
  renderGradDashboardLoading(page);

  try {
    const dashboard = await getGraduationStatus();
    renderGradDashboard(page, dashboard);
  } catch (error) {
    // 졸업 현황 실패는 전용 에러 패널로 처리
    const errorInfo = resolveErrorInfo(error, UI_MESSAGES.COMMON_ERROR);
    renderGradDashboardError(page, {
      title: "졸업 현황을 불러오지 못했어요.",
      description: errorInfo.message,
    });
  }
}

// 성적 요약 카드 데이터 로드
async function loadGradeSummarySection(page) {
  initGradeSummarySection(page, { state: "loading" });

  try {
    const gradeSummary = await getGradeSummary();
    renderGradeSummarySection(page, {
      state: "success",
      data: gradeSummary,
    });
  } catch {
    // local 브라우저에서는 네트워크 실패를 즉시 alert로 안내
    if (shouldAlertGradeSummaryNetworkError()) {
      window.alert(UI_MESSAGES.NETWORK_ERROR);
    }

    // 성적 요약 실패도 카드 레이아웃은 유지한 채 빈 데이터로 대체
    renderGradeSummarySection(page, {
      state: "success",
      data: createEmptyGradeSummaryData(),
    });
  }
}

// 대시보드 병렬 데이터 로드
async function loadDashboardData(page) {
  await Promise.allSettled([loadGraduationStatusSection(page), loadGradeSummarySection(page)]);
}

// /grad/ 페이지 초기화
export async function initGradPage() {
  const authResult = await ensureProtectedPageAccess();

  // 보호 페이지 접근에 실패하면 후속 렌더를 중단
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD,
    userName: resolveGradViewerName(authResult?.profile),
    profile: authResult?.profile,
  });

  const pageRoot = qs("[data-page-root]");

  // 페이지 루트가 없으면 초기화를 중단
  if (!pageRoot) return;

  const page = createGradPage(pageRoot, authResult);
  page.tutorial = initTutorial({
    pageKey: "dashboard",
    simpleOnboardingSteps: createDashboardSimpleOnboardingSteps(),
    detailedTutorialSteps: createDashboardDetailedTutorialSteps(),
    getContext: () => ({
      profile: page.profile,
    }),
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(page.gradeSummaryResizeTimerId);
    page.gradeSummaryResizeTimerId = window.setTimeout(() => {
      if (!page.lastGradeSummaryPayload) return;
      renderGradeSummarySection(page, page.lastGradeSummaryPayload);
    }, 120);
  });

  await loadDashboardData(page);
  page.tutorial?.refresh({ skipScroll: true });
}

initGradPage();
