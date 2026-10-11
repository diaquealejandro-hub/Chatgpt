export const escapeHTML = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 home:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 train:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
 book:'<path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z"/>',
 sheets:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M2 6v14m7-12h7m-7 4h7m-7 4h4"/>',
 stats:'<path d="M4 20V10m8 10V4m8 16v-7"/>',
 settings:'<path d="m9 3-1 3-3 1v4l-2 2 2 3 3 1 1 4h6l1-4 3-1 2-3-2-2V7l-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 flame:'<path d="M12 3c0 5-5 6-5 10 0 2 1 3 2 4-4 0-6-3-6-6 0 0-1 11 9 11 8 0 10-9 6-14 0 4-2 5-3 5 0-4-1-7-3-10Z"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 play:'<path d="m8 4 13 8-13 8V4Z"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 4 9 9 0 1 0 20 15Z"/>',
 focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="4"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>'
};
export function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.target}</svg>`;}
export function button(text,action,cls='',extra=''){return `<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;}
export function time(n){n=Math.max(0,Math.ceil(n));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
export function methodHTML(m){return `<div class="method-panel"><h3>${escapeHTML(m.title)}</h3><p>${escapeHTML(m.rule)}</p><ol class="method-steps">${m.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol></div>`;}
export function heading(title,subtitle,action=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;}
export function metric(label,value,note='',glyph=''){return `<div class="stat"><div class="stat-label">${glyph?icon(glyph):''}${label}</div><div class="stat-value number">${value}</div><div class="stat-note">${note}</div></div>`;}
