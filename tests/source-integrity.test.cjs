const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
test('todos os scripts inline e módulos têm sintaxe válida',()=>{for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);for(const name of ['project-store.js','studio.js','cloud-sync.js'])new vm.Script(fs.readFileSync(path.join(root,'www',name),'utf8'));});
test('não há seleção por posição, SDK via CDN nem deleção de tabelas na sincronização',()=>{const cloud=fs.readFileSync(path.join(root,'www/cloud-sync.js'),'utf8');assert.doesNotMatch(html,/episodes\[(?:selectedEpisode|n)-1\]/);assert.doesNotMatch(html,/cdn\.jsdelivr/);assert.doesNotMatch(cloud,/\.delete\(/);assert.match(cloud,/eq\('user_id',userId\)/);});
test('dependências Capacitor são consistentes e versão da UI acompanha package',()=>{const p=require('../package.json');assert.equal(p.dependencies['@capacitor/core'],p.dependencies['@capacitor/android']);assert.equal(p.dependencies['@capacitor/core'],p.devDependencies['@capacitor/cli']);assert.match(html,new RegExp('appVersion: "'+p.version.replaceAll('.','\\.')+'"'));});
test('build empacota SDK e workflow executa testes antes do APK',()=>{const build=fs.readFileSync(path.join(root,'scripts/build.cjs'),'utf8'),workflow=fs.readFileSync(path.join(root,'.github/workflows/android-apk.yml'),'utf8');assert.match(build,/@supabase\/supabase-js/);assert.match(build,/outfile:'www\/vendor.js'/);assert.ok(workflow.indexOf('npm test')<workflow.indexOf('assembleDebug'));assert.match(workflow,/pull_request:/);});

test('memória narrativa fica recolhida sem remover dados de continuidade',()=>{
  assert.match(html,/<details class="card memory narrative-drawer">/);
  assert.match(html,/<p id="memory"/);
  assert.doesNotMatch(html,/<details class="card memory narrative-drawer" open/);
});
test('estúdio inclui painel de produção e verificação sem prometer geração fictícia',()=>{
  const studio=fs.readFileSync(path.join(root,'www/studio.js'),'utf8');
  assert.match(html,/class="card production-hub"/);
  assert.match(studio,/function checkEpisodeProduction\(/);
  assert.match(studio,/geração automática por IA não está conectada/);
  assert.match(studio,/function fillMissingSceneDurations\(/);
});

test('prévia de diálogos usa síntese de voz local sem alegar exportação',()=>{
 const studio=fs.readFileSync(path.join(root,'www/studio.js'),'utf8');
 assert.match(studio,/function previewSceneDialogue\(/);
 assert.match(studio,/SpeechSynthesisUtterance/);
 assert.match(studio,/function stopSceneDialogue\(/);
 assert.match(studio,/Áudio não foi gravado/);
});

test('painel de produção tem estilos e cenas expansíveis',()=>{
 const studio=fs.readFileSync(path.join(root,'www/studio.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'www/production-ui.css'),'utf8');
 assert.match(html,/production-ui\.css/);
 assert.match(studio,/function updateProductionOverview\(/);
 assert.match(studio,/class="scene production-scene"/);
 assert.match(css,/\.production-progress/);
});

test('prévia sequencial encontra vídeos nos painéis expansíveis',()=>{
 const studio=fs.readFileSync(path.join(root,'www/studio.js'),'utf8');
 assert.match(studio,/#videoWorkspace \.production-scene video/);
 assert.doesNotMatch(studio,/#videoWorkspace article video/);
});
test('exportação de dublagem está disponível por episódio',()=>{
 const studio=fs.readFileSync(path.join(root,'www/studio.js'),'utf8');
 assert.match(studio,/function exportDialogueScript\(/);
 assert.match(studio,/Exportar roteiro de dublagem/);
 assert.match(studio,/dublagem\.txt/);
});

test('geração de vídeo usa função protegida e mantém estado por cena',()=>{
 const studio=fs.readFileSync(path.join(root,'www/studio.js'),'utf8');
 assert.match(studio,/functions\.invoke\('generate-video'/);
 assert.match(studio,/function startAiSceneVideo\(/);
 assert.match(studio,/function checkAiSceneVideo\(/);
 assert.match(studio,/aiVideoTaskId/);
});
