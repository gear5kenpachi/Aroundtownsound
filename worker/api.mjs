const OWNER_EMAIL = 'patrickbarber08@gmail.com';
const json = (value, status=200) => new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const owner = request => (request.headers.get('oai-authenticated-user-email') || '').toLowerCase() === OWNER_EMAIL && !!request.headers.get('oai-authenticated-user-id');
const services = ['Business commercial — from $49','Personalized song — from $99','Podcast intro or outro — from $69','Creator theme — from $79'];
export async function api(request, env) {
 const url = new URL(request.url);
 if (url.pathname === '/api/orders' && request.method === 'GET') {
  if (!owner(request)) return json({error:'Owner sign-in required.'},403);
  try { const rows=await env.DB.prepare('SELECT id, customer, email, service, genre, preferred_date, brief, created_at FROM orders ORDER BY created_at DESC LIMIT 200').all(); return json({orders:rows.results}); }
  catch {return json({error:'Could not load requests. Please try again.'},503);}
 }
 if (url.pathname !== '/api/orders' || request.method !== 'POST') return json({error:'Not found'},404);
 if (request.headers.get('origin') !== url.origin) return json({error:'Please submit from this website.'},403);
 if (!(request.headers.get('content-type')||'').includes('application/json')) return json({error:'JSON required.'},415);
 if (Number(request.headers.get('content-length')||0)>12000) return json({error:'Request too large.'},413);
 try {
  const raw=await request.text(); if(raw.length>12000)return json({error:'Request too large.'},413);
  let data; try {data=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  const val = (key,max) => typeof data[key]==='string' ? data[key].trim().slice(0,max+1) : '';
  const customer=val('customer',120),email=val('email',200),service=val('service',100),genre=val('genre',100),date=val('date',10),brief=val('brief',3000),id=val('id',36);
  if(val('website',200))return json({error:'Unable to accept request.'},400);
  if(!customer||customer.length>120||!/^\S+@\S+\.\S+$/.test(email)||email.length>200||!services.includes(service)||genre.length>100||!brief||brief.length>3000||!(/^[0-9a-f-]{36}$/i.test(id))||(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date)))return json({error:'Please check your name, email, service, and story.'},400);
  const exists=await env.DB.prepare('SELECT id FROM orders WHERE id = ?').bind(id).first();if(exists)return json({id:exists.id},200);
  const ip=request.headers.get('cf-connecting-ip')||'unknown';
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('AroundTownSound:'+ip));const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const recent=await env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE ip_hash = ? AND created_at > ?').bind(hash,new Date(Date.now()-3600000).toISOString()).first();
  if(recent.n>=5)return json({error:'Too many requests. Please try again in an hour.'},429);
  await env.DB.prepare('INSERT INTO orders (id,customer,email,service,genre,preferred_date,brief,created_at,ip_hash) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,customer,email,service,genre,date,brief,new Date().toISOString(),hash).run();
  return json({id},201);
 } catch {return json({error:'Your request was not confirmed. Please try again; you will not be charged.'},503);}
}
export {owner};
