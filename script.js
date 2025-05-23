fetch("papers.json")
  .then(res => res.json())
  .then(papers => {
    const container = document.getElementById("papers");

    papers.forEach(paper => {
      const div = document.createElement("div");
      div.className = "paper";

      div.innerHTML = `
        <h3><a href="${paper.link}" target="_blank" rel="noopener noreferrer">${paper.title}</a></h3>
        <p><strong>Authors:</strong> ${paper.authors}</p>
        <p><strong>Journal:</strong> ${paper.journal} (${paper.date})</p>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    document.getElementById("papers").innerHTML = `<p>Failed to load papers. Try refreshing.</p>`;
    console.error("Error loading papers:", err);
  });
