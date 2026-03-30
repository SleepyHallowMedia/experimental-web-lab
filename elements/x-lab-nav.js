import { features } from '../scripts/feature-detect.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    header{
      position: sticky; top: 0; z-index: 50;
      backdrop-filter: blur(10px);
      background: color-mix(in oklab, var(--bg), transparent 20%);
      border-bottom: 1px solid rgba(255,255,255,.10);
    }
    nav{
      max-width: 1100px;
      margin: 0 auto;
      padding: 10px 18px;
      display:flex; align-items:center; gap: 12px; flex-wrap: wrap;
    }
    .brand{display:flex; align-items:center; gap:10px}
    .dot{
      width: 14px; height: 14px; border-radius: 99px;
      background: radial-gradient(circle at 35% 35%, #fff, var(--accent));
      box-shadow: 0 0 0 4px rgba(124,92,255,.18);
    }
    a{color: inherit}
    .spacer{flex:1}
    .pill{
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      border-radius: 999px;
      padding: 6px 10px;
      display:flex; gap:10px; align-items:center;
      font-size: .95rem;
    }
    button{
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.08);
      color: inherit;
      padding: 7px 10px;
      cursor: pointer;
    }
    .tag{font-family: var(--mono); font-size: .86rem; opacity:.9}
  </style>

  <header>
    <nav>
      <div class="brand">
        <span class="dot"></span>
        <strong>Web Lab</strong>
        <span class="tag">/ experimental</span>
      </div>

      ./Home</a>
      pages/elements.htmlElements</a>
      pages/apis.htmlAPIs</a>
      pages/about.htmlAbout</a>

      <span class="spacer"></span>

      <span class="pill" id="featPill" title="Feature flags (live)">
        <span>popover:</span> <b id="p"></b>
        <span>anchor:</span> <b id="a"></b>
      </span>

      <button id="theme">Toggle theme</button>
    </nav>
  </header>
`;

customElements.define('x-lab-nav', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(tpl.content.cloneNode(true));
  }
  connectedCallback(){
    const sh = this.shadowRoot;
    sh.getElementById('p').textContent = features.popover() ? 'on' : 'off';
    sh.getElementById('a').textContent = features.anchorPositioning() ? 'on' : 'off';
    sh.getElementById('theme').addEventListener('click', () => {
      const html = document.documentElement;
      const next = (html.dataset.theme === 'light') ? 'dark' : 'light';
      html.dataset.theme = next;
      localStorage.setItem('theme', next);
    });
  }
});