const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');
const folder = path.join('android','app','src','main','java','br','com','doramastudio','ai');
fs.mkdirSync(folder,{recursive:true});
fs.copyFileSync('native/DoramaFilesPlugin.java',path.join(folder,'DoramaFilesPlugin.java'));
fs.writeFileSync(path.join(folder,'MainActivity.java'),`package br.com.doramastudio.ai;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle savedInstanceState) {
  registerPlugin(DoramaFilesPlugin.class);
  super.onCreate(savedInstanceState);
 }
}
`);
const gradlePath='android/app/build.gradle';
let gradle=fs.readFileSync(gradlePath,'utf8').replace(/versionCode \d+/, 'versionCode 20400').replace(/versionName "[^"]+"/,`versionName "${pkg.version}"`);
fs.writeFileSync(gradlePath,gradle);
console.log('Exportação Android via seletor de documentos registrada. Versão '+pkg.version);
