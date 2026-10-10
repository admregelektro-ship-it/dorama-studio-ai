'use strict';
let cloudSaveQueue=Promise.resolve();
function syncProject(){
  if(!sessionUser||!current)return Promise.resolve();
  snapshotSeason();
  const live=current,project=DoramaStore.clone(current),userId=sessionUser.id;
  if(project.cloudOwnerId&&project.cloudOwnerId!==userId)return Promise.reject(Error('Este projeto pertence a outra conta. Abra um projeto da conta atual antes de sincronizar.'));
  const task=cloudSaveQueue.catch(()=>{}).then(async()=>{
    if(sessionUser?.id!==userId)throw Error('A conta mudou. Sincronização cancelada.');
    // The same live project may have obtained its cloud ID from an earlier queued save.
    project.cloudId=live.cloudId||project.cloudId;
    project.cloudOwnerId=userId;
    const payload={user_id:userId,title:project.title,premise:project.idea||'',genre:project.genre,country:project.country,tone:project.tone,rating:project.rating,episode_count:project.n,episode_duration:parseInt(project.duration)||null,ending_style:project.ending,synopsis:project.synopsis,visual_style:project.visualStyle||null,poster_url:project.posterUrl||null,status:'active',metadata:project};
    const result=project.cloudId?await sb.from('doramas').update(payload).eq('id',project.cloudId).eq('user_id',userId).select('id').single():await sb.from('doramas').insert(payload).select('id').single();
    if(result.error)throw result.error;
    project.cloudId=result.data.id;live.cloudId=result.data.id;live.cloudOwnerId=userId;
    // Metadata is the full-fidelity source. Legacy tables remain compatible and no rows are deleted.
    const existing=await sb.from('characters').select('id,name').eq('dorama_id',project.cloudId).eq('user_id',userId);
    if(existing.error)throw existing.error;
    for(const [i,c] of (project.characters||[]).entries()){
      const matches=(existing.data||[]).filter(row=>row.name===c.name);
      if(matches.length>1)continue; // Preserve ambiguous legacy rows rather than guessing an identity.
      const fields={dorama_id:project.cloudId,user_id:userId,name:c.name,role:c.role||null,personality:c.bio||null,visual_identity:c.visual?.identity||null,wardrobe:c.visual?.style||null,portrait_url:c.imageUrl||null,sort_order:i};
      const res=matches.length?await sb.from('characters').update(fields).eq('id',matches[0].id).eq('user_id',userId):await sb.from('characters').insert(fields);
      if(res.error)throw res.error;
    }
    const season1=project.seasons?.['1'];
    const eps=(season1?.episodes||[]).map(e=>({dorama_id:project.cloudId,user_id:userId,episode_number:e.number,title:e.title||null,summary:e.summary||null,scenes:e.script?.scenes||[],cliffhanger:e.script?.hook||null,status:e.script?'completed':'planned'}));
    if(eps.length){const res=await sb.from('episodes').upsert(eps,{onConflict:'dorama_id,episode_number'});if(res.error)throw res.error;}
    if(season1){const res=await sb.from('story_memory').upsert({dorama_id:project.cloudId,user_id:userId,facts:season1.memory||[],timeline:(season1.episodes||[]).filter(e=>e.script).map(e=>({episode:e.number,summary:e.summary,cliffhanger:e.script.hook||null}))},{onConflict:'dorama_id'});if(res.error)throw res.error;}
    // Persist the live state, not the older snapshot sent to the server.
    DoramaStore.save(localStorage,live);
  });
  cloudSaveQueue=task;return task;
}
async function loadCloudProjects(){
  renderSavedLocalOnly();if(!sessionUser)return;
  const userId=sessionUser.id;
  const {data,error}=await sb.from('doramas').select('id,title,genre,episode_count,updated_at').eq('user_id',userId).order('updated_at',{ascending:false}).limit(100);
  if(sessionUser?.id!==userId)return;
  if(error){notify('Projetos locais disponíveis. Nuvem indisponível: '+error.message);return;}
  const heading=document.createElement('p');heading.className='label';heading.textContent='NA NUVEM';by('saved').append(heading);
  for(const p of data||[]){const button=document.createElement('button');button.className='project-button';const title=document.createElement('strong'),description=document.createElement('span');title.textContent=p.title;description.textContent=(p.genre||'Dorama')+' · '+p.episode_count+' episódios · nuvem';button.append(title,description);button.onclick=()=>loadCloudProject(p.id).catch(e=>notify('Falha ao abrir: '+e.message));by('saved').append(button);}
}
