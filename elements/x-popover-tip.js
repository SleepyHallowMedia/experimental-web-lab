import { features } from '../scripts/feature-detect.js';

const tt = document.createElement('template');
tt.innerHTML = `
  <style>
    :host{display: contents}
    /* Popover box */
    .tip[popover]{
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(10,14,28,.94);
      box-shadow: 0 18px 60px rgba(0,0,0,.35);
      width: min(360px, 88vw);
      color: var(--text);
    }
    .tip .muted{opacity:.85}
    .fallback{
      position: fixed;
      z-index: 9999;
      display:none;
    }
  </style>

  <div id="tip" class="tip" popover="hint">
    <div id="txt"></div>
    <div class="muted">Hover/focus target • click to pin</div>
  </div>
`;

customElements.define('x-popover-tip', class extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(tt.content.cloneNode(true));
  }
  connectedCallback(){
    const targetId = this.getAttribute('for');
    const text = this.getAttribute('text') ?? '';
    const tip = this.shadowRoot.getElementById('tip');
    const txt = this.shadowRoot.getElementById('txt');
    txt.textContent = text;

    const target = document.getElementById(targetId);
    if (!target) return;

    // If Popover API supported, wire interest-like behavior via events.
    // (Popover API: declarative popovers + JS control exist; MDN documents usage.) [2](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)[3](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover)
    if (features.popover()){
      // Use CSS Anchor Positioning if available by setting anchor-name on target
      if (features.anchorPositioning()){
        // Use inline style so it doesn't rely on author CSS files
        target.style.anchorName = '--tip-anchor';
        tip.style.position = 'absolute';
        tip.style.positionAnchor = '--tip-anchor';
        // Place below the anchor; use anchor() where supported
        tip.style.top = 'anchor(bottom)';
        tip.style.left = 'anchor(center)';
        tip.style.transform = 'translate(-50%, 10px)';
      }

      const show = () => tip.showPopover?.();
      const hide = () => tip.hidePopover?.();

      target.addEventListener('pointerenter', show);
      target.addEventListener('focus', show);
      target.addEventListener('pointerleave', hide);
      target.addEventListener('blur', hide);

      // Click toggles pinned state
      let pinned = false;
      target.addEventListener('click', () => {
        pinned = !pinned;
        if (pinned) tip.showPopover?.();
        else tip.hidePopover?.();
      });
      return;
    }

    // Fallback: fixed-position mini tooltip with getBoundingClientRect
    tip.classList.add('fallback');
    tip.removeAttribute('popover');
    document.body.appendChild(tip);

    const place = () => {
      const r = target.getBoundingClientRect();
      tip.style.left = `${Math.round(r.left + r.width/2)}px`;
      tip.style.top = `${Math.round(r.bottom + 10)}px`;
      tip.style.transform = 'translateX(-50%)';
    };
    const show = () => { place(); tip.style.display = 'block'; };
    const hide = () => { tip.style.display = 'none'; };

    target.addEventListener('pointerenter', show);
    target.addEventListener('focus', show);
    target.addEventListener('pointerleave', hide);
    target.addEventListener('blur', hide);
    window.addEventListener('scroll', () => tip.style.display === 'block' && place(), {passive:true});
    window.addEventListener('resize', () => tip.style.display === 'block' && place());
  }
});