import { setText } from "/src/scripts/utils/dom.js";

const BADGE_VARIANTS = ["badge--blue", "badge--green", "badge--red", "badge--amber"];
const DEFAULT_PAGE_DESCRIPTION = "상세 졸업 판정 결과를 확인할 수 있습니다.";

// HTML 문자열 렌더링 전 특수문자 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 공통 badge 클래스 조합
function getBadgeClass(variant) {
  return `badge${BADGE_VARIANTS.includes(variant) ? ` ${variant}` : ""}`;
}

// 마이크로전공 상태에 맞는 진행률 바 클래스 선택
function getMicroMajorProgressClassName(statusText) {
  if (statusText === "이수완료") {
    // 완료 상태는 성공 색상 진행률 바 사용
    return "progress__bar progress__bar--success";
  }

  if (statusText === "이수가능") {
    // 아직 시작 전 상태는 중립 색상 진행률 바 사용
    return "progress__bar status-micro-major-card__progress-bar--neutral";
  }

  // 진행 중 상태는 기본 파란 진행률 바 사용
  return "progress__bar";
}

// 상단 요약 카드 렌더링
function renderSummary(elements, summary) {
  if (!elements || !summary) return;

  elements.badge.className = `${getBadgeClass(summary.badgeVariant)} status-summary-card__badge`;
  setText(elements.badge, summary.badgeText);
  setText(elements.earned, summary.earned);
  setText(elements.required, summary.required);
}

// 상단 적용 정보 렌더링
function renderAppliedInfo(elements, appliedInfo) {
  if (!elements || !appliedInfo) return;

  setText(elements.department, appliedInfo.department);
  setText(elements.template, appliedInfo.template);
  elements.majors.innerHTML = (appliedInfo.majors || [])
    .map((value) => `<span class="${getBadgeClass("")}">${escapeHtml(value)}</span>`)
    .join("");
}

// 공통 졸업 판정 카드 HTML 생성
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

// 전공 카드 리스트 HTML 생성
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

// 단일 목록형 마이크로전공 상세 HTML 생성
function buildMicroMajorCourseListHtml(card) {
  const courses = Array.isArray(card?.courses) ? card.courses : [];
  const courseListHtml =
    courses.length > 0
      ? courses
          .map((course, index) => {
            const emphasizedClass = course?.isRecognized ? " status-micro-major-card__course--recognized" : "";
            const separatorHtml =
              index < courses.length - 1
                ? '<span class="status-micro-major-card__separator" aria-hidden="true">/</span>'
                : "";

            return `
              <span class="status-micro-major-card__course${emphasizedClass}">${escapeHtml(course?.name || "")}</span>${separatorHtml}
            `;
          })
          .join("")
      // 연결된 과목이 없으면 빈 상태 문구 출력
      : `<span class="status-micro-major-card__empty">표시할 과목 정보가 없습니다.</span>`;

  return `
    <div class="status-micro-major-card__detail">
      <p class="status-micro-major-card__detail-title">${escapeHtml(card?.detailTitle || "인정 과목 목록")}</p>
      <div class="status-micro-major-card__course-list">
        ${courseListHtml}
      </div>
    </div>
  `;
}

// 그룹 블록형 마이크로전공 상세 HTML 생성
function buildMicroMajorGroupsHtml(card) {
  const groupBlocks = Array.isArray(card?.groupBlocks) ? card.groupBlocks : [];
  const groupBlocksHtml =
    groupBlocks.length > 0
      ? groupBlocks
          .map((group) => {
            const coursesHtml =
              Array.isArray(group?.courses) && group.courses.length > 0
                // 그룹별 과목이 있으면 강조 규칙을 적용해 목록 렌더링
                ? `
                    <div class="status-micro-major-card__course-list status-micro-major-card__course-list--group">
                      ${group.courses
                        .map((course, index) => {
                          const emphasizedClass = course?.isRecognized
                            ? " status-micro-major-card__course--recognized"
                            : "";
                          const separatorHtml =
                            index < group.courses.length - 1
                              ? '<span class="status-micro-major-card__separator" aria-hidden="true">/</span>'
                              : "";

                          return `
                            <span class="status-micro-major-card__course${emphasizedClass}">${escapeHtml(course?.name || "")}</span>${separatorHtml}
                          `;
                        })
                        .join("")}
                    </div>
                  `
                // 그룹별 과목이 아직 없으면 placeholder 문구 유지
                : `<p class="status-micro-major-group__empty">${escapeHtml(group?.placeholderText || "세부 과목 연결은 다음 단계에서 추가됩니다.")}</p>`;

            return `
              <article class="status-micro-major-group">
                <div class="status-micro-major-group__header">
                  <div class="status-micro-major-group__title-row">
                    <h4 class="status-micro-major-group__title">${escapeHtml(group?.title || "")}</h4>
                    <p class="status-micro-major-group__summary">${escapeHtml(group?.summaryText || "")}</p>
                  </div>
                </div>
                ${coursesHtml}
              </article>
            `;
          })
          .join("")
      // 그룹 정보가 비어 있으면 기본 안내 블록 렌더링
      : `
          <article class="status-micro-major-group">
            <div class="status-micro-major-group__header">
              <h4 class="status-micro-major-group__title">그룹 정보 연결 예정</h4>
            </div>
            <p class="status-micro-major-group__empty">세부 그룹 과목 목록은 다음 단계에서 연결됩니다.</p>
          </article>
        `;

  return `
    <div class="status-micro-major-card__detail">
      <p class="status-micro-major-card__detail-title">${escapeHtml(card?.detailTitle || "그룹별 이수 현황")}</p>
      <div class="status-micro-major-groups">
        ${groupBlocksHtml}
      </div>
    </div>
  `;
}

// 마이크로전공 카드 HTML 생성
function buildMicroMajorCardHtml(card) {
  if (!card) return "";

  const detailHtml = card.layout === "course-list" ? buildMicroMajorCourseListHtml(card) : buildMicroMajorGroupsHtml(card);

  return `
    <article class="card status-micro-major-card">
      <div class="status-micro-major-card__header">
        <div class="status-micro-major-card__headline">
          <h3 class="status-micro-major-card__title">${escapeHtml(card?.name || "")}</h3>
          <p class="status-micro-major-card__meta">${escapeHtml(card?.metaText || "")}</p>
        </div>
        <span class="${getBadgeClass(card?.badgeVariant)} status-micro-major-card__status">${escapeHtml(card?.statusText || "")}</span>
      </div>

      <div class="status-micro-major-card__summary-block">
        <p class="status-micro-major-card__summary">${escapeHtml(card?.summaryText || "")}</p>
      </div>

      <div class="progress status-micro-major-card__progress" aria-hidden="true">
        <div
          class="${getMicroMajorProgressClassName(card?.statusText)}"
          style="width: ${Math.max(0, Math.min(Number(card?.progressPercent) || 0, 100))}%"
        ></div>
      </div>

      ${detailHtml}
    </article>
  `;
}

// 마이크로전공 섹션 보조 안내 문구 HTML 생성
function buildMicroMajorStateHtml(sectionViewModel) {
  const notice = sectionViewModel?.notice;
  if (!notice?.title && !notice?.text) {
    return "";
  }

  if (notice?.title) {
    const descriptionHtml = notice?.description
      ? `<p class="status-micro-major-state-card__description">${escapeHtml(notice.description)}</p>`
      : "";

    return `
      <section class="card status-micro-major-state-card" aria-live="polite">
        <h3 class="status-micro-major-state-card__title">${escapeHtml(notice.title)}</h3>
        ${descriptionHtml}
      </section>
    `;
  }

  const variantClass =
    notice.variant === "error"
      ? " status-micro-major-notice--error"
      : notice.variant === "warning"
        ? " status-micro-major-notice--warning"
        : notice.variant === "empty"
          ? " status-micro-major-notice--empty"
          : " status-micro-major-notice--preview";

  return `
    <p class="status-micro-major-notice${variantClass}" aria-live="polite">
      ${escapeHtml(notice.text)}
    </p>
  `;
}

// 페이지 로딩 상태 HTML 생성
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

// 판정 불가 상태 HTML 생성
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

// 졸업 현황 정상 렌더링 HTML 생성
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

// 상태에 맞는 본문 HTML 선택
function buildBodyHtml(viewModel) {
  switch (viewModel.state) {
    case "success":
      // 정상 판정 완료 시 상세 카드와 부족 항목 렌더링
      return buildSuccessHtml(viewModel.cards, viewModel.missing);
    case "unevaluable":
    case "network-error":
      // 판정 불가나 네트워크 오류 시 안내 카드 렌더링
      return buildUnevaluableHtml(viewModel.unevaluable);
    case "loading":
    default:
      // 초기 진입 시 로딩 상태 렌더링
      return buildLoadingHtml();
  }
}

// 졸업 현황 페이지 메인 영역 렌더링
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
    elements.body.innerHTML = buildBodyHtml(viewModel);
  }
}

// 마이크로전공 섹션만 독립적으로 렌더링
export function renderMicroMajorSection(page, sectionViewModel) {
  const elements = page?.elements?.microMajor;
  if (!elements?.section || !elements?.state || !elements?.grid) return;

  elements.section.hidden = false;
  const items = Array.isArray(sectionViewModel?.items) ? sectionViewModel.items : [];
  const noticeHtml = buildMicroMajorStateHtml(sectionViewModel);

  elements.state.hidden = !noticeHtml;
  elements.state.innerHTML = noticeHtml;
  // 카드가 하나도 없을 때만 grid 자체를 숨김
  elements.grid.hidden = items.length === 0;
  elements.grid.innerHTML = items.map((item) => buildMicroMajorCardHtml(item)).join("");
}
