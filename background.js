window.addEventListener("load", () => {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Minimalist floating dots with high contrast colors
  const dots = Array.from({ length: 38 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 2.5 + Math.random() * 2.5,
    dx: (Math.random() - 0.5) * 0.18,
    dy: (Math.random() - 0.5) * 0.18,
    alpha: 0.85,
    color: Math.random() > 0.5 ? "#fff" : "#00e0ff"
  }));

  // Mouse tracking (listen on window, not canvas)
  let mouse = { x: null, y: null, active: false };
  window.addEventListener("mousemove", e => {
    // Map mouse coordinates to canvas size
    const x = e.clientX;
    const y = e.clientY;
    mouse.x = x * (canvas.width / window.innerWidth);
    mouse.y = y * (canvas.height / window.innerHeight);
    mouse.active = true;
  });
  window.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  function draw() {
    // Draw dark background for contrast
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#181c24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw "bonds" between close dots with high contrast
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i];
        const b = dots[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          // Bright cyan for short, orange for longer bonds
          const t = dist / 110;
          ctx.strokeStyle = t < 0.5
            ? `rgba(0,224,255,${0.45 - t * 0.25})`
            : `rgba(255,180,0,${0.32 - (t - 0.5) * 0.32})`;
          ctx.lineWidth = 1.7 - t * 1.1;
          ctx.shadowColor = "#fff";
          ctx.shadowBlur = 4;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    dots.forEach(dot => {
      // Repel from mouse if close
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 60;
        if (dist < minDist) {
          // Repel strength decreases with distance
          const force = (minDist - dist) / minDist;
          const angle = Math.atan2(dy, dx);
          dot.x += Math.cos(angle) * force * 2.2;
          dot.y += Math.sin(angle) * force * 2.2;
        }
      }
      dot.x += dot.dx;
      dot.y += dot.dy;
      if (dot.x < 0 || dot.x > canvas.width) dot.dx *= -1;
      if (dot.y < 0 || dot.y > canvas.height) dot.dy *= -1;
      ctx.save();
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
      ctx.fillStyle = dot.color;
      ctx.globalAlpha = dot.alpha;
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }

  draw();
});