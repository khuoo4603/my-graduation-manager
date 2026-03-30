import { setText } from "/src/scripts/utils/dom.js";

const STATUS_PRESETS = {
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

const GRAD_DASHBOARD_SCENARIOS = {
  summary: {
    statusKey: "incomplete",
    isBlocked: false,
    progress: {
      total: { current: 35, required: 130 },
      liberalArts: { current: 11, required: 34 },
      major: { current: 20, required: 60 },
      exploration: { current: 6, required: 12 },
    },
    missing: [
      "전공 핵심 학점 부족 (12학점 필요)",
      "교양 학점 부족 (3학점 필요)",
      "전공탐색 학점 부족 (3학점 필요)",
    ],
    overlayMessage: "학부 또는 졸업요건 템플릿 정보가 설정되지 않아 판정을 진행할 수 없습니다.",
  },
  blocked: {
    statusKey: "blocked",
    isBlocked: true,
    progress: {
      total: { current: 35, required: 130 },
      liberalArts: { current: 11, required: 34 },
      major: { current: 20, required: 60 },
      exploration: { current: 6, required: 12 },
    },
    missing: [
      "전공 핵심 학점 부족 (12학점 필요)",
      "교양 학점 부족 (3학점 필요)",
      "전공탐색 학점 부족 (3학점 필요)",
    ],
    overlayMessage: "학부 또는 졸업요건 템플릿 정보가 설정되지 않아 판정을 진행할 수 없습니다.",
  },
};

// 상태 배지 색상 클래스 선택
function getBadgeClassName(tone) {
  if (tone === "green") return "badge badge--green";
  if (tone === "blue") return "badge badge--blue";
  if (tone === "amber") return "badge badge--amber";
  return "badge badge--red";
}

// 상태 배지 텍스트와 색상 반영
function setBadge(element, label, tone) {
  if (!element) return;

  element.className = `${getBadgeClassName(tone)} ${element.dataset.badgeClass || ""}`.trim();
  setText(element, label);
}

// 진행률 width 계산
function getProgressWidth(current, required) {
  if (!required || Number(required) <= 0) return 0;

  const ratio = (Number(current) / Number(required)) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

// 상단 인사말 반영
function renderViewerContext(elements, viewer) {
  setText(elements.userGreeting, `안녕하세요, ${viewer.name}님`);
  setText(elements.userDepartment, viewer.department);
}

// progress bar 영역 반영
function renderProgressItems(progressItems, progressData) {
  Object.entries(progressItems).forEach(([key, itemElements]) => {
    const item = progressData[key];
    if (!item) return;

    const isComplete = Number(item.current) >= Number(item.required);
    const width = getProgressWidth(item.current, item.required);

    setText(itemElements.value, `${item.current} / ${item.required}`);
    itemElements.bar.className = isComplete ? "progress__bar progress__bar--success" : "progress__bar";
    itemElements.bar.style.width = `${width}%`;
  });
}

// 부족 항목 목록 반영
function renderMissingItems(missingItems, items) {
  missingItems.forEach((slot, index) => {
    const message = items[index] || "";

    // 빈 슬롯은 숨겨서 최대 3개 구조만 유지
    if (!message) {
      slot.root.hidden = true;
      setText(slot.text, "");
      return;
    }

    slot.root.hidden = false;
    setText(slot.text, message);
  });
}

// 판정 불가 오버레이 토글
function renderNonEvaluableOverlay(elements, shouldBlock, message) {
  elements.dashboardShell.classList.toggle("is-blocked", shouldBlock);
  elements.overlay.hidden = !shouldBlock;
  elements.overlay.setAttribute("aria-hidden", String(!shouldBlock));
  setText(elements.overlayMessage, message);
}

// 현재 데모 상태에 맞는 시나리오 선택
function getGradScenario(view) {
  return GRAD_DASHBOARD_SCENARIOS[view] || GRAD_DASHBOARD_SCENARIOS.summary;
}

// Dashboard 화면 렌더
export function renderGradDashboard(page) {
  const scenario = getGradScenario(page.demoView);
  const status = STATUS_PRESETS[scenario.statusKey] || STATUS_PRESETS.incomplete;

  page.elements.pageRoot.dataset.gradDemoView = page.demoView;

  renderViewerContext(page.elements, page.viewer);
  setBadge(page.elements.statusBadge, status.label, status.tone);
  renderProgressItems(page.elements.progressItems, scenario.progress);
  renderMissingItems(page.elements.missingItems, scenario.missing);
  renderNonEvaluableOverlay(page.elements, scenario.isBlocked, scenario.overlayMessage);
}
