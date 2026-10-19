// Continuous, resolution-aware circular waves. No video decoding or dependencies.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const surfaces = [];
  let frame = 0, previous = 0, time = 0;
  const button = document.querySelector('.video-toggle');
  let paused = preference.matches;

  for (const host of document.querySelectorAll('.art, .work-visual.portal')) {
    const canvas = document.createElement('canvas');
    canvas.className = 'circular-waves';
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); continue; }
    host.classList.add('has-waves');
    const surface = { host, canvas, ctx, width: 0, height: 0, visible: false, x: 0, y: 0, targetX: 0, targetY: 0 };
    surfaces.push(surface);
    new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      surface.width = width; surface.height = height;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(surface);
    }).observe(host);
    new IntersectionObserver(([entry]) => {
      surface.visible = entry.isIntersecting;
      schedule();
    }, { rootMargin: '80px' }).observe(host);
    host.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || preference.matches) return;
      const bounds = host.getBoundingClientRect();
      surface.targetX = (event.clientX - bounds.left) / bounds.width - .5;
      surface.targetY = (event.clientY - bounds.top) / bounds.height - .5;
    });
    host.addEventListener('pointerleave', () => { surface.targetX = surface.targetY = 0; });
  }

  function draw(s) {
    const { ctx, width: w, height: h } = s;
    if (!w || !h) return;
    const size = Math.hypot(w, h) * .64;
    const cx = w * .5 + s.x * w * .09, cy = h * .5 + s.y * h * .09;
    const background = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
    background.addColorStop(0, '#051c89');
    background.addColorStop(.3, '#174be7');
    background.addColorStop(.7, '#387df7');
    background.addColorStop(1, '#aad9ff');
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    // Each ring travels outward; fading at both ends makes the wrap seamless.
    for (let i = 23; i >= 0; i--) {
      const progress = ((i / 24 + time * .045) % 1);
      const radius = size * Math.pow(progress, 1.24);
      const opacity = Math.min(1, progress * 12) * Math.min(1, (1 - progress) * 7);
      ctx.beginPath();
      for (let j = 0; j <= 144; j++) {
        const angle = j / 144 * Math.PI * 2;
        const ripple = Math.sin(angle * 3 + time * .7 - progress * 9) * .018
          + Math.cos(angle * 5 - time * .45 + progress * 5) * .009;
        const r = radius * (1 + ripple);
        const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.lineWidth = 2 + progress * 9;
      ctx.strokeStyle = `rgba(3,32,157,${opacity * .28})`; ctx.stroke();
      ctx.lineWidth = .8 + progress * 2.5;
      ctx.strokeStyle = `rgba(196,235,255,${opacity * .8})`; ctx.stroke();
    }
  }
  function schedule() {
    if (!frame && !paused && !document.hidden && surfaces.some(s => s.visible)) {
      previous = 0; frame = requestAnimationFrame(tick);
    }
  }
  function tick(now) {
    frame = 0;
    if (paused || document.hidden || !surfaces.some(s => s.visible)) return;
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now; time += dt;
    for (const s of surfaces) if (s.visible) {
      const ease = 1 - Math.exp(-5 * dt);
      s.x += (s.targetX - s.x) * ease; s.y += (s.targetY - s.y) * ease;
      draw(s);
    }
    frame = requestAnimationFrame(tick);
  }
  function syncButton() {
    button.textContent = paused ? 'PLAY ↗' : 'PAUSE Ⅱ';
    button.setAttribute('aria-label', paused ? 'Play circular waves' : 'Pause circular waves');
    button.setAttribute('aria-pressed', String(paused));
  }
  button.onclick = () => { paused = !paused; syncButton(); schedule(); };
  preference.addEventListener('change', () => {
    paused = preference.matches; syncButton();
    if (paused) { time = 0; surfaces.forEach(draw); }
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  syncButton();
})();
