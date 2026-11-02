(() => {
'use strict';
const rows=window.LAX_DATA, $=s=>document.querySelector(s), NS='http://www.w3.org/2000/svg';
if(!rows?.length){$('#error').textContent='Passenger data could not be loaded. Please reload the page.';return;}
const months=[...new Set(rows.map(r=>r[0]))].sort(), terminals=[...new Set(rows.map(r=>r[1]))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
const state={start:0,end:months.length-1,terminal:null,dimension:3,linkMode:'filter'};
const sum=a=>a.reduce((n,r)=>n+r[4],0), fmt=n=>n.toLocaleString('en-US'), compact=n=>n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1000?(n/1000).toFixed(0)+'k':String(Math.round(n));
const monthLabel=m=>new Date(m+'-01T00:00:00Z').toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'});
function el(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.append(n);return n;}
function text(svg,x,y,value,attrs={}){const n=el('text',{x,y,...attrs},svg);n.textContent=value;return n;}
function line(svg,x1,y1,x2,y2,attrs={}){return el('line',{x1,y1,x2,y2,...attrs},svg);}
function tip(event,content){const t=$('#tooltip');t.textContent=content;t.hidden=false;t.style.left=Math.max(8,Math.min(innerWidth-275,event.clientX+14))+'px';t.style.top=Math.max(8,Math.min(innerHeight-100,event.clientY+14))+'px';}
function hideTip(){$('#tooltip').hidden=true;}
function selectTerminal(t){state.terminal=state.terminal===t?null:t;hideTip();render();}
function monthly(data){const m=new Map(months.map(d=>[d,0]));for(const r of data)m.set(r[0],m.get(r[0])+r[4]);return months.map(d=>m.get(d));}
const allMonthly=monthly(rows), left=64,right=1175,x=i=>left+i/(months.length-1)*(right-left);
function path(values,y){return values.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ');}
function drawLine(){const svg=$('#line');svg.replaceChildren();const focus=monthly(state.terminal?rows.filter(r=>r[1]===state.terminal):rows),max=Math.ceil(Math.max(...allMonthly)/2e6)*2e6,y=v=>215-v/max*185;
for(let i=0;i<=4;i++){const v=max*i/4,yy=y(v);line(svg,left,yy,right,yy,{class:'grid-line'});text(svg,left-14,yy+3,compact(v),{'text-anchor':'end'});}
for(let i=0;i<months.length;i++)if(i%24===0||i===months.length-1)text(svg,x(i),244,months[i].slice(0,4),{'text-anchor':'middle'});
el('rect',{x:x(state.start),y:22,width:Math.max(2,x(state.end)-x(state.start)),height:193,fill:'#edf5ef',opacity:.65},svg);
if(state.linkMode==='highlight')el('path',{d:path(allMonthly,y),fill:'none',stroke:'#cedbd3','stroke-width':2,'data-series':'airport-context'},svg);
el('path',{d:path(focus,y),fill:'none',stroke:'#218477','stroke-width':2.3,'stroke-linejoin':'round'},svg);
const hoverLine=line(svg,0,23,0,215,{stroke:'#618f7c','stroke-dasharray':'3 3',visibility:'hidden'}),dot=el('circle',{r:4,fill:'#218477',stroke:'white','stroke-width':2,visibility:'hidden'},svg);
const hit=el('rect',{x:left,y:20,width:right-left,height:198,fill:'transparent'},svg);
hit.addEventListener('pointermove',e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const local=p.matrixTransform(svg.getScreenCTM().inverse());const i=Math.max(0,Math.min(months.length-1,Math.round((local.x-left)/(right-left)*(months.length-1))));hoverLine.setAttribute('x1',x(i));hoverLine.setAttribute('x2',x(i));hoverLine.setAttribute('visibility','visible');dot.setAttribute('cx',x(i));dot.setAttribute('cy',y(focus[i]));dot.setAttribute('visibility','visible');tip(e,`${monthLabel(months[i])} · ${state.terminal||'All terminals'}: ${fmt(focus[i])} passenger movements`);});hit.addEventListener('pointerleave',()=>{hideTip();hoverLine.setAttribute('visibility','hidden');dot.setAttribute('visibility','hidden');});
const brush=$('#brush');brush.replaceChildren();const by=v=>44-v/max*30;
el('rect',{x:left,y:5,width:right-left,height:45,fill:'#f3f6f1',rx:4},brush);el('path',{d:path(allMonthly,by)+` L ${right},49 L ${left},49 Z`,fill:'#d8e5db'},brush);
el('rect',{x:x(state.start),y:4,width:Math.max(3,x(state.end)-x(state.start)),height:47,fill:'#69a18a','fill-opacity':.17,stroke:'#77a78d',rx:2},brush);
for(const i of [state.start,state.end]){el('rect',{x:x(i)-3,y:3,width:6,height:49,rx:2,fill:'#fff',stroke:'#77a78d'},brush);line(brush,x(i),22,x(i),33,{stroke:'#77a78d'});}
}
function rowLabel(t){return t==='Miscellaneous Terminal'?'Miscellaneous':t==='Imperial Terminal'?'Imperial':t;}
function drawBars(data){const svg=$('#bars');svg.replaceChildren();const totals=terminals.map(t=>({t,n:sum(data.filter(r=>r[1]===t))})).sort((a,b)=>b.n-a.n),max=Math.max(...totals.map(d=>d.n),1),L=118,R=530,top=24,step=30;
for(let i=0;i<=4;i++){let xx=L+(R-L)*i/4;line(svg,xx,top-8,xx,top+step*terminals.length,{class:'grid-line'});text(svg,xx,415,compact(max*i/4),{'text-anchor':'middle'});}
for(const [i,{t,n}] of totals.entries()){const y=top+i*step,g=el('g',{class:'terminal-row',tabindex:0,role:'button','aria-label':`${t}: ${fmt(n)} passengers. Select terminal.`,'aria-pressed':state.terminal===t},svg);el('rect',{x:8,y:y-4,width:580,height:29,rx:4,fill:state.terminal===t?'#f0f6ef':'transparent'},g);text(g,L-12,y+13,rowLabel(t),{'text-anchor':'end',style:`fill:${state.terminal===t?'#218477':'#7a8e80'}`});el('rect',{x:L,y,width:Math.max(1,n/max*(R-L)),height:18,rx:3,fill:state.terminal===t||!state.terminal?'#398c77':'#cadbd0',class:'bar'},g);text(g,L+n/max*(R-L)+7,y+13,compact(n),{style:'font-size:9px'});g.addEventListener('click',()=>selectTerminal(t));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectTerminal(t);}});g.addEventListener('pointermove',e=>tip(e,`${t} · ${fmt(n)} passenger movements`));g.addEventListener('pointerleave',hideTip);}
}
function drawComposition(data){const svg=$('#composition');svg.replaceChildren();const keys=state.dimension===3?['Domestic','International']:['Arrival','Departure'],colors=['#398c77','#bed6c1'];$('#composition-legend').replaceChildren(...keys.map((k,i)=>{const n=document.createElement('span'),dot=document.createElement('i');dot.style.background=colors[i];n.append(dot,k);return n;}));$('#composition-title').textContent=keys.join(' / ');const L=118,R=555,step=30,top=10;
for(let i=0;i<=4;i++){const xx=L+(R-L)*i/4;line(svg,xx,top-2,xx,top+terminals.length*step,{class:'grid-line'});text(svg,xx,382,(i*25)+'%',{'text-anchor':'middle'});}
const visibleTerminals=state.terminal&&state.linkMode==='filter'?terminals.filter(t=>t===state.terminal):terminals;
const ordered=visibleTerminals.map(t=>({t,data:data.filter(r=>r[1]===t)})).sort((a,b)=>sum(b.data)-sum(a.data));
ordered.forEach(({t,data:d},i)=>{const y=top+i*step,total=sum(d),g=el('g',{'data-terminal':t,opacity:state.terminal&&state.linkMode==='highlight'&&state.terminal!==t?.25:1},svg);text(g,L-12,y+13,rowLabel(t),{'text-anchor':'end'});if(!total){text(g,L+8,y+13,'No reported passengers');return;}let offset=0;keys.forEach((k,j)=>{const n=sum(d.filter(r=>r[state.dimension]===k)),share=n/total,w=share*(R-L),bar=el('rect',{x:L+offset,y,width:w,height:18,fill:colors[j]},g);if(w>42)text(g,L+offset+w/2,y+12,(share*100).toFixed(0)+'%',{'text-anchor':'middle',style:`font-size:9px;fill:${j?'#436952':'white'}`});bar.addEventListener('pointermove',e=>tip(e,`${t} · ${k}: ${fmt(n)} (${(share*100).toFixed(1)}%)`));bar.addEventListener('pointerleave',hideTip);offset+=w;});});
}
function render(){const filtered=rows.filter(r=>r[0]>=months[state.start]&&r[0]<=months[state.end]),focus=state.terminal?filtered.filter(r=>r[1]===state.terminal):filtered,total=sum(focus);$('#total').textContent=fmt(total);$('#total-note').textContent=state.terminal?`Passenger movements · ${state.terminal}`:'Across all terminals';$('#period').textContent=`${monthLabel(months[state.start])} – ${monthLabel(months[state.end])}`;$('#month-count').textContent=`${state.end-state.start+1} months selected`;$('#terminal').textContent=state.terminal||'All terminals';$('#share').textContent=total?(sum(focus.filter(r=>r[3]==='International'))/total*100).toFixed(1)+'%':'—';$('#start').value=months[state.start];$('#end').value=months[state.end];$('#announcement').textContent=`${state.terminal||'All terminals'}, ${$('#period').textContent}, ${fmt(total)} passengers`;drawLine();drawBars(filtered);drawComposition(filtered);}
for(const id of ['start','end']){const input=$('#'+id);input.min=months[0];input.max=months.at(-1);}
$('#month-filter').onsubmit=event=>{event.preventDefault();const a=months.indexOf($('#start').value),b=months.indexOf($('#end').value);if(a<0||b<0||a>b){$('#error').textContent=`Choose a valid range between ${monthLabel(months[0])} and ${monthLabel(months.at(-1))}. Start must precede end.`;return;}$('#error').textContent='';state.start=a;state.end=b;render();};
$('#reset').onclick=()=>{state.start=0;state.end=months.length-1;state.terminal=null;$('#error').textContent='';hideTip();render();};$('#dimension').onchange=e=>{state.dimension=Number(e.target.value);render();};
let anchor=null;const brush=$('#brush');function indexAt(e){const p=brush.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(brush.getScreenCTM().inverse());return Math.max(0,Math.min(months.length-1,Math.round((q.x-left)/(right-left)*(months.length-1))));}
brush.addEventListener('pointerdown',e=>{anchor=indexAt(e);brush.setPointerCapture(e.pointerId);});brush.addEventListener('pointermove',e=>{if(anchor===null)return;const i=indexAt(e);state.start=Math.min(anchor,i);state.end=Math.max(anchor,i);render();});brush.addEventListener('pointerup',e=>{if(anchor===null)return;const i=indexAt(e);state.start=Math.min(anchor,i);state.end=Math.max(anchor,i);anchor=null;$('#error').textContent='';render();});brush.addEventListener('pointercancel',()=>{anchor=null;});brush.addEventListener('dblclick',()=>{state.start=0;state.end=months.length-1;render();});
// Each tab remembers its composition dimension; the linked date and terminal selections are shared.
let activeTab='explorer';
const dimensions={explorer:3,exercise:2,highlight:3};
const tabs=['explorer','exercise','highlight'];
function navigateTab(name,focus=false){
 dimensions[activeTab]=state.dimension;activeTab=name;state.dimension=dimensions[name];state.linkMode=name==='highlight'?'highlight':'filter';
 $('#line-legend').hidden=state.linkMode!=='highlight';
 for(const tab of tabs){const button=$('#tab-'+tab),active=tab===name;button.setAttribute('aria-selected',active);button.tabIndex=active?0:-1;$('#panel-'+tab).hidden=!active;}
 $('#'+name+'-slot').append($('#workspace'));$('#dimension').value=String(state.dimension);$('#dimension').disabled=name==='exercise';hideTip();render();if(focus)$('#tab-'+name).focus();
}
for(const [i,name] of tabs.entries()){
 $('#tab-'+name).onclick=()=>navigateTab(name);
 $('#tab-'+name).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();navigateTab(e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length],true);}};
}
$('#coverage').textContent=months[0].slice(0,4)+'–'+months.at(-1).slice(0,4);$('#data-note').textContent=`${fmt(rows.length)} records · ${terminals.length} terminals · ${months.length} months`;$('#line-legend').hidden=true;render();
})();
