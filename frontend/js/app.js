console.log("APP.JS LOADED");

// === PAGE MAP ===
const pages = {
  collection: document.getElementById("page-collection"),
  qa: document.getElementById("page-qa"),
  priority: document.getElementById("page-priority"),
  history: document.getElementById("page-history"),
};

function showPage(key) {
  Object.values(pages).forEach(p => p.style.display = "none");
  pages[key].style.display = "block";
}

// === NAV EVENTS ===
document.getElementById("nav-collection").addEventListener("click", () => showPage("collection"));
document.getElementById("nav-qa").addEventListener("click", () => showPage("qa"));
document.getElementById("nav-priority").addEventListener("click", () => showPage("priority"));
document.getElementById("nav-history").addEventListener("click", () => showPage("history"));

// === INIT ===
// Load state from backend and render UI
async function initApp() {
  if (typeof loadState === "function") {
    await loadState();
  }
  if (typeof renderAll === "function") {
    renderAll();
  }
  showPage("collection");
}

initApp();

