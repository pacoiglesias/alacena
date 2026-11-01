import { spawnSync } from 'node:child_process';
const mode=process.argv[2] || 'dev';
const env={...process.env,VITE_REVIEW_MODE:'true',ALACENA_DIST_DIR:'review-dist'};
function run(args) {const r=spawnSync(process.execPath,args,{stdio:'inherit',env});if(r.status!==0)process.exit(r.status || 1);}
if(mode==='build') {run(['scripts/prepare-offline.mjs']);run(['node_modules/vite/bin/vite.js','build','--outDir','review-dist']);run(['scripts/build-offline.mjs']);}
else run(['node_modules/vite/bin/vite.js',...(mode==='serve'?['preview','--outDir','review-dist']:[]),'--host','127.0.0.1','--port',mode==='serve'?'5192':'5190']);
