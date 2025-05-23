let showSavedOnly = false;

function renderPapers(papers, container) {
  const saved = new Set(JSON.parse(localStorage.getItem("savedDOIs") || "[]"));
  container.innerHTML = "";

  papers.forEach(paper => {
    if (showSavedOnly && !saved.has(paper.doi)) return;

    const div = document.createElement("div");
    div.className = "paper";

    const dateObj = paper.date || {};
    const dateString = [dateObj.year, dateObj.month, dateObj.day].filter(Boolean).join("-") || "n/a";

    const abstractHTML = paper.abstract
      ? `<details><summary>Read more</summary><p>${paper.abstract}</p></details>`
      : "";

    const isSaved = saved.has(paper.doi);
    const savedText = isSaved ? "★ Saved" : "☆ Save";

    div.innerHTML = `
      <h3><a href="${paper.link}" target="_blank" rel="noopener noreferrer">${paper.title}</a></h3>
      <p><strong>Authors:</strong> ${paper.authors}</p>
      <p><strong>Journal:</strong> ${paper.journal} (${dateString})</p>
      <p><strong>Discipline:</strong> ${paper.discipline}</p>
      ${abstractHTML}
      <button class="save-btn" data-doi="${paper.doi}">${savedText}</button>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const doi = btn.dataset.doi;
      const saved = new Set(JSON.parse(localStorage.getItem("savedDOIs") || "[]"));

      if (saved.has(doi)) {
        saved.delete(doi);
      } else {
        saved.add(doi);
      }

      localStorage.setItem("savedDOIs", JSON.stringify([...saved]));
      renderPapers(currentPapers, document.getElementById("papers"));
    });
  });
}

let currentPapers = [];

fetch("papers.json")
  .then(res => res.json())
  .then(papers => {
    currentPapers = papers;
    renderPapers(papers, document.getElementById("papers"));

    document.getElementById("search").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = currentPapers.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.authors.toLowerCase().includes(term) ||
        p.journal.toLowerCase().includes(term) ||
        p.discipline.toLowerCase().includes(term)
      );
      renderPapers(filtered, document.getElementById("papers"));
    });

    document.getElementById("toggle-saved").addEventListener("click", () => {
      showSavedOnly = !showSavedOnly;
      document.getElementById("toggle-saved").textContent = showSavedOnly ? "Show All" : "Show Saved";
      renderPapers(currentPapers, document.getElementById("papers"));
    });
  })
  .catch(err => {
    document.getElementById("papers").innerHTML = `<p>Failed to load papers. Try refreshing.</p>`;
    console.error("Error loading papers:", err);
  });
