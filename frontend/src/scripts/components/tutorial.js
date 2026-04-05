import "/src/styles/tutorial.css";

import { PAGE_PATHS } from "/src/scripts/utils/constants.js";

const ONBOARDING_SESSION_KEY = "mgm-active-onboarding";
const OVERLAY_ROOT_ID = "tutorial-overlay-root";
const TUTORIAL_ACTION_TYPES = new Set(["next", "navigate", "close"]);

const PAGE_KEY_BY_PATH = {
  [PAGE_PATHS.GRAD]: "dashboard",
  [PAGE_PATHS.PROFILE]: "profile",
  [PAGE_PATHS.GRAD_COURSES]: "courses",
  [PAGE_PATHS.GRAD_STATUS]: "status",
  [PAGE_PATHS.STORAGE]: "storage",
};

// 튜토리얼 카드 텍스트에 들어갈 문자열을 HTML 안전하게 변환
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 경로 문자열을 페이지 키 매핑에 맞는 형태로 정규화
function normalizePath(pathname = "") {
  if (!pathname) return "/";
  const trimmedPathname = pathname.replace(/\/+$/, "");
  return trimmedPathname ? `${trimmedPathname}/` : "/";
}

// 이동 URL을 현재 프로젝트의 튜토리얼 pageKey로 변환
function resolvePageKeyFromHref(href) {
  if (!href) return "";

  try {
    const url = new URL(href, window.location.origin);
    return PAGE_KEY_BY_PATH[normalizePath(url.pathname)] || "";
  } catch {
    return "";
  }
}

// sessionStorage에 저장된 온보딩 이어보기 상태를 복원
function readOnboardingSession() {
  try {
    const rawValue = sessionStorage.getItem(ONBOARDING_SESSION_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      pageKey: String(parsed.pageKey || ""),
      stepIndex: Number.isInteger(parsed.stepIndex) ? parsed.stepIndex : 0,
    };
  } catch {
    return null;
  }
}

// 현재 온보딩 pageKey와 stepIndex를 sessionStorage에 저장
function writeOnboardingSession(session) {
  try {
    sessionStorage.setItem(
      ONBOARDING_SESSION_KEY,
      JSON.stringify({
        pageKey: String(session?.pageKey || ""),
        stepIndex: Number.isInteger(session?.stepIndex) ? session.stepIndex : 0,
      }),
    );
  } catch {
    // Ignore storage write failures.
  }
}

// 온보딩 종료 시 sessionStorage에 남은 이어보기 상태를 정리
function clearOnboardingSession() {
  try {
    sessionStorage.removeItem(ONBOARDING_SESSION_KEY);
  } catch {
    // Ignore storage remove failures.
  }
}

// 설명 텍스트를 튜토리얼 카드 본문 HTML로 변환
function resolveDescriptionHtml(description) {
  if (Array.isArray(description)) {
    const items = description.map((item) => String(item || "").trim()).filter(Boolean);
    if (items.length === 0) return "";

    return `
      <div class="tutorial-card__copy">
        ${items.map((item) => `<p class="tutorial-card__description">${escapeHtml(item)}</p>`).join("")}
      </div>
    `;
  }

  const text = String(description || "").trim();
  if (!text) return "";
  return `<p class="tutorial-card__description">${escapeHtml(text)}</p>`;
}

// 하이라이트 대상으로 사용할 수 있는 표시 중인 요소인지 확인
function isRenderableTargetElement(target) {
  if (!(target instanceof Element)) return false;

  if (target instanceof HTMLElement && target.hidden) {
    return false;
  }

  if (target.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const rect = target.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// data-tutorial selector 문자열로 실제 표시 중인 대상 요소를 찾기
function resolveTargetElement(targetSelector) {
  if (typeof targetSelector !== "string" || !targetSelector.trim()) {
    return null;
  }

  const resolvedTarget = document.querySelector(targetSelector);
  return isRenderableTargetElement(resolvedTarget) ? resolvedTarget : null;
}

// target 누락으로 step이 사라질 때 개발 중 원인을 확인할 수 있게 경고 출력
function warnMissingTarget({ pageKey, mode, index, step, skipped = false }) {
  console.warn(`[tutorial] Missing target selector.${skipped ? " Skipping step." : ""}`, {
    pageKey,
    mode,
    index,
    title: String(step?.title || ""),
    target: String(step?.target || ""),
  });
}

// 공통 오버레이 DOM을 재사용하거나 처음 한 번 생성
function createOverlayRefs() {
  const existingRoot = document.getElementById(OVERLAY_ROOT_ID);
  if (existingRoot) {
    return {
      root: existingRoot,
      scrim: existingRoot.querySelector("[data-tutorial-scrim]"),
      highlight: existingRoot.querySelector("[data-tutorial-highlight]"),
      card: existingRoot.querySelector("[data-tutorial-card]"),
      progress: existingRoot.querySelector("[data-tutorial-progress]"),
      dismissButton: existingRoot.querySelector("[data-tutorial-dismiss]"),
      title: existingRoot.querySelector("[data-tutorial-title]"),
      body: existingRoot.querySelector("[data-tutorial-body]"),
      prevButton: existingRoot.querySelector("[data-tutorial-prev]"),
      primaryButton: existingRoot.querySelector("[data-tutorial-primary]"),
    };
  }

  const root = document.createElement("div");
  root.id = OVERLAY_ROOT_ID;
  root.className = "tutorial-overlay";
  root.hidden = true;
  root.innerHTML = `
    <div class="tutorial-overlay__scrim" data-tutorial-scrim></div>
    <div class="tutorial-highlight" data-tutorial-highlight hidden></div>
    <section class="tutorial-card" data-tutorial-card role="dialog" aria-modal="true" aria-live="polite">
      <div class="tutorial-card__meta">
        <span class="tutorial-card__progress" data-tutorial-progress>1 / 1</span>
        <button class="tutorial-card__close" type="button" data-tutorial-dismiss aria-label="튜토리얼 닫기">
          &times;
        </button>
      </div>
      <div class="tutorial-card__content">
        <h2 class="tutorial-card__title" data-tutorial-title></h2>
        <div class="tutorial-card__body" data-tutorial-body></div>
      </div>
      <div class="tutorial-actions">
        <div class="tutorial-actions__secondary">
          <button class="btn btn--ghost" type="button" data-tutorial-prev>이전</button>
        </div>
        <button class="btn btn--primary" type="button" data-tutorial-primary>다음</button>
      </div>
    </section>
  `;

  document.body.append(root);

  return {
    root,
    scrim: root.querySelector("[data-tutorial-scrim]"),
    highlight: root.querySelector("[data-tutorial-highlight]"),
    card: root.querySelector("[data-tutorial-card]"),
    progress: root.querySelector("[data-tutorial-progress]"),
    dismissButton: root.querySelector("[data-tutorial-dismiss]"),
    title: root.querySelector("[data-tutorial-title]"),
    body: root.querySelector("[data-tutorial-body]"),
    prevButton: root.querySelector("[data-tutorial-prev]"),
    primaryButton: root.querySelector("[data-tutorial-primary]"),
  };
}

// 프로필 완료 여부를 학부와 템플릿 기준으로 계산
function resolveProfileComplete(profile) {
  return Boolean(profile?.department?.id) && Boolean(profile?.template?.id);
}

// 외부 컨텍스트에서 재사용할 프로필 완료 여부 판단 래퍼
function isProfileComplete(profile) {
  return resolveProfileComplete(profile);
}

// 자동 온보딩 시작 여부를 초기 프로필 상태 기준으로 판단
function shouldAutoStartByProfile(profile) {
  const departmentId = String(profile?.department?.id ?? "").trim();
  const templateId = String(profile?.template?.id ?? "").trim();
  return !departmentId && !templateId;
}

// X 닫기 경고 노출 여부를 자동 실행과 같은 기준으로 판단
function shouldWarnBeforeDismiss(profile) {
  return shouldAutoStartByProfile(profile);
}

// 현재 모드와 프로필 상태를 바탕으로 X 닫기 경고 필요 여부를 계산
function isDismissWarningRequired(mode, context) {
  if (mode !== "onboarding") return false;

  const profile = context?.profile;
  if (!profile || typeof profile !== "object") return false;

  return shouldWarnBeforeDismiss(profile);
}

// 허용된 액션 타입만 사용하고 나머지는 기본 동작으로 정리
function resolveActionType(actionType, fallbackActionType) {
  return TUTORIAL_ACTION_TYPES.has(actionType) ? actionType : fallbackActionType;
}

// 페이지별 튜토리얼 오버레이와 상태를 제어하는 컨트롤러 생성
function createTutorialController(options = {}) {
  const overlay = createOverlayRefs();

  const state = {
    pageKey: String(options.pageKey || ""),
    onboardingSteps: Array.isArray(options.onboardingSteps) ? options.onboardingSteps : [],
    pageSteps: Array.isArray(options.pageSteps) ? options.pageSteps : [],
    getContext: typeof options.getContext === "function" ? options.getContext : () => ({}),
    shouldAutoStartOnboarding:
      typeof options.shouldAutoStartOnboarding === "function" ? options.shouldAutoStartOnboarding : null,
    active: false,
    mode: "",
    steps: [],
    currentIndex: -1,
    currentStep: null,
    currentTarget: null,
    resizeHandler: null,
    scrollHandler: null,
    keydownHandler: null,
  };

  // 외부 페이지 상태를 튜토리얼에서 쓰는 공통 컨텍스트로 정규화
  function getContext() {
    const context = state.getContext() || {};
    return {
      ...context,
      profileComplete: isProfileComplete(context.profile || null),
    };
  }

  // target 누락 여부를 반영해 실제로 이동 가능한 step 인덱스를 찾기
  function resolveAvailableIndex(targetIndex, direction = 1) {
    const lastIndex = state.steps.length - 1;
    let index = targetIndex;

    while (index >= 0 && index <= lastIndex) {
      const step = state.steps[index];
      const target = resolveTargetElement(step?.target);
      const skipIfMissing = Boolean(step?.target) && step?.skipIfMissing !== false;

      if (!skipIfMissing || target || !step?.target) {
        return index;
      }

      warnMissingTarget({
        pageKey: state.pageKey,
        mode: state.mode,
        index,
        step,
        skipped: true,
      });
      index += direction;
    }

    return -1;
  }

  // guard 결과와 기본값을 합쳐 현재 step 표시 정보를 확정
  function resolveStep(step) {
    const context = getContext();
    const guardResult =
      typeof step?.guard === "function"
        ? step.guard({
            context,
            mode: state.mode,
            index: state.currentIndex,
            step,
          }) || null
        : null;

    const isLastStep = state.currentIndex >= state.steps.length - 1;
    const fallbackActionType = isLastStep ? "close" : "next";
    const fallbackActionLabel = isLastStep ? "튜토리얼 종료" : "다음";

    return {
      ...step,
      ...(guardResult || {}),
      actionType: resolveActionType(guardResult?.actionType || step?.actionType, fallbackActionType),
      actionLabel: guardResult?.actionLabel || step?.actionLabel || fallbackActionLabel,
      blockAdvance: guardResult?.blockAdvance ?? step?.blockAdvance ?? false,
      skipAllowed: guardResult?.skipAllowed ?? step?.skipAllowed ?? true,
      placement: guardResult?.placement || step?.placement || "bottom",
      description: guardResult?.description || step?.description || "",
      target: guardResult?.target || step?.target || null,
      actionHref: guardResult?.actionHref || step?.actionHref || "",
      nextOnboardingPageKey:
        guardResult?.nextOnboardingPageKey || step?.nextOnboardingPageKey || resolvePageKeyFromHref(step?.actionHref),
      nextOnboardingStepIndex: Number.isInteger(guardResult?.nextOnboardingStepIndex)
        ? guardResult.nextOnboardingStepIndex
        : Number.isInteger(step?.nextOnboardingStepIndex)
          ? step.nextOnboardingStepIndex
          : 0,
    };
  }

  // 하이라이트 박스를 완전히 숨기고 위치 정보를 초기화
  function hideHighlight() {
    overlay.highlight.hidden = true;
    overlay.highlight.style.removeProperty("top");
    overlay.highlight.style.removeProperty("left");
    overlay.highlight.style.removeProperty("width");
    overlay.highlight.style.removeProperty("height");
  }

  // 현재 target bounding rect 기준으로 하이라이트 박스 위치를 갱신
  function highlightTarget(target) {
    if (!target) {
      hideHighlight();
      return;
    }

    const rect = target.getBoundingClientRect();
    const width = Math.max(rect.width, 0);
    const height = Math.max(rect.height, 0);

    if (width === 0 && height === 0) {
      hideHighlight();
      return;
    }

    const padding = 10;
    overlay.highlight.hidden = false;
    overlay.highlight.style.top = `${Math.max(rect.top - padding, 8)}px`;
    overlay.highlight.style.left = `${Math.max(rect.left - padding, 8)}px`;
    overlay.highlight.style.width = `${Math.min(width + padding * 2, window.innerWidth - 16)}px`;
    overlay.highlight.style.height = `${Math.min(height + padding * 2, window.innerHeight - 16)}px`;
  }

  // 현재 강조 대상이 화면 중앙 근처에 오도록 스크롤
  function scrollTargetIntoView(target) {
    if (!(target instanceof HTMLElement)) return;

    target.scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "nearest",
    });
  }

  // target 위치와 placement를 기준으로 설명 카드 좌표를 계산
  function positionCard(target, placement = "bottom") {
    const card = overlay.card;
    if (!card) return;

    const margin = 16;
    const cardRect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!target || placement === "center") {
      card.style.top = `${Math.max((viewportHeight - cardRect.height) / 2, margin)}px`;
      card.style.left = `${Math.max((viewportWidth - cardRect.width) / 2, margin)}px`;
      return;
    }

    const targetRect = target.getBoundingClientRect();
    let top = targetRect.bottom + margin;
    let left = targetRect.left;

    if (placement === "top") {
      top = targetRect.top - cardRect.height - margin;
      left = targetRect.left;
    } else if (placement === "right") {
      top = targetRect.top;
      left = targetRect.right + margin;
    } else if (placement === "left") {
      top = targetRect.top;
      left = targetRect.left - cardRect.width - margin;
    } else {
      left = targetRect.left;
    }

    if (placement === "bottom" || placement === "top") {
      left = targetRect.left + (targetRect.width - cardRect.width) / 2;
    }

    top = Math.max(margin, Math.min(top, viewportHeight - cardRect.height - margin));
    left = Math.max(margin, Math.min(left, viewportWidth - cardRect.width - margin));

    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
  }

  // 온보딩 중 현재 페이지와 step 위치를 이어보기 세션에 동기화
  function syncOnboardingSession() {
    if (state.mode !== "onboarding") return;

    writeOnboardingSession({
      pageKey: state.pageKey,
      stepIndex: state.currentIndex,
    });
  }

  // 현재 step UI와 하이라이트, 버튼 상태를 실제 화면에 반영
  function renderCurrentStep({ skipScroll = false } = {}) {
    const step = state.steps[state.currentIndex];
    if (!step) {
      controller.closeTutorial();
      return;
    }

    const resolvedStep = resolveStep(step);
    const target = resolveTargetElement(resolvedStep.target);

    if (resolvedStep.target && !target && resolvedStep.skipIfMissing === false) {
      warnMissingTarget({
        pageKey: state.pageKey,
        mode: state.mode,
        index: state.currentIndex,
        step: resolvedStep,
        skipped: false,
      });
    }

    state.currentStep = resolvedStep;
    state.currentTarget = target;

    overlay.root.hidden = false;
    overlay.root.classList.add("is-active");
    overlay.progress.textContent = `${state.currentIndex + 1} / ${state.steps.length}`;
    overlay.title.textContent = resolvedStep.title || "";
    overlay.body.innerHTML = resolveDescriptionHtml(resolvedStep.description);
    overlay.dismissButton.hidden = resolvedStep.skipAllowed === false;
    overlay.prevButton.hidden = state.currentIndex <= 0;
    overlay.primaryButton.textContent = resolvedStep.actionLabel || "다음";

    if (!skipScroll) {
      scrollTargetIntoView(target);
    }
    highlightTarget(target);

    requestAnimationFrame(() => {
      positionCard(target, resolvedStep.placement);
    });

    syncOnboardingSession();
  }

  // 튜토리얼 활성화 시 공통 이벤트 리스너와 오버레이를 연결
  function activate() {
    if (state.active) return;

    state.active = true;
    overlay.root.hidden = false;
    overlay.root.classList.add("is-active");

    state.resizeHandler = () => controller.refresh();
    state.scrollHandler = () => controller.refresh({ skipScroll: true });
    state.keydownHandler = (event) => {
      if (event.key === "Escape") {
        controller.closeTutorial();
      }
    };

    window.addEventListener("resize", state.resizeHandler);
    window.addEventListener("scroll", state.scrollHandler, true);
    document.addEventListener("keydown", state.keydownHandler);
  }

  // 튜토리얼 종료 시 이벤트와 상태를 정리하고 화면을 원복
  function deactivate({ clearSession = state.mode === "onboarding" } = {}) {
    if (state.resizeHandler) {
      window.removeEventListener("resize", state.resizeHandler);
      state.resizeHandler = null;
    }

    if (state.scrollHandler) {
      window.removeEventListener("scroll", state.scrollHandler, true);
      state.scrollHandler = null;
    }

    if (state.keydownHandler) {
      document.removeEventListener("keydown", state.keydownHandler);
      state.keydownHandler = null;
    }

    overlay.root.hidden = true;
    overlay.root.classList.remove("is-active");
    hideHighlight();

    state.active = false;
    state.mode = "";
    state.steps = [];
    state.currentIndex = -1;
    state.currentStep = null;
    state.currentTarget = null;

    if (clearSession) {
      clearOnboardingSession();
    }
  }

  // primary 버튼의 next, navigate, close 동작을 단순화해 처리
  function handlePrimaryAction() {
    const step = state.currentStep;
    if (!step) return;

    if (step.blockAdvance) {
      controller.refresh({ skipScroll: true });
      return;
    }

    if (step.actionType === "navigate" && step.actionHref) {
      if (state.mode === "onboarding") {
        writeOnboardingSession({
          pageKey: step.nextOnboardingPageKey || resolvePageKeyFromHref(step.actionHref),
          stepIndex: step.nextOnboardingStepIndex || 0,
        });
      } else {
        clearOnboardingSession();
      }

      window.location.href = step.actionHref;
      return;
    }

    if (step.actionType === "close") {
      controller.closeTutorial();
      return;
    }

    controller.nextStep();
  }

  // X 버튼 클릭 시 정책에 맞는 경고를 확인한 뒤 종료 처리
  function handleDismissAction() {
    const context = getContext();

    if (isDismissWarningRequired(state.mode, context)) {
      const confirmed = window.confirm(
        "프로필의 학부 및 템플릿 설정을 완료하지 않으면 튜토리얼이 다시 시작될 수 있습니다.",
      );

      if (!confirmed) {
        return;
      }
    }

    controller.closeTutorial();
  }

  const controller = {
    // 페이지 진입 시 트리거와 이어보기, 자동 실행 조건을 연결
    initTutorial() {
      overlay.prevButton.onclick = () => controller.prevStep();
      overlay.dismissButton.onclick = () => handleDismissAction();
      overlay.primaryButton.onclick = () => handlePrimaryAction();

      const trigger = document.querySelector(`[data-tutorial-trigger="${state.pageKey}"]`);
      trigger?.addEventListener("click", () => {
        controller.startPageTutorial();
      });

      const pendingOnboarding = readOnboardingSession();

      if (pendingOnboarding?.pageKey === state.pageKey && state.onboardingSteps.length > 0) {
        controller.startOnboarding(pendingOnboarding.stepIndex || 0);
        return controller;
      }

      const shouldAutoStart =
        typeof state.shouldAutoStartOnboarding === "function"
          ? state.shouldAutoStartOnboarding()
          : state.pageKey === "dashboard" && shouldAutoStartByProfile(getContext().profile);

      if (!pendingOnboarding && state.onboardingSteps.length > 0 && shouldAutoStart) {
        controller.startOnboarding(0);
      }

      return controller;
    },

    // 여러 페이지를 이동하는 온보딩 흐름을 지정한 step부터 시작
    startOnboarding(startIndex = 0) {
      deactivate({ clearSession: false });
      state.mode = "onboarding";
      state.steps = state.onboardingSteps;

      if (state.steps.length === 0) return controller;

      activate();
      controller.goToStep(startIndex);
      return controller;
    },

    // 현재 페이지 설명형 다시보기 튜토리얼을 지정한 step부터 시작
    startPageTutorial(startIndex = 0) {
      deactivate({ clearSession: false });
      state.mode = "page";
      state.steps = state.pageSteps;

      if (state.steps.length === 0) return controller;

      activate();
      controller.goToStep(startIndex);
      return controller;
    },

    // 다음으로 표시 가능한 step을 찾아 이동
    nextStep() {
      if (!state.active) return controller;

      const nextIndex = resolveAvailableIndex(state.currentIndex + 1, 1);
      if (nextIndex < 0) {
        controller.closeTutorial();
        return controller;
      }

      controller.goToStep(nextIndex);
      return controller;
    },

    // 이전으로 표시 가능한 step을 찾아 이동
    prevStep() {
      if (!state.active) return controller;

      const prevIndex = resolveAvailableIndex(state.currentIndex - 1, -1);
      if (prevIndex < 0) return controller;

      controller.goToStep(prevIndex);
      return controller;
    },

    // 현재 튜토리얼을 종료하고 오버레이 상태를 정리
    closeTutorial() {
      deactivate({ clearSession: state.mode === "onboarding" });
      return controller;
    },

    // target 누락 여부를 반영해 지정한 step 인덱스로 이동
    goToStep(index) {
      if (!state.active || state.steps.length === 0) return controller;

      const normalizedIndex = index < 0 ? 0 : index;
      const direction = normalizedIndex >= state.currentIndex ? 1 : -1;
      const resolvedIndex = resolveAvailableIndex(normalizedIndex, direction);

      if (resolvedIndex < 0) {
        controller.closeTutorial();
        return controller;
      }

      state.currentIndex = resolvedIndex;
      renderCurrentStep();
      return controller;
    },

    // 현재 화면 상태를 기준으로 target과 카드 위치를 다시 계산
    refresh({ skipScroll = false } = {}) {
      if (!state.active || !state.currentStep) return controller;

      const target = resolveTargetElement(state.currentStep.target);
      state.currentTarget = target;

      if (!skipScroll) {
        scrollTargetIntoView(target);
      }

      renderCurrentStep({ skipScroll });
      return controller;
    },
  };

  return controller;
}

// 페이지별 튜토리얼 컨트롤러를 생성하고 초기 연결까지 수행
export function initTutorial(options = {}) {
  const controller = createTutorialController(options);
  return controller.initTutorial();
}
