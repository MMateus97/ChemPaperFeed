let papersShown = 40;
const papersPerLoad = 40;
let showSavedOnly = false;
let currentPapers = [];
let activeJournal = null;
let activeDiscipline = null;
let currentSortMethod = "newest"; // Track selected sort

function sortPapers(papers, method) {
  let arr = [...papers];
  switch (method) {
    case "newest":
      arr.sort((a, b) => {
        const dateA = new Date(`${a.date?.year || 0}-${a.date?.month || 1}-${a.date?.day || 1}`);
        const dateB = new Date(`${b.date?.year || 0}-${b.date?.month || 1}-${b.date?.day || 1}`);
        return dateB - dateA;
      });
      break;
    case "oldest":
      arr.sort((a, b) => {
        const dateA = new Date(`${a.date?.year || 0}-${a.date?.month || 1}-${a.date?.day || 1}`);
        const dateB = new Date(`${b.date?.year || 0}-${b.date?.month || 1}-${b.date?.day || 1}`);
        return dateA - dateB;
      });
      break;
    case "az":
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
      break;
    case "za":
      arr.sort((a, b) => (b.title || "").localeCompare(a.title || "", undefined, { sensitivity: "base" }));
      break;
    case "journal":
      arr.sort((a, b) => (a.journal || "").localeCompare(b.journal || "", undefined, { sensitivity: "base" }));
      break;
    case "discipline":
      arr.sort((a, b) => (a.discipline || "").localeCompare(b.discipline || "", undefined, { sensitivity: "base" }));
      break;
    default:
      break;
  }
  return arr;
}

function renderPapers(papers, container) {
  const saved = new Set(JSON.parse(localStorage.getItem("savedDOIs") || "[]"));
  container.innerHTML = "";

  const isFutureDate = (paper) => {
    const { year, month = 1, day = 1 } = paper.date || {};
    const pubDate = new Date(year, month - 1, day);
    const today = new Date();
    return pubDate > today;
  };

  let shown = 0;

  const sortedPapers = sortPapers(papers, currentSortMethod);

  sortedPapers.forEach(paper => {
    if (isFutureDate(paper)) return;
    if (showSavedOnly && !saved.has(paper.doi)) return;
    if (activeJournal && paper.journal !== activeJournal) return;
    if (activeDiscipline && paper.discipline !== activeDiscipline) return;
    if (shown >= papersShown) return;

    shown++;

    const div = document.createElement("div");
    div.className = "paper";

    const abstractHTML = paper.abstract
      ? `<details><summary>Read more</summary><p>${paper.abstract}</p></details>`
      : "";

    const conceptsHTML = paper.concepts && paper.concepts.length
      ? `<p><strong>Concepts:</strong> ${paper.concepts.join(", ")}</p>`
      : "";

    const isSaved = saved.has(paper.doi);
    const savedText = isSaved ? "★ Saved" : "⭐ Save";

    div.innerHTML = `
      <h3><a href="${paper.link}" target="_blank" rel="noopener noreferrer">${paper.title}</a></h3>
      <p><strong>Authors:</strong> ${paper.authors}</p>
      <p><strong>Journal:</strong> ${paper.journal}</p>
      <p><strong>Publication date:</strong> ${paper.publication_date_str || "n/a"}</p>
      <p><strong>Discipline:</strong> ${paper.discipline}</p>
      ${conceptsHTML}
      ${abstractHTML}
      <button class="save-btn" data-doi="${paper.doi}">${savedText}</button>
    `;

    container.appendChild(div);
  });

  const filtered = sortedPapers.filter(paper => {
    if (isFutureDate(paper)) return false;
    if (showSavedOnly && !saved.has(paper.doi)) return false;
    if (activeJournal && paper.journal !== activeJournal) return false;
    if (activeDiscipline && paper.discipline !== activeDiscipline) return false;
    return true;
  });

  if (shown < filtered.length) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.textContent = "Load More";
    loadMoreBtn.className = "load-more";
    loadMoreBtn.addEventListener("click", () => {
      papersShown += papersPerLoad;
      renderPapers(papers, container);
    });
    container.appendChild(loadMoreBtn);
  }

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
      papersShown = papersPerLoad;
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
      papersShown = papersPerLoad;
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
      papersShown = papersPerLoad;
      renderPapers(filtered, document.getElementById("papers"));
    });

    document.getElementById("toggle-saved").addEventListener("click", () => {
      showSavedOnly = !showSavedOnly;
      document.getElementById("toggle-saved").textContent = showSavedOnly ? "Show All" : "Show Saved";
      papersShown = papersPerLoad;
      renderPapers(currentPapers, document.getElementById("papers"));
    });

    document.getElementById("sort-method").addEventListener("change", (e) => {
      currentSortMethod = e.target.value;
      papersShown = papersPerLoad;
      renderPapers(currentPapers, document.getElementById("papers"));
    });
  })
  .catch(err => {
    document.getElementById("papers").innerHTML = "<p>Failed to load papers. Try refreshing.</p>";
    console.error("Error loading papers:", err);
  });
