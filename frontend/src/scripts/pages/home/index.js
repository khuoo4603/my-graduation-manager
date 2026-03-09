function initHomePage() {
  console.log("[page] home loaded");
  const pageRoot = document.querySelector('[data-page="home"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initHomePage();
