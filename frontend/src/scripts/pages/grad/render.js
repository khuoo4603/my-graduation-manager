import { clearChildren, setText } from "/src/scripts/utils/dom.js";

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
  error: {
    label: "불러오기 실패",
    tone: "red",
  },
};

const DEFAULT_NON_EVALUABLE_TITLE = "졸업 판정을 진행할 수 없어요.";
const DEFAULT_NON_EVALUABLE_MESSAGE = "프로필 기준 정보가 설정되지 않아 졸업 판정을 진행할 수 없습니다.";
const DEFAULT_STATUS_ERROR_TITLE = "졸업 현황을 불러오지 못했어요.";
const DEFAULT_STATUS_ERROR_DESCRIPTION = "잠시 후 다시 시도해주세요.";
const DEFAULT_ERROR_TITLE = "성적 요약을 불러오지 못했어요.";
const DEFAULT_ERROR_DESCRIPTION = "네트워크 연결을 확인해 주세요. 또는 잠시 후 다시 시도해 주세요.";

const GRADE_DISTRIBUTION_ORDER = ["A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "P", "NP"];
const GRADE_COLORS = {
  "A+": "#2f7df6",
  A0: "#43a3ff",
  "B+": "#5863f8",
  B0: "#8b5cf6",
  "C+": "#ec5cc7",
  C0: "#fb923c",
  "D+": "#fbbf24",
  D0: "#f59e0b",
  F: "#ef4444",
  P: "#10b981",
  NP: "#64748b",
};

const CHART_SIZE = {
  width: 1000,
  height: 320,
  paddingTop: 22,
  paddingRight: 32,
  paddingBottom: 50,
  paddingLeft: 64,
};

const SVG_NS = "http://www.w3.org/2000/svg";
const DONUT_CHART = {
  size: 220,
  strokeWidth: 24,
  radius: 98,
};

// 숫자 변환 실패 시 0으로 정규화
function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// 평점 표시값 고정 소수점 포맷
function formatGpa(value) {
  return toSafeNumber(value).toFixed(2);
}

// 개수 표시용 문자열 포맷
function formatCount(value) {
  return String(toSafeNumber(value));
}

function formatViewerGreeting(name) {
  const resolvedName = String(name || "").trim() || "unknown";
  return `안녕하세요, ${resolvedName}님`;
}

// 진행률 바 너비 계산
function getProgressWidth(earned, required) {
  // 기준 학점이 없으면 진행률 계산을 생략
  if (required <= 0) return 0;

  const ratio = (earned / required) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

// 일반 영역 진행률 응답 정규화
function buildDirectProgress(section) {
  return {
    earned: toSafeNumber(section?.earned),
    required: toSafeNumber(section?.required),
    shortage: toSafeNumber(section?.shortage),
    isSatisfied: Boolean(section?.isSatisfied),
  };
}

// 전공 진행률 응답 정규화
function buildMajorProgress(major) {
  const majors = Array.isArray(major?.majors) ? major.majors : [];

  // 전공 정보가 없으면 0 기준 진행률로 처리
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

// 졸업 현황 응답을 화면용 모델로 정리
function buildDashboardViewModel(dashboard) {
  const isEvaluable = dashboard?.isEvaluable !== false;

  return {
    statusKey: !isEvaluable ? "blocked" : dashboard?.overall?.isSatisfied ? "satisfied" : "incomplete",
    isBlocked: !isEvaluable,
    statusMessage: String(dashboard?.message || "").trim() || DEFAULT_NON_EVALUABLE_MESSAGE,
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

// 졸업 현황 진행률 카드 렌더링
function renderProgressItems(progressItems, progressData) {
  Object.entries(progressItems).forEach(([key, itemElements]) => {
    const item = progressData[key];

    // 정의되지 않은 진행률 키는 렌더에서 제외
    if (!item) return;

    const earned = toSafeNumber(item.earned);
    const required = toSafeNumber(item.required);
    const width = getProgressWidth(earned, required);

    setText(itemElements.value, `${earned} / ${required}`);
    itemElements.bar.className = item.isSatisfied ? "progress__bar progress__bar--success" : "progress__bar";
    itemElements.bar.style.width = `${width}%`;
  });
}

// 부족 요건 목록 렌더링
function renderMissingItems(missingItems, items) {
  let visibleCount = 0;

  missingItems.forEach((slot, index) => {
    const message = items[index] || "";

    // 표시할 항목이 없으면 슬롯을 비움
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

// 판정 불가 오버레이 노출 제어
function renderNonEvaluableOverlay(elements, shouldBlock, message) {
  // 오버레이 DOM이 없으면 후속 처리를 생략
  if (!elements.dashboardShell || !elements.overlay || !elements.overlayMessage) return;

  elements.dashboardShell.classList.toggle("is-blocked", shouldBlock);
  elements.overlay.hidden = !shouldBlock;
  elements.overlay.setAttribute("aria-hidden", String(!shouldBlock));
  setText(elements.overlayMessage, message);
}

// 졸업 현황 카드의 상태 패널 전환
function renderGradStatusPanel(elements, panel = null) {
  // 상태 패널 DOM이 없으면 전환을 생략
  if (!elements.statusStatePanel || !elements.statusProgressList) return;

  const isVisible = Boolean(panel);
  elements.statusStatePanel.hidden = !isVisible;
  elements.statusProgressList.hidden = isVisible;

  // 패널이 꺼져 있으면 이전 상태 문구를 초기화
  if (!isVisible) {
    setText(elements.statusStateTitle, "");
    setText(elements.statusStateDescription, "");

    // 액션 버튼도 함께 숨김
    if (elements.statusStateAction) {
      elements.statusStateAction.hidden = true;
    }

    return;
  }

  setText(elements.statusStateTitle, panel.title || "");
  setText(elements.statusStateDescription, panel.description || "");

  // 액션 버튼이 없는 카드 구조는 텍스트만 갱신
  if (!elements.statusStateAction) return;

  // 버튼 정보가 있으면 이동 CTA를 함께 노출
  if (panel.actionLabel && panel.actionHref) {
    elements.statusStateAction.hidden = false;
    elements.statusStateAction.href = panel.actionHref;
    setText(elements.statusStateAction, panel.actionLabel);
    return;
  }

  elements.statusStateAction.hidden = true;
}

// 졸업 현황 배지 색상과 텍스트 반영
function setStatusBadge(elements, status) {
  const badgeToneClass =
    status.tone === "green"
      ? "badge badge--green"
      : status.tone === "blue"
        ? "badge badge--blue"
        : status.tone === "amber"
          ? "badge badge--amber"
          : "badge badge--red";

  elements.statusBadge.className = `${badgeToneClass} ${elements.statusBadge.dataset.badgeClass || ""}`.trim();
  setText(elements.statusBadge, status.label);
}

// 로딩/에러 시 사용할 기본 진행률 상태 생성
function createEmptyProgressState() {
  return {
    total: { earned: 0, required: 0, isSatisfied: false },
    liberalArts: { earned: 0, required: 0, isSatisfied: false },
    major: { earned: 0, required: 0, isSatisfied: false },
    exploration: { earned: 0, required: 0, isSatisfied: false },
  };
}

// 졸업 현황 로딩 상태 렌더링
export function renderGradDashboardLoading(page) {
  const { elements, viewer } = page;

  setText(elements.userGreeting, formatViewerGreeting(viewer.name));
  elements.pageRoot.dataset.gradState = "loading";
  elements.dashboardShell?.setAttribute("aria-busy", "true");

  setStatusBadge(elements, STATUS_PRESETS.loading);
  renderGradStatusPanel(elements, null);
  renderProgressItems(elements.progressItems, createEmptyProgressState());
  renderMissingItems(elements.missingItems, []);

  if (elements.missingBox) {
    elements.missingBox.hidden = true;
  }

  renderNonEvaluableOverlay(elements, false, "");
}

// 졸업 현황 성공 상태 렌더링
export function renderGradDashboard(page, dashboard) {
  const { elements, viewer } = page;
  const viewModel = buildDashboardViewModel(dashboard);
  const status = STATUS_PRESETS[viewModel.statusKey] || STATUS_PRESETS.incomplete;

  setText(elements.userGreeting, formatViewerGreeting(viewer.name));
  elements.pageRoot.dataset.gradState = viewModel.isBlocked ? "blocked" : "ready";
  elements.dashboardShell?.setAttribute("aria-busy", "false");

  setStatusBadge(elements, status);

  // 판정 불가 상태는 진행률 대신 안내 패널을 노출
  if (viewModel.isBlocked) {
    renderProgressItems(elements.progressItems, createEmptyProgressState());
    renderGradStatusPanel(elements, {
      title: DEFAULT_NON_EVALUABLE_TITLE,
      description: viewModel.statusMessage,
      actionLabel: "프로필 설정으로 이동",
      actionHref: "/profile/",
    });
    renderMissingItems(elements.missingItems, []);

    if (elements.missingBox) {
      elements.missingBox.hidden = true;
    }

    renderNonEvaluableOverlay(elements, false, "");
    return;
  }

  const visibleMissingCount = renderMissingItems(elements.missingItems, viewModel.missing);
  const shouldShowMissingBox = viewModel.statusKey !== "satisfied" && visibleMissingCount > 0;

  renderGradStatusPanel(elements, null);
  renderProgressItems(elements.progressItems, viewModel.progress);

  if (elements.missingBox) {
    elements.missingBox.hidden = !shouldShowMissingBox;
  }

  renderNonEvaluableOverlay(elements, false, "");
}

// 졸업 현황 실패 상태 렌더링
export function renderGradDashboardError(page, payload = {}) {
  const { elements, viewer } = page;

  setText(elements.userGreeting, formatViewerGreeting(viewer.name));
  elements.pageRoot.dataset.gradState = "error";
  elements.dashboardShell?.setAttribute("aria-busy", "false");

  setStatusBadge(elements, STATUS_PRESETS.error);
  renderProgressItems(elements.progressItems, createEmptyProgressState());
  renderMissingItems(elements.missingItems, []);
  renderGradStatusPanel(elements, {
    title: payload.title || DEFAULT_STATUS_ERROR_TITLE,
    description: payload.description || DEFAULT_STATUS_ERROR_DESCRIPTION,
  });

  if (elements.missingBox) {
    elements.missingBox.hidden = true;
  }

  renderNonEvaluableOverlay(elements, false, "");
}

// 성적 요약 응답을 화면용 모델로 정리
function normalizeGradeSummary(summary) {
  const distributionMap = summary?.gradeDistribution || {};
  const gradeDistribution = GRADE_DISTRIBUTION_ORDER.map((grade) => ({
    grade,
    count: toSafeNumber(distributionMap[grade]),
    color: GRADE_COLORS[grade],
  }));

  const visibleGradeDistribution = gradeDistribution.filter((item) => item.count > 0);
  const termSummaries = Array.isArray(summary?.termSummaries)
    ? summary.termSummaries
        .map((item) => ({
          year: toSafeNumber(item?.year),
          term: String(item?.term || "").trim(),
          label: `${toSafeNumber(item?.year)}-${String(item?.term || "").trim()}`,
          overallGpa: toSafeNumber(item?.overallGpa),
          majorGpa: toSafeNumber(item?.majorGpa),
        }))
        .filter((item) => item.year > 0 && item.term)
    : [];

  return {
    includedCourseCount: toSafeNumber(summary?.includedCourseCount),
    retakeExcludedCourseCount: toSafeNumber(summary?.retakeExcludedCourseCount),
    gpaExcludedCourseCount: toSafeNumber(summary?.gpaExcludedCourseCount),
    overallGpa: toSafeNumber(summary?.overallGpa),
    majorGpa: toSafeNumber(summary?.majorGpa),
    gradeDistribution,
    visibleGradeDistribution,
    termSummaries,
  };
}

// GPA 차트 툴팁 숨김 처리
function hideSemesterGpaTooltip(gradeSummary) {
  gradeSummary.chartPoints?.querySelectorAll(".is-active").forEach((button) => {
    button.classList.remove("is-active");
  });

  // 툴팁 셸이 없으면 스타일 초기화만 생략
  if (!gradeSummary.chartTooltip) return;

  gradeSummary.chartTooltip.hidden = true;
  gradeSummary.chartTooltip.setAttribute("aria-hidden", "true");
  gradeSummary.chartTooltip.classList.remove("is-active", "grad-gpa-chart__tooltip-shell--below");
  gradeSummary.chartTooltip.style.removeProperty("left");
  gradeSummary.chartTooltip.style.removeProperty("top");
}

// GPA 차트 포인트 툴팁 노출 처리
function showSemesterGpaTooltip(gradeSummary, pointButton) {
  // 툴팁 셸이 없으면 hover 동작을 생략
  if (!gradeSummary.chartTooltip) return;

  hideSemesterGpaTooltip(gradeSummary);

  pointButton.classList.add("is-active");
  setText(gradeSummary.chartTooltipLabel, pointButton.dataset.termLabel || "");
  setText(gradeSummary.chartTooltipValues?.overall, pointButton.dataset.overallGpa || "");
  setText(gradeSummary.chartTooltipValues?.major, pointButton.dataset.majorGpa || "");

  gradeSummary.chartTooltip.hidden = false;
  gradeSummary.chartTooltip.setAttribute("aria-hidden", "false");
  gradeSummary.chartTooltip.classList.add("is-active");
  gradeSummary.chartTooltip.classList.toggle(
    "grad-gpa-chart__tooltip-shell--below",
    pointButton.dataset.tooltipPosition === "below"
  );
  gradeSummary.chartTooltip.style.left = pointButton.dataset.tooltipLeft || "50%";
  gradeSummary.chartTooltip.style.top = pointButton.dataset.tooltipTop || "50%";
}

// 성적 요약 섹션 레벨 상태 전환
function setGradeSummaryState(gradeSummary, state, payload = {}) {
  gradeSummary.root.dataset.gradeSummaryState = state;
  hideSemesterGpaTooltip(gradeSummary);

  Object.entries(gradeSummary.panels).forEach(([key, panel]) => {
    const isActive = key === state;
    panel.hidden = !isActive;
    panel.setAttribute("aria-hidden", String(!isActive));
  });

  // 에러 상태에서는 섹션 상단 안내 문구만 갱신
  if (state === "error") {
    setText(gradeSummary.errorTitle, payload.title || DEFAULT_ERROR_TITLE);
    setText(gradeSummary.errorDescription, payload.description || DEFAULT_ERROR_DESCRIPTION);
  }
}

// 학기별 GPA 차트 렌더링
export function renderSemesterGpaChart(gradeSummary, viewModel) {
  if (
    !gradeSummary.chartSvg ||
    !gradeSummary.chartGrid ||
    !gradeSummary.chartArea ||
    !gradeSummary.chartLines?.overall ||
    !gradeSummary.chartLines?.major ||
    !gradeSummary.chartLabels ||
    !gradeSummary.chartPoints
  ) {
    return;
  }

  hideSemesterGpaTooltip(gradeSummary);
  const isEmpty = viewModel.termSummaries.length === 0;

  // 빈 데이터면 차트 대신 안내 문구만 노출
  gradeSummary.chartSvg.hidden = isEmpty;
  gradeSummary.chartPoints.hidden = isEmpty;

  if (gradeSummary.chartEmpty) {
    gradeSummary.chartEmpty.hidden = !isEmpty;
  }

  // 그릴 학기 데이터가 없으면 기존 path와 포인트를 비움
  if (isEmpty) {
    gradeSummary.chartArea.setAttribute("d", "");
    gradeSummary.chartLines.overall.setAttribute("d", "");
    gradeSummary.chartLines.major.setAttribute("d", "");
    gradeSummary.chartGrid.replaceChildren();
    gradeSummary.chartLabels.replaceChildren();
    gradeSummary.chartPoints.replaceChildren();
    return;
  }

  const plotWidth = CHART_SIZE.width - CHART_SIZE.paddingLeft - CHART_SIZE.paddingRight;
  const plotHeight = CHART_SIZE.height - CHART_SIZE.paddingTop - CHART_SIZE.paddingBottom;
  const baselineY = CHART_SIZE.paddingTop + plotHeight;
  const maxValue = Math.max(
    4.5,
    Math.ceil(
      viewModel.termSummaries.reduce((highest, item) => {
        return Math.max(highest, item.overallGpa, item.majorGpa);
      }, 0) * 2
    ) / 2
  );
  const toPointY = (value) => {
    const ratio = Math.max(0, Math.min(1, value / (maxValue || 1)));
    return CHART_SIZE.paddingTop + plotHeight - ratio * plotHeight;
  };
  const pointStep = viewModel.termSummaries.length > 1 ? plotWidth / (viewModel.termSummaries.length - 1) : 0;
  const chartPoints = viewModel.termSummaries.map((term, index) => {
    const x = CHART_SIZE.paddingLeft + pointStep * index;

    return {
      ...term,
      x,
      overallY: toPointY(term.overallGpa),
      majorY: toPointY(term.majorGpa),
    };
  });
  const ticks = [];

  for (let tick = 0; tick <= maxValue + 0.25; tick += 0.5) {
    ticks.push(Number(tick.toFixed(1)));
  }

  const overallPath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.overallY}`).join(" ");
  const majorPath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.majorY}`).join(" ");

  if (gradeSummary.chartAxes?.x) {
    gradeSummary.chartAxes.x.setAttribute("x1", String(CHART_SIZE.paddingLeft));
    gradeSummary.chartAxes.x.setAttribute("y1", String(baselineY));
    gradeSummary.chartAxes.x.setAttribute("x2", String(CHART_SIZE.width - CHART_SIZE.paddingRight));
    gradeSummary.chartAxes.x.setAttribute("y2", String(baselineY));
  }

  if (gradeSummary.chartAxes?.y) {
    gradeSummary.chartAxes.y.setAttribute("x1", String(CHART_SIZE.paddingLeft));
    gradeSummary.chartAxes.y.setAttribute("y1", String(CHART_SIZE.paddingTop));
    gradeSummary.chartAxes.y.setAttribute("x2", String(CHART_SIZE.paddingLeft));
    gradeSummary.chartAxes.y.setAttribute("y2", String(baselineY));
  }

  gradeSummary.chartArea.setAttribute(
    "d",
    overallPath
      ? `${overallPath} L ${chartPoints[chartPoints.length - 1].x} ${baselineY} L ${chartPoints[0].x} ${baselineY} Z`
      : ""
  );
  gradeSummary.chartLines.overall.setAttribute("d", overallPath);
  gradeSummary.chartLines.major.setAttribute("d", majorPath);

  // y축 눈금과 grid line 렌더링
  const gridNodes = [];
  ticks.forEach((tick) => {
    const y = toPointY(tick);
    const group = document.createElementNS(SVG_NS, "g");
    const line = document.createElementNS(SVG_NS, "line");
    const label = document.createElementNS(SVG_NS, "text");

    line.setAttribute("x1", String(CHART_SIZE.paddingLeft));
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(CHART_SIZE.width - CHART_SIZE.paddingRight));
    line.setAttribute("y2", String(y));
    line.setAttribute("class", "grad-gpa-chart__grid-line");

    label.setAttribute("x", String(CHART_SIZE.paddingLeft - 14));
    label.setAttribute("y", String(y + 4));
    label.setAttribute("class", "grad-gpa-chart__axis-label");
    label.setAttribute("text-anchor", "end");
    label.textContent = tick.toFixed(1);

    group.append(line, label);
    gridNodes.push(group);
  });
  gradeSummary.chartGrid.replaceChildren(...gridNodes);

  // x축 학기 라벨 렌더링
  const labelNodes = chartPoints.map((point) => {
    const label = document.createElementNS(SVG_NS, "text");

    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(CHART_SIZE.height - 16));
    label.setAttribute("class", "grad-gpa-chart__axis-label grad-gpa-chart__axis-label--x");
    label.setAttribute("text-anchor", "middle");
    label.textContent = point.label;

    return label;
  });
  gradeSummary.chartLabels.replaceChildren(...labelNodes);

  // 각 시리즈 포인트와 툴팁 트리거 버튼 렌더링
  const pointButtons = [];
  chartPoints.forEach((term) => {
    [
      {
        className: "grad-gpa-chart__point grad-gpa-chart__point--overall",
        seriesName: "전체 평점",
        seriesValue: term.overallGpa,
        y: term.overallY,
      },
      {
        className: "grad-gpa-chart__point grad-gpa-chart__point--major",
        seriesName: "전공 평점",
        seriesValue: term.majorGpa,
        y: term.majorY,
      },
    ].forEach((series) => {
      const button = document.createElement("button");
      const core = document.createElement("span");

      button.type = "button";
      button.className = series.className;
      button.style.left = `${(term.x / CHART_SIZE.width) * 100}%`;
      button.style.top = `${(series.y / CHART_SIZE.height) * 100}%`;
      button.setAttribute("aria-label", `${term.label} ${series.seriesName} ${formatGpa(series.seriesValue)}`);
      button.dataset.termLabel = term.label;
      button.dataset.overallGpa = formatGpa(term.overallGpa);
      button.dataset.majorGpa = formatGpa(term.majorGpa);
      button.dataset.tooltipLeft = `${(term.x / CHART_SIZE.width) * 100}%`;
      button.dataset.tooltipTop = `${(series.y / CHART_SIZE.height) * 100}%`;
      button.dataset.tooltipPosition = series.y <= CHART_SIZE.paddingTop + 56 ? "below" : "above";

      core.className = "grad-gpa-chart__point-core";
      button.append(core);
      button.addEventListener("pointerenter", () => showSemesterGpaTooltip(gradeSummary, button));
      button.addEventListener("focus", () => showSemesterGpaTooltip(gradeSummary, button));
      button.addEventListener("pointerleave", () => {
        // 포커스가 남아 있지 않을 때만 hover 툴팁을 닫음
        if (document.activeElement !== button) {
          hideSemesterGpaTooltip(gradeSummary);
        }
      });
      button.addEventListener("blur", () => hideSemesterGpaTooltip(gradeSummary));
      pointButtons.push(button);
    });
  });
  gradeSummary.chartPoints.replaceChildren(...pointButtons);
}

// 성적 분포 도넛 차트 렌더링
export function renderGradeDistribution(gradeSummary, viewModel) {
  // 분포 카드 DOM이 없으면 렌더를 생략
  if (!gradeSummary.distributionSegments || !gradeSummary.distributionLegend || !gradeSummary.distributionTotal) return;

  const legendItems = viewModel.visibleGradeDistribution.length
    ? viewModel.visibleGradeDistribution
    : viewModel.gradeDistribution.slice(0, 1);
  const circumference = 2 * Math.PI * DONUT_CHART.radius;
  const isEmpty = viewModel.includedCourseCount === 0 || viewModel.visibleGradeDistribution.length === 0;
  let currentOffset = 0;

  setText(gradeSummary.distributionTotal, formatCount(viewModel.includedCourseCount));
  clearChildren(gradeSummary.distributionSegments);

  // 빈 데이터면 범례 대신 안내 문구만 노출
  if (gradeSummary.distributionEmpty) {
    gradeSummary.distributionEmpty.hidden = !isEmpty;
  }

  gradeSummary.distributionLegend.hidden = isEmpty;

  // 표시할 분포가 없으면 세그먼트와 범례를 비움
  if (isEmpty) {
    gradeSummary.distributionLegend.replaceChildren();
    return;
  }

  // 등급별 도넛 세그먼트 렌더링
  const segmentNodes = legendItems.map((item) => {
    const segment = document.createElementNS(SVG_NS, "circle");
    const segmentLength =
      viewModel.includedCourseCount > 0 ? (item.count / viewModel.includedCourseCount) * circumference : 0;

    segment.setAttribute("class", "grad-distribution__segment");
    segment.setAttribute("cx", String(DONUT_CHART.size / 2));
    segment.setAttribute("cy", String(DONUT_CHART.size / 2));
    segment.setAttribute("r", String(DONUT_CHART.radius));
    segment.setAttribute("fill", "none");
    segment.setAttribute("stroke", item.color);
    segment.setAttribute("stroke-width", String(DONUT_CHART.strokeWidth));
    segment.setAttribute("stroke-dasharray", `${segmentLength} ${circumference}`);
    segment.setAttribute("stroke-dashoffset", String(-currentOffset));
    currentOffset += segmentLength;

    return segment;
  });
  gradeSummary.distributionSegments.replaceChildren(...segmentNodes);

  // 등급 범례 렌더링
  const legendNodes = legendItems.map((item) => {
    const legendItem = document.createElement("div");
    const legendGrade = document.createElement("span");
    const dot = document.createElement("span");
    const label = document.createElement("span");
    const count = document.createElement("strong");

    legendItem.className = "grad-distribution__legend-item";
    legendGrade.className = "grad-distribution__legend-grade";
    dot.className = "grad-distribution__legend-dot";
    dot.style.backgroundColor = item.color;
    count.className = "grad-distribution__legend-count";

    setText(label, item.grade);
    setText(count, formatCount(item.count));

    legendGrade.append(dot, label);
    legendItem.append(legendGrade, count);

    return legendItem;
  });
  gradeSummary.distributionLegend.replaceChildren(...legendNodes);
}

// Summary & Policy 카드 숫자 렌더링
export function renderSummaryStats(gradeSummary, viewModel) {
  const stats = gradeSummary.summaryStats || {};

  setText(stats.included, formatCount(viewModel.includedCourseCount));
  setText(stats.retakeExcluded, formatCount(viewModel.retakeExcludedCourseCount));
  setText(stats.gpaExcluded, formatCount(viewModel.gpaExcludedCourseCount));
}

// 상단 GPA 배지 숫자 렌더링
function renderGradeSummaryMetrics(gradeSummary, viewModel) {
  setText(gradeSummary.gpaValues?.overall, formatGpa(viewModel.overallGpa));
  setText(gradeSummary.gpaValues?.major, formatGpa(viewModel.majorGpa));
}

// 성적 요약 섹션 전체 렌더링
export function renderGradeSummarySection(page, payload) {
  const gradeSummary = page.elements.gradeSummary;

  // 성적 요약 DOM이 없으면 렌더를 중단
  if (!gradeSummary?.root) return;

  const requestedState = payload?.state === "loading" || payload?.state === "error" ? payload.state : "success";

  // 로딩 중에는 로딩 패널만 노출
  if (requestedState === "loading") {
    setGradeSummaryState(gradeSummary, "loading", payload);
    return;
  }

  // 섹션 레벨 에러는 에러 패널로 전환
  if (requestedState === "error") {
    setGradeSummaryState(gradeSummary, "error", payload);
    return;
  }

  // 성공 응답은 normal/empty를 같은 success 레이아웃 안에서 처리
  const viewModel = normalizeGradeSummary(payload?.data);

  setGradeSummaryState(gradeSummary, "success", payload);
  renderGradeSummaryMetrics(gradeSummary, viewModel);
  renderSemesterGpaChart(gradeSummary, viewModel);
  renderGradeDistribution(gradeSummary, viewModel);
  renderSummaryStats(gradeSummary, viewModel);
}

// 성적 요약 초기 상태 진입 처리
export function initGradeSummarySection(page, initialPayload) {
  renderGradeSummarySection(page, initialPayload);
}
