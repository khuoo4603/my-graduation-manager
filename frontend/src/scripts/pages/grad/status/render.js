import { setText } from "/src/scripts/utils/dom.js";

const BADGE_VARIANTS = ["badge--blue", "badge--green", "badge--red", "badge--amber"];

// HTML 주입 시 특수문자를 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 상태 배지는 전달받은 variant만 적용되도록 정리
function setBadgeVariant(element, variant) {
  if (!element) return;

  BADGE_VARIANTS.forEach((className) => element.classList.remove(className));

  if (variant && BADGE_VARIANTS.includes(variant)) {
    element.classList.add(variant);
  }
}

// progress bar width는 계산된 최종 값만 반영
function setProgress(bar, progressPercent) {
  if (!bar) return;

  const resolvedPercent =
    typeof progressPercent === "number" ? Math.max(0, Math.min(progressPercent, 100)) : 0;

  bar.style.width = `${resolvedPercent}%`;
}

// 상단 적용 정보 배지 목록을 공통 형식으로 렌더
function renderBadgeRow(container, values, variant = "") {
  if (!container) return;

  container.innerHTML = values
    .map((value) => `<span class="badge${variant ? ` ${variant}` : ""}">${escapeHtml(value)}</span>`)
    .join("");
}

// 카드 하단 리스트는 전달받은 문자열 배열만 그대로 렌더
function renderDetailList(container, items) {
  if (!container) return;

  if (!items || items.length === 0) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = items
    .map((item) => `<li class="status-note-list__item">${escapeHtml(item)}</li>`)
    .join("");
}

// 상단 요약 카드의 상태 배지와 점수만 갱신
function renderSummary(elements, summary) {
  setBadgeVariant(elements.badge, summary.badgeVariant);
  setText(elements.badge, summary.badgeText);
  setText(elements.earned, summary.earned);
  setText(elements.required, summary.required);
}

// 페이지 상단 설명 문구를 현재 상태에 맞게 교체
function renderPageDescription(element, description) {
  if (!element || !description) return;
  setText(element, description);
}

// 상단 카드 하단 적용 정보 영역을 표시용 값 기준으로 렌더
function renderAppliedInfo(elements, appliedInfo) {
  if (!appliedInfo) return;

  setText(elements.department, appliedInfo.department);
  setText(elements.template, appliedInfo.template);
  renderBadgeRow(elements.majors, appliedInfo.majors || []);
}

// 교양/SEED/전공탐색 공통 카드 구조는 전달받은 표시값만 반영
function renderCard(elements, card) {
  if (!elements || !card) return;

  setBadgeVariant(elements.badge, card.badgeVariant);
  setText(elements.badge, card.badgeText);
  setText(elements.required, card.requiredText);
  setText(elements.earned, card.earnedText);
  setText(elements.shortage, card.shortageText);
  setProgress(elements.bar, card.progressPercent);
  renderDetailList(elements.details, card.details);
}

// 전공 카드 한 장 HTML을 현재 표시값 기준으로 생성
function renderMajorCardHtml(card) {
  return `
    <article class="card status-eval-card">
      <div class="status-eval-card__header">
        <h2 class="status-eval-card__title">${escapeHtml(card.title)}</h2>
        <span class="badge ${escapeHtml(card.badgeVariant)} status-eval-card__status">${escapeHtml(card.badgeText)}</span>
      </div>
      <dl class="status-value-list">
        <div class="status-value-list__row">
          <dt>필요 학점</dt>
          <dd>${escapeHtml(card.requiredText)}</dd>
        </div>
        <div class="status-value-list__row">
          <dt>취득 학점</dt>
          <dd>${escapeHtml(card.earnedText)}</dd>
        </div>
        <div class="status-value-list__row status-value-list__row--danger">
          <dt>부족 학점</dt>
          <dd>${escapeHtml(card.shortageText)}</dd>
        </div>
      </dl>
      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width: ${card.progressPercent}%"></div>
      </div>
      <ul class="status-note-list">
        ${card.details.map((detail) => `<li class="status-note-list__item">${escapeHtml(detail)}</li>`).join("")}
      </ul>
    </article>
  `;
}

// 전공 영역은 실제 카드 목록 또는 빈 상태 카드 중 하나만 렌더
function renderMajorCards(container, majorSection) {
  if (!container || !majorSection) return;

  if (Array.isArray(majorSection.items) && majorSection.items.length > 0) {
    container.innerHTML = majorSection.items.map(renderMajorCardHtml).join("");
    return;
  }

  if (!majorSection.emptyState) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = renderMajorCardHtml(majorSection.emptyState);
}

// 부족 항목 카드의 리스트는 message 중심 표시 규칙만 적용
function renderMissingList(container, missing) {
  if (!container || !missing) return;

  if (!missing.items || missing.items.length === 0) {
    container.innerHTML = `
      <li class="status-missing-list__item status-missing-list__item--empty">
        <span class="status-missing-list__icon" aria-hidden="true">-</span>
        <span>${escapeHtml(missing.emptyText || "현재 부족한 항목이 없습니다.")}</span>
      </li>
    `;
    return;
  }

  container.innerHTML = missing.items
    .map(
      (item) => `
        <li class="status-missing-list__item">
          <span class="status-missing-list__icon" aria-hidden="true">x</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `,
    )
    .join("");
}

// 판정 불가 패널은 해석이 끝난 문구와 액션만 반영
function renderUnevaluablePanel(elements, panel) {
  if (!elements || !panel) return;

  const actionWrap = elements.action?.closest(".status-unevaluable-card__actions") || null;

  elements.root.classList.remove("status-unevaluable-card--danger");
  setText(elements.title, panel.title);
  setText(elements.description, panel.description);
  setText(elements.message, panel.message);
  elements.description.hidden = !panel.description;
  elements.message.hidden = !panel.message;

  if (!elements.action) return;

  const hasAction = Boolean(panel.actionLabel && panel.actionHref);

  if (actionWrap) {
    actionWrap.hidden = !hasAction;
  }

  elements.action.hidden = !hasAction;

  if (hasAction) {
    setText(elements.action, panel.actionLabel);
    elements.action.setAttribute("href", panel.actionHref);
    return;
  }

  elements.action.removeAttribute("href");
  setText(elements.action, "");
}

// 에러 패널은 제목과 설명만 갱신
function renderErrorPanel(elements, panel) {
  if (!elements || !panel) return;

  setText(elements.title, panel.title);
  setText(elements.description, panel.description);
}

// 현재 상태에 따라 loading/success/unevaluable/error 패널 노출을 제어
function showStatePanels(elements, state) {
  const isSuccess = state === "success";
  const isNetworkError = state === "network-error";
  const isUnevaluable = state === "unevaluable";
  const isLoading = state === "loading";
  const isError = state === "error";

  elements.primaryShell.hidden = !(isSuccess || isNetworkError || isUnevaluable);
  elements.successShell.hidden = !(isSuccess || isNetworkError);
  elements.unevaluablePanel.root.hidden = !isUnevaluable;
  elements.loadingPanel.hidden = !isLoading;
  elements.errorPanel.root.hidden = !isError;
}

// /grad/status/ 페이지 전체 DOM은 최종 view model만 받아 반영
export function renderStatusPage(page, viewModel) {
  const { elements } = page;

  renderPageDescription(elements.subtitle, viewModel.pageDescription);

  if (viewModel.summary) {
    renderSummary(elements.summary, viewModel.summary);
  }

  if (viewModel.appliedInfo) {
    renderAppliedInfo(elements.appliedInfo, viewModel.appliedInfo);
  }

  if (viewModel.state === "success" || viewModel.state === "network-error") {
    renderCard(elements.culture, viewModel.cards.culture);
    renderCard(elements.seed, viewModel.cards.seed);
    renderCard(elements.majorExploration, viewModel.cards.majorExploration);
    renderMajorCards(elements.majorList, viewModel.cards.major);
    setText(elements.missing.description, viewModel.missing.description);
    renderMissingList(elements.missing.list, viewModel.missing);
  }

  if (viewModel.state === "unevaluable") {
    renderUnevaluablePanel(elements.unevaluablePanel, viewModel.unevaluable);
  }

  if (viewModel.state === "error") {
    renderErrorPanel(elements.errorPanel, viewModel.error);
  }

  showStatePanels(elements, viewModel.state);
}
