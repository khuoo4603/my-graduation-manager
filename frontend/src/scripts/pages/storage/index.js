import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/storage.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, createElement, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { ensureProtectedPageAccess } from "/src/scripts/utils/auth.js";

// Storage 페이지 초기화: 공통 헤더와 페이지 기본 설명을 렌더링
export async function initStoragePage() {
  // 로그인 필요 페이지 세션 확인
  const authResult = await ensureProtectedPageAccess();
  if (!authResult) return;

  // 상단 헤더 Storage 활성 메뉴 설정
  renderHeader("[data-header-root]", {
    currentPath: PAGE_PATHS.STORAGE,
    userName: authResult.profile?.name || "unknown",
  });

  // 루트 엘리먼트 미존재 시 렌더링 중단
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  // 기존 내용을 비우고 자료함 안내 텍스트를 출력
  clearChildren(pageRoot);
  pageRoot.append(
    createElement("section", {
      className: "stack",
      children: [
        createElement("h1", { className: "page-title", text: "Storage" }),
        createElement("p", {
          className: "page-subtitle",
          text: "자료함 페이지입니다.",
        }),
      ],
    }),
  );
}

// 페이지 엔트리에서 초기화 함수 실행
initStoragePage();



