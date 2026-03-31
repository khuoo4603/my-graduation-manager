import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/status.css";

import { getGraduationStatus } from "/src/scripts/api/grad.js";
import { getProfile } from "/src/scripts/api/profile.js";
import { renderHeader } from "/src/scripts/components/header.js";
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

// 학점 표기용 숫자 문자열을 공통 형식으로 변환
function formatCredits(value, fallback = "0학점") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? `${number}학점` : fallback;
}

// 필요/취득 값 기준 부족 학점을 일관된 규칙으로 계산
function resolveShortage(required, earned, shortage) {
  return Math.max(toSafeNumber(shortage), Math.max(required - earned, 0));
}

// 진행률 계산 시 0~100 범위를 벗어나지 않도록 보정
function resolveProgressPercent(earned, required) {
  if (required <= 0) return 0;
  return Math.max(0, Math.min((earned / required) * 100, 100));
}

// 상단 헤더 사용자명은 기존 공통 프로필 구조를 그대로 재사용
function resolveViewerName(profile) {
  return String(profile?.user?.name || "").trim() || "unknown";
}

// 상태 페이지 루트 DOM 참조를 한 번만 수집
function collectStatusElements(pageRoot) {
  return {
    primaryShell: qs("[data-status-primary-shell]", pageRoot),
    subtitle: qs(".status-page__subtitle", pageRoot),
    loadingPanel: qs("[data-status-loading-panel]", pageRoot),
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
    culture: {
      badge: qs("[data-status-culture-badge]", pageRoot),
      required: qs("[data-status-culture-required]", pageRoot),
      earned: qs("[data-status-culture-earned]", pageRoot),
      shortage: qs("[data-status-culture-shortage]", pageRoot),
      bar: qs("[data-status-culture-bar]", pageRoot),
      details: qs("[data-status-culture-details]", pageRoot),
    },
    seed: {
      badge: qs("[data-status-seed-badge]", pageRoot),
      required: qs("[data-status-seed-required]", pageRoot),
      earned: qs("[data-status-seed-earned]", pageRoot),
      shortage: qs("[data-status-seed-shortage]", pageRoot),
      bar: qs("[data-status-seed-bar]", pageRoot),
      details: qs("[data-status-seed-details]", pageRoot),
    },
    majorList: qs("[data-status-major-list]", pageRoot),
    majorExploration: {
      badge: qs("[data-status-major-exploration-badge]", pageRoot),
      required: qs("[data-status-major-exploration-required]", pageRoot),
      earned: qs("[data-status-major-exploration-earned]", pageRoot),
      shortage: qs("[data-status-major-exploration-shortage]", pageRoot),
      bar: qs("[data-status-major-exploration-bar]", pageRoot),
      details: qs("[data-status-major-exploration-details]", pageRoot),
    },
    missing: {
      description: qs("[data-status-missing-description]", pageRoot),
      list: qs("[data-status-missing-list]", pageRoot),
    },
    unevaluablePanel: {
      root: qs("[data-status-unevaluable-panel]", pageRoot),
      title: qs("[data-status-unevaluable-title]", pageRoot),
      description: qs("[data-status-unevaluable-description]", pageRoot),
      message: qs("[data-status-unevaluable-message]", pageRoot),
      action: qs("[data-status-unevaluable-action]", pageRoot),
    },
    errorPanel: {
      root: qs("[data-status-error-panel]", pageRoot),
      title: qs("[data-status-error-title]", pageRoot),
      description: qs("[data-status-error-description]", pageRoot),
    },
  };
}

// /grad/status/ 페이지에서 공통으로 사용할 루트 객체를 구성
function createStatusPage(pageRoot) {
  return {
    root: pageRoot,
    elements: collectStatusElements(pageRoot),
  };
}

// 프로필 응답에서 현재 학부명을 안전하게 추출
function resolveDepartmentName(profile, fallback = "미설정") {
  return String(profile?.department?.name || "").trim() || fallback;
}

// 템플릿명은 상태 응답 우선, 없으면 프로필 응답으로 보정
function resolveTemplateName(statusTemplate, profileTemplate, fallback = "미설정") {
  const templateName = String(statusTemplate?.name || profileTemplate?.name || "").trim();

  if (templateName) {
    return templateName;
  }

  const templateYear =
    toSafeNumber(statusTemplate?.year) ||
    toSafeNumber(statusTemplate?.applicableYear) ||
    toSafeNumber(profileTemplate?.year) ||
    toSafeNumber(profileTemplate?.applicableYear);

  if (templateYear > 0) {
    return `${templateYear} 졸업요건`;
  }

  return fallback;
}

// 상단 적용 정보 영역의 전공 배지는 전공명과 유형을 함께 노출
function resolveAppliedMajors(status, profile, fallback = "전공 미설정") {
  const statusMajors = Array.isArray(status?.major?.majors) ? status.major.majors : [];

  const majors = (statusMajors.length > 0 ? statusMajors : Array.isArray(profile?.majors) ? profile.majors : [])
    .map((major) => {
      const name = String(major?.name || major?.majorName || "").trim();
      const type = String(major?.type || major?.majorType || "").trim();

      if (!name) return null;
      return type ? `${name}(${type})` : name;
    })
    .filter(Boolean);

  return majors.length > 0 ? majors : [fallback];
}

// 상태 배지 텍스트와 색상 규칙을 공통 형식으로 정리
function resolveSatisfiedBadge(isSatisfied) {
  return {
    badgeText: isSatisfied ? "충족" : "미충족",
    badgeVariant: isSatisfied ? "badge--green" : "badge--red",
  };
}

// 교양/SEED/전공탐색 공통 카드용 표시값 구조를 생성
function createCardViewModel({ required, earned, shortage, isSatisfied, progressPercent, details = [] }) {
  const badge = resolveSatisfiedBadge(isSatisfied);

  return {
    ...badge,
    requiredText: formatCredits(required),
    earnedText: formatCredits(earned),
    shortageText: formatCredits(shortage),
    progressPercent,
    details,
  };
}

// 상단 요약 카드는 overall 값과 상태 배지 규칙만 사용
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
  const badge = overall?.isSatisfied
    ? { badgeText: "졸업 요건 충족", badgeVariant: "badge--green" }
    : { badgeText: "졸업 요건 미충족", badgeVariant: "badge--red" };

  return {
    ...badge,
    earned: String(toSafeNumber(overall?.earned)),
    required: String(toSafeNumber(overall?.required)),
  };
}

// 상단 카드 하단 적용 정보 영역은 실제 프로필/판정 기준을 그대로 반영
function buildAppliedInfoViewModel(status, profile) {
  return {
    department: resolveDepartmentName(profile),
    template: resolveTemplateName(status?.template, profile?.template),
    majors: resolveAppliedMajors(status, profile),
  };
}

// 교양 규칙 목록은 실제 응답 항목을 기반으로 표시 문자열만 정리
function buildCultureCardViewModel(culture) {
  const required = toSafeNumber(culture?.required);
  const earned = toSafeNumber(culture?.earned);
  const shortage = resolveShortage(required, earned, culture?.shortage);
  const rules = Array.isArray(culture?.rules) ? culture.rules : [];

  return createCardViewModel({
    required,
    earned,
    shortage,
    isSatisfied: Boolean(culture?.isSatisfied),
    progressPercent: resolveProgressPercent(earned, required),
    details: rules
      .map((rule) => {
        const category = String(rule?.category || "").trim();
        if (!category || category === "교양선택") return null;

        return `${category}: ${toSafeNumber(rule?.earned)}/${toSafeNumber(rule?.required)}학점`;
      })
      .filter(Boolean),
  });
}

// SEED 표시용 필요영역 집합 문자열을 공식 응답 구조로부터 계산
function resolveSeedRequiredAreaDisplay(seed) {
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

  if (requiredAreas.length === 0) {
    return {
      requiredAreaLabel: "",
      requiredAreaEarned: 0,
      requiredAreaProgressText: "",
    };
  }

  const requiredAreaEarned = Math.min(
    requiredAreas.reduce((maxEarned, requiredArea) => {
      const matchedArea = areaEntries.find((entry) => entry.area === requiredArea);
      return Math.max(maxEarned, matchedArea?.earned ?? 0);
    }, 0),
    minAreaCredits,
  );
  const requiredAreaLabel = requiredAreas.join(", ");

  return {
    requiredAreaLabel,
    requiredAreaEarned,
    requiredAreaProgressText: `${requiredAreaLabel}: ${requiredAreaEarned}/${minAreaCredits}학점`,
  };
}

// SEED 카드는 공식 응답을 view model로 먼저 정리한 뒤 문자열만 넘김
function buildSeedCardViewModel(seed) {
  const required = toSafeNumber(seed?.required);
  const earned = toSafeNumber(seed?.earned);
  const shortage = resolveShortage(required, earned, seed?.shortage);
  const requiredAreaDisplay = resolveSeedRequiredAreaDisplay(seed);

  return {
    ...createCardViewModel({
      required,
      earned,
      shortage,
      isSatisfied: Boolean(seed?.isSatisfied),
      progressPercent: resolveProgressPercent(earned, required),
      details: requiredAreaDisplay.requiredAreaProgressText ? [requiredAreaDisplay.requiredAreaProgressText] : [],
    }),
    requiredAreaLabel: requiredAreaDisplay.requiredAreaLabel,
    requiredAreaEarned: requiredAreaDisplay.requiredAreaEarned,
    requiredAreaProgressText: requiredAreaDisplay.requiredAreaProgressText,
    isAreaSatisfied: Boolean(seed?.isAreaSatisfied),
    isTotalSatisfied: Boolean(seed?.isTotalSatisfied),
  };
}

// 전공 카드 1장의 모든 표시값을 index.js에서 미리 완성
function buildMajorItemViewModel(item) {
  const name = String(item?.name || "").trim();
  if (!name) return null;

  const requiredTotal = toSafeNumber(item?.requiredTotal);
  const earnedTotal = toSafeNumber(item?.earnedTotal);
  const shortage = resolveShortage(requiredTotal, earnedTotal, requiredTotal - earnedTotal);
  const badge = resolveSatisfiedBadge(Boolean(item?.isSatisfied));

  return {
    title: `전공 요건(${name})`,
    ...badge,
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

// 전공 영역은 실제 전공 목록 또는 빈 상태 카드 중 하나만 선택해서 전달
function buildMajorSectionViewModel(major, mode = "success") {
  const majors = Array.isArray(major?.majors) ? major.majors.map(buildMajorItemViewModel).filter(Boolean) : [];

  if (majors.length > 0) {
    return {
      items: majors,
      emptyState: null,
    };
  }

  if (mode === "network-error") {
    return {
      items: [],
      emptyState: {
        title: "전공 요건",
        badgeText: "미충족",
        badgeVariant: "badge--red",
        requiredText: "0학점",
        earnedText: "0학점",
        shortageText: "0학점",
        progressPercent: 0,
        details: ["전공 정보를 불러오지 못했습니다."],
      },
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

// 전공탐색 하단 문구도 응답값을 그대로 읽을 수 있게 정리
function buildMajorExplorationViewModel(majorExploration) {
  const required = toSafeNumber(majorExploration?.required);
  const earned = toSafeNumber(majorExploration?.earned);
  const shortage = resolveShortage(required, earned, majorExploration?.shortage);

  return createCardViewModel({
    required,
    earned,
    shortage,
    isSatisfied: Boolean(majorExploration?.isSatisfied),
    progressPercent: resolveProgressPercent(earned, required),
    details: [
      `본인 학부 전공탐색: ${toSafeNumber(majorExploration?.earnedMyDept)}/${toSafeNumber(
        majorExploration?.requiredMyDept,
      )}학점`,
    ],
  });
}

// 부족 항목은 message 우선 정책으로 표시 문자열만 추출
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

// success 상태는 API 응답을 현재 화면 구조에 맞는 표시값으로만 정리
function buildSuccessViewModel(status, profile) {
  return {
    state: "success",
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    summary: buildSummaryViewModel(status),
    appliedInfo: buildAppliedInfoViewModel(status, profile),
    cards: {
      culture: buildCultureCardViewModel(status?.culture),
      seed: buildSeedCardViewModel(status?.seed),
      major: buildMajorSectionViewModel(status?.major, "success"),
      majorExploration: buildMajorExplorationViewModel(status?.majorExploration),
    },
    missing: buildMissingViewModel(status?.missing),
  };
}

// reason/reasons 필드는 백엔드 응답 구조 차이를 모두 수용하도록 정리
function resolveUnevaluableReasonCode(status) {
  const reasons = Array.isArray(status?.reasons)
    ? status.reasons.map((reason) => String(reason || "").trim()).filter(Boolean)
    : [];

  if (reasons.length > 0) {
    return reasons.length > 1 ? "MISSING_GRADUATION_CONTEXT" : reasons[0];
  }

  return String(status?.reason || "").trim();
}

// 판정 불가 안내 패널은 reason/message를 자연어 문구로 해석해서 전달
function buildUnevaluablePanelViewModel(status) {
  const reason = resolveUnevaluableReasonCode(status);
  const copy =
    UNEVALUABLE_REASON_COPY[reason] ||
    (reason.startsWith("MISSING_") ? UNEVALUABLE_REASON_COPY.MISSING_GRADUATION_CONTEXT : UNEVALUABLE_REASON_COPY.DEFAULT);

  return {
    title: "판정 불가",
    description: copy.description,
    message: String(status?.message || "").trim() || copy.message,
    actionLabel: "프로필로 이동",
    actionHref: PAGE_PATHS.PROFILE,
  };
}

// unevaluable 상태는 상단 카드와 판정 불가 패널만 렌더
function buildUnevaluableViewModel(status, profile) {
  return {
    state: "unevaluable",
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    summary: buildSummaryViewModel(status),
    appliedInfo: buildAppliedInfoViewModel(status, profile),
    unevaluable: buildUnevaluablePanelViewModel(status),
  };
}

// 네트워크 실패용 fallback은 0값 카드와 빈 전공 상태만 구성
function buildNetworkErrorViewModel() {
  return {
    state: "network-error",
    pageDescription: NETWORK_PAGE_DESCRIPTION,
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
    cards: {
      culture: createCardViewModel({
        required: 0,
        earned: 0,
        shortage: 0,
        isSatisfied: false,
        progressPercent: 0,
        details: [],
      }),
      seed: {
        ...createCardViewModel({
          required: 0,
          earned: 0,
          shortage: 0,
          isSatisfied: false,
          progressPercent: 0,
          details: [],
        }),
        requiredAreaLabel: "",
        requiredAreaEarned: 0,
        requiredAreaProgressText: "",
        isAreaSatisfied: false,
        isTotalSatisfied: false,
      },
      major: buildMajorSectionViewModel({ majors: [] }, "network-error"),
      majorExploration: createCardViewModel({
        required: 0,
        earned: 0,
        shortage: 0,
        isSatisfied: false,
        progressPercent: 0,
        details: ["본인 학부 전공탐색: 0/0학점"],
      }),
    },
    missing: buildMissingViewModel([], {
      emptyDescription: NETWORK_PAGE_DESCRIPTION,
      emptyText: "데이터를 불러오지 못했습니다.",
    }),
  };
}

// 로컬 개발 환경에서만 네트워크 오류 alert를 띄움
function alertNetworkErrorInLocal() {
  if (!isLocalEnv) return;
  window.alert(UI_MESSAGES.NETWORK_ERROR);
}

// 메인 status API 호출 결과에 따라 페이지 상태를 분기 렌더
async function loadStatusPage(page, authResult) {
  renderStatusPage(page, { state: "loading" });

  const profilePromise = authResult.profile ? Promise.resolve(authResult.profile) : getProfile();
  const [statusResult, profileResult] = await Promise.allSettled([getGraduationStatus(), profilePromise]);

  // status API 실패는 네트워크 오류와 일반 API 오류를 분리 처리
  if (statusResult.status !== "fulfilled") {
    const errorInfo = resolveErrorInfo(statusResult.reason, UI_MESSAGES.COMMON_ERROR);

    if (errorInfo.code === "NETWORK") {
      alertNetworkErrorInLocal();
      renderStatusPage(page, buildNetworkErrorViewModel());
      return;
    }

    redirectToErrorPage(errorInfo);
    return;
  }

  // 보조 profile 조회는 네트워크 실패면 alert 후 fallback, 일반 오류면 공통 에러 정책 우선
  if (profileResult.status !== "fulfilled") {
    const profileErrorInfo = resolveErrorInfo(profileResult.reason, UI_MESSAGES.COMMON_ERROR);

    if (profileErrorInfo.code === "NETWORK") {
      alertNetworkErrorInLocal();
    } else if (!authResult.profile) {
      redirectToErrorPage(profileErrorInfo);
      return;
    }
  }

  const status = statusResult.value;
  const profile = profileResult.status === "fulfilled" ? profileResult.value : authResult.profile || null;

  // API 성공 + isEvaluable=false일 때만 판정 불가 패널을 사용
  if (status?.isEvaluable === false) {
    renderStatusPage(page, buildUnevaluableViewModel(status, profile));
    return;
  }

  renderStatusPage(page, buildSuccessViewModel(status, profile));
}

// 보호 페이지 진입 체크 후 헤더와 페이지 렌더를 시작
async function initStatusPage() {
  const authResult = await ensureProtectedPageAccess();

  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_STATUS,
    userName: resolveViewerName(authResult.profile),
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const page = createStatusPage(pageRoot);
  await loadStatusPage(page, authResult);
}

initStatusPage();
