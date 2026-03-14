import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/storage.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";

// 자료함 안내 화면 렌더링
function renderStoragePage(pageRoot) {
  pageRoot.innerHTML = `
    <section class="stack">
      <h1 class="page-title">Storage</h1>
      <p class="page-subtitle">자료함 페이지입니다.</p>
    </section>
  `;
}

// 자료함 페이지 초기 진입 처리
export async function initStoragePage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.STORAGE,
    userName: authResult.profile?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  renderStoragePage(pageRoot);
}

initStoragePage();
