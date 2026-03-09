function initGradCoursesPage() {
  console.log("[page] grad/courses loaded");
  const pageRoot = document.querySelector('[data-page="grad-courses"]');
  if (pageRoot) pageRoot.dataset.ready = "true";
}

initGradCoursesPage();
