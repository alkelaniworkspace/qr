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
/** Bump when the bookmarklet changes: the import page asks for an old bookmark to be replaced. */
export const CAPTURE_VERSION = 3;

export interface CapturedPage {
  html: string;
  url: string;
  title?: string;
}

const SOURCE = String.raw`(function(APP){
if(window.__qlickCapture){window.__qlickCapture.style.display='block';return;}
var d=document,box=d.createElement('div');window.__qlickCapture=box;box.setAttribute('data-qlick-ui','');
box.setAttribute('style','all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;width:300px;background:#141414;color:#fff;border-radius:18px;padding:16px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.45)');
function el(tag,css,text,attr){var e=d.createElement(tag);if(css)e.setAttribute('style',css);if(text)e.textContent=text;if(attr)e.setAttribute(attr,'');return e}
var head=el('div','display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px');head.appendChild(el('span','width:10px;height:10px;border-radius:50%;background:#bdfb04'));head.appendChild(el('span','','Qlick · Speisekarte holen'));head.appendChild(el('button','all:unset;margin-left:auto;cursor:pointer;opacity:.6;font-size:18px','×','data-x'));box.appendChild(head);
box.appendChild(el('div','margin:10px 0 12px;color:#bbb','Lade alle Gerichte und Fotos …','data-s'));
var track=el('div','height:4px;background:#333;border-radius:4px;overflow:hidden');track.appendChild(el('div','height:100%;width:0;background:#bdfb04;transition:width .2s','','data-p'));box.appendChild(track);
var gob=el('button','all:unset;box-sizing:border-box;display:block;width:100%;margin-top:12px;padding:11px;border-radius:12px;background:#bdfb04;color:#141414;font-weight:700;text-align:center;cursor:pointer;opacity:.4','An Qlick senden','data-go');gob.disabled=true;box.appendChild(gob);
box.appendChild(el('button','all:unset;display:none;width:100%;margin-top:8px;text-align:center;color:#bbb;text-decoration:underline;cursor:pointer;font-size:12px','Stattdessen kopieren','data-copy'));
d.body.appendChild(box);
var q=function(s){return box.querySelector('['+s+']')},st=q('data-s'),bar=q('data-p'),go=q('data-go'),cp=q('data-copy'),html='',sent=false;
q('data-x').onclick=function(){box.style.display='none'};
var PR=/\d{1,3}[.,]\d{2}\s*(?:€|EUR)|€\s*\d{1,3}[.,]\d{2}/gi;
function cnt(t){var m=(t||'').match(PR);return m?m.length:0}
function abs(u){try{return u&&u.indexOf('data:')!==0&&u.indexOf('blob:')!==0?new URL(u,location.href).href:''}catch(e){return ''}}
function best(i){var ss=i.getAttribute('srcset')||i.getAttribute('data-srcset')||'',b='',bw=0;var pic=i.parentElement&&i.parentElement.tagName==='PICTURE'?i.parentElement.querySelectorAll('source'):[];for(var k=0;k<pic.length;k++)ss+=','+(pic[k].getAttribute('srcset')||pic[k].getAttribute('data-srcset')||'');ss.split(',').forEach(function(c){var p=c.trim().split(/\s+/);if(!p[0])return;var w=parseFloat(p[1])||1;if(w>=bw){bw=w;b=p[0]}});return abs(b)||abs(i.currentSrc)||abs(i.getAttribute('data-src'))||abs(i.getAttribute('data-lazy-src'))||abs(i.getAttribute('data-original'))||abs(i.src)}
function markImgs(r){r.querySelectorAll('img').forEach(function(i){if(box.contains(i))return;var s=best(i);if(s)i.setAttribute('data-qlick-src',s)})}
function markBg(r){var all=r.getElementsByTagName('*');for(var k=0;k<all.length&&k<4000;k++){var el=all[k];if(el.hasAttribute('data-qlick-bg')||el.offsetWidth<50||el.offsetHeight<40)continue;var b=getComputedStyle(el).backgroundImage;if(b&&b.indexOf('url(')>=0){var m=b.match(/url\(["']?([^"')]+)["']?\)/);var u=m&&abs(m[1]);if(u)el.setAttribute('data-qlick-bg',u)}}}
var cards=new Map(),heads=[];
function harvest(){
markImgs(d);
d.querySelectorAll('h1,h2,h3,h4,[role=heading]').forEach(function(h){if(box.contains(h))return;var t=(h.innerText||'').replace(/\s+/g,' ').trim();if(!t||t.length>60||cnt(t))return;var a=h.parentElement,k=0;while(a&&a!==d.body&&k<3){var at=a.innerText||'';if(at.length>500)break;if(cnt(at))return;a=a.parentElement;k++}heads.push({t:t,y:h.getBoundingClientRect().top+scrollY})});
var w=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT),n,seen=new Set();
while((n=w.nextNode())){PR.lastIndex=0;if(!PR.test(n.nodeValue))continue;var el=n.parentElement;if(!el||box.contains(el))continue;var c=el;
while(c.parentElement&&c.parentElement!==d.body){var pe=c.parentElement,pt=pe.innerText||'',pc=cnt(pt),cc=cnt(c.innerText);if(pc===cc){c=pe;continue}if(pc<=8&&pt.length<500&&pe.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b').length<=1){c=pe;continue}break}
if(seen.has(c))continue;seen.add(c);var key=(c.innerText||'').replace(/\s+/g,' ').trim();if(!key||cards.has(key))continue;
markBg(c);var y=c.getBoundingClientRect().top+scrollY,cat='';heads.forEach(function(h){if(h.y<=y+2)cat=h.t});
cards.set(key,{h:c.outerHTML,cat:cat,y:y})}
}
function waitImgs(){var p=[];d.querySelectorAll('img').forEach(function(i){var r=i.getBoundingClientRect();if(r.bottom>-50&&r.top<innerHeight+50&&!i.complete)p.push(new Promise(function(ok){i.addEventListener('load',ok,{once:true});i.addEventListener('error',ok,{once:true})}))});return Promise.race([Promise.all(p),new Promise(function(ok){setTimeout(ok,1500)})])}
var start=window.scrollY,y=0,steps=0,H=function(){return Math.max(d.documentElement.scrollHeight,d.body.scrollHeight)};
function step(){y+=Math.max(300,innerHeight*.7);steps++;window.scrollTo(0,y);bar.style.width=Math.min(95,y/H()*100)+'%';st.textContent='Lade alle Gerichte und Fotos … '+cards.size+' gefunden';
setTimeout(function(){waitImgs().then(function(){harvest();if(y<H()&&steps<160){step()}else{setTimeout(capture,600)}})},350)}
function capture(){
harvest();window.scrollTo(0,start);markBg(d.body);
var c=d.documentElement.cloneNode(true);
c.querySelectorAll('style,svg,noscript,link,iframe,video,audio,canvas,template,[data-qlick-ui]').forEach(function(e){e.remove()});
c.querySelectorAll('script').forEach(function(s){var t=(s.type||'').toLowerCase(),x=s.textContent||'';if(t.indexOf('json')<0&&!/window\.__|__NEXT_DATA__|__NUXT__|__APOLLO|__PRELOADED|__INITIAL/.test(x.slice(0,400)))s.remove()});
c.querySelectorAll('[style]').forEach(function(e){if(e.getAttribute('style').indexOf('url(')<0)e.removeAttribute('style')});
var live=(d.body.innerText||'').replace(/\s+/g,' '),missing=0,photos=0,list=[],collected='';
cards.forEach(function(v,k){list.push(v);if(live.indexOf(k.slice(0,120))<0)missing++});
list.forEach(function(v){if(/data-qlick-(src|bg)=/.test(v.h))photos++});
if(missing){list.sort(function(a,b){return a.y-b.y});var ex='',cur=null;list.forEach(function(v){if(v.cat!==cur){if(cur!==null)ex+='</section>';cur=v.cat;ex+='<section data-qlick-cards><h2>'+(cur||'Karte').replace(/</g,'&lt;')+'</h2>'}ex+=v.h});if(cur!==null)ex+='</section>';
collected='<main data-qlick-collected>'+ex+'</main>'}
html='<!doctype html>'+c.outerHTML;if(collected)html=html.replace(/<body([^>]*)>/i,function(m){return m+collected});
bar.style.width='100%';st.textContent='Fertig: '+cards.size+' Gerichte, '+photos+' mit Foto.';go.disabled=false;go.style.opacity=1;
}
function payload(){return{type:'qlick-menu',v:${CAPTURE_VERSION},html:html,url:location.href,title:d.title}}
go.onclick=function(){
if(!html)return;var win=window.open(APP+'/import','qlick_import');if(!win){st.textContent='Das Fenster wurde blockiert. Erlaube Pop-ups für diese Seite oder kopiere die Karte und füge sie in Qlick unter „Einfügen“ ein.';cp.style.display='block';return}st.textContent='Sende an Qlick …';
function on(e){if(e.origin===APP&&e.data==='qlick-ready'&&win){win.postMessage(payload(),APP);sent=true;st.textContent='Gesendet. Weiter im Qlick-Tab.';removeEventListener('message',on)}}
addEventListener('message',on);
setTimeout(function(){if(!sent){st.textContent='Senden wurde von dieser Seite blockiert. Kopiere die Karte und füge sie in Qlick unter „Einfügen“ ein.';cp.style.display='block'}},5000);
};
cp.onclick=function(){navigator.clipboard.writeText('${CAPTURE_PREFIX}'+JSON.stringify(payload())).then(function(){st.textContent='Kopiert. In Qlick unter „Einfügen“ mit Strg+V einfügen.'},function(){st.textContent='Kopieren nicht möglich. Bitte Strg+A, Strg+C auf dieser Seite und in Qlick einfügen.'})};
harvest();step();
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
