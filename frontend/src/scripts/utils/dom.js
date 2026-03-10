// 단일 DOM 요소를 조회
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

// 다중 DOM 요소를 배열로 조회
export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

// 전달값이 선택자/요소인지 판단해 실제 Element로 변환
export function resolveElement(target) {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (typeof target === "string") return document.querySelector(target);
  return null;
}

// 태그명과 옵션 객체를 기반으로 Element를 생성
export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  const { className, text, attrs, dataset, children } = options;

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  // attrs 옵션은 setAttribute로 일괄 반영
  if (attrs && typeof attrs === "object") {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      element.setAttribute(key, String(value));
    });
  }

  // dataset 옵션은 data-* 속성으로 반영
  if (dataset && typeof dataset === "object") {
    Object.entries(dataset).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      element.dataset[key] = String(value);
    });
  }

  // children 배열에 유효한 노드만 append
  if (Array.isArray(children) && children.length > 0) {
    element.append(...children.filter(Boolean));
  }

  return element;
}

// 대상 요소 자식 노드 전체 제거
export function clearChildren(target) {
  const element = resolveElement(target);
  if (!element) return;
  element.replaceChildren();
}

// 대상 요소의 텍스트를 안전하게 교체
export function setText(target, text) {
  const element = resolveElement(target);
  if (!element) return;
  element.textContent = text ?? "";
}

