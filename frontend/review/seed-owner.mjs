// Local Auth emulator only. Never uses Firebase production credentials.
const origin='http://127.0.0.1:9199';
const email='revision@alacena.test';
async function post(path,body,admin=false) {
  const response=await fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer owner'}:{})},body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw Error(data.error?.message||'Emulator failed');return data;
}
let user;
try{user=await post('/identitytoolkit.googleapis.com/v1/accounts:signUp?key=review-only',{email,password:'solo-emulador-2026',returnSecureToken:true});}
catch{const data=await post('/identitytoolkit.googleapis.com/v1/projects/demo-alacena-review/accounts:lookup',{email:[email]},true);user={localId:data.users?.[0]?.localId};}
if(!user.localId)throw Error('Missing local review user');
await post('/identitytoolkit.googleapis.com/v1/projects/demo-alacena-review/accounts:update',{localId:user.localId,emailVerified:true,customAttributes:JSON.stringify({alacenaAccess:true,households:['house-1','house-2','house-spain']})},true);
console.log('Cuenta ficticia lista: revision@alacena.test. Sin cambios en producción.');
