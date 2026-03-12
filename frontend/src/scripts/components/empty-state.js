// 데이터가 없을 때 표시할 공통 빈 상태 컴포넌트를 생성
export function createEmptyState(options = {}) {
  const title = options.title || "No data";
  const description = options.description || "There is nothing to show yet.";

  const root = document.createElement("section");
  root.className = "empty-state card";
  root.innerHTML = `
    <h2 class="empty-state__title">${title}</h2>
    <p class="empty-state__description">${description}</p>
  `;

  return root;
}
