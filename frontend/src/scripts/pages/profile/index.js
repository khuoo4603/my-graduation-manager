import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/profile.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, createElement, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";

// Profile 페이지 초기화: 헤더와 페이지 안내 콘텐츠를 렌더링
export async function initProfilePage() {
  // 로그인 필요 페이지 세션 확인
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  // 현재 프로필 경로를 기준으로 헤더 활성 메뉴를 설정
  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.PROFILE,
    userName: authResult.profile?.name || "unknown",
  });

  // 페이지 컨테이너 미존재 시 후속 렌더링 중단
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  // 기존 DOM을 초기화하고 프로필 안내 문구를 출력
  clearChildren(pageRoot);
  pageRoot.append(
    createElement("section", {
      className: "stack",
      children: [
        createElement("h1", { className: "page-title", text: "Profile" }),
        createElement("p", {
          className: "page-subtitle",
          text: "프로필 페이지입니다.",
        }),
      ],
    }),
  );
}

// 모듈 진입 시 즉시 초기화
initProfilePage();



