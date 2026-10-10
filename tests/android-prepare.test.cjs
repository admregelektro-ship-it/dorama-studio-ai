const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
test('preparação Android aplica versão e plugin de exportação de forma idempotente',()=>{
  const root=path.join(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dorama-android-'));
  try{fs.mkdirSync(path.join(tmp,'android/app'),{recursive:true});fs.mkdirSync(path.join(tmp,'native'));fs.writeFileSync(path.join(tmp,'android/app/build.gradle'),'defaultConfig { versionCode 1\nversionName "1.0" }');fs.copyFileSync(path.join(root,'native/DoramaFilesPlugin.java'),path.join(tmp,'native/DoramaFilesPlugin.java'));
    for(let i=0;i<2;i++){const run=spawnSync(process.execPath,[path.join(root,'scripts/prepare-android.cjs')],{cwd:tmp,encoding:'utf8'});assert.equal(run.status,0,run.stderr);}
    const gradle=fs.readFileSync(path.join(tmp,'android/app/build.gradle'),'utf8'),activity=fs.readFileSync(path.join(tmp,'android/app/src/main/java/br/com/doramastudio/ai/MainActivity.java'),'utf8');assert.match(gradle,/versionName "2.4.0"/);assert.match(gradle,/versionCode 20400/);assert.equal(activity.match(/registerPlugin/g).length,1);assert.match(fs.readFileSync(path.join(tmp,'android/app/src/main/java/br/com/doramastudio/ai/DoramaFilesPlugin.java'),'utf8'),/ACTION_CREATE_DOCUMENT/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
