/**
 * "Aus dem Browser": a bookmarklet that reads a menu page in the user's own
 * browser. Sites that block servers (Cloudflare, delivery platforms) never
 * block a real visitor, and the browser sees the page exactly as rendered,
 * including lazy-loaded photos.
 *
 * Flow: bookmarklet scrolls the page (loads all lazy images), records the
 * real image URLs (img.currentSrc, computed background-image), strips styles
 * and scripts that carry no data, then opens {app}/import and hands the page
 * over with postMessage. If the site blocks that (rare), it copies the page
 * to the clipboard instead, to paste in the studio.
 */

export const IMPORT_CHANNEL = "qlick-menu-import";
export const CAPTURE_PREFIX = "QLICK-MENU:";

export interface CapturedPage {
  html: string;
  url: string;
  title?: string;
}

const SOURCE = String.raw`(function(APP){
if(window.__qlickCapture){window.__qlickCapture.style.display='block';return;}
var d=document,box=d.createElement('div');window.__qlickCapture=box;
box.setAttribute('style','all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;width:300px;background:#141414;color:#fff;border-radius:18px;padding:16px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.45)');
box.innerHTML='<div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px"><span style="width:10px;height:10px;border-radius:50%;background:#bdfb04"></span>Qlick · Speisekarte holen<button data-x style="all:unset;margin-left:auto;cursor:pointer;opacity:.6;font-size:18px">×</button></div><div data-s style="margin:10px 0 12px;color:#bbb">Lade alle Gerichte und Fotos …</div><div style="height:4px;background:#333;border-radius:4px;overflow:hidden"><div data-p style="height:100%;width:0;background:#bdfb04;transition:width .2s"></div></div><button data-go disabled style="all:unset;box-sizing:border-box;display:block;width:100%;margin-top:12px;padding:11px;border-radius:12px;background:#bdfb04;color:#141414;font-weight:700;text-align:center;cursor:pointer;opacity:.4">An Qlick senden</button><button data-copy style="all:unset;display:none;width:100%;margin-top:8px;text-align:center;color:#bbb;text-decoration:underline;cursor:pointer;font-size:12px">Stattdessen kopieren</button>';
d.body.appendChild(box);
var q=function(s){return box.querySelector('['+s+']')},st=q('data-s'),bar=q('data-p'),go=q('data-go'),cp=q('data-copy'),html='',sent=false;
q('data-x').onclick=function(){box.style.display='none'};
var start=window.scrollY,y=0,H=function(){return Math.max(d.documentElement.scrollHeight,d.body.scrollHeight)};
function step(){y+=Math.max(300,innerHeight*.85);window.scrollTo(0,y);bar.style.width=Math.min(95,y/H()*100)+'%';if(y<H()&&y<80000){setTimeout(step,280)}else{setTimeout(capture,900)}}
function capture(){
window.scrollTo(0,start);var imgs=0;
d.querySelectorAll('img').forEach(function(i){var s=i.currentSrc||i.src;if(s&&s.indexOf('data:')!==0){i.setAttribute('data-qlick-src',s);imgs++}});
var all=d.body.getElementsByTagName('*');for(var k=0;k<all.length&&k<12000;k++){var el=all[k];if(el.offsetWidth<60||el.offsetHeight<40)continue;var b=getComputedStyle(el).backgroundImage;if(b&&b.indexOf('url(')>=0){var m=b.match(/url\(["']?([^"')]+)["']?\)/);if(m&&m[1].indexOf('data:')!==0){try{el.setAttribute('data-qlick-bg',new URL(m[1],location.href).href);imgs++}catch(e){}}}}
var c=d.documentElement.cloneNode(true);
c.querySelectorAll('style,svg,noscript,link,iframe,video,audio,canvas,template').forEach(function(e){e.remove()});
c.querySelectorAll('script').forEach(function(s){var t=(s.type||'').toLowerCase(),x=s.textContent||'';if(t.indexOf('json')<0&&!/window\.__|__NEXT_DATA__|__NUXT__|__APOLLO|__PRELOADED|__INITIAL/.test(x.slice(0,400)))s.remove()});
c.querySelectorAll('[style]').forEach(function(e){if(e.getAttribute('style').indexOf('url(')<0)e.removeAttribute('style')});
var w=c.querySelector('[data-qlick-ui]');if(w)w.remove();
html='<!doctype html>'+c.outerHTML;
bar.style.width='100%';st.textContent='Fertig: '+imgs+' Fotos gefunden ('+Math.round(html.length/1024)+' KB).';go.disabled=false;go.style.opacity=1;
}
box.setAttribute('data-qlick-ui','');
function payload(){return{type:'qlick-menu',html:html,url:location.href,title:d.title}}
go.onclick=function(){
if(!html)return;var win=window.open(APP+'/import','qlick_import');st.textContent='Sende an Qlick …';
function on(e){if(e.origin===APP&&e.data==='qlick-ready'&&win){win.postMessage(payload(),APP);sent=true;st.textContent='Gesendet. Weiter im Qlick-Tab.';removeEventListener('message',on)}}
addEventListener('message',on);
setTimeout(function(){if(!sent){st.textContent='Senden wurde von dieser Seite blockiert. Kopiere die Karte und füge sie in Qlick unter „Einfügen“ ein.';cp.style.display='block'}},5000);
};
cp.onclick=function(){navigator.clipboard.writeText('${CAPTURE_PREFIX}'+JSON.stringify(payload())).then(function(){st.textContent='Kopiert. In Qlick unter „Einfügen“ mit Strg+V einfügen.'},function(){st.textContent='Kopieren nicht möglich. Bitte Strg+A, Strg+C auf dieser Seite und in Qlick einfügen.'})};
step();
})`;

/** The javascript: URL for the bookmarklet, bound to this app's origin. */
export function bookmarkletHref(app: string): string {
  const code = SOURCE.replace(/\n/g, "") + `(${JSON.stringify(app)})`;
  return `javascript:${encodeURIComponent(code)}`;
}

/** Sends a captured or pasted page to the import API (gzip when the browser supports it). */
export async function importCaptured(page: CapturedPage): Promise<{ ok: boolean; message?: string; menu?: unknown }> {
  try {
    if (typeof CompressionStream !== "undefined") {
      const gz = await new Response(new Blob([page.html]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
      const res = await fetch("/api/menu-import", { method: "POST", headers: { "content-type": "application/gzip", "x-page-url": page.url }, body: gz });
      return await res.json();
    }
    const res = await fetch("/api/menu-import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ html: page.html, url: page.url }) });
    return await res.json();
  } catch {
    return { ok: false, message: "Verbindung fehlgeschlagen. Bitte erneut versuchen." };
  }
}

/** Recognises the clipboard payload written by the bookmarklet fallback. */
export function parseCapturePayload(text: string): CapturedPage | null {
  if (!text.startsWith(CAPTURE_PREFIX)) return null;
  try {
    const p = JSON.parse(text.slice(CAPTURE_PREFIX.length)) as Partial<CapturedPage>;
    return typeof p.html === "string" && typeof p.url === "string" ? { html: p.html, url: p.url, title: p.title } : null;
  } catch {
    return null;
  }
}
