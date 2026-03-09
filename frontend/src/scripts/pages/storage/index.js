function initStoragePage() {
  console.log("[page] storage loaded");
  const pageRoot = document.querySelector('[data-page="storage"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initStoragePage();
