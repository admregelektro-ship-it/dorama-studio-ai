const fs = require('node:fs');
const esbuild = require('esbuild');
const pkg = require('../package.json');
if (pkg.dependencies['@capacitor/core'] !== pkg.dependencies['@capacitor/android'] || pkg.dependencies['@capacitor/core'] !== pkg.devDependencies['@capacitor/cli']) throw Error('Versões Capacitor divergentes.');
esbuild.buildSync({stdin:{contents:`import {createClient} from '@supabase/supabase-js';import {Capacitor,registerPlugin} from '@capacitor/core';window.supabase={createClient};const files=registerPlugin('DoramaFiles');window.DoramaNative={isNativePlatform:()=>Capacitor.isNativePlatform(),exportFile:options=>files.exportFile(options)};`,resolveDir:process.cwd()},bundle:true,platform:'browser',target:'es2022',minify:true,outfile:'www/vendor.js'});
console.log('SDK Supabase e bridge Capacitor empacotados localmente.');
