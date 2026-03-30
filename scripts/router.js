// Lightweight hash router for sections (keeps GitHub Pages happy)
import { $$ } from './utils.js';

export function initRouter(){
  const internal = $$('a[href^="#"]');
  for (const a of internal){
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      history.pushState({}, '', id);
      el.scrollIntoView({behavior: 'smooth', block:'start'});
    });
  }
}