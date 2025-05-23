fetch("papers.json")
  .then(res => res.json())
  .then(papers => {
    const container = document.getElementById("papers");

    papers.forEach(paper => {
      const div = document.createElement("div");
      div.className = "paper";

      // Format date object into a string like "2025-05-23"
      const dateObj = paper.date || {};
      const dateString = [dateObj.year, dateObj.month, dateObj.day].filter(Boolean).join("-") || "n/a";

      div.innerHTML = `
        <h3><a href="${paper.link}" target="_blank" rel="noopener noreferrer">${paper.title}</a></h3>
        <p><strong>Authors:</strong> ${paper.authors}</p>
        <p><strong>Journal:</strong> ${paper.journal} (${dateString})</p>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    document.getElementById("papers").innerHTML = `<p>Failed to load papers. Try refreshing.</p>`;
    console.error("Error loading papers:", err);
  });
