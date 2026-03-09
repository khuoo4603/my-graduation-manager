function initGradPage() {
  console.log("[page] grad loaded");
  const pageRoot = document.querySelector('[data-page="grad"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initGradPage();
