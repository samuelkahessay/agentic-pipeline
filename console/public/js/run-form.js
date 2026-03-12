window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("run-form");
  if (!form) {
    return;
  }

  const workiqInputs = document.getElementById("workiq-inputs");
  const notesInputs = document.getElementById("notes-inputs");
  const targetRepoGroup = document.getElementById("target-repo-group");

  function refreshVisibility() {
    const inputSource = form.elements.inputSource.value;
    const mode = form.elements.mode.value;
    workiqInputs.classList.toggle("hidden", inputSource !== "workiq");
    notesInputs.classList.toggle("hidden", inputSource !== "notes");
    targetRepoGroup.classList.toggle("hidden", mode !== "existing");
  }

  form.addEventListener("change", refreshVisibility);
  refreshVisibility();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = {
      inputSource: form.elements.inputSource.value,
      query: form.elements.query.value.trim(),
      notes: form.elements.notes.value.trim(),
      mode: form.elements.mode.value,
      targetRepo: form.elements.targetRepo.value.trim(),
      mockMode: form.elements.mockMode.checked,
    };

    const response = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();
    if (!response.ok) {
      alert(payload.error || "Run failed to start.");
      return;
    }

    window.location.href = `/run/${payload.runId}`;
  });
});
