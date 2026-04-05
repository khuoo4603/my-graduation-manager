import { setText } from "/src/scripts/utils/dom.js";

const BADGE_VARIANTS = ["badge--blue", "badge--green", "badge--red", "badge--amber"];
const DEFAULT_PAGE_DESCRIPTION = "상세 졸업 판정 결과를 확인할 수 있습니다.";

// HTML 문자열 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 배지 class 조합
function getBadgeClass(variant) {
  return `badge${BADGE_VARIANTS.includes(variant) ? ` ${variant}` : ""}`;
}

// Overall summary 렌더링
function renderSummary(elements, summary) {
  if (!elements || !summary) return;

  elements.badge.className = `${getBadgeClass(summary.badgeVariant)} status-summary-card__badge`;
  setText(elements.badge, summary.badgeText);
  setText(elements.earned, summary.earned);
  setText(elements.required, summary.required);
}

// 적용 정보 렌더링
function renderAppliedInfo(elements, appliedInfo) {
  if (!elements || !appliedInfo) return;

  setText(elements.department, appliedInfo.department);
  setText(elements.template, appliedInfo.template);
  elements.majors.innerHTML = (appliedInfo.majors || [])
    .map((value) => `<span class="${getBadgeClass("")}">${escapeHtml(value)}</span>`)
    .join("");
}

// 평가 카드 HTML 생성
function buildEvalCardHtml(title, card) {
  if (!card) return "";

  const progressPercent =
    typeof card.progressPercent === "number" && !Number.isNaN(card.progressPercent)
      ? Math.max(0, Math.min(card.progressPercent, 100))
      : 0;
  const detailItems = Array.isArray(card.details) ? card.details : [];
  const detailsHtml =
    detailItems.length > 0
      ? `
          <ul class="status-note-list">
            ${detailItems.map((item) => `<li class="status-note-list__item">${escapeHtml(item)}</li>`).join("")}
          </ul>
        `
      : "";

  return `
    <article class="card status-eval-card">
      <div class="status-eval-card__header">
        <h2 class="status-eval-card__title">${escapeHtml(title)}</h2>
        <span class="${getBadgeClass(card.badgeVariant)} status-eval-card__status">${escapeHtml(card.badgeText)}</span>
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
        <div class="progress__bar" style="width: ${progressPercent}%"></div>
      </div>

      ${detailsHtml}
    </article>
  `;
}

// 전공 카드 묶음 HTML 생성
function buildMajorCardsHtml(majorSection) {
  if (!majorSection) return "";

  const cards =
    Array.isArray(majorSection.items) && majorSection.items.length > 0
      ? majorSection.items
      : majorSection.emptyState
        ? [majorSection.emptyState]
        : [];

  if (cards.length === 0) {
    return "";
  }

  return `
    <div class="status-major-list">
      ${cards.map((card) => buildEvalCardHtml(card.title, card)).join("")}
    </div>
  `;
}

// 부족 항목 카드 HTML 생성
function buildMissingHtml(missing) {
  if (!missing) return "";

  const itemsHtml =
    missing?.items && missing.items.length > 0
      ? missing.items
          .map(
            (item) => `
              <li class="status-missing-list__item">
                <span class="status-missing-list__icon" aria-hidden="true">x</span>
                <span>${escapeHtml(item)}</span>
              </li>
            `,
          )
          .join("")
      : `
          <li class="status-missing-list__item status-missing-list__item--empty">
            <span class="status-missing-list__icon" aria-hidden="true">-</span>
            <span>${escapeHtml(missing?.emptyText || "현재 부족한 항목이 없습니다.")}</span>
          </li>
        `;

  return `
    <section class="card status-missing-card" data-tutorial="status-missing-card">
      <div class="status-missing-card__header">
        <span class="status-missing-card__icon" aria-hidden="true">!</span>
        <div>
          <h2 class="status-missing-card__title">부족 항목</h2>
          <p class="status-missing-card__description">${escapeHtml(missing.description || "")}</p>
        </div>
      </div>

      <ul class="status-missing-list">
        ${itemsHtml}
      </ul>
    </section>
  `;
}

// loading body HTML 생성
function buildLoadingHtml() {
  return `
    <div class="status-detail-section" data-tutorial="status-rule-section">
      <section class="card status-panel" data-tutorial="status-missing-section">
      <div class="loading-state" aria-live="polite">
        <span class="loading-state__spinner" aria-hidden="true"></span>
        <div class="status-panel__copy">
          <h2 class="status-panel__title">졸업 판정 정보를 불러오는 중입니다.</h2>
          <p class="status-panel__description">화면 구성을 준비하고 있습니다.</p>
        </div>
      </div>
      </section>
    </div>
  `;
}

// 판정 불가 카드 HTML 생성
function buildUnevaluableHtml(panel) {
  const actionHtml =
    panel?.actionLabel && panel?.actionHref
      ? `
          <div class="status-unevaluable-card__actions">
            <a class="btn btn--primary" href="${escapeHtml(panel.actionHref)}">${escapeHtml(panel.actionLabel)}</a>
          </div>
        `
      : "";
  const messageHtml = panel?.message
    ? `<p class="status-unevaluable-card__message">${escapeHtml(panel.message)}</p>`
    : "";

  return `
    <div class="status-detail-section" data-tutorial="status-rule-section">
      <section class="card status-unevaluable-card" data-tutorial="status-missing-section">
      <h2 class="status-unevaluable-card__title">${escapeHtml(panel?.title || "판정 불가")}</h2>
      <p class="status-unevaluable-card__description">${escapeHtml(panel?.description || "")}</p>
      ${messageHtml}
      ${actionHtml}
      </section>
    </div>
  `;
}

// success body HTML 생성
function buildSuccessHtml(cards, missing) {
  return `
    <div class="status-detail-section" data-tutorial="status-rule-section">
      <div class="status-detail-grid" data-tutorial="status-rule-cards">
      ${buildEvalCardHtml("교양 학점", cards?.culture)}
      ${buildEvalCardHtml("SEED 요건", cards?.seed)}
      ${buildMajorCardsHtml(cards?.major)}
      ${buildEvalCardHtml("전공탐색", cards?.majorExploration)}
      </div>
    </div>
    <div class="status-detail-section" data-tutorial="status-missing-section">
      ${buildMissingHtml(missing)}
    </div>
  `;
}

// 상태별 body HTML 생성
function buildBodyHtml(viewModel) {
  switch (viewModel.state) {
    case "success":
      // success에서만 상세 카드와 부족 항목 렌더링
      return buildSuccessHtml(viewModel.cards, viewModel.missing);
    case "unevaluable":
    case "network-error":
      // 판정 불가 카드 레이아웃 재사용
      return buildUnevaluableHtml(viewModel.unevaluable);
    case "loading":
    default:
      // 예외 상태는 loading UI로 처리
      return buildLoadingHtml();
  }
}

// /grad/status/ 페이지 렌더링
export function renderStatusPage(page, viewModel) {
  const { elements } = page;
  const isLoading = viewModel.state === "loading";

  setText(elements.subtitle, viewModel.pageDescription || DEFAULT_PAGE_DESCRIPTION);
  elements.primaryShell.hidden = isLoading;
  elements.primaryShell.setAttribute("aria-hidden", String(isLoading));

  if (!isLoading) {
    renderSummary(elements.summary, viewModel.summary);
    renderAppliedInfo(elements.appliedInfo, viewModel.appliedInfo);
  }

  if (elements.body) {
    // 하단 body는 항상 전체 교체
    elements.body.innerHTML = buildBodyHtml(viewModel);
  }
}
