import { downloadText } from '../scripts/utils.js';
import { features } from '../scripts/feature-detect.js';

const te = document.createElement('template');
te.innerHTML = `
  <style>
    .wrap{display:grid; gap:12px}
    .row{display:flex; gap:10px; flex-wrap:wrap; align-items:center}
    table{
      width: 100%;
      border-collapse: collapse;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.04);
    }
    th, td{
      padding: 10px;
      border-bottom: 1px solid rgba(255,255,255,.10);
      vertical-align: top;
    }
    th{text-align:left; color: var(--muted); font-weight: 600}
    code{font-family: var(--mono)}
    .btn{
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.08);
      color: inherit;
      padding: 8px 10px;
      cursor: pointer;
    }
    .danger{border-color: rgba(251,113,133,.35)}
    textarea{width: 100%}
  </style>

  <div class="wrap">
    <div class="row">
      <button id="refresh" class="btn">Refresh</button>
      <button id="export" class="btn">Export JSON</button>
      <button id="importBtn" class="btn">Import JSON</button>
      <button id="wipe" class="btn danger">Wipe weblab:* only</button>
      <span id="status" class="muted"></span>
    </div>

    <table>
      <thead><tr><th>Key</th><th>Value</th></tr></thead>
      <tbody id="body"></tbody>
    </table>

    <details class="panel">
      <summary>Import JSON payload</summary>
      <p class="muted">Paste JSON object. Keys will be prefixed with <code>weblab:</code> for safety.</p>
      <textarea id="payload" placeholder='{"color":"purple","demo":true}'></textarea>
      <div class="row">
        <button id="apply" class="btn">Apply Import</button>
      </div>
    </details>
  </div>
`;

customElements.define('x-storage-explorer', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(te.content.cloneNode(true));
  }
  connectedCallback(){
    const sh = this.shadowRoot;
    this.body = sh.getElementById('body');
    this.status = sh.getElementById('status');
    this.payload = sh.getElementById('payload');

    sh.getElementById('refresh').addEventListener('click', ()=>this.render());
    sh.getElementById('export').addEventListener('click', ()=>this.export());
    sh.getElementById('importBtn').addEventListener('click', ()=> sh.querySelector('details').open = true);
    sh.getElementById('apply').addEventListener('click', ()=>this.import());
    sh.getElementById('wipe').addEventListener('click', ()=>this.wipe());

    this.render();
  }
  render(){
    if (!features.storage()){
      this.status.textContent = 'Storage not available (blocked or disabled).';
      return;
    }
    const keys = Object.keys(localStorage).sort();
    const rows = keys.map(k => {
      let v = localStorage.getItem(k) ?? '';
      if (v.length > 200) v = v.slice(0, 200) + '…';
      return `<tr><td><code>${escapeHtml(k)}</code></td><td><code>${escapeHtml(v)}</code></td></tr>`;
    }).join('');
    this.body.innerHTML = rows || `<tr><td colspan="2" class="muted">No keys found.</td></tr>`;
    this.status.textContent = `${keys.length} localStorage keys`;
  }
  export(){
    const keys = Object.keys(localStorage).filter(k=>k.startsWith('weblab:'));
    const obj = {};
    for (const k of keys) obj[k] = localStorage.getItem(k);
    downloadText('weblab-storage.json', JSON.stringify(obj, null, 2));
  }
  import(){
    try{
      const raw = this.payload.value.trim();
      if (!raw) return;
      const obj = JSON.parse(raw);
      for (const [k,v] of Object.entries(obj)){
        localStorage.setItem(`weblab:${k}`, typeof v === 'string' ? v : JSON.stringify(v));
      }
      this.payload.value = '';
      this.render();
      this.status.textContent = 'Imported into weblab:* keys.';
    }catch(e){
      this.status.textContent = `Import failed: ${e.message}`;
    }
  }
  wipe(){
    const keys = Object.keys(localStorage).filter(k=>k.startsWith('weblab:'));
    keys.forEach(k=>localStorage.removeItem(k));
    this.render();
    this.status.textContent = 'Wiped weblab:* keys.';
  }
});

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}