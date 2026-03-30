import { clamp } from '../scripts/utils.js';
import { features } from '../scripts/feature-detect.js';

const ts = document.createElement('template');
ts.innerHTML = `
  <style>
    .wrap{display:grid; gap:12px}
    .grid{
      display:grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 8px;
    }
    button{
      aspect-ratio: 1/1;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(255,255,255,.06);
      cursor:pointer;
      color: inherit;
      transition: transform .05s ease, background .15s ease;
    }
    button:active{transform: translateY(1px)}
    button.on{background: color-mix(in oklab, var(--accent), rgba(255,255,255,.06) 50%)}
    .controls{display:flex; flex-wrap:wrap; gap: 12px; align-items:center}
    .pill{
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      border-radius: 999px;
      padding: 8px 10px;
      display:flex; gap: 8px; align-items:center;
    }
    .msg{color: var(--muted)}
  </style>

  <div class="wrap">
    <div class="msg" id="msg"></div>
    <div class="grid" id="grid"></div>
    <div class="controls">
      <label class="pill">Wave
        <select id="wave">
          <option>sine</option><option>triangle</option><option>sawtooth</option><option>square</option>
        </select>
      </label>
      <label class="pill">Attack
        <input id="a" type="range" min="0" max="400" value="15" />
      </label>
      <label class="pill">Release
        <input id="r" type="range" min="0" max="1200" value="180" />
      </label>
      <label class="pill">Master
        <input id="m" type="range" min="0" max="100" value="25" />
      </label>
    </div>
  </div>
`;

customElements.define('x-synth-pad', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(ts.content.cloneNode(true));
  }
  connectedCallback(){
    const sh = this.shadowRoot;
    this.msg = sh.getElementById('msg');
    this.grid = sh.getElementById('grid');
    this.wave = sh.getElementById('wave');
    this.attack = sh.getElementById('a');
    this.release = sh.getElementById('r');
    this.master = sh.getElementById('m');

    if (!features.audio()){
      this.msg.textContent = 'Web Audio not available in this browser.';
      return;
    }
    this.msg.textContent = 'Click a pad to play a note. (Audio starts after your first click.)';

    // Create pads
    const base = 220; // A3
    const notes = Array.from({length: 16}, (_,i)=> base * Math.pow(2, i/12));
    this.buttons = notes.map((f,i)=>{
      const b = document.createElement('button');
      b.textContent = (i%12===0) ? 'A' : '';
      b.title = `${f.toFixed(1)} Hz`;
      b.addEventListener('pointerdown', () => this.play(f, b));
      this.grid.appendChild(b);
      return b;
    });
  }

  ensureCtx(){
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.out = this.ctx.createGain();
    this.out.gain.value = (+this.master.value)/100;
    this.out.connect(this.ctx.destination);

    this.master.addEventListener('input', ()=> this.out.gain.value = (+this.master.value)/100);
  }

  play(freq, btn){
    this.ensureCtx();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = this.wave.value;
    osc.frequency.setValueAtTime(freq, now);

    const a = (+this.attack.value)/1000;
    const r = (+this.release.value)/1000;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + Math.max(0.001, a));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.01, a + r));

    osc.connect(gain);
    gain.connect(this.out);
    osc.start(now);
    osc.stop(now + a + r + 0.03);

    btn.classList.add('on');
    setTimeout(()=> btn.classList.remove('on'), Math.max(60, (a+r)*1000));
  }
});
``