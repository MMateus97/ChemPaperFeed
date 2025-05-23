let showSavedOnly = false;
let currentPapers = [];
let activeJournal = null;
let activeDiscipline = null;

function renderPapers(papers, container) {
  const saved = new Set(JSON.parse(localStorage.getItem("savedDOIs") || "[]"));
  container.innerHTML = "";

  papers.forEach(paper => {
    if (showSavedOnly && !saved.has(paper.doi)) return;
    if (activeJournal && paper.journal !== activeJournal) return;
    if (activeDiscipline && paper.discipline !== activeDiscipline) return;

    const div = document.createElement("div");
    div.className = "paper";

    const dateObj = paper.date || {};
    const dateString = [dateObj.year, dateObj.month, dateObj.day].filter(Boolean).join("-") || "n/a";

    const abstractHTML = paper.abstract
      ? `<details><summary>Read more</summary><p>${paper.abstract}</p></details>`
      : "";

    const isSaved = saved.has(paper.doi);
    const savedText = isSaved ? "★ Saved" : "⭐ Save";

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

function renderSidebarFilters(papers) {
  const journalSet = new Set();
  const disciplineSet = new Set();

  papers.forEach(p => {
    if (p.journal) journalSet.add(p.journal);
    if (p.discipline) disciplineSet.add(p.discipline);
  });

  const journalList = document.getElementById("journal-filter");
  const disciplineList = document.getElementById("discipline-filter");

  journalList.innerHTML = "";
  disciplineList.innerHTML = "";

  [...journalSet].sort().forEach(journal => {
    const li = document.createElement("li");
    li.textContent = journal;
    li.addEventListener("click", () => {
      activeJournal = activeJournal === journal ? null : journal;
      renderPapers(currentPapers, document.getElementById("papers"));
      updateSidebarSelection();
    });
    journalList.appendChild(li);
  });

  [...disciplineSet].sort().forEach(discipline => {
    const li = document.createElement("li");
    li.textContent = discipline;
    li.addEventListener("click", () => {
      activeDiscipline = activeDiscipline === discipline ? null : discipline;
      renderPapers(currentPapers, document.getElementById("papers"));
      updateSidebarSelection();
    });
    disciplineList.appendChild(li);
  });

  function updateSidebarSelection() {
    document.querySelectorAll("#journal-filter li").forEach(li => {
      li.classList.toggle("active", li.textContent === activeJournal);
    });
    document.querySelectorAll("#discipline-filter li").forEach(li => {
      li.classList.toggle("active", li.textContent === activeDiscipline);
    });
  }
}

fetch("papers.json")
  .then(res => res.json())
  .then(papers => {
    currentPapers = papers;
    renderSidebarFilters(papers);
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
