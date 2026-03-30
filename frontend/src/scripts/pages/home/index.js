import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/home.css";

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { API_BASE_URL } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";

// 홈 로그인 페이지 레이아웃 렌더링
function renderHomePage(pageRoot) {
  pageRoot.innerHTML = `
    <section class="login-layout">
      <article class="login-intro">
        <span class="login-intro__brand" aria-hidden="true">
          <img src="${getFluentIconPath("home")}" alt="" />
        </span>
        <div>
          <h1 class="login-intro__title">My Graduation Manager</h1>
          <p class="login-intro__subtitle">졸업 요건을 빠르게 확인하고 관련된 학업 정보를 한곳에서 관리하세요.</p>
        </div>
        <ul class="login-intro__list">
          <li class="login-intro__item">
            <span class="icon-box icon-box--blue" aria-hidden="true"><img src="${getFluentIconPath("apps")}" alt="" /></span>
            <div>
              <h3>졸업 요건 분석</h3>
              <p>학점 요건과 영역별 이수 현황, 부족한 과목을 실시간으로 확인할 수 있습니다.</p>
            </div>
          </li>
          <li class="login-intro__item">
            <span class="icon-box icon-box--green" aria-hidden="true"><img src="${getFluentIconPath("book")}" alt="" /></span>
            <div>
              <h3>수강 과목 관리</h3>
              <p>이수 과목을 추가하고 관리해 현재 진행 상태를 정확하게 유지하세요.</p>
            </div>
          </li>
          <li class="login-intro__item">
            <span class="icon-box icon-box--purple" aria-hidden="true"><img src="${getFluentIconPath("folder")}" alt="" /></span>
            <div>
              <h3>문서 보관</h3>
              <p>졸업 관련 문서를 안전한 공간에 업로드하고 보관할 수 있습니다.</p>
            </div>
          </li>
        </ul>
      </article>

      <article class="login-card card card--elevated">
        <header class="login-card__header">
          <h2 class="login-card__title">Sign In</h2>
          <p class="login-card__subtitle">Google 계정으로 시작하세요</p>
        </header>

        <button type="button" class="btn btn--google" data-login-action>
          <img src="${getFluentIconPath("person")}" alt="" />
          <span>Sign in</span>
        </button>

        <p class="login-card__footer">로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.</p>
      </article>
    </section>
  `;
}

// 홈 페이지 DOM 요소 수집
function collectHomeElements(pageRoot) {
  return {
    loginButton: qs("[data-login-action]", pageRoot),
  };
}

// 홈 페이지 이벤트 등록
function bindHomePageEvents(elements) {
  elements.loginButton?.addEventListener("click", () => {
    if (!API_BASE_URL) {
      throw new Error("VITE_API_BASE_URL is required");
    }

    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  });
}

// 홈 페이지 초기 진입 처리
export function initHomePage() {
  const headerRoot = qs("[data-header-root]");
  headerRoot?.replaceChildren();

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  renderHomePage(pageRoot);

  const elements = collectHomeElements(pageRoot);
  bindHomePageEvents(elements);
}

initHomePage();
