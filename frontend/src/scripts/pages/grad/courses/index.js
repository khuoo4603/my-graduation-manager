import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/courses.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";
import { qs } from "/src/scripts/utils/dom.js";

// 수강 과목 안내 화면 렌더링
function renderCoursesPage(pageRoot) {
  pageRoot.innerHTML = `
    <section class="stack">
      <h1 class="page-title">Courses</h1>
      <p class="page-subtitle">수강 과목 페이지입니다.</p>
    </section>
  `;
}

// 수강 과목 페이지 초기 진입 처리
export async function initCoursesPage() {
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.GRAD_COURSES,
    userName: authResult.profile?.name || "unknown",
  });

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  renderCoursesPage(pageRoot);
}

initCoursesPage();
