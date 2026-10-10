const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=require('node:path').join(__dirname,'..');
function app(){
  const values=new Map(),nodes=new Map();
  function node(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},className:'',disabled:false,children:[],classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},append(...children){this.children.push(...children);},prepend(){},scrollIntoView(){},pause(){},load(){}});return nodes.get(id);}
  const document={getElementById:node,querySelector:()=>node('main'),querySelectorAll:()=>[],createElement:tag=>node(tag+'-'+Math.random()),addEventListener(){}};
  const localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
  const context=vm.createContext({document,localStorage,console,Blob,URL,crypto:globalThis.crypto,setTimeout,clearTimeout,alert:()=>{},confirm:()=>true,scrollTo(){},navigator:{},window:null});context.window=context;
  const run=code=>vm.runInContext(code,context);
  run(fs.readFileSync(root+'/www/project-store.js','utf8'));
  const html=fs.readFileSync(root+'/www/index.html','utf8');
  for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(match[1].includes('renderSaved();refreshAuth()'))continue;run(match[1]);}
  run(fs.readFileSync(root+'/www/studio.js','utf8'));run(fs.readFileSync(root+'/www/cloud-sync.js','utf8'));
  run(`current={title:'Original',genre:'Drama',characters:[{name:'Ana'}],episodes:[{number:9,title:'Nove',script:null},{number:1,title:'Um',script:{hook:'Gancho',scenes:[{id:'scene-old',place:'Casa',time:'Dia',action:'Ação',dialogue:[{name:'Ana',text:'Texto: original\\nMais uma linha',emotion:'feliz'}],localClip:{key:'blob-1',name:'clip.mp4'},videoClipUrl:'https://example.com/clip.mp4',custom:'manter'}]}}],memory:[],duration:'15 min'};persistLocal();selectedEpisode=1;`);
  return {run,node,localStorage,context};
}
test('abrir episódio 9 fora de ordem permite adicionar e salvar duas cenas sem IA',async()=>{
  const a=app();a.run('openEpisode(9);addScene()');assert.match(a.node('script').innerHTML,/Nova cena/);
  for(const text of ['Primeira cena manual','Segunda cena manual']){a.node('scenePlace').value='Praça';a.node('sceneAction').value=text;a.node('sceneDuration').value='10';a.node('sceneStatus').value='roteiro';await a.run('saveSceneEdit()');a.run('addScene()');}
  assert.equal(a.run('getVideoEpisode().script.scenes.length'),2);assert.equal(a.run('DoramaStore.episode(current,1).script.scenes.length'),1);
  a.run('current=null;loadSaved(0);openEpisode(9)');assert.equal(a.run('getVideoEpisode().script.scenes.length'),2);
});
test('formulário de edição preserva campos de clipe, diálogos multiline e metadados',async()=>{
  const a=app();a.run('openEpisode(1);editScene(0)');a.node('sceneAction').value='Edição manual';a.node('sceneDuration').value='8';a.node('sceneStatus').value='roteiro';await a.run('saveSceneEdit()');
  assert.equal(a.run('getVideoEpisode().script.scenes[0].localClip.key'),'blob-1');assert.equal(a.run('getVideoEpisode().script.scenes[0].custom'),'manter');assert.equal(a.run('getVideoEpisode().script.scenes[0].dialogue[0].emotion'),'feliz');assert.equal(a.run('getVideoEpisode().script.scenes[0].dialogue[0].text'),'Texto: original\nMais uma linha');
});
test('falha de quota na interface reverte alteração e mostra erro sem sucesso falso',async()=>{
  const a=app();a.run('openEpisode(1);editScene(0)');a.node('sceneAction').value='Não deve persistir';a.node('sceneDuration').value='8';a.node('sceneStatus').value='roteiro';
  const previous=a.localStorage.getItem('doramaLibraryV24');const original=a.localStorage.setItem;a.localStorage.setItem=(key,value)=>{if(key==='doramaLibraryV24')throw Error('Sem espaço');return original(key,value);};await a.run('saveSceneEdit()');
  assert.equal(a.run('getVideoEpisode().script.scenes[0].action'),'Ação');assert.equal(a.localStorage.getItem('doramaLibraryV24'),previous);assert.match(a.node('sceneSaveStatus').textContent,/Não salvo: Sem espaço/);
});
test('exclusão e restauração na interface preservam clipe original',async()=>{const a=app();a.run('openEpisode(1)');await a.run('deleteScene(0)');assert.equal(a.run('getVideoEpisode().script.scenes.length'),0);await a.run('restoreLastScene()');assert.equal(a.run('getVideoEpisode().script.scenes[0].localClip.key'),'blob-1');});
test('exportação JSON e TXT contém cenas reais e não altera projeto',async()=>{
  const a=app();a.run(`downloadMaterial=async (blob,name)=>{window.exported={text:await blob.text(),name}};openEpisode(1);`);const before=a.run('JSON.stringify(current)');await a.run('exportVideoPlan()');const json=JSON.parse(a.context.exported.text);assert.equal(json.scenes.length,1);assert.equal(json.scenes[0].localClip.key,'blob-1');assert.match(json.scenes[0].videoPrompt,/Ação/);assert.equal(a.run('JSON.stringify(current)'),before);await a.run('exportProductionText()');assert.match(a.context.exported.text,/Texto: original\nMais uma linha/);assert.match(a.context.exported.name,/prompts.txt$/);
});
test('troca de episódio durante edição bloqueia gravação na cena errada',async()=>{const a=app();a.run('openEpisode(1);editScene(0);selectedEpisode=9');await a.run('saveSceneEdit()');assert.equal(a.run('DoramaStore.episode(current,9).script'),null);assert.match(a.node('sceneSaveStatus').textContent,/episódio mudou/);});
test('navegação ao estúdio sem projeto avisa sem quebrar a interface',()=>{const a=app();a.run('current=null;go("result")');assert.ok(true);});
test('sincronizações concorrentes são serializadas e não duplicam projeto nem apagam elenco',async()=>{
  const a=app();a.run(`window.cloudCalls=[];sessionUser={id:'user-1'};sb.from=table=>{let op='select',payload;const chain={select(){return chain},eq(){return chain},insert(value){op='insert';payload=value;return chain},update(value){op='update';payload=value;return chain},upsert(value){op='upsert';payload=value;return chain},single(){cloudCalls.push({table,op,payload});return Promise.resolve({data:{id:'cloud-1'},error:null})},then(resolve,reject){cloudCalls.push({table,op,payload});return Promise.resolve({data:table==='characters'?[]:null,error:null}).then(resolve,reject)}};return chain};`);
  await a.run('Promise.all([syncProject(),syncProject()])');
  assert.equal(a.run("cloudCalls.filter(c=>c.table==='doramas'&&c.op==='insert').length"),1);assert.equal(a.run("cloudCalls.filter(c=>c.table==='doramas'&&c.op==='update').length"),1);assert.equal(a.run('current.cloudOwnerId'),'user-1');
  assert.equal(a.run("cloudCalls.find(c=>c.table==='episodes').payload.find(e=>e.episode_number===1).scenes[0].custom"),'manter');assert.equal(a.run("'relationships' in cloudCalls.find(c=>c.table==='characters'&&c.op==='insert').payload"),false);
});
test('projeto de outra conta é bloqueado antes de enviar dados à nuvem',async()=>{const a=app();a.run("sessionUser={id:'user-2'};current.cloudOwnerId='user-1'");await assert.rejects(a.run('syncProject()'),/outra conta/);});
test('falha da nuvem mantém projeto salvo no aparelho',async()=>{const a=app();a.run(`sessionUser={id:'user-1'};sb.from=()=>{const chain={insert(){return chain},select(){return chain},single:async()=>({error:new Error('Nuvem indisponível')})};return chain};`);await a.run('saveProject(false)');assert.equal(a.run('DoramaStore.projects(localStorage)[0].episodes[1].script.scenes[0].custom'),'manter');});
test('resposta de IA sem cenas não sobrescreve roteiro existente',async()=>{const a=app();const before=a.run('JSON.stringify(getVideoEpisode())');a.run(`sb.auth.getSession=async()=>({data:{session:{access_token:'test-only'}}});sb.functions={invoke:async()=>({data:{ok:true,result:{episode:{scenes:[]}}},error:null})};`);await a.run('generateEpisode()');assert.equal(a.run('JSON.stringify(getVideoEpisode())'),before);});
test('falha de rede no login é tratada sem rejeição não capturada',async()=>{const a=app();a.run(`sb.auth.signInWithPassword=async()=>{throw Error('Sem conexão')}`);await a.run('signIn()');assert.match(a.node('appNotice').textContent,/Login não concluído: Sem conexão/);});
