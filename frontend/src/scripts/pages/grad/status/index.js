import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/status.css";

import { getGraduationStatus } from "/src/scripts/api/grad.js";
import { getProfile } from "/src/scripts/api/profile.js";
import { renderHeader } from "/src/scripts/components/header.js";
import { initTutorial } from "/src/scripts/components/tutorial.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { isLocalEnv, PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";
import { redirectToErrorPage, resolveErrorInfo } from "/src/scripts/utils/error.js";

import { renderStatusPage } from "./render.js";

const DEFAULT_PAGE_DESCRIPTION = "상세 졸업 판정 결과를 확인할 수 있습니다.";
const NETWORK_PAGE_DESCRIPTION = "네트워크 연결을 확인해 주세요";
const DEFAULT_MISSING_DESCRIPTION = "졸업 가능 상태가 되려면 아래 항목을 충족해야 합니다.";

const UNEVALUABLE_REASON_COPY = {
  PROFILE_TEMPLATE_MISSING: {
    description: "졸업 판정에 필요한 프로필 정보가 아직 충분하지 않습니다.",
    message: "프로필에서 학부, 템플릿, 전공 정보를 먼저 설정해 주세요.",
  },
  MISSING_DEPARTMENT: {
    description: "졸업 판정에 필요한 프로필 정보가 아직 충분하지 않습니다.",
    message: "프로필에서 학부 정보를 먼저 설정해 주세요.",
  },
  MISSING_GRADUATION_TEMPLATE: {
    description: "졸업 판정에 필요한 프로필 정보가 아직 충분하지 않습니다.",
    message: "프로필에서 템플릿 정보를 먼저 설정해 주세요.",
  },
  MISSING_GRADUATION_CONTEXT: {
    description: "졸업 판정에 필요한 프로필 정보가 아직 충분하지 않습니다.",
    message: "프로필에서 학부, 템플릿, 전공 정보를 먼저 확인해 주세요.",
  },
  DEFAULT: {
    description: "졸업 판정에 필요한 정보를 아직 확인할 수 없습니다.",
    message: "잠시 후 다시 시도하거나 프로필 정보를 확인해 주세요.",
  },
};

// 숫자 기반 응답 값을 안전한 number로 정리
function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// 학점 표기 문자열 변환
function formatCredits(value, fallback = "0학점") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? `${number}학점` : fallback;
}

// 부족 학점 계산
function resolveShortage(required, earned, shortage) {
  return Math.max(toSafeNumber(shortage), Math.max(required - earned, 0));
}

// 진행률 보정
function resolveProgressPercent(earned, required) {
  if (required <= 0) return 0;
  return Math.max(0, Math.min((earned / required) * 100, 100));
}

// 헤더 사용자명 정리
function resolveViewerName(profile) {
  return String(profile?.user?.name || "").trim();
}

// 상태 페이지 DOM 참조 수집
function collectStatusElements(pageRoot) {
  return {
    primaryShell: qs("[data-status-primary-shell]", pageRoot),
    subtitle: qs(".status-page__subtitle", pageRoot),
    body: qs("[data-status-body]", pageRoot),
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
  };
}

// /grad/status/ 페이지 상태 객체 생성
function createStatusPage(pageRoot) {
  return {
    root: pageRoot,
    elements: collectStatusElements(pageRoot),
    profile: null,
    tutorial: null,
  };
}

function createStatusOnboardingSteps() {
  return [
    {
      target: '[data-tutorial="status-title"]',
      title: "졸업 현황 페이지",
      description: [
        "이 페이지는 입력보다 확인에 가까운 화면입니다.",
        "현재 졸업 진행 상황과 부족한 항목을 빠르게 점검할 수 있습니다.",
      ],
    },
    {
      target: '[data-tutorial="status-overall-card"]',
      title: "전체 현황 카드",
      description: [
        "전체 취득 학점과 적용 중인 학부, 템플릿, 전공 정보를 함께 보여 줍니다.",
        "먼저 이 카드에서 현재 기준이 무엇인지 확인하면 좋습니다.",
      ],
    },
    {
      target: '[data-tutorial="status-rule-section"]',
      title: "영역별 판정 카드",
      description: [
        "교양, SEED, 전공, 전공탐색 영역별 진행 상태를 확인하는 구역입니다.",
        "어느 영역이 부족한지 먼저 파악한 뒤 이후 수강 계획에 반영하면 됩니다.",
      ],
    },
    {
      target: '[data-tutorial="status-missing-section"]',
      title: "부족 항목 확인",
      description: [
        "부족한 항목은 이 영역에서 다시 한 번 정리해서 보여 줍니다.",
        "다음으로 자료함을 확인하면서 관련 파일 관리 흐름도 함께 익혀 보겠습니다.",
      ],
      actionType: "navigate",
      actionLabel: "자료함으로 이동",
      actionHref: PAGE_PATHS.STORAGE,
      nextOnboardingPageKey: "storage",
      nextOnboardingStepIndex: 0,
    },
  ];
}

function createStatusPageTutorialSteps() {
  return [
    {
      target: '[data-tutorial="status-overall-card"]',
      title: "전체 현황",
      description: [
        "전체 취득 학점과 적용 중인 기준 정보를 한 번에 보여 줍니다.",
        "현재 어떤 학부와 템플릿으로 계산 중인지 여기서 먼저 확인합니다.",
      ],
    },
    {
      target: '[data-tutorial="status-rule-section"]',
      title: "영역별 카드",
      description: [
        "교양, SEED, 전공, 전공탐색 영역의 충족 여부를 비교할 수 있습니다.",
        "각 카드의 부족 학점을 기준으로 이후 수강 계획을 세우면 됩니다.",
      ],
    },
    {
      target: '[data-tutorial="status-missing-section"]',
      title: "부족 항목",
      description: [
        "부족한 항목을 모아 보여 주는 영역입니다.",
        "우선순위를 정할 때 가장 먼저 확인하면 좋은 요약입니다.",
      ],
      actionType: "close",
      actionLabel: "튜토리얼 종료",
    },
  ];
}

// 상단 요약 카드 view model 생성
function buildSummaryViewModel(status) {
  if (status?.isEvaluable === false) {
    return {
      badgeText: "판정 불가",
      badgeVariant: "badge--red",
      earned: "--",
      required: "--",
    };
  }

  const overall = status?.overall ?? {};

  return {
    badgeText: overall?.isSatisfied ? "졸업 요건 충족" : "졸업 요건 미충족",
    badgeVariant: overall?.isSatisfied ? "badge--green" : "badge--red",
    earned: String(toSafeNumber(overall?.earned)),
    required: String(toSafeNumber(overall?.required)),
  };
}

// 상단 적용 정보 view model 생성
function buildAppliedInfoViewModel(status, profile) {
  const department = String(profile?.department?.name || "").trim() || "미설정";

  const statusTemplate = status?.template;
  const profileTemplate = profile?.template;
  const templateName = String(statusTemplate?.name || profileTemplate?.name || "").trim();
  const templateYear =
    toSafeNumber(statusTemplate?.year) ||
    toSafeNumber(statusTemplate?.applicableYear) ||
    toSafeNumber(profileTemplate?.year) ||
    toSafeNumber(profileTemplate?.applicableYear);

  const statusMajors = Array.isArray(status?.major?.majors) ? status.major.majors : [];
  const majors = (statusMajors.length > 0 ? statusMajors : Array.isArray(profile?.majors) ? profile.majors : [])
    .map((major) => {
      const name = String(major?.name || major?.majorName || "").trim();
      const type = String(major?.type || major?.majorType || "").trim();

      if (!name) return null;
      return type ? `${name}(${type})` : name;
    })
    .filter(Boolean);

  return {
    department,
    template: templateName || (templateYear > 0 ? `${templateYear} 졸업요건` : "미설정"),
    majors: majors.length > 0 ? majors : ["전공 미설정"],
  };
}

// 교양 카드 view model 생성
function buildCultureCardViewModel(culture) {
  const required = toSafeNumber(culture?.required);
  const earned = toSafeNumber(culture?.earned);
  const shortage = resolveShortage(required, earned, culture?.shortage);
  const isSatisfied = Boolean(culture?.isSatisfied);
  const rules = Array.isArray(culture?.rules) ? culture.rules : [];

  return {
    badgeText: isSatisfied ? "충족" : "미충족",
    badgeVariant: isSatisfied ? "badge--green" : "badge--red",
    requiredText: formatCredits(required),
    earnedText: formatCredits(earned),
    shortageText: formatCredits(shortage),
    progressPercent: resolveProgressPercent(earned, required),
    details: rules
      .map((rule) => {
        const category = String(rule?.category || "").trim();
        if (!category || category === "교양선택") return null;

        return `${category}: ${toSafeNumber(rule?.earned)}/${toSafeNumber(rule?.required)}학점`;
      })
      .filter(Boolean),
  };
}

// SEED 카드 view model 생성
function buildSeedCardViewModel(seed) {
  const required = toSafeNumber(seed?.required);
  const earned = toSafeNumber(seed?.earned);
  const shortage = resolveShortage(required, earned, seed?.shortage);
  const isSatisfied = Boolean(seed?.isSatisfied);

  const requiredAreas = Array.isArray(seed?.requiredAreas)
    ? seed.requiredAreas.map((area) => String(area || "").trim()).filter(Boolean)
    : [];
  const minAreaCredits = toSafeNumber(seed?.minAreaCredits);
  const areaEntries = Array.isArray(seed?.areas)
    ? seed.areas.map((area) => ({
        area: String(area?.area || "").trim(),
        earned: toSafeNumber(area?.earned),
      }))
    : [];

  let requiredAreaLabel = "";
  let requiredAreaEarned = 0;
  let requiredAreaProgressText = "";

  if (requiredAreas.length > 0) {
    requiredAreaEarned = Math.min(
      requiredAreas.reduce((maxEarned, requiredArea) => {
        const matchedArea = areaEntries.find((entry) => entry.area === requiredArea);
        return Math.max(maxEarned, matchedArea?.earned ?? 0);
      }, 0),
      minAreaCredits,
    );
    requiredAreaLabel = requiredAreas.join(", ");
    requiredAreaProgressText = `${requiredAreaLabel}: ${requiredAreaEarned}/${minAreaCredits}학점`;
  }

  return {
    badgeText: isSatisfied ? "충족" : "미충족",
    badgeVariant: isSatisfied ? "badge--green" : "badge--red",
    requiredText: formatCredits(required),
    earnedText: formatCredits(earned),
    shortageText: formatCredits(shortage),
    progressPercent: resolveProgressPercent(earned, required),
    details: requiredAreaProgressText ? [requiredAreaProgressText] : [],
    requiredAreaLabel,
    requiredAreaEarned,
    requiredAreaProgressText,
    isAreaSatisfied: Boolean(seed?.isAreaSatisfied),
    isTotalSatisfied: Boolean(seed?.isTotalSatisfied),
  };
}

// 전공 카드 view model 생성
function buildMajorItemViewModel(item) {
  const name = String(item?.name || "").trim();
  if (!name) return null;

  const requiredTotal = toSafeNumber(item?.requiredTotal);
  const earnedTotal = toSafeNumber(item?.earnedTotal);
  const shortage = resolveShortage(requiredTotal, earnedTotal, requiredTotal - earnedTotal);
  const isSatisfied = Boolean(item?.isSatisfied);

  return {
    title: `전공 요건(${name})`,
    badgeText: isSatisfied ? "충족" : "미충족",
    badgeVariant: isSatisfied ? "badge--green" : "badge--red",
    requiredText: formatCredits(requiredTotal),
    earnedText: formatCredits(earnedTotal),
    shortageText: formatCredits(shortage),
    progressPercent: resolveProgressPercent(earnedTotal, requiredTotal),
    details: [
      `전공 필수: ${toSafeNumber(item?.earnedCore)}/${toSafeNumber(item?.requiredCore)}학점`,
      `전공 선택: ${toSafeNumber(item?.earnedElective)}학점`,
    ],
  };
}

// 전공 섹션 view model 생성
function buildMajorSectionViewModel(major) {
  const majors = Array.isArray(major?.majors) ? major.majors.map(buildMajorItemViewModel).filter(Boolean) : [];

  if (majors.length > 0) {
    return {
      items: majors,
      emptyState: null,
    };
  }

  return {
    items: [],
    emptyState: {
      title: "전공 요건",
      badgeText: "전공 미등록",
      badgeVariant: "badge--amber",
      requiredText: "--",
      earnedText: "--",
      shortageText: "--",
      progressPercent: 0,
      details: ["등록된 전공이 없습니다."],
    },
  };
}

// 전공탐색 카드 view model 생성
function buildMajorExplorationViewModel(majorExploration) {
  const required = toSafeNumber(majorExploration?.required);
  const earned = toSafeNumber(majorExploration?.earned);
  const shortage = resolveShortage(required, earned, majorExploration?.shortage);
  const isSatisfied = Boolean(majorExploration?.isSatisfied);

  return {
    badgeText: isSatisfied ? "충족" : "미충족",
    badgeVariant: isSatisfied ? "badge--green" : "badge--red",
    requiredText: formatCredits(required),
    earnedText: formatCredits(earned),
    shortageText: formatCredits(shortage),
    progressPercent: resolveProgressPercent(earned, required),
    details: [
      `본인 학부 전공탐색: ${toSafeNumber(majorExploration?.earnedMyDept)}/${toSafeNumber(
        majorExploration?.requiredMyDept,
      )}학점`,
    ],
  };
}

// 부족 항목 view model 생성
function buildMissingViewModel(missing, options = {}) {
  const itemsSource = Array.isArray(missing) ? missing : Array.isArray(missing?.missing) ? missing.missing : [];
  const items = itemsSource
    .map((item) => {
      const message = String(item?.message || "").trim();
      const domain = String(item?.domain || "").trim();
      return message || domain || null;
    })
    .filter(Boolean);

  return {
    description:
      items.length > 0
        ? options.description || DEFAULT_MISSING_DESCRIPTION
        : options.emptyDescription || "현재 부족한 항목이 없습니다.",
    emptyText: options.emptyText || "현재 부족한 항목이 없습니다.",
    items,
  };
}

// success 상태 view model 생성
function buildSuccessViewModel(status, profile) {
  return {
    state: "success",
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    summary: buildSummaryViewModel(status),
    appliedInfo: buildAppliedInfoViewModel(status, profile),
    cards: {
      culture: buildCultureCardViewModel(status?.culture),
      seed: buildSeedCardViewModel(status?.seed),
      major: buildMajorSectionViewModel(status?.major),
      majorExploration: buildMajorExplorationViewModel(status?.majorExploration),
    },
    missing: buildMissingViewModel(status?.missing),
  };
}

// 판정 불가 카드 view model 생성
function buildUnevaluablePanelViewModel(status) {
  const reasons = Array.isArray(status?.reasons)
    ? status.reasons.map((reason) => String(reason || "").trim()).filter(Boolean)
    : [];
  const reason =
    reasons.length > 0
      ? reasons.length > 1
        ? "MISSING_GRADUATION_CONTEXT"
        : reasons[0]
      : String(status?.reason || "").trim();
  const fallbackCopy = reason.startsWith("MISSING_")
    ? UNEVALUABLE_REASON_COPY.MISSING_GRADUATION_CONTEXT
    : UNEVALUABLE_REASON_COPY.DEFAULT;
  const copy = UNEVALUABLE_REASON_COPY[reason] || fallbackCopy;

  return {
    title: "판정 불가",
    description: copy.description,
    message: String(status?.message || "").trim() || copy.message,
    actionLabel: "프로필로 이동",
    actionHref: PAGE_PATHS.PROFILE,
  };
}

// unevaluable 상태 view model 생성
function buildUnevaluableViewModel(status, profile) {
  return {
    state: "unevaluable",
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    summary: buildSummaryViewModel(status),
    appliedInfo: buildAppliedInfoViewModel(status, profile),
    unevaluable: buildUnevaluablePanelViewModel(status),
  };
}

// network-error 상태 view model 생성
function buildNetworkErrorViewModel() {
  return {
    state: "network-error",
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    summary: {
      badgeText: "졸업현황을 불러오지 못했습니다",
      badgeVariant: "badge--red",
      earned: "0",
      required: "0",
    },
    appliedInfo: {
      department: "-",
      template: "-",
      majors: ["-"],
    },
    unevaluable: {
      title: "졸업현황을 불러오지 못했습니다",
      description: NETWORK_PAGE_DESCRIPTION,
      message: "",
      actionLabel: "",
      actionHref: "",
    },
  };
}

// 로컬 개발 환경에서만 네트워크 alert 노출
function alertNetworkErrorInLocal() {
  if (!isLocalEnv) return;
  window.alert(UI_MESSAGES.NETWORK_ERROR);
}

// 상태 페이지 데이터 로드
async function loadStatusPage(page, authResult) {
  renderStatusPage(page, {
    state: "loading",
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
  });

  const profilePromise = authResult.profile ? Promise.resolve(authResult.profile) : getProfile();
  const [statusResult, profileResult] = await Promise.allSettled([getGraduationStatus(), profilePromise]);

  if (statusResult.status !== "fulfilled") {
    const errorInfo = resolveErrorInfo(statusResult.reason, UI_MESSAGES.COMMON_ERROR);

    if (errorInfo.code === "NETWORK") {
      // status API 네트워크 실패는 fallback 카드 사용
      alertNetworkErrorInLocal();
      renderStatusPage(page, buildNetworkErrorViewModel());
      return;
    }

    redirectToErrorPage(errorInfo);
    return;
  }

  if (profileResult.status !== "fulfilled") {
    const profileErrorInfo = resolveErrorInfo(profileResult.reason, UI_MESSAGES.COMMON_ERROR);

    if (profileErrorInfo.code === "NETWORK") {
      // profile 조회 실패도 동일한 fallback 카드 사용
      alertNetworkErrorInLocal();
      renderStatusPage(page, buildNetworkErrorViewModel());
      return;
    }

    if (!authResult.profile) {
      redirectToErrorPage(profileErrorInfo);
      return;
    }
  }

  const status = statusResult.value;
  const profile = profileResult.status === "fulfilled" ? profileResult.value : authResult.profile || null;
  page.profile = profile;

  if (status?.isEvaluable === false) {
    // 판정 불가면 안내 카드만 렌더링
    renderStatusPage(page, buildUnevaluableViewModel(status, profile));
    return;
  }

  // success면 상세 카드와 부족 항목 렌더링
  renderStatusPage(page, buildSuccessViewModel(status, profile));
}

// /grad/status/ 페이지 초기화
async function initStatusPage() {
  const authResult = await ensureProtectedPageAccess();

  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_STATUS,
    userName: resolveViewerName(authResult.profile),
    profile: authResult.profile,
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const page = createStatusPage(pageRoot);
  await loadStatusPage(page, authResult);
  page.tutorial = initTutorial({
    pageKey: "status",
    onboardingSteps: createStatusOnboardingSteps(),
    pageSteps: createStatusPageTutorialSteps(),
    getContext: () => ({
      profile: page.profile,
    }),
  });
  page.tutorial?.refresh({ skipScroll: true });
}

initStatusPage();
