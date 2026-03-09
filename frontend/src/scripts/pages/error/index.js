function initErrorPage() {
  console.log("[page] error loaded");
  const pageRoot = document.querySelector('[data-page="error"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initErrorPage();
