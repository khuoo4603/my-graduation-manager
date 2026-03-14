import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/status.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";

// 졸업 판정 안내 화면 렌더링
function renderStatusPage(pageRoot) {
  pageRoot.innerHTML = `
    <section class="stack">
      <h1 class="page-title">Graduation Status</h1>
      <p class="page-subtitle">졸업 판정 페이지입니다.</p>
    </section>
  `;
}

// 졸업 판정 페이지 초기 진입 처리
export async function initStatusPage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_STATUS,
    userName: authResult.profile?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  renderStatusPage(pageRoot);
}

initStatusPage();
