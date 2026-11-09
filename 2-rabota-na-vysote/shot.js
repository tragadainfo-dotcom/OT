const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(m.type()==='error'&&!/TUNNEL/.test(m.text()))e.push(m.text())});
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(500);
for(const id of ['scA','scB','scC']) await (await p.$('#'+id)).screenshot({path:id+'.png'});
await (await p.$('#gallery')).screenshot({path:'gal.png'});
console.log(e);await b.close()})();
