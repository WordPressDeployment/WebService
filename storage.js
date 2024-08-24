const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql'), {escape,escapeId}=require('./sqlstring')
const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}, cache=new Map(), states=new Map(), state_headers=new Map()
//cylia.songs_v18
//song_id,title,artist,album,track_no,length,date,genre,isrc,rejected,fingerprinted,file_sha1,song_feats,feats_logged,max_dB

//deviceEventLogs.[some_sysUUID]
//eventIndex,sourceTimestamp,recogTimestamp,sourceIndex,song_id,tm,tc,fm,fc,fMSE,tMSE,tinliers,finliers,samplePeriod,score,db,version,isNew

//deviceEventSummaryLogs.[some_sysUUID]
//eventIndex,sysUUID,song_id,score,timestamp,duration,delta
//deviceEventSummaryLogs also has a songGroups table which seems to be aggregated data from the rest of tables but less attributes per record
//songGroups has sg_index,summary_eventIndex,songID,sysUUID

let connection=DB_CLIENT.createConnection(db_opts)
connection.connect()
connection.on('error',function(){
  connection=DB_CLIENT.createConnection(db_opts)
  connection.connect()
  connection.on('error',arguments.callee)
})

async function query(q){
  let resolve=null, p=new Promise(r=>resolve=r)
  connection.query(q,function(err,result){
    if(err)  console.log(err);
    resolve(err? []: result)
  }) //soft error handling because yes
  return await p
}
function eventQueryString(id,start,end){
  //let sql_start=new Date(start).toISOString().replace('T', ' ').replace('Z', '')
  id = escapeId(id)
  let sql_end=new Date(end).toISOString().replace('T', ' ').replace('Z', '')
  let sql_start=`SELECT MAX(timestamp) from deviceEventSummaryLogs.${id} where timestamp <= '${sql_end}'`
  //return `select * from ${id} where sourceTimestamp between '${sql_start}' and '${sql_end}';`
  return `SELECT ds.eventIndex as eventIndex, ds.song_id as song_id, ds.sourceIndex as sourceIndex, ds.sourceTimestamp as sourceTimestamp, ds.recogTimestamp as recogTimestamp, s.title as title, s.artist as artist, s.album as album, s.genre as genre, (tinliers/6*finliers/50) as score FROM deviceEventLogs.${id} as ds JOIN cylia.songs_v18 as s on s.song_id=ds.song_id WHERE sourceTimestamp BETWEEN (${sql_start}) and '${sql_end}' ORDER BY ds.sourceTimestamp DESC;`
}
function summaryQueryString(id,start,end){
  id = escapeId(id)
  let sql_start=new Date(start).toISOString().replace('T', ' ').replace('Z', '')
  let sql_end=new Date(end).toISOString().replace('T', ' ').replace('Z', '')
  //return `select * from ${id} where timestamp between '${sql_start}' and '${sql_end}';`
  return `SELECT ds.eventIndex as eventIndex, ds.sysUUID as sysUUID, ds.song_id as song_id, ds.score as score, ds.timestamp as timestamp, s.title as title, s.artist as artist, s.album as album, s.genre as genre, (ds.duration*ds.delta) as seconds FROM deviceEventSummaryLogs.${id} as ds JOIN cylia.songs_v18 as s on s.song_id=ds.song_id WHERE  timestamp BETWEEN '${sql_start}' and '${sql_end}' ORDER BY ds.timestamp DESC limit 20;`
}
function stateQuery(id){
  id = escape(id)
  return `select * from devices.stateActivity where sourceTimestamp >= now(6) - interval 5 minute and sysUUID=${id};`
}
function parseTimes(time_range){
  if(!time_range) return [0,0];
  const times=time_range.split(';')
  if(times.length!==2) return [0,0];
  return times.map(Number)
}
async function update(record,key){
  const [box_id,time_range]=JSON.parse(key)
  const [start,end]=parseTimes(time_range)
  const events=await query(eventQueryString(box_id,start,end))
  const summaries=await query(summaryQueryString(box_id,start,end))
  if(!record.events) console.log(eventQueryString(box_id,start,end));
  if(!record.summaries) console.log(summaryQueryString(box_id,start,end));
  for(let i=0;i<events.length;i++){
    if(events[i].sourceTimestamp < events[0].sourceTimestamp){
      //the query gives everything in the event after the last summary
      //however from that, only those with the latest sourceTimestamp are required
      events.length=i;
      break;
    }
    events[i].sourceTimestamp -= 0; //convert date value to long int
    events[i].recogTimestamp -= 0; //convert date value to long int
  }
  summaries.reverse()
  for(let i=0;i<summaries.length;i++) summaries[i].timestamp-=0;
  record.events = events;
  record.summaries = summaries;
  if(end<=Date.now()) record.state={offline:true}; //claim it is offline if the event isn't current
  else record.state=(await query(stateQuery(box_id)))[0] || {offline:true}; //query exists or assumed offline
  return record
}
async function update_states(record,id){
  if(id.includes(';')) return null; //do nothing (not a specific id)
  let temp=await query(stateQuery(id))
  for(let i=0;i<temp.length;i++) record[i]=temp[i];
  record.length=temp.length;
  return record;
}
setInterval(function(){
  cache.forEach(update)
  states.forEach(update_states)
},4e3) //cached items updated every 4 seconds

async function get_box_info(box_id,time_range){
  //console.log({box_id,time_range})
  if(!box_id || !time_range) return {}; //nothing returned when nothing is asked for
  if(!box_id.startsWith('mCylia-')) return {}; //box-id validation
  let [start,end]=time_range.split(';')
  if(!start || !end) return {};
  if(isNaN(start) || isNaN(end)) return {};
  if(Number(start)>=Number(end)) return {};
  //console.log({box_id,times: parseTimes(time_range).map(a=>new Date(a).toGMTString()) }) //show everything
  let key=JSON.stringify([box_id,time_range]), record=cache.get(key)
  if(record) return record;
  record=await update({},key)
  //console.log(record)
  cache.set(key,record)
  return record
}
async function get_state_info(header){
  //console.log({listing:header}) //listing
  if(state_headers.has(header)) return state_headers.get(header);
  const ids=header.split(';'), state_info=Array(ids.length);
  //if(ids.some(header=>!header.startsWith('mCylia-'))) return {state_info}; //sysUUID validation
  for(let i=0;i<ids.length;i++){
    if(!(ids[i].startsWith('mCylia-'))){
      state_info[i]=[];
      continue; //individual row sysUUID validation instead for now
    }
    let record=states.get(ids[i])
    if(!record){
      record=await update_states([],ids[i])
      states.set(record,ids[i])
    }
    state_info[i]=record
  }
  const events={state_info}
  state_headers.set(header,events)
  return events
}
module.exports={get_box_info,get_state_info}
