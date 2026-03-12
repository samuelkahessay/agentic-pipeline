async function loadPreflight() {
  const grid = document.getElementById("preflight-grid");
  if (!grid) {
    return;
  }

  const response = await fetch("/api/preflight");
  const payload = await response.json();
  grid.innerHTML = "";

  for (const check of payload.checks) {
    const card = document.createElement("article");
    card.className = `preflight-card ${check.present ? "good" : "bad"}`;
    card.innerHTML = `
      <div class="status-pill">${check.present ? "Ready" : "Missing"}</div>
      <h3>${check.name}</h3>
      <small>${check.required ? "Required for launch" : "Optional"}</small>
    `;
    grid.appendChild(card);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadPreflight().catch((error) => {
    console.error(error);
  });
});
