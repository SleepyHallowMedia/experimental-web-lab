import { features } from '../scripts/feature-detect.js';

const tc = document.createElement('template');
tc.innerHTML = `
  <style>
    .wrap{display:grid; gap:12px}
    .row{display:flex; gap:10px; flex-wrap:wrap; align-items:center}
    textarea{width: min(820px, 100%)}
    .btn{
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.08);
      color: inherit;
      padding: 8px 10px;
      cursor: pointer;
    }
    .muted{color: var(--muted)}
  </style>
  <div class="wrap">
    <div class="muted" id="cap"></div>
    <textarea id="t" placeholder="Type text here…"></textarea>
    <div class="row">
      <button id="copy" class="btn">Copy</button>
      <button id="paste" class="btn">Paste</button>
      <button id="copyRich" class="btn">Copy (with timestamp)</button>
      <span id="s" class="muted"></span>
    </div>
  </div>
`;

customElements.define('x-clipboard-lab', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(tc.content.cloneNode(true));
  }
  connectedCallback(){
    const sh = this.shadowRoot;
    this.t = sh.getElementById('t');
    this.s = sh.getElementById('s');
    const cap = sh.getElementById('cap');

    cap.textContent = `clipboard.writeText: ${features.clipboardWrite()} • clipboard.readText: ${features.clipboardRead()}`;

    sh.getElementById('copy').addEventListener('click', ()=>this.copy());
    sh.getElementById('copyRich').addEventListener('click', ()=>this.copyRich());
    sh.getElementById('paste').addEventListener('click', ()=>this.paste());
  }

  async copy(){
    const text = this.t.value;
    try{
      if (features.clipboardWrite()){
        await navigator.clipboard.writeText(text);
        this.s.textContent = 'Copied via Clipboard API.';
      } else {
        this.fallbackCopy(text);
        this.s.textContent = 'Copied via execCommand fallback.';
      }
    }catch(e){
      this.fallbackCopy(text);
      this.s.textContent = `Copy fallback used (${e.message}).`;
    }
  }

  async copyRich(){
    const text = `${this.t.value}\n\n— copied at ${new Date().toISOString()}`;
    this.t.value = text;
    return this.copy();
  }

  async paste(){
    try{
      if (!features.clipboardRead()){
        this.s.textContent = 'Read not available; use Ctrl/Cmd+V into the textarea.';
        this.t.focus();
        return;
      }
      const text = await navigator.clipboard.readText();
      this.t.value = text;
      this.s.textContent = 'Pasted via Clipboard API.';
    }catch(e){
      this.s.textContent = `Paste failed (permission?): ${e.message}`;
    }
  }

  fallbackCopy(text){
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
});