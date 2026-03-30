import { setText } from "/src/scripts/utils/dom.js";

const STATUS_PRESETS = {
  loading: {
    label: "불러오는 중",
    tone: "blue",
  },
  satisfied: {
    label: "졸업요건 충족",
    tone: "green",
  },
  incomplete: {
    label: "졸업요건 미충족",
    tone: "red",
  },
  blocked: {
    label: "졸업 판정 불가",
    tone: "red",
  },
};

const DEFAULT_NON_EVALUABLE_MESSAGE = "졸업 판정을 진행할 수 없습니다.";

// 숫자형 응답 필드를 안전하게 정규화
function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// 진행률 width 계산
function getProgressWidth(earned, required) {
  if (required <= 0) return 0;

  const ratio = (earned / required) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

// overall, culture, majorExploration처럼 earned/required가 바로 내려오는 영역 정리
function buildDirectProgress(section) {
  return {
    earned: toSafeNumber(section?.earned),
    required: toSafeNumber(section?.required),
    shortage: toSafeNumber(section?.shortage),
    isSatisfied: Boolean(section?.isSatisfied),
  };
}

// major는 per-major 배열만 내려오므로 대시보드 한 줄 표현용으로만 합산
function buildMajorProgress(major) {
  const majors = Array.isArray(major?.majors) ? major.majors : [];

  if (!major?.hasMajors || majors.length === 0) {
    return {
      earned: 0,
      required: 0,
      shortage: 0,
      isSatisfied: Boolean(major?.isSatisfied),
    };
  }

  let earned = 0;
  let required = 0;

  majors.forEach((item) => {
    const earnedTotal =
      "earnedTotal" in (item || {})
        ? toSafeNumber(item.earnedTotal)
        : toSafeNumber(item?.earnedCore) + toSafeNumber(item?.earnedElective);

    earned += earnedTotal;
    required += toSafeNumber(item?.requiredTotal);
  });

  return {
    earned,
    required,
    shortage: Math.max(required - earned, 0),
    isSatisfied: Boolean(major?.isSatisfied),
  };
}

// API 응답을 현재 대시보드 구조에 맞는 뷰 모델로 정리
function buildDashboardViewModel(dashboard) {
  const isEvaluable = dashboard?.isEvaluable !== false;

  return {
    // 판정 불가는 에러가 아니라 200 OK 기반 정상 응답 UI 상태
    statusKey: !isEvaluable ? "blocked" : dashboard?.overall?.isSatisfied ? "satisfied" : "incomplete",
    isBlocked: !isEvaluable,
    overlayMessage: dashboard?.message || DEFAULT_NON_EVALUABLE_MESSAGE,
    progress: {
      total: buildDirectProgress(dashboard?.overall),
      liberalArts: buildDirectProgress(dashboard?.culture),
      major: buildMajorProgress(dashboard?.major),
      exploration: buildDirectProgress(dashboard?.majorExploration),
    },
    missing: Array.isArray(dashboard?.missing)
      ? dashboard.missing
          .slice(0, 3)
          .map((item) => String(item?.message || "").trim())
          .filter(Boolean)
      : [],
  };
}

// progress bar 영역 반영
function renderProgressItems(progressItems, progressData) {
  Object.entries(progressItems).forEach(([key, itemElements]) => {
    const item = progressData[key];
    if (!item) return;

    const earned = toSafeNumber(item.earned);
    const required = toSafeNumber(item.required);
    const width = getProgressWidth(earned, required);

    setText(itemElements.value, `${earned} / ${required}`);
    itemElements.bar.className = item.isSatisfied ? "progress__bar progress__bar--success" : "progress__bar";
    itemElements.bar.style.width = `${width}%`;
  });
}

// 부족 항목 목록 반영
function renderMissingItems(missingItems, items) {
  let visibleCount = 0;

  missingItems.forEach((slot, index) => {
    const message = items[index] || "";

    // 실제 부족 항목이 없는 슬롯은 숨겨서 최대 3개 구조만 유지
    if (!message) {
      slot.root.hidden = true;
      setText(slot.text, "");
      return;
    }

    slot.root.hidden = false;
    setText(slot.text, message);
    visibleCount += 1;
  });

  return visibleCount;
}

// 판정 불가 오버레이 토글
function renderNonEvaluableOverlay(elements, shouldBlock, message) {
  elements.dashboardShell.classList.toggle("is-blocked", shouldBlock);
  elements.overlay.hidden = !shouldBlock;
  elements.overlay.setAttribute("aria-hidden", String(!shouldBlock));
  setText(elements.overlayMessage, message);
}

// 첫 API 응답 전 로딩 상태 반영
export function renderGradDashboardLoading(page) {
  const { elements, viewer } = page;
  const status = STATUS_PRESETS.loading;

  setText(elements.userGreeting, `안녕하세요, ${viewer.name}님`);
  elements.pageRoot.dataset.gradState = "loading";
  elements.dashboardShell?.setAttribute("aria-busy", "true");

  elements.statusBadge.className = `${status.tone === "blue" ? "badge badge--blue" : "badge badge--red"} ${elements.statusBadge.dataset.badgeClass || ""}`.trim();
  setText(elements.statusBadge, status.label);

  renderProgressItems(elements.progressItems, {
    total: { earned: 0, required: 0, isSatisfied: false },
    liberalArts: { earned: 0, required: 0, isSatisfied: false },
    major: { earned: 0, required: 0, isSatisfied: false },
    exploration: { earned: 0, required: 0, isSatisfied: false },
  });
  renderMissingItems(elements.missingItems, []);
  if (elements.missingBox) {
    elements.missingBox.hidden = true;
  }
  renderNonEvaluableOverlay(elements, false, "");
}

// Dashboard 화면 렌더
export function renderGradDashboard(page, dashboard) {
  const { elements, viewer } = page;
  const viewModel = buildDashboardViewModel(dashboard);
  const status = STATUS_PRESETS[viewModel.statusKey] || STATUS_PRESETS.incomplete;
  const visibleMissingCount = renderMissingItems(elements.missingItems, viewModel.missing);
  const shouldShowMissingBox = !viewModel.isBlocked && viewModel.statusKey !== "satisfied" && visibleMissingCount > 0;

  setText(elements.userGreeting, `안녕하세요, ${viewer.name}님`);
  elements.pageRoot.dataset.gradState = viewModel.isBlocked ? "blocked" : "ready";
  elements.dashboardShell?.setAttribute("aria-busy", "false");

  elements.statusBadge.className = `${status.tone === "green" ? "badge badge--green" : status.tone === "blue" ? "badge badge--blue" : status.tone === "amber" ? "badge badge--amber" : "badge badge--red"} ${elements.statusBadge.dataset.badgeClass || ""}`.trim();
  setText(elements.statusBadge, status.label);

  renderProgressItems(elements.progressItems, viewModel.progress);

  if (elements.missingBox) {
    elements.missingBox.hidden = !shouldShowMissingBox;
  }

  renderNonEvaluableOverlay(elements, viewModel.isBlocked, viewModel.overlayMessage);
}
