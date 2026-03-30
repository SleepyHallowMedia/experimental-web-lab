const t = document.createElement('template');
t.innerHTML = `
  <style>
    a{
      display:block;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.12);
      background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
      padding: 14px;
      box-shadow: 0 18px 60px rgba(0,0,0,.18);
      text-decoration:none;
      color: inherit;
      transition: transform .12s ease, border-color .2s ease, background .2s ease;
      min-height: 132px;
    }
    a:hover{transform: translateY(-2px); border-color: rgba(255,255,255,.22)}
    h3{margin:0 0 6px; font-size: 1.05rem}
    p{margin:0; color: var(--muted)}
    .top{display:flex; align-items:center; justify-content:space-between; gap:10px}
    .badge{
      font-family: var(--mono);
      font-size: .82rem;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      opacity:.92;
    }
  </style>
  <a part="link">
    <div class="top">
      <h3 id="title"></h3>
      <span class="badge" id="badge"></span>
    </div>
    <p id="desc"></p>
  </a>
`;

customElements.define('x-demo-card', class extends HTMLElement{
  static get observedAttributes(){ return ['title','href','desc','badge']; }
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(t.content.cloneNode(true));
  }
  attributeChangedCallback(){ this.render(); }
  connectedCallback(){ this.render(); }
  render(){
    const sh = this.shadowRoot;
    const a = sh.querySelector('a');
    a.href = this.getAttribute('href') ?? '#';
    sh.getElementById('title').textContent = this.getAttribute('title') ?? '';
    sh.getElementById('badge').textContent = this.getAttribute('badge') ?? '';
    sh.getElementById('desc').textContent = this.getAttribute('desc') ?? '';
  }
});