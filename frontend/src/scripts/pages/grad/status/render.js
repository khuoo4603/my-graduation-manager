import { setText } from "/src/scripts/utils/dom.js";

const BADGE_VARIANTS = ["badge--blue", "badge--green", "badge--red", "badge--amber"];
const UNEVALUABLE_REASON_COPY = {
  PROFILE_TEMPLATE_MISSING: {
    description: "졸업 판정에 필요한 프로필 정보가 아직 충분하지 않습니다.",
    message: "프로필에서 학부, 템플릿, 전공 정보를 먼저 설정해 주세요.",
    actionLabel: "프로필로 이동",
    actionHref: "/profile/",
  },
  PROFILE_MAJOR_SETUP_INCOMPLETE: {
    description: "졸업 판정에 필요한 프로필 정보가 아직 충분하지 않습니다.",
    message: "프로필에서 학부, 템플릿, 전공 정보를 먼저 설정해 주세요.",
    actionLabel: "프로필로 이동",
    actionHref: "/profile/",
  },
  NETWORK_FAILURE: {
    description: "졸업 현황을 불러오지 못했어요.",
    message: "네트워크 연결을 확인해 주세요.",
    actionLabel: "다시 시도",
    actionHref: "/grad/status/",
  },
  DEFAULT: {
    description: "졸업 판정에 필요한 정보를 확인할 수 없습니다.",
    message: "잠시 후 다시 시도하거나 프로필 정보를 확인해 주세요.",
    actionLabel: "프로필로 이동",
    actionHref: "/profile/",
  },
};

// HTML 문자열 주입 전 특수문자 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 학점 숫자를 화면 표시용 문자열로 변환
function formatCredits(value) {
  return Number.isFinite(value) ? `${value}학점` : "--";
}

// 상태 배지 색상 클래스 반영
function setBadgeVariant(element, variant) {
  // 대상 요소가 없으면 색상 반영을 생략
  if (!element) return;

  BADGE_VARIANTS.forEach((className) => element.classList.remove(className));

  // 허용된 배지 변형만 적용
  if (variant && BADGE_VARIANTS.includes(variant)) {
    element.classList.add(variant);
  }
}

// 진행률 바 너비 계산 및 반영
function setProgress(bar, earned, required, progressPercent = null) {
  // 진행률 바 DOM이 없으면 갱신을 생략
  if (!bar) return;

  const resolvedPercent =
    typeof progressPercent === "number"
      ? Math.max(0, Math.min(progressPercent, 100))
      : Number.isFinite(earned) && Number.isFinite(required) && required > 0
        ? Math.max(0, Math.min((earned / required) * 100, 100))
        : 0;

  bar.style.width = `${resolvedPercent}%`;
}

// 배지 목록 문자열 렌더링
function renderBadgeRow(container, values, variant = "") {
  // 배지 컨테이너가 없으면 렌더를 생략
  if (!container) return;

  container.innerHTML = values
    .map((value) => `<span class="badge${variant ? ` ${variant}` : ""}">${escapeHtml(value)}</span>`)
    .join("");
}

// 전공 배지 표시 문자열 정리
function formatMajorBadge(major) {
  // 전공 정보가 없으면 미설정 문구 반환
  if (!major) return "전공 미설정";
  // 이미 문자열이면 그대로 사용
  if (typeof major === "string") return major;
  // 이름이 없으면 유형 기반 fallback 문구 사용
  if (!major.name) return major.type || "전공 미설정";
  return major.type ? `${major.name}(${major.type})` : major.name;
}

// 판정 불가 reason을 화면용 자연어 문구로 정규화
function resolveUnevaluableCopy(panel) {
  const reason = String(panel?.reason || "").trim();
  const copy =
    UNEVALUABLE_REASON_COPY[reason] ||
    (reason.startsWith("PROFILE_") ? UNEVALUABLE_REASON_COPY.PROFILE_TEMPLATE_MISSING : UNEVALUABLE_REASON_COPY.DEFAULT);

  return {
    title: panel?.title || "판정 불가",
    description: panel?.description || copy.description,
    message: panel?.message || copy.message,
    actionLabel: panel?.actionLabel || copy.actionLabel,
    actionHref: panel?.actionHref || copy.actionHref,
  };
}

// 상세 항목 bullet 목록 렌더링
function renderDetailList(container, items) {
  // 상세 목록 DOM이 없으면 렌더를 생략
  if (!container) return;

  // 표시할 상세 항목이 없으면 목록을 비우고 숨김
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

// SEED 필요영역 집합 기준 상세 문구 렌더링
function renderSeedDetails(container, card) {
  const hasRequiredAreas = Array.isArray(card.requiredAreas) && card.requiredAreas.length > 0;
  const areaEntries = Array.isArray(card.areas) ? card.areas : [];
  const groupedEarned = hasRequiredAreas
    ? areaEntries
        .filter((entry) => card.requiredAreas.includes(entry.area))
        .reduce((total, entry) => total + (Number.isFinite(entry.earned) ? entry.earned : 0), 0)
    : 0;
  const items = hasRequiredAreas
    ? [
        `${card.requiredAreas
          .map((area) => (typeof area === "string" ? area : area?.name))
          .filter(Boolean)
          .join(", ")}: ${groupedEarned}/${Number.isFinite(card.minAreaCredits) ? card.minAreaCredits : 3}학점`,
      ]
    : card.details;

  renderDetailList(container, items);
}

// 부족 항목 목록 렌더링
function renderMissingList(container, items) {
  // 부족 항목 DOM이 없으면 렌더를 생략
  if (!container) return;

  // 부족 항목이 없으면 empty 문구만 노출
  if (!items || items.length === 0) {
    container.innerHTML = `
      <li class="status-missing-list__item status-missing-list__item--empty">
        <span class="status-missing-list__icon" aria-hidden="true">o</span>
        <span>현재 부족한 항목이 없습니다.</span>
      </li>
    `;
    return;
  }

  container.innerHTML = items
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

// 충족 여부 배지 텍스트와 색상 반영
function renderStatusBadge(element, isSatisfied) {
  // 대상 배지가 없으면 상태 반영을 생략
  if (!element) return;

  setBadgeVariant(element, isSatisfied ? "badge--green" : "badge--red");
  setText(element, isSatisfied ? "충족" : "미충족");
}

// 상단 요약 카드 수치와 상태 배지 반영
function renderSummary(elements, summary) {
  setBadgeVariant(elements.badge, summary.badgeVariant);
  setText(elements.badge, summary.badgeText);
  setText(elements.earned, summary.earned);
  setText(elements.required, summary.required);
}

// 상단 적용 정보 카드 반영
function renderAppliedInfo(elements, appliedInfo) {
  setText(elements.department, appliedInfo.department);
  setText(elements.template, appliedInfo.template);
  renderBadgeRow(
    elements.majors,
    Array.isArray(appliedInfo.majors) && appliedInfo.majors.length > 0
      ? appliedInfo.majors.map(formatMajorBadge)
      : ["전공 미설정"],
  );
}

// 공통 상세 카드 수치와 상태 반영
function renderCard(elements, card) {
  setText(elements.required, formatCredits(card.required));
  setText(elements.earned, formatCredits(card.earned));
  setText(elements.shortage, formatCredits(card.shortage));
  setProgress(elements.bar, card.earned, card.required, card.progressPercent);
  renderStatusBadge(elements.badge, card.isSatisfied);
  renderDetailList(elements.details, card.details);
}

// 전공 개수에 맞춰 전공 요건 카드 목록 렌더링
function renderMajorCards(container, majors) {
  // 전공 카드 컨테이너가 없으면 렌더를 생략
  if (!container) return;

  // 전공 정보가 없으면 empty 카드 하나만 노출
  if (!majors || majors.length === 0) {
    container.innerHTML = `
      <article class="card status-eval-card status-eval-card--empty">
        <div class="status-eval-card__header">
          <h2 class="status-eval-card__title">전공 요건</h2>
          <span class="badge badge--amber status-eval-card__status">전공 미등록</span>
        </div>
        <dl class="status-value-list">
          <div class="status-value-list__row">
            <dt>필요 학점</dt>
            <dd>--</dd>
          </div>
          <div class="status-value-list__row">
            <dt>취득 학점</dt>
            <dd>--</dd>
          </div>
          <div class="status-value-list__row status-value-list__row--danger">
            <dt>부족 학점</dt>
            <dd>--</dd>
          </div>
        </dl>
        <div class="progress" aria-hidden="true">
          <div class="progress__bar" style="width: 0%"></div>
        </div>
        <ul class="status-note-list">
          <li class="status-note-list__item">등록된 전공이 없습니다.</li>
        </ul>
      </article>
    `;
    return;
  }

  container.innerHTML = majors
    .map((major) => {
      const shortage = Math.max(0, major.requiredTotal - major.earnedTotal);
      const progressPercent = major.requiredTotal > 0 ? Math.min((major.earnedTotal / major.requiredTotal) * 100, 100) : 0;

      return `
        <article class="card status-eval-card">
          <div class="status-eval-card__header">
            <h2 class="status-eval-card__title">전공 요건(${escapeHtml(major.name)})</h2>
            <span class="badge ${major.isSatisfied ? "badge--green" : "badge--red"} status-eval-card__status">
              ${major.isSatisfied ? "충족" : "미충족"}
            </span>
          </div>
          <dl class="status-value-list">
            <div class="status-value-list__row">
              <dt>필요 학점</dt>
              <dd>${escapeHtml(formatCredits(major.requiredTotal))}</dd>
            </div>
            <div class="status-value-list__row">
              <dt>취득 학점</dt>
              <dd>${escapeHtml(formatCredits(major.earnedTotal))}</dd>
            </div>
            <div class="status-value-list__row status-value-list__row--danger">
              <dt>부족 학점</dt>
              <dd>${escapeHtml(formatCredits(shortage))}</dd>
            </div>
          </dl>
          <div class="progress" aria-hidden="true">
            <div class="progress__bar" style="width: ${progressPercent}%"></div>
          </div>
          <ul class="status-note-list">
            <li class="status-note-list__item">전공 필수: ${escapeHtml(`${major.earnedCore}/${major.requiredCore}학점`)}</li>
            <li class="status-note-list__item">전공 선택: ${escapeHtml(`${major.earnedElective}학점`)}</li>
          </ul>
        </article>
      `;
    })
    .join("");
}

// 판정 불가 안내 패널 렌더링
function renderUnevaluablePanel(elements, panel) {
  const copy = resolveUnevaluableCopy(panel);

  setText(elements.title, copy.title);
  setText(elements.description, copy.description);
  setText(elements.message, copy.message);

  // 이동 버튼이 있는 패널 구조면 CTA도 함께 갱신
  if (elements.action) {
    setText(elements.action, copy.actionLabel);
    elements.action.setAttribute("href", copy.actionHref);
  }
}

// 에러 패널 텍스트 반영
function renderErrorPanel(elements, panel) {
  setText(elements.title, panel.title);
  setText(elements.description, panel.description);
}

// 상태별 패널과 상세 영역 노출 제어
function showStatePanels(elements, state) {
  const isSuccess = state === "success";
  const isUnevaluable = state === "unevaluable";
  const isLoading = state === "loading";
  const isError = state === "error";

  elements.primaryShell.hidden = !(isSuccess || isUnevaluable);
  elements.successShell.hidden = !isSuccess;
  elements.unevaluablePanel.root.hidden = !isUnevaluable;
  elements.loadingPanel.hidden = !isLoading;
  elements.errorPanel.root.hidden = !isError;
}

// /grad/status/ 화면 전체 렌더링
export function renderStatusPage(page, viewModel) {
  const { elements } = page;

  // 상단 요약 데이터가 있으면 공통 요약 카드를 갱신
  if (viewModel.summary) {
    renderSummary(elements.summary, viewModel.summary);
  }

  // 적용 정보가 있으면 학부/템플릿/전공 영역을 갱신
  if (viewModel.appliedInfo) {
    renderAppliedInfo(elements.appliedInfo, viewModel.appliedInfo);
  }

  // success 상태에서만 상세 카드와 부족 항목을 렌더링
  if (viewModel.state === "success") {
    renderCard(elements.culture, viewModel.cards.culture);
    setText(elements.seed.required, formatCredits(viewModel.cards.seed.required));
    setText(elements.seed.earned, formatCredits(viewModel.cards.seed.earned));
    setText(elements.seed.shortage, formatCredits(viewModel.cards.seed.shortage));
    setProgress(elements.seed.bar, viewModel.cards.seed.earned, viewModel.cards.seed.required, viewModel.cards.seed.progressPercent);
    renderStatusBadge(elements.seed.badge, viewModel.cards.seed.isSatisfied);
    renderSeedDetails(elements.seed.details, viewModel.cards.seed);
    renderCard(elements.majorExploration, viewModel.cards.majorExploration);
    renderMajorCards(elements.majorList, viewModel.cards.major);
    setText(elements.missing.description, viewModel.missing.description);
    renderMissingList(elements.missing.list, viewModel.missing.items);
  }

  // unevaluable 상태면 판정 불가 안내 패널만 렌더링
  if (viewModel.state === "unevaluable") {
    renderUnevaluablePanel(elements.unevaluablePanel, viewModel.unevaluable);
  }

  // error 상태면 에러 패널 문구만 갱신
  if (viewModel.state === "error") {
    renderErrorPanel(elements.errorPanel, viewModel.error);
  }

  showStatePanels(elements, viewModel.state);
}
