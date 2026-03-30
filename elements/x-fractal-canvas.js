import { clamp, prefersReducedMotion } from '../scripts/utils.js';

const tf = document.createElement('template');
tf.innerHTML = `
  <style>
    .wrap{display:grid; gap:12px}
    canvas{
      width: 100%;
      height: 340px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.2);
    }
    .controls{display:flex; flex-wrap:wrap; gap:12px; align-items:center}
    .controls label{display:flex; gap:8px; align-items:center}
    .pill{
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      border-radius: 999px;
      padding: 8px 10px;
    }
  </style>

  <div class="wrap">
    <canvas></canvas>
    <div class="controls">
      <label class="pill">Iterations
        <input id="it" type="range" min="50" max="600" value="220" />
      </label>
      <label class="pill">Zoom
        <input id="zm" type="range" min="1" max="200" value="70" />
      </label>
      <label class="pill">Animate
        <input id="an" type="checkbox" checked />
      </label>
      <button id="reroll" class="pill">Reroll palette</button>
      <span class="pill" id="info"></span>
    </div>
  </div>
`;

function palette(n=256, seed=1){
  const arr = [];
  let x = seed * 99991;
  for (let i=0;i<n;i++){
    x = (x * 1664525 + 1013904223) >>> 0;
    const r = 40 + (x & 255);
    const g = 40 + ((x>>8) & 255);
    const b = 40 + ((x>>16) & 255);
    arr.push([r&255,g&255,b&255]);
  }
  return arr;
}

customElements.define('x-fractal-canvas', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(tf.content.cloneNode(true));
  }
  connectedCallback(){
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.it = this.shadowRoot.getElementById('it');
    this.zm = this.shadowRoot.getElementById('zm');
    this.an = this.shadowRoot.getElementById('an');
    this.info = this.shadowRoot.getElementById('info');
    this.seed = 1 + Math.floor(Math.random()*1e6);
    this.pal = palette(256, this.seed);

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.draw();
    };

    this.shadowRoot.getElementById('reroll').addEventListener('click', () => {
      this.seed = 1 + Math.floor(Math.random()*1e6);
      this.pal = palette(256, this.seed);
      this.draw();
    });

    [this.it, this.zm, this.an].forEach(el => el.addEventListener('input', () => this.draw()));

    this._ro = new ResizeObserver(resize);
    this._ro.observe(this.canvas);

    this.t0 = performance.now();
    this.anim = !prefersReducedMotion();
    this.loop = (t) => {
      if (this.an.checked && this.anim){
        this.t0 = t;
        this.draw(t);
      }
      this._raf = requestAnimationFrame(this.loop);
    };
    this._raf = requestAnimationFrame(this.loop);
    resize();
  }
  disconnectedCallback(){
    this._ro?.disconnect();
    cancelAnimationFrame(this._raf);
  }

  draw(t = performance.now()){
    const w = this.canvas.width, h = this.canvas.height;
    const img = this.ctx.createImageData(w, h);
    const data = img.data;

    const iterations = +this.it.value;
    const zoom = +this.zm.value / 50;
    const time = (t * 0.00008);

    // Julia-ish set with time-varying constant
    const cx = -0.72 + Math.cos(time) * 0.15;
    const cy =  0.18 + Math.sin(time*1.3) * 0.12;

    for (let y=0;y<h;y++){
      const ny = (y - h/2) / (h/2) / zoom;
      for (let x=0;x<w;x++){
        const nx = (x - w/2) / (w/2) / zoom;

        let zx = nx, zy = ny;
        let i = 0;
        for (; i<iterations; i++){
          const xx = zx*zx - zy*zy + cx;
          const yy = 2*zx*zy + cy;
          zx = xx; zy = yy;
          if (zx*zx + zy*zy > 4) break;
        }

        const idx = (y*w + x)*4;
        const p = this.pal[i % 256];
        const shade = i === iterations ? 0.08 : 1.0;
        data[idx]   = p[0] * shade;
        data[idx+1] = p[1] * shade;
        data[idx+2] = p[2] * shade;
        data[idx+3] = 255;
      }
    }

    this.ctx.putImageData(img, 0, 0);
    this.info.textContent = `seed:${this.seed} it:${iterations} zoom:${zoom.toFixed(2)} c:${cx.toFixed(2)},${cy.toFixed(2)}`;
  }
});