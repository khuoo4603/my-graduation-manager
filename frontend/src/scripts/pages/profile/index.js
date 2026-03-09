function initProfilePage() {
  console.log("[page] profile loaded");
  const pageRoot = document.querySelector('[data-page="profile"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initProfilePage();
