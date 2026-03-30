// elements/x-signal-graph.js
import { prefersReducedMotion } from '../scripts/utils.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .wrap { display: grid; gap: 12px; }
    canvas {
      width: 100%;
      height: 220px;
      display: block;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.22);
    }
    .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .pill {
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      border-radius: 999px;
      padding: 8px 10px;
      display: inline-flex;
      gap: 8px;
      align-items: center;
      user-select: none;
      white-space: nowrap;
    }
    input[type="range"] { width: 140px; }
  </style>

  <div class="wrap">
    <canvas part="canvas" aria-label="Animated signal graph"></canvas>
    <div class="controls">
      <label class="pill">
        Speed
        <input id="sp" type="range" min="1" max="120" value="40">
      </label>

      <label class="pill">
        Noise
        <input id="nz" type="range" min="0" max="100" value="18">
      </label>

      <label class="pill">
        Glow
        <input id="gl" type="checkbox" checked>
      </label>

      <span class="pill" id="fps" title="Approximate frame rate"></span>
    </div>
  </div>
`;

customElements.define('x-signal-graph', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    this._raf = 0;
    this._ro = null;

    this.t = 0;
    this._last = 0;

    this._fpsFrames = 0;
    this._fpsLast = 0;
  }

  connectedCallback() {
    const root = this.shadowRoot;

    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    this.sp = root.getElementById('sp');
    this.nz = root.getElementById('nz');
    this.gl = root.getElementById('gl');
    this.fpsEl = root.getElementById('fps');

    this.animEnabled = !prefersReducedMotion();

    // Resize to device pixels for crisp rendering.
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));

      if (this.canvas.width !== w) this.canvas.width = w;
      if (this.canvas.height !== h) this.canvas.height = h;

      // Draw immediately after resize (even in reduced motion)
      this.draw(0);
    };

    this._ro = new ResizeObserver(resize);
    this._ro.observe(this.canvas);
    resize();

    // If reduced motion, still redraw on control changes.
    const redraw = () => this.draw(0);
    this.sp.addEventListener('input', redraw);
    this.nz.addEventListener('input', redraw);
    this.gl.addEventListener('change', redraw);

    // Start animation loop
    this._last = performance.now();
    this._fpsLast = this._last;

    const loop = (now) => {
      if (!this.isConnected) return;

      const dtMs = now - this._last;
      this._last = now;

      // Clamp dt to avoid huge jumps (tab switching, etc.)
      const dt = Math.max(0, Math.min(0.05, dtMs / 1000));

      if (this.animEnabled) {
        this.draw(dt);

        // FPS approx update every ~0.6s
        this._fpsFrames += 1;
        const elapsed = now - this._fpsLast;
        if (elapsed >= 600) {
          const fps = Math.round((this._fpsFrames * 1000) / elapsed);
          this.fpsEl.textContent = fps + ' fps';
          this._fpsFrames = 0;
          this._fpsLast = now;
        }
      } else {
        this.fpsEl.textContent = 'reduced motion';
      }

      this._raf = requestAnimationFrame(loop);
    };

    this._raf = requestAnimationFrame(loop);
  }

  disconnectedCallback() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
  }

  draw(dt) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Read controls
    const speed = Number(this.sp.value) / 40;     // ~1 at 40
    const noiseAmt = Number(this.nz.value) / 100; // 0..1

    this.t += dt * speed;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Glow toggle
    if (this.gl.checked) {
      ctx.shadowColor = 'rgba(124,92,255,0.55)';
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowBlur = 0;
    }

    // Main signal stroke
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(34,211,238,0.95)';
    ctx.beginPath();

    // Composite signal: a couple of sines + deterministic pseudo-noise
    // Deterministic noise avoids flicker while still looking "alive".
    for (let x = 0; x < w; x++) {
      const u = x / Math.max(1, (w - 1));

      const s1 = Math.sin((u * 8 + this.t) * Math.PI * 2) * 0.42;
      const s2 = Math.sin((u * 2 - this.t * 0.7) * Math.PI * 2) * 0.20;
      const s3 = Math.sin((u * 20 + this.t * 1.7) * Math.PI * 2) * 0.06;

      const base = s1 + s2 + s3;

      // Deterministic pseudo noise 0..1
      const n01 = (Math.sin((u * 40 + this.t * 3.2) * 99.1) * 0.5 + 0.5);
      const noise = (n01 - 0.5) * noiseAmt; // -0.5..0.5 scaled

      const y = (h / 2) + (base + noise) * (h * 0.42);

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Baseline
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }
});