window.addEventListener("load", () => {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const sabers = Array.from({ length: 30 }, () => ({
    x: Math.random() * canvas.width,
    y: 200 + Math.random() * (canvas.height - 200),
    length: 80 + Math.random() * 120,
    speed: 0.8 + Math.random() * 1.5,
    hue: Math.random() * 360,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sabers.forEach(saber => {
      saber.y += saber.speed;
      if (saber.y > canvas.height + saber.length) {
        saber.y = 200 - saber.length;
        saber.x = Math.random() * canvas.width;
      }
      ctx.strokeStyle = `hsl(${saber.hue}, 100%, 70%)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(saber.x, saber.y);
      ctx.lineTo(saber.x, saber.y + saber.length);
      ctx.stroke();
    });
    requestAnimationFrame(draw);
  }

  draw();
});