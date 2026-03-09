function initGradStatusPage() {
  console.log("[page] grad/status loaded");
  const pageRoot = document.querySelector('[data-page="grad-status"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initGradStatusPage();
