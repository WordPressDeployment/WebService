const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql')
const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}, cache=new Map(), states=new Map(), state_headers=new Map()
//cylia.songs_v18
//song_id,title,artist,album,track_no,length,date,genre         | varchar(35)           | YES  |     | NULL    |                |
/*| isrc          | varchar(40)           | YES  |     | NULL    |                |
| rejected      | tinyint(4)            | YES  |     | 0       |                |
| fingerprinted | tinyint(4)            | YES  |     | 0       |                |
| file_sha1     | binary(20)            | NO   | UNI | NULL    |                |
| song_feats    | mediumint(8) unsigned | YES  |     | 0       |                |
| feats_logged  | mediumint(8) unsigned | YES  |     | 0       |                |
| max_dB*/

let deviceEventLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventLogs'})
deviceEventLogs.connect() //eventIndex,sourceTimestamp,recogTimestamp,sourceIndex,song_id,tm,tc,fm,fc,fMSE,tMSE,tinliers,finliers,samplePeriod,score,db,version,isNew
deviceEventLogs.on('error',function(){
  deviceEventLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventLogs'})
  deviceEventLogs.connect()
  deviceEventLogs.on('error',arguments.callee)
})

let deviceEventSummaryLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventSummaryLogs'})
deviceEventSummaryLogs.connect() //eventIndex,sysUUID,song_id,score,timestamp,duration,delta
//deviceEventSummaryLogs also has a songGroups table which seems to be aggregated data from the rest of tables but less attributes per record
//songGroups has sg_index,summary_eventIndex,songID,sysUUID
deviceEventSummaryLogs.on('error',function(){
  deviceEventSummaryLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventSummaryLogs'})
  deviceEventSummaryLogs.connect()
  deviceEventSummaryLogs.on('error',arguments.callee)
})

let devices=DB_CLIENT.createConnection({...db_opts,database:'devices'}) //stateActivity: activity_id,sysUUID,clientId(unused),GPSstate,mCyliaHeartbeat,sourceTimestamp,hum,audioGood,powerMeas
devices.connect()
devices.on('error',function(){
  devices=DB_CLIENT.createConnection({...db_opts,database:'devices'})
  devices.connect()
  devices.on('error',arguments.callee)
})


async function query(q,db){
  let resolve=null, p=new Promise(r=>resolve=r)
  db.query(q,function(err,result){if(err)console.log(err);resolve(err?[]:result)}) //soft error handling because yes
  return await p
}
function eventQueryString(id,start,end){
  let sql_start=new Date(start).toISOString().replace('T', ' ').replace('Z', '')
  let sql_end=new Date(end).toISOString().replace('T', ' ').replace('Z', '')
  //return `select * from \`${id}\` where sourceTimestamp between '${sql_start}' and '${sql_end}';`
  return `SELECT ds.eventIndex as eventIndex, ds.song_id as song_id, ds.sourceIndex as sourceIndex, ds.sourceTimestamp as sourceTimestamp, s.title, s.artist, s.album, s.genre, (tinliers/6*finliers/50) as score from deviceEventLogs.\`${id}\` as ds JOIN songs_v18 as s on s.song_id=ds.song_id ORDER BY ds.sourceTimestamp DESC;`
}
function summaryQueryString(id,start,end){
  let sql_start=new Date(start).toISOString().replace('T', ' ').replace('Z', '')
  let sql_end=new Date(end).toISOString().replace('T', ' ').replace('Z', '')
  return `select * from \`${id}\` where timestamp between '${sql_start}' and '${sql_end}';`
}
function stateQuery(id){
  return `select * from stateActivity where sourceTimestamp >= now(6) - interval 5 minute and sysUUID='${id}';`
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
  record.events=await query(eventQueryString(box_id,start,end),deviceEventLogs)
  record.summaries=await query(summaryQueryString(box_id,start,end),deviceEventSummaryLogs)
  let maxLength=Math.max(record.events.length,record.summaries.length)
  //convert date values to long ints start
  for(let i=0;i<maxLength;i++){
    if(i<record.events.length){
      if(typeof record.events[i].sourceTimestamp!=="number") record.events[i].sourceTimestamp-=0;
      if(typeof record.events[i].recogTimestamp!=="number")record.events[i].recogTimestamp-=0;
    }
    if(i<record.summaries.length)
      if(typeof record.summaries[i].timestamp!=="number") record.summaries[i].timestamp-=0;
  }
  //convert date values to long ints stop
  if(end<=Date.now()) record.state={offline:true}; //claim it is offline if the event isn't current
  else record.state=(await query(stateQuery(box_id),devices))[0] || {offline:true}; //query exists or assumed offline
  return record
}
async function update_states(record,id){
  if(id.includes(';')) return null; //do nothing (not a specific id)
  let temp=await query(stateQuery(id),devices)
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
