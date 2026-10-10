'use strict';
let editorContext = null, dialogueDraft = [], previewUrls = [];
function notify(message) {
  let box = by('appNotice');
  if (!box) {box = document.createElement('p'); box.id='appNotice'; box.className='notice'; box.setAttribute('role','status'); document.querySelector('main').prepend(box);}
  box.textContent=message;
}
function renderSavedLocalOnly() {
  try {
    const projects=DoramaStore.projects(localStorage);
    by('saved').innerHTML=projects.length?projects.map((p,i)=>`<button class="project-button" onclick="loadSaved(${i})"><strong>${esc(p.title||'Sem título')}</strong><span>${esc(p.genre||'Dorama')} · ${p.episodes?.length||0} episódios · neste aparelho</span></button>`).join(''):'<p class="muted">Nenhum Dorama salvo ainda.</p>';
  } catch(e) {by('saved').textContent='Falha ao ler dados locais: '+e.message;}
}
function loadSaved(index=0) {
  try {
    if(current)persistLocal();
    const p=DoramaStore.projects(localStorage)[index]; if(!p)throw Error('Projeto não encontrado.');
    current=DoramaStore.clone(p); ensureSeasons();
    const state=current.seasons[String(current.activeSeason)];current.episodes=state.episodes;current.memory=state.memory||[];
    renderSeries();go('result');
  }catch(e){notify('Não foi possível abrir: '+e.message);}
}
function renderScript(ep) {
  const scenes=ep.script?.scenes;
  if(ep.script&&!Array.isArray(scenes)){by('script').innerHTML='<p class="notice">Roteiro inválido. Exporte uma cópia antes de reparar os dados.</p>';return;}
  const list=scenes||[], duration=list.reduce((total,s)=>total+(Number(s.duration)||0),0);
  by('script').innerHTML=`<div class="card production-summary"><span class="stream-kicker">ESTÚDIO DE PRODUÇÃO</span><h2>${list.length} cenas · ${duration} segundos planejados</h2><p class="muted">A quantidade vem do roteiro salvo. Adicione cenas manualmente sem depender da IA.</p><button class="btn primary" onclick="addScene()">＋ Nova cena</button></div>`+
    list.map((scene,i)=>`<article class="card scene-card"><div class="between"><span class="badge">CENA ${i+1} · ${Number(scene.duration)||'—'} s</span><span class="badge">${esc(scene.status||'roteiro')}</span></div><h3>${esc(scene.place)} · ${esc(scene.time)}</h3><p class="muted">${esc(scene.action)}</p><p class="status">Personagens: ${esc((scene.characters||[...new Set((scene.dialogue||[]).map(d=>d.name))]).join(', '))}</p>${(scene.dialogue||[]).map(d=>`<div class="dialogue"><b>${esc(d.name)}:</b> <span class="preserve-lines">${esc(d.text)}</span></div>`).join('')}<div class="scene-tools"><button class="btn secondary small" onclick="editScene(${i})">Editar</button><button class="btn secondary small" aria-label="Mover cena ${i+1} para cima" onclick="moveScene(${i},-1)" ${i===0?'disabled':''}>↑</button><button class="btn secondary small" aria-label="Mover cena ${i+1} para baixo" onclick="moveScene(${i},1)" ${i===list.length-1?'disabled':''}>↓</button><button class="btn secondary small danger" onclick="deleteScene(${i})">Excluir</button></div></article>`).join('')+
    `<div class="card memory"><b>Gancho final</b><p class="muted preserve-lines">${esc(ep.script?.hook||'Não definido.')}</p><button class="btn secondary small" onclick="editHook()">Editar gancho</button></div>${ep.deletedScenes?.length?'<button class="btn secondary" onclick="restoreLastScene()">↶ Restaurar última cena excluída</button>':''}<div id="sceneEditor"></div>`;
  by('genEp').textContent=list.length?'↻ Regenerar com IA (mantém histórico)':'✨ Gerar roteiro com IA';
}
function sceneForm(scene,index) {
  const ep=getVideoEpisode();if(!ep)return;
  editorContext={project:current.localId,season:current.activeSeason,episode:ep.number,index};
  dialogueDraft=DoramaStore.clone(scene.dialogue||[]);
  by('sceneEditor').innerHTML=`<form class="card" id="sceneForm" onsubmit="event.preventDefault();saveSceneEdit()"><h3>${index===null?'Nova cena':'Editar cena '+(index+1)}</h3>${[['scenePlace','LOCAL / CENÁRIO'],['sceneTime','HORÁRIO'],['sceneCast','PERSONAGENS (separados por vírgula)']].map(([id,label])=>`<label class="label" for="${id}">${label}</label><input id="${id}" class="input">`).join('')}<label class="label" for="sceneDuration">DURAÇÃO PLANEJADA (segundos)</label><input id="sceneDuration" class="input" type="number" min="1" max="3600" required><label class="label" for="sceneAction">AÇÃO / DESCRIÇÃO</label><textarea id="sceneAction" class="textarea" required></textarea><label class="label" for="sceneStatus">STATUS</label><select id="sceneStatus" class="select">${['roteiro','materiais','clipe-importado','revisado'].map(v=>`<option>${v}</option>`).join('')}</select><label class="label" for="sceneImagePrompt">PROMPT DE IMAGEM (opcional)</label><textarea id="sceneImagePrompt" class="textarea"></textarea><label class="label" for="sceneVideoPrompt">PROMPT DE VÍDEO (opcional)</label><textarea id="sceneVideoPrompt" class="textarea"></textarea><h4>Diálogos</h4><div id="dialogueEditor"></div><button type="button" class="btn secondary small" onclick="addDialogue()">＋ Fala</button><div class="scene-tools"><button class="btn primary" type="submit">Salvar cena</button><button type="button" class="btn secondary" onclick="editorContext=null;by('sceneEditor').innerHTML=''">Cancelar</button></div><p id="sceneSaveStatus" class="status" role="status"></p></form>`;
  for(const [id,value] of Object.entries({scenePlace:scene.place||'',sceneTime:scene.time||'',sceneCast:(scene.characters||[...new Set((scene.dialogue||[]).map(d=>d.name))]).join(', '),sceneDuration:scene.duration||4,sceneAction:scene.action||'',sceneStatus:scene.status||'roteiro',sceneImagePrompt:scene.imagePrompt||'',sceneVideoPrompt:scene.videoPrompt||''}))by(id).value=value;
  if(scene.status&&!by('sceneStatus').value){const option=document.createElement('option');option.value=scene.status;option.textContent=scene.status;by('sceneStatus').append(option);by('sceneStatus').value=scene.status;}
  renderDialogueEditor();by('sceneEditor').scrollIntoView({behavior:'smooth',block:'start'});
}
function captureDialogue(){dialogueDraft=dialogueDraft.map((d,i)=>({...d,name:by('dialogueName'+i).value,text:by('dialogueText'+i).value}));}
function renderDialogueEditor(){by('dialogueEditor').innerHTML=dialogueDraft.map((d,i)=>`<div class="scene"><label class="label" for="dialogueName${i}">PERSONAGEM</label><input id="dialogueName${i}" class="input" value="${esc(d.name)}"><label class="label" for="dialogueText${i}">FALA</label><textarea id="dialogueText${i}" class="textarea">${esc(d.text)}</textarea><button type="button" class="btn secondary small" onclick="removeDialogue(${i})">Remover fala</button></div>`).join('');for(let i=0;i<dialogueDraft.length;i++){by('dialogueName'+i).value=dialogueDraft[i].name||'';by('dialogueText'+i).value=dialogueDraft[i].text||'';}}
function addDialogue(){captureDialogue();dialogueDraft.push({name:'',text:''});renderDialogueEditor();}
function removeDialogue(i){captureDialogue();dialogueDraft.splice(i,1);renderDialogueEditor();}
function editScene(i){const scene=getVideoEpisode()?.script?.scenes?.[i];if(scene)sceneForm(scene,i);}
function addScene(){if(!getVideoEpisode())return;sceneForm({place:'',time:'',action:'',dialogue:[]},null);}
async function commitSceneChange(change) {
  const previous=DoramaStore.clone(current);
  try{change();persistLocal();}
  catch(e){current=previous;throw e;}
  renderScript(getVideoEpisode());renderSeries();renderVideoWorkspace();
  notify('Salvo neste aparelho.');
  if(sessionUser){try{await syncProject();notify('Salvo neste aparelho e na nuvem.');}catch(e){notify('Salvo neste aparelho; sincronização pendente: '+e.message);}}
}
async function saveSceneEdit() {
  try{
    if(!editorContext||editorContext.project!==current.localId||editorContext.season!==current.activeSeason||Number(editorContext.episode)!==Number(selectedEpisode))throw Error('O projeto ou episódio mudou. Reabra a cena.');
    captureDialogue();
    const patch={place:by('scenePlace').value.trim(),time:by('sceneTime').value.trim(),action:by('sceneAction').value.trim(),characters:by('sceneCast').value.split(',').map(s=>s.trim()).filter(Boolean),duration:Number(by('sceneDuration').value),status:by('sceneStatus').value,imagePrompt:by('sceneImagePrompt').value,videoPrompt:by('sceneVideoPrompt').value,dialogue:dialogueDraft};
    const index=editorContext.index;
    await commitSceneChange(()=>DoramaStore.updateScene(current,selectedEpisode,index,patch));editorContext=null;
  }catch(e){if(by('sceneSaveStatus'))by('sceneSaveStatus').textContent='Não salvo: '+e.message;else notify('Não salvo: '+e.message);}
}
async function moveScene(i,delta){try{await commitSceneChange(()=>DoramaStore.moveScene(current,selectedEpisode,i,delta));}catch(e){notify('Não salvo: '+e.message);}}
async function deleteScene(i){if(!confirm('Excluir esta cena da sequência? Ela poderá ser restaurada.'))return;try{await commitSceneChange(()=>DoramaStore.removeScene(current,selectedEpisode,i));}catch(e){notify('Não salvo: '+e.message);}}
async function restoreLastScene(){try{await commitSceneChange(()=>DoramaStore.restoreScene(current,selectedEpisode));}catch(e){notify('Não salvo: '+e.message);}}
function openClipDatabase(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('Armazenamento de clipes indisponível.'));const request=indexedDB.open('dorama-clips-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('clips');request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});}
async function clipStore(action,key,value){const db=await openClipDatabase();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('clips',action==='get'?'readonly':'readwrite');const store=tx.objectStore('clips');const req=action==='get'?store.get(key):store.put(value,key);tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Armazenamento cancelado.'));});}finally{db.close();}}
async function importSceneClip(i,input) {
  const file=input.files?.[0],project=current,ep=getVideoEpisode(),scene=ep?.script?.scenes?.[i];if(!file||!scene)return;
  if(!/\.(mp4|webm|mov)$/i.test(file.name)||file.size>50*1024*1024){notify('Escolha MP4, WebM ou MOV de até 50 MB. MP4 H.264/AAC é recomendado no Android.');return;}
  try{
    // Check actual decode support before claiming that an imported file is playable.
    const url=URL.createObjectURL(file),video=document.createElement('video');video.preload='auto';
    let duration;
    try{duration=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Não foi possível ler o vídeo em 15 segundos.')),15000);video.onloadeddata=()=>{clearTimeout(timer);Number.isFinite(video.duration)&&video.duration>0?resolve(video.duration):reject(Error('Duração de vídeo inválida.'));};video.onerror=()=>{clearTimeout(timer);reject(Error('Formato ou codec não reproduzível neste aparelho.'));};video.src=url;});}
    finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
    if(current!==project||getVideoEpisode()!==ep||ep.script.scenes[i]!==scene)throw Error('A cena mudou durante a importação. Selecione o arquivo novamente.');
    const key=DoramaStore.id();await clipStore('put',key,file);
    await commitSceneChange(()=>{scene.localClip={key,name:file.name,size:file.size,type:file.type,duration};scene.id=scene.id||DoramaStore.id();scene.status='clipe-importado';});
  }catch(e){notify('Clipe não vinculado: '+e.message);}
}
function clearPreviewUrls(){previewUrls.forEach(url=>URL.revokeObjectURL(url));previewUrls=[];}
let workspaceRender=0;
async function renderVideoWorkspace(){
  const el=by('videoWorkspace'),ep=getVideoEpisode();if(!el)return;clearPreviewUrls();const render=++workspaceRender;
  const scenes=ep?.script?.scenes||[];
  el.innerHTML='<div id="productionOverview" class="production-overview" role="status" aria-live="polite"></div><div class="scene-tools"><button class="btn secondary" onclick="fillMissingSceneDurations(8)">Definir 8 s nas cenas sem duração</button></div><p class="stream-note">Fluxo gratuito: exporte os prompts → produza em ferramenta externa → importe os clipes → revise em sequência → monte no editor de vídeo do celular. Clipes ficam no armazenamento local e não são enviados ao Supabase. Montagem MP4 interna ainda não está disponível.</p>'+scenes.map((scene,i)=>`<details class="scene production-scene" ${i===0?'open':''}><summary class="between"><b>Cena ${i+1} · ${esc(scene.place||'Cenário')}</b><span class="badge">${esc(scene.localClip?.name||scene.status||'sem clipe')}</span></summary><div class="production-scene-body"><p class="status">${esc(scene.place||'Cenário não definido')} · ${Number(scene.duration)||'—'} s planejados${scene.localClip?' · '+Number(scene.localClip.duration).toFixed(1)+' s de clipe':''}</p><label class="label">PROMPT DE IMAGEM</label><textarea class="textarea" readonly aria-label="Prompt de imagem da cena ${i+1}">${esc(scene.imagePrompt||imageScenePrompt(scene,i))}</textarea><label class="label">PROMPT DE VÍDEO</label><textarea class="textarea" readonly aria-label="Prompt de vídeo da cena ${i+1}">${esc(scene.videoPrompt||videoScenePrompt(scene,i))}</textarea><button class="btn secondary small" onclick="copyScenePrompt(${i})">Copiar prompt de vídeo</button><button class="btn primary small" onclick="startAiSceneVideo(${i})">Gerar vídeo com IA (Agnes)</button><button class="btn secondary small" onclick="checkAiSceneVideo(${i})">Consultar geração</button><button class="btn secondary small" onclick="previewSceneDialogue(${i})">▶ Ouvir diálogos</button><button class="btn secondary small" onclick="stopSceneDialogue()">■ Parar voz</button><label class="label" for="localClip${i}">IMPORTAR CLIPE DO CELULAR</label><input id="localClip${i}" class="input" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onchange="importSceneClip(${i},this)"><label class="label" for="clipUrl${i}">OU LINK HTTPS DO CLIPE</label><input class="input" id="clipUrl${i}" type="url" value="${esc(scene.videoClipUrl||'')}"><button class="btn secondary small" onclick="setSceneClip(${i},by('clipUrl${i}').value)">Salvar link</button><details><summary>Animação local experimental (imagem → WebM)</summary><p class="stream-note">Não é geração por IA. Depende de MediaRecorder no aparelho. Teste a reprodução antes de usar no editor externo.</p><input class="input" type="file" accept="image/png,image/jpeg,image/webp" id="sceneImage${i}" aria-label="Imagem da cena ${i+1}"><button class="btn secondary small" id="sceneRenderBtn${i}" onclick="renderSceneMotion(${i})">Criar animação de 4 segundos</button></details><div id="clipPreview${i}"></div>${scene.localClip?`<button class="btn secondary small" onclick="exportLocalClip(${i})">Exportar arquivo do clipe</button>`:''}</div></details>`).join('')+`<div class="scene-tools"><button class="btn primary" id="autoEpisodeBtn" onclick="generateEpisodeAutomatically()">Gerar cenas automaticamente (IA gratuita)</button><button class="btn primary" onclick="checkEpisodeProduction()">Verificar produção do episódio</button><button class="btn primary" onclick="previewSequence()">▶ Prévia em sequência</button><button class="btn secondary" onclick="exportSilentEpisodeWebm()">Exportar prévia WebM sem áudio (experimental)</button><button class="btn secondary" onclick="exportVideoPlan()">Exportar materiais JSON</button><button class="btn secondary" onclick="exportProductionText()">Exportar prompts TXT</button><button class="btn secondary" onclick="exportDialogueScript()">Exportar roteiro de dublagem</button></div><video id="sequencePlayer" class="player hidden" controls playsinline></video><p id="videoClipStatus" class="status" role="status"></p>`;
  updateProductionOverview(scenes);
  for(let i=0;i<scenes.length;i++){
    try{const sc=scenes[i],blob=sc.localClip?await clipStore('get',sc.localClip.key):null;if(render!==workspaceRender)return;let url=blob?URL.createObjectURL(blob):safeVideoUrl(sc.videoClipUrl);if(blob)previewUrls.push(url);
      if(url){const video=document.createElement('video');video.className='player';video.controls=true;video.playsInline=true;video.preload='none';video.src=url;video.onerror=()=>notify('Falha ao reproduzir a cena '+(i+1)+'. Verifique o codec ou o servidor.');by('clipPreview'+i)?.append(video);}else if(sc.localClip)by('clipPreview'+i).textContent='Arquivo local ausente neste aparelho. Importe novamente.';
    }catch(e){if(render===workspaceRender)notify('Prévia indisponível: '+e.message);}
  }
}
function updateProductionOverview(scenes){
  const el=by('productionOverview');if(!el)return;
  const total=scenes.length,withDuration=scenes.filter(s=>Number(s.duration)>0).length;
  const linked=scenes.filter(s=>s.localClip?.key||safeVideoUrl(s.videoClipUrl)).length;
  const percent=total?Math.round(100*linked/total):0;
  el.innerHTML='<div class="between"><div><span class="stream-kicker">ANDAMENTO DO EPISÓDIO</span><h3>'+linked+' de '+total+' cenas com clipe</h3></div><strong>'+percent+'%</strong></div><div class="production-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'" aria-label="Cenas com clipes"><span style="width:'+percent+'%"></span></div><p class="status">'+withDuration+'/'+total+' cenas com duração definida. Os clipes são verificados ao tocar em Verificar produção.</p>';
}
async function fillMissingSceneDurations(seconds=8){
  const ep=getVideoEpisode();if(!ep?.script?.scenes?.length)return;
  const missing=ep.script.scenes.filter(scene=>!(Number(scene.duration)>0));
  if(!missing.length){notify('Todas as cenas já têm duração definida.');return;}
  try{await commitSceneChange(()=>{for(const scene of missing)scene.duration=seconds;});notify('Duração de '+seconds+' segundos definida em '+missing.length+' cenas.');}
  catch(e){notify('Não foi possível atualizar as durações: '+e.message);}
}
let sceneSpeechSession=0;
function stopSceneDialogue(){
  sceneSpeechSession++;
  if('speechSynthesis' in window)window.speechSynthesis.cancel();
  const status=by('videoClipStatus');if(status)status.textContent='Leitura de diálogos interrompida.';
}
function previewSceneDialogue(i){
  const status=by('videoClipStatus'),scene=getVideoEpisode()?.script?.scenes?.[i];
  if(!scene)return;
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
    if(status)status.textContent='A leitura de voz não é compatível com este aparelho.';return;
  }
  const lines=(scene.dialogue||[]).filter(d=>String(d.text||'').trim());
  if(!lines.length){if(status)status.textContent='Adicione falas à cena '+(i+1)+' para ouvir os diálogos.';return;}
  window.speechSynthesis.cancel();const session=++sceneSpeechSession;
  const speakLine=index=>{
    if(session!==sceneSpeechSession)return;
    if(index>=lines.length){if(status)status.textContent='Leitura da cena '+(i+1)+' concluída. Áudio não foi gravado.';return;}
    const utterance=new SpeechSynthesisUtterance(String(lines[index].text));
    utterance.lang='pt-BR';utterance.rate=0.93;utterance.pitch=1;
    utterance.onend=()=>speakLine(index+1);
    utterance.onerror=()=>{if(status)status.textContent='Falha na síntese de voz. Verifique o mecanismo de voz do Android.';};
    if(status)status.textContent='Lendo fala '+(index+1)+' de '+lines.length+' · '+String(lines[index].name||'Personagem')+'. Prévia com voz do aparelho, sem gerar áudio para exportação.';
    window.speechSynthesis.speak(utterance);
  };
  speakLine(0);
}
async function checkEpisodeProduction(){
  const ep=getVideoEpisode(),scenes=ep?.script?.scenes||[],status=by('videoClipStatus');
  if(!status)return;
  if(!scenes.length){status.textContent='Adicione cenas ao roteiro antes de iniciar a produção.';return;}
  let ready=0,missingDuration=0,missingClip=0;
  for(const scene of scenes){
    if(!(Number(scene.duration)>0))missingDuration++;
    let hasClip=Boolean(safeVideoUrl(scene.videoClipUrl));
    if(scene.localClip?.key){try{hasClip=Boolean(await clipStore('get',scene.localClip.key))||hasClip;}catch(e){/* storage unavailable */}}
    if(hasClip)ready++;else missingClip++;
  }
  status.textContent='Produção: '+ready+'/'+scenes.length+' cenas com vídeo. '+missingClip+' sem clipe; '+missingDuration+' sem duração. '+(missingClip?'Para produzir o episódio, ainda é necessário gerar/importar os clipes. A geração automática por IA não está conectada.':'Todos os clipes estão disponíveis para prévia em sequência. A exportação MP4 ainda não está implementada.');
}
function imageScenePrompt(scene,i){return `Quadro cinematográfico da cena ${i+1}, ${current.country||''}. ${scene.place||''}, ${scene.time||''}. ${scene.action||''}. Elenco: ${(current.characters||[]).map(c=>c.name+': '+(c.visual?.identity||'')+'; figurino '+(c.visual?.style||'')).join(' | ')}. Preservar continuidade e identidade visual.`;}
async function setSceneClip(i,value){const scene=getVideoEpisode()?.script?.scenes?.[i];if(!scene)return;const url=String(value||'').trim();if(url&&!safeVideoUrl(url)){notify('Informe um link HTTPS válido.');return;}try{await commitSceneChange(()=>{scene.videoClipUrl=url;});}catch(e){notify('Link não salvo: '+e.message);}}
function previewSequence(){const player=by('sequencePlayer'),videos=[...document.querySelectorAll('#videoWorkspace .production-scene video')];if(!videos.length){notify('Importe um clipe para assistir à sequência.');return;}let index=0;player.classList.remove('hidden');const play=()=>{player.src=videos[index].src;by('videoClipStatus').textContent='Prévia do clipe '+(index+1)+' de '+videos.length+'. Cenas sem clipe são omitidas; nenhum arquivo final é gerado.';player.play().catch(e=>notify('Toque no player para iniciar: '+e.message));};player.onended=()=>{if(++index<videos.length)play();};player.onerror=()=>notify('Não foi possível reproduzir este clipe.');play();}
async function exportSilentEpisodeWebm(){
 const scenes=getVideoEpisode()?.script?.scenes||[];
 if(!scenes.length||scenes.some(s=>!s.localClip?.key)){notify('Para exportar, importe um clipe local para cada cena. Links externos não são compatíveis.');return;}
 if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream){notify('Este aparelho não suporta gravação WebM pelo navegador.');return;}
 if(!confirm('Exportar prévia WebM SEM ÁUDIO? A montagem MP4 com diálogos ainda não está disponível.'))return;
 const status=by('videoClipStatus'),canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
 const ctx=canvas.getContext('2d'),stream=canvas.captureStream(24),mime=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime){stream.getTracks().forEach(t=>t.stop());notify('Gravação WebM não suportada neste aparelho.');return;}
 const chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1400000});
 rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 const finished=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=e=>reject(Error('Falha ao gravar vídeo.'));});
 try{
  rec.start(1000);
  for(let i=0;i<scenes.length;i++){
   const blob=await clipStore('get',scenes[i].localClip.key);if(!blob)throw Error('Clipe da cena '+(i+1)+' ausente.');
   const url=URL.createObjectURL(blob),video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=url;
   try{
    await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Formato de vídeo incompatível na cena '+(i+1)));});
    if(status)status.textContent='Gravando cena '+(i+1)+' de '+scenes.length+' (sem áudio)...';
    const playback=video.play();
    await Promise.race([playback,new Promise((_,reject)=>setTimeout(()=>reject(Error('Reprodução não iniciou na cena '+(i+1))),12000))]);
    await new Promise((resolve,reject)=>{
     let frame=0;const draw=()=>{try{if(video.ended){resolve();return;}if(video.readyState<2){frame=requestAnimationFrame(draw);return;}ctx.fillStyle='#000';ctx.fillRect(0,0,640,360);const scale=Math.min(640/video.videoWidth,360/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;ctx.drawImage(video,(640-w)/2,(360-h)/2,w,h);frame=requestAnimationFrame(draw);}catch(e){reject(e);}};video.onended=()=>{cancelAnimationFrame(frame);resolve();};video.onerror=()=>{cancelAnimationFrame(frame);reject(Error('Erro na cena '+(i+1)));};draw();
    });
   }finally{video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
  }
  rec.stop();await finished;
  if(!chunks.length)throw Error('Nenhum quadro foi gravado.');
  await downloadMaterial(new Blob(chunks,{type:'video/webm'}),'dorama-previa-sem-audio.webm');
  notify('Prévia WebM exportada sem áudio. Verifique o arquivo antes de compartilhar.');
 }catch(e){if(rec.state!=='inactive')rec.stop();notify('Não foi possível exportar: '+e.message);}
 finally{stream.getTracks().forEach(t=>t.stop());if(status)status.textContent='Exportação local encerrada.';}
}
async function downloadMaterial(blob,name){
  if(window.DoramaNative?.isNativePlatform()){
    // Android WebView does not reliably download blob URLs. Use Storage Access Framework.
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
    await window.DoramaNative.exportFile({name,mime:blob.type||'application/octet-stream',base64});return;
  }
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
async function exportLocalClip(i){try{const clip=getVideoEpisode()?.script?.scenes?.[i]?.localClip;if(!clip)return;const blob=await clipStore('get',clip.key);if(!blob)throw Error('Clipe não está neste aparelho.');await downloadMaterial(blob,clip.name);notify('Clipe exportado.');}catch(e){notify('Exportação não concluída: '+e.message);}}
async function callVideoProvider(action,payload){
 if(typeof sb==='undefined')throw Error('Conecte sua conta para usar o provedor de vídeo.');
 const {data:{session}}=await sb.auth.getSession();
 if(!session?.access_token)throw Error('Entre na sua conta para gerar vídeos.');
 const {data,error}=await sb.functions.invoke('generate-video',{body:{action,...payload}});
 if(error){let detail=data;try{if(error.context&&typeof error.context.json==='function')detail=await error.context.json();}catch(_){}throw Error(detail?.error||detail?.message||error.message||'Provedor indisponível.');}
 if(data?.error)throw Error(data.error);
 return data;
}
let episodeAutoRunning=false;
async function generateEpisodeAutomatically(){
 if(episodeAutoRunning){notify('A produção automática já está em andamento.');return;}
 const scenes=getVideoEpisode()?.script?.scenes||[],status=by('videoClipStatus');
 if(!scenes.length){notify('Crie o roteiro do episódio antes de iniciar a produção.');return;}
 episodeAutoRunning=true;
 const button=by('autoEpisodeBtn');if(button)button.disabled=true;
 let created=0,completed=0;
 try{
  for(let i=0;i<scenes.length;i++){
   const scene=scenes[i];if(scene.localClip?.key||safeVideoUrl(scene.videoClipUrl)){completed++;continue;}
   if(status)status.textContent='Produção automática: cena '+(i+1)+' de '+scenes.length+'.';
   if(scene.aiVideoTaskId){if(status)status.textContent='Cena '+(i+1)+' já solicitada. Não será cobrada ou enviada novamente.';continue;}
   let data;
   try{data=await callVideoProvider('create',{prompt:scene.videoPrompt||videoScenePrompt(scene,i)});}
   catch(e){const unavailable=/no available channel|HTTP 503/i.test(String(e.message));throw Error(unavailable?'O modelo gratuito da Agnes está indisponível. Produção interrompida sem migrar para serviço pago.':e.message);}
   if(!data?.taskId)throw Error('O serviço não retornou identificador para a cena '+(i+1));
   await commitSceneChange(()=>{scene.aiVideoTaskId=data.taskId;scene.aiVideoStatus='pending';});
   created++;
  }
  notify('Solicitações concluídas: '+created+' nova(s), '+completed+' cena(s) já pronta(s). Use Consultar geração para acompanhar.');
 }catch(e){notify('Produção automática pausada: '+e.message);if(status)status.textContent=e.message;}
 finally{episodeAutoRunning=false;if(button)button.disabled=false;}
}
async function startAiSceneVideo(i){
 const scene=getVideoEpisode()?.script?.scenes?.[i],status=by('videoClipStatus');if(!scene)return;
 if(scene.aiVideoTaskId&&!confirm('Esta cena já tem uma tarefa de vídeo. Criar outra?'))return;
 if(status)status.textContent='Solicitando geração da cena '+(i+1)+'...';
 try{
  const data=await callVideoProvider('create',{prompt:scene.videoPrompt||videoScenePrompt(scene,i)});
  await commitSceneChange(()=>{scene.aiVideoTaskId=data.taskId;scene.aiVideoStatus='pending';});
  notify('Geração solicitada para a cena '+(i+1)+'. Use Consultar geração para acompanhar.');
 }catch(e){const unavailable=/no available channel|HTTP 503/i.test(String(e.message));const message=unavailable?'A Agnes não disponibilizou o modelo gratuito nesta conta. Nenhuma tarefa foi criada. Você pode importar clipes do celular ou usar a animação local enquanto o serviço não volta.':e.message;notify('Geração indisponível: '+message);if(status)status.textContent=message;}
}
async function checkAiSceneVideo(i){
 const scene=getVideoEpisode()?.script?.scenes?.[i];if(!scene)return;
 if(!scene.aiVideoTaskId){notify('Solicite a geração desta cena primeiro.');return;}
 try{
  const data=await callVideoProvider('status',{taskId:scene.aiVideoTaskId});
  if(data.status==='completed'&&data.videoUrl){
   await commitSceneChange(()=>{scene.videoClipUrl=data.videoUrl;scene.aiVideoStatus='completed';scene.status='clipe-ia';});
   notify('Clipe da cena '+(i+1)+' disponível. Confira a reprodução.');
  }else if(data.status==='failed'){await commitSceneChange(()=>{scene.aiVideoStatus='failed';});notify('Geração falhou: '+(data.error||'Erro do provedor'));}
  else notify('Cena '+(i+1)+': '+String(data.status||'aguardando')+'. Consulte novamente em instantes.');
 }catch(e){notify('Consulta indisponível: '+e.message);}
}
function productionPlan(){const plan=DoramaStore.plan(current,selectedEpisode);plan.scenes=plan.scenes.map((scene,i)=>({...scene,imagePrompt:scene.imagePrompt||imageScenePrompt(scene,i),videoPrompt:scene.videoPrompt||videoScenePrompt(scene,i)}));return plan;}
async function exportVideoPlan(){try{const plan=productionPlan();await downloadMaterial(new Blob([JSON.stringify(plan,null,2)],{type:'application/json'}),`dorama-t${plan.season}-ep${plan.episode}-materiais.json`);notify('Materiais exportados: '+plan.scenes.length+' cenas.');}catch(e){notify('Exportação não concluída: '+e.message);}}
function exportClipManifest(){return exportVideoPlan();}
async function exportDialogueScript(){
 try{
  const ep=getVideoEpisode(),scenes=ep?.script?.scenes||[];
  if(!scenes.length){notify('Adicione cenas antes de exportar o roteiro de dublagem.');return;}
  const title=String(current?.title||'Dorama');
  const lines=[title,'Temporada '+(current?.activeSeason||1)+' · Episódio '+selectedEpisode,'ROTEIRO DE DUBLAGEM','','Vozes: prévia local do aparelho. Atribuição de vozes e áudio final dependem de produção posterior.',''];
  for(let i=0;i<scenes.length;i++){
   const s=scenes[i];lines.push('CENA '+(i+1)+' · '+String(s.place||'Cenário')+' · '+(Number(s.duration)||'sem duração')+' s');
   if(!s.dialogue?.length)lines.push('(Sem falas cadastradas)');
   for(const d of s.dialogue||[])lines.push(String(d.name||'Personagem')+': '+String(d.text||''));
   lines.push('');
  }
  await downloadMaterial(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),'dorama-t'+(current?.activeSeason||1)+'-ep'+selectedEpisode+'-dublagem.txt');
  notify('Roteiro de dublagem exportado.');
 }catch(e){notify('Falha ao exportar dublagem: '+e.message);}
}
async function exportProductionText(){try{const plan=productionPlan();const text=`${plan.title} — T${plan.season} E${plan.episode}\n\n`+plan.scenes.map(s=>`CENA ${s.order} — ${s.place}\nDuração: ${s.duration||'não definida'} s\nStatus: ${s.status||'roteiro'}\nAção: ${s.action}\nDiálogos:\n${(s.dialogue||[]).map(d=>d.name+': '+d.text).join('\n')}\nIMAGEM: ${s.imagePrompt}\nVÍDEO: ${s.videoPrompt}\nClipe: ${s.localClip?.name||s.videoClipUrl||'pendente'}`).join('\n\n');await downloadMaterial(new Blob([text],{type:'text/plain;charset=utf-8'}),`dorama-t${plan.season}-ep${plan.episode}-prompts.txt`);notify('Prompts exportados.');}catch(e){notify('Exportação não concluída: '+e.message);}}
async function exportProjectBackup(){try{snapshotSeason();await downloadMaterial(new Blob([JSON.stringify({format:'dorama-studio-backup/v1',createdAt:new Date().toISOString(),project:current},null,2)],{type:'application/json'}),'dorama-backup-'+new Date().toISOString().slice(0,10)+'.json');notify('Backup exportado. Exporte também os arquivos de clipes locais.');}catch(e){notify('Backup não exportado: '+e.message);}}
document.addEventListener('visibilitychange',()=>{if(document.hidden){try{if(current)persistLocal();}catch(e){notify('Não foi possível salvar: '+e.message);}}});

async function signUp(){try{await signUpRequest();}catch(e){notify('Cadastro não concluído: '+authMessage(e));}}
async function signIn(){try{await signInRequest();}catch(e){notify('Login não concluído: '+authMessage(e));}}
async function signOut(){try{await signOutRequest();}catch(e){notify('Saída não concluída: '+authMessage(e));}}
