import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/status.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";

import { renderStatusPage } from "./render.js";

const DEFAULT_MOCK_STATE = "success";
const VALID_STATES = new Set(["loading", "success", "unevaluable", "error"]);

const SUCCESS_VIEW_MODEL = {
  state: "success",
  summary: {
    badgeText: "졸업 요건 미충족",
    badgeVariant: "badge--red",
    earned: "35",
    required: "130",
  },
  appliedInfo: {
    department: "소프트웨어공학과",
    template: "2022학번 졸업요건",
    majors: [
      { name: "컴퓨터공학", type: "주전공" },
      { name: "소프트웨어공학", type: "복수전공" },
    ],
  },
  cards: {
    overall: {
      required: 130,
      earned: 35,
      shortage: 95,
      isSatisfied: false,
      details: [],
    },
    culture: {
      required: 34,
      earned: 11,
      shortage: 23,
      isSatisfied: false,
      details: ["일반교양: 8/12학점", "언어: 3/6학점", "비판적 사고: 0/6학점"],
    },
    seed: {
      required: 12,
      earned: 6,
      shortage: 6,
      requiredAreas: ["Economy", "Environment", "Diversity"],
      minAreaCredits: 3,
      areas: [
        { area: "Science", earned: 3 },
        { area: "Economy", earned: 0 },
        { area: "Environment", earned: 0 },
        { area: "Diversity", earned: 0 },
      ],
      isAreaSatisfied: false,
      isTotalSatisfied: false,
      isSatisfied: false,
    },
    major: [
      {
        name: "컴퓨터공학",
        type: "주전공",
        requiredTotal: 60,
        earnedTotal: 20,
        earnedCore: 12,
        requiredCore: 24,
        earnedElective: 8,
        isSatisfied: false,
      },
      {
        name: "소프트웨어공학",
        type: "복수전공",
        requiredTotal: 36,
        earnedTotal: 18,
        earnedCore: 9,
        requiredCore: 15,
        earnedElective: 9,
        isSatisfied: false,
      },
    ],
    majorExploration: {
      required: 6,
      earned: 0,
      shortage: 6,
      isSatisfied: false,
      details: ["본인 학부 전공 탐색: 0/3학점"],
    },
  },
  missing: {
    description: "졸업 가능 상태가 되려면 아래 항목을 충족해야 합니다.",
    items: [
      "전공 필수 학점 부족 (12학점 필요)",
      "SEED 필요영역 학점 부족 (3학점 필요)",
      "비판적 사고 교양 필요 (6학점 필요)",
      "전공탐색 필요 (6학점 필요)",
    ],
  },
};

const UNEVALUABLE_VIEW_MODEL = {
  state: "unevaluable",
  summary: {
    badgeText: "판정 불가",
    badgeVariant: "badge--amber",
    earned: "--",
    required: "--",
  },
  appliedInfo: {
    department: "소프트웨어공학과",
    template: "미설정",
    majors: [],
  },
  unevaluable: {
    title: "판정 불가",
    reason: "PROFILE_TEMPLATE_MISSING",
    actionLabel: "프로필로 이동",
    actionHref: "/profile/",
  },
};

const LOADING_VIEW_MODEL = {
  state: "loading",
};

const ERROR_VIEW_MODEL = {
  state: "error",
  error: {
    title: "졸업 판정 정보를 불러오지 못했습니다.",
    description: "현재는 목업 상태입니다. API 연결은 다음 단계에서 추가됩니다.",
  },
};

const MOCK_VIEW_MODELS = {
  loading: LOADING_VIEW_MODEL,
  success: SUCCESS_VIEW_MODEL,
  unevaluable: UNEVALUABLE_VIEW_MODEL,
  error: ERROR_VIEW_MODEL,
};

// 헤더에 표시할 사용자 이름 정규화
function resolveViewerName(profile) {
  const rawName = String(profile?.user?.name || profile?.name || "").trim();

  // 이름이 비어 있거나 unknown이면 기본 표시값으로 대체
  if (!rawName || rawName.toLowerCase() === "unknown") return "unknown";
  return rawName;
}

// query string 기반 mock 상태 결정
function resolveMockState() {
  const params = new URLSearchParams(window.location.search);
  const requestedState = String(params.get("mock") || DEFAULT_MOCK_STATE).trim().toLowerCase();

  return VALID_STATES.has(requestedState) ? requestedState : DEFAULT_MOCK_STATE;
}

// 공통 상세 카드 DOM 참조 묶음 수집
function collectCardElements(pageRoot, key) {
  return {
    required: qs(`[data-status-${key}-required]`, pageRoot),
    earned: qs(`[data-status-${key}-earned]`, pageRoot),
    shortage: qs(`[data-status-${key}-shortage]`, pageRoot),
    bar: qs(`[data-status-${key}-bar]`, pageRoot),
    badge: qs(`[data-status-${key}-badge]`, pageRoot),
    details: qs(`[data-status-${key}-details]`, pageRoot),
  };
}

// /grad/status/ 페이지 전체 DOM 참조 수집
function collectStatusElements(pageRoot) {
  return {
    primaryShell: qs("[data-status-primary-shell]", pageRoot),
    successShell: qs("[data-status-success-shell]", pageRoot),
    summary: {
      badge: qs("[data-status-summary-badge]", pageRoot),
      earned: qs("[data-status-summary-earned]", pageRoot),
      required: qs("[data-status-summary-required]", pageRoot),
    },
    appliedInfo: {
      department: qs("[data-status-department-badge]", pageRoot),
      template: qs("[data-status-template-badge]", pageRoot),
      majors: qs("[data-status-major-type-badges]", pageRoot),
    },
    loadingPanel: qs("[data-status-loading-panel]", pageRoot),
    errorPanel: {
      root: qs("[data-status-error-panel]", pageRoot),
      title: qs("[data-status-error-title]", pageRoot),
      description: qs("[data-status-error-description]", pageRoot),
    },
    unevaluablePanel: {
      root: qs("[data-status-unevaluable-panel]", pageRoot),
      title: qs("[data-status-unevaluable-title]", pageRoot),
      description: qs("[data-status-unevaluable-description]", pageRoot),
      message: qs("[data-status-unevaluable-message]", pageRoot),
      action: qs("[data-status-unevaluable-action]", pageRoot),
    },
    overall: collectCardElements(pageRoot, "overall"),
    culture: collectCardElements(pageRoot, "culture"),
    seed: collectCardElements(pageRoot, "seed"),
    majorList: qs("[data-status-major-list]", pageRoot),
    majorExploration: collectCardElements(pageRoot, "major-exploration"),
    missing: {
      description: qs("[data-status-missing-description]", pageRoot),
      list: qs("[data-status-missing-list]", pageRoot),
    },
  };
}

// /grad/status/ 페이지 초기 진입 처리
export async function initStatusPage() {
  const authResult = await ensureProtectedPageAccess();

  // 보호 페이지 접근에 실패하면 후속 렌더를 중단
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_STATUS,
    userName: resolveViewerName(authResult.profile),
  });

  const pageRoot = qs("[data-page-root]");

  // 페이지 루트가 없으면 초기화를 중단
  if (!pageRoot) return;

  const viewState = resolveMockState();

  renderStatusPage(
    {
      elements: collectStatusElements(pageRoot),
    },
    MOCK_VIEW_MODELS[viewState] || MOCK_VIEW_MODELS[DEFAULT_MOCK_STATE],
  );
}

initStatusPage();
