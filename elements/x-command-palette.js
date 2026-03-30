import { $ } from '../scripts/utils.js';

const tp = document.createElement('template');
tp.innerHTML = `
  <style>
    dialog{
      width: min(720px, 94vw);
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.18);
      background: rgba(10,14,28,.92);
      color: var(--text);
      box-shadow: 0 30px 120px rgba(0,0,0,.55);
      padding: 0;
      overflow: hidden;
    }
    dialog::backdrop{
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(4px);
    }
    header{
      padding: 12px 12px 8px;
      border-bottom: 1px solid rgba(255,255,255,.10);
    }
    input{
      width: 100%;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      padding: 12px 12px;
      color: inherit;
      font-size: 1rem;
      outline: none;
    }
    ul{list-style:none; margin:0; padding: 8px;}
    li{
      display:flex; justify-content:space-between; gap: 12px;
      padding: 10px 10px;
      border-radius: 12px;
      cursor: pointer;
    }
    li:hover{background: rgba(255,255,255,.06)}
    .hint{color: var(--muted); font-family: var(--mono); font-size: .9rem}
    .k{font-family: var(--mono); opacity: .9}
  </style>

  <dialog id="dlg">
    <header>
      <input id="q" placeholder="Type a command… (theme, fractal, synth, storage, elements, apis)" />
    </header>
    <ul id="list"></ul>
  </dialog>
`;

const COMMANDS = [
  {name:'Go: Fractal', hint:'#fractal', run:()=>location.hash='#fractal'},
  {name:'Go: Synth', hint:'#synth', run:()=>location.hash='#synth'},
  {name:'Go: Graph', hint:'#graph', run:()=>location.hash='#graph'},
  {name:'Go: Storage', hint:'#storage', run:()=>location.hash='#storage'},
  {name:'Open: Elements page', hint:'pages/elements.html', run:()=>location.href='pages/elements.html'},
  {name:'Open: APIs page', hint:'pages/apis.html', run:()=>location.href='pages/apis.html'},
  {name:'Toggle theme', hint:'light/dark', run:()=>{
    const html = document.documentElement;
    const next = (html.dataset.theme === 'light') ? 'dark' : 'light';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
  }},
  {name:'Clear localStorage keys (web-lab only)', hint:'danger', run:()=>{
    Object.keys(localStorage).filter(k=>k.startsWith('weblab:')).forEach(k=>localStorage.removeItem(k));
    alert('Cleared weblab:* keys');
  }}
];

customElements.define('x-command-palette', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(tp.content.cloneNode(true));
  }
  connectedCallback(){
    this.dlg = this.shadowRoot.getElementById('dlg');
    this.q = this.shadowRoot.getElementById('q');
    this.list = this.shadowRoot.getElementById('list');

    const render = () => {
      const term = (this.q.value || '').trim().toLowerCase();
      const items = COMMANDS.filter(c => !term || c.name.toLowerCase().includes(term) || c.hint.toLowerCase().includes(term));
      this.list.innerHTML = items.map((c,i)=>`
        <li data-i="${i}">
          <span>${c.name}</span>
          <span class="hint">${c.hint}</span>
        </li>
      `).join('');
      this.items = items;
    };

    this.q.addEventListener('input', render);
    this.list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const cmd = this.items[+li.dataset.i];
      this.close();
      cmd.run();
    });

    // Global hotkey
    window.addEventListener('keydown', (e) => {
      const isK = (e.key.toLowerCase() === 'k');
      const mod = e.ctrlKey || e.metaKey;
      if (mod && isK){
        e.preventDefault();
        this.open();
      }
      if (e.key === 'Escape' && this.dlg.open) this.close();
    });

    render();
  }
  open(){
    this.dlg.showModal();
    this.q.value = '';
    this.q.focus();
    this.q.dispatchEvent(new Event('input'));
  }
  close(){ this.dlg.close(); }
});