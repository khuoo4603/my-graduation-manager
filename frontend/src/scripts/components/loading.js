// 로딩 상태를 표시하는 공통 컴포넌트를 생성
export function createLoading(options = {}) {
  const text = options.text || "Loading...";

  const root = document.createElement("div");
  root.className = "loading-state";
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <span class="loading-state__spinner" aria-hidden="true"></span>
    <p class="loading-state__text">${text}</p>
  `;

  return root;
}
