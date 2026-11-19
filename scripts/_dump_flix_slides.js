const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs'); const path = require('path');
function sa() {
  const r = fs.readFileSync(path.join(__dirname,'..','.env.local'),'utf8');
  const line = r.split(/\r?\n/).find(l=>l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  const p = JSON.parse(line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g,''));
  if (p.private_key) p.private_key = p.private_key.replace(/\n/g,'\n');
  return p;
}
if (!getApps().length) initializeApp({ credential: cert(sa()) });
const db = getFirestore();
(async()=>{
  const snap = await db.collection('movieLessons').limit(5).get();
  const typeCounts = {};
  for (const d of snap.docs){
    const data = d.data();
    console.log(`\n${d.id} "${(data.clip?.title||data.title||'').slice(0,50)}" (${data.slides?.length||0} slides):`);
    (data.slides||[]).forEach((s,i)=>{
      typeCounts[s.type] = (typeCounts[s.type]||0)+1;
      console.log(`  ${i}. type=${s.type}  title="${(s.title||'').slice(0,60)}"`);
    });
  }
  console.log('\nSlide type counts across sampled lessons:');
  Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).forEach(([t,c])=>console.log(`  ${t}: ${c}`));
})().catch(e=>{console.error(e);process.exit(1);});
