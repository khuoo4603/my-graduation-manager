// 단일 DOM 요소 조회
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

// 대상 요소 자식 노드 전체 제거
export function clearChildren(element) {
  if (!element) return;
  element.replaceChildren();
}

// 대상 요소 텍스트 교체
export function setText(element, text) {
  if (!element) return;
  element.textContent = text ?? "";
}
