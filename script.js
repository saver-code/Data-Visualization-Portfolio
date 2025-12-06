// Smooth scroll for in-page links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Hero canvas: subtle rough graphs overlay on same background color
// ...existing code...

// ...existing code...

// Floating graphs background across the whole page
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const sprites = [];

  function rand(min, max) { return Math.random() * (max - min) + min; }
  const rgba = (hex, a) => {
    let h = hex.replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join('');
    const n = parseInt(h,16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    return `rgba(${r},${g},${b},${a})`;
  };

  function sizeCanvas() {
    const vw = window.innerWidth, vh = window.innerHeight;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // chart primitives
  function drawGrid(step, color) {
    const vw = window.innerWidth, vh = window.innerHeight;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let x=0; x<vw; x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,vh); ctx.stroke(); }
    for (let y=0; y<vh; y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(vw,y); ctx.stroke(); }
    ctx.restore();
  }
  function roughRect(x,y,w,h){
    for(let i=0;i<2;i++){ ctx.beginPath();
      ctx.moveTo(x+rand(-1,1),y+rand(-1,1));
      ctx.lineTo(x+w+rand(-1,1),y+rand(-1,1));
      ctx.lineTo(x+w+rand(-1,1),y+h+rand(-1,1));
      ctx.lineTo(x+rand(-1,1),y+h+rand(-1,1));
      ctx.closePath(); ctx.stroke();
    }
  }
  function drawLineChart(x,y,w,h) {
    const pts=[]; const n=6;
    for (let i=0;i<n;i++) pts.push([x+(w/(n-1))*i+rand(-6,6), y+h-(h*Math.random())+rand(-6,6)]);
    ctx.save(); ctx.globalAlpha=.6;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.stroke();
    ctx.globalAlpha=1; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]+rand(-1,1));
    ctx.stroke(); ctx.restore();
  }
  function drawBarChart(x,y,w,h,bars){
    ctx.save(); ctx.globalAlpha=.6;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.stroke();
    ctx.globalAlpha=1;
    const gap=6, bw=(w-gap*(bars+1))/bars;
    for(let i=0;i<bars;i++){
      const bh=rand(h*.2,h*.95), bx=x+gap+i*(bw+gap), by=y+h-bh;
      roughRect(bx,by,bw,bh);
    }
    ctx.restore();
  }
  function drawScatter(x,y,w,h,count){
    ctx.save(); ctx.globalAlpha=.6;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.stroke();
    ctx.globalAlpha=1;
    for(let i=0;i<count;i++){
      const px=x+rand(6,w-6), py=y+rand(6,h-6);
      ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }
  function drawMiniSparkline(x, y, w, h, points = 8) {
    const pts = [];
    for (let i = 0; i < points; i++) {
      pts.push([x + (w / (points - 1)) * i + rand(-2, 2), y + rand(0, h)]);
    }
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < pts.length; i += Math.max(1, Math.floor(points / 4))) {
      ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  function drawMiniPie(cx, cy, r, segments = 5) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2 - rand(0.05, 0.15);
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function createSprites() {
    sprites.length = 0;
    const vw = window.innerWidth, vh = window.innerHeight;
    const count = Math.floor(vw / 160) + 10; // density
    for (let i = 0; i < count; i++) {
      const w = rand(90, 150), h = rand(40, 70);
      sprites.push({
        x: rand(24, vw - w - 24),
        y: rand(24, vh - h - 24),
        w, h,
        type: ['spark', 'bar', 'line', 'pie'][Math.floor(rand(0, 4))],
        vx: rand(-0.06, 0.06),
        vy: rand(-0.05, 0.05),
        sway: rand(0.5, 1.2),
        phase: rand(0, Math.PI * 2)
      });
    }
  }

  function drawSprite(s) {
    if (s.type === 'spark') drawMiniSparkline(s.x, s.y, s.w, s.h, Math.floor(rand(6, 10)));
    else if (s.type === 'bar') drawBarChart(s.x, s.y, s.w, s.h, Math.floor(rand(4, 7)));
    else if (s.type === 'line') drawLineChart(s.x, s.y, s.w, s.h);
    else drawMiniPie(s.x + s.w/2, s.y + s.h/2, Math.min(s.w, s.h) / 3, Math.floor(rand(4, 7)));
  }

  function updateSprites(dt) {
    const vw = window.innerWidth, vh = window.innerHeight;
    for (const s of sprites) {
      s.phase += dt * 0.0015 * s.sway;
      s.x += s.vx * (dt * 0.6) + Math.sin(s.phase) * 0.08;
      s.y += s.vy * (dt * 0.6) + Math.cos(s.phase) * 0.06;

      // wrap around edges
      if (s.x < -160) s.x = vw + 20;
      if (s.x > vw + 160) s.x = -20;
      if (s.y < -120) s.y = vh + 20;
      if (s.y > vh + 120) s.y = -20;
    }
  }

  function drawBackdrop() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#4cc9f0';
    ctx.strokeStyle = rgba(accent, 0.65);
    ctx.lineWidth = 2.2;
    ctx.shadowColor = rgba(accent, 0.3);
    ctx.shadowBlur = 4;
    drawGrid(80, 'rgba(255,255,255,0.06)');
    drawGrid(20, 'rgba(255,255,255,0.02)');
  }

  function render() {
    sizeCanvas();
    createSprites();
  }

  let last = performance.now();
  function frame(now) {
    const dt = now - last; last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackdrop();
    updateSprites(dt);
    for (const s of sprites) drawSprite(s);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { render(); }, { passive: true });
  render();
  requestAnimationFrame(frame);
})();

// ...existing code...