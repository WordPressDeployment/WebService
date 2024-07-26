const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql')
const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}, cache=new Map(), states=new Map(), state_headers=new Map()

let deviceEventLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventLogs'})
deviceEventLogs.connect() //eventIndex,sourceTimeStamp,recogTimeStamp,sourceIndex,song_id,tm,tc,fm,fc,fMSE,tMSE,tinliers,finliers,samplePeriod,score,db,version,isNew
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
  return `select * from \`${id}\` where sourceTimestamp between '${sql_start}' and '${sql_end}';`
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
  return time_range.split(';').map(Number)
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
  if(end<=Date.now()) record.state={offline:true};
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
  //console.log({box_id,time_range}) //show everything
  if(!box_id || !time_range) return {}; //nothing returned when nothing is asked for
  if(!box_id.startsWith('mCylia-')) return {}; //box-id validation
  let [start,end]=time_range.split(';')
  if(!start || !end) return {};
  if(Number(start)>=Number(end)) return {};
  let key=JSON.stringify([box_id,time_range]), record=cache.get(key)
  if(record) return record;
  record=await update({},key)
  cache.set(key,record)
  return record
}
async function get_state_info(header){
  //console.log(header)
  if(state_headers.has(header)) return state_headers.get(header);
  const ids=header.split(';'), state_info=Array(ids.length);
  if(ids.some(header=>!header.startsWith('mCylia-'))) return {state_info}; //sysUUID validation
  for(let i=0;i<ids.length;i++){
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
