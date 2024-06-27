const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql')
const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}, cache=new Map()

const deviceEventLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventLogs'})
deviceEventLogs.connect() //eventIndex,sourceTimeStamp,recogTimeStamp,sourceIndex,song_id,tm,tc,fm,fc,fMSE,tMSE,tinliers,finliers,samplePeriod,score,db,version,isNew
const deviceEventSummaryLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventSummaryLogs'})
deviceEventSummaryLogs.connect() //eventIndex,sysUUID,song_id,score,timestamp,duration,delta
//deviceEventSummaryLogs also has a songGroups table which seems to be aggregated data from the rest of tables but less attributes per record
//songGroups has sg_index,summary_eventIndex,songID,sysUUID
const devices=DB_CLIENT.createConnection({...db_opts,database:'devices'}) //rfidActivity: activity_id,UUID(unused),sysUUID,clientId(unused),state,timestamp
devices.connect()
//third db queued

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
function rfidQuery(id){
  return `select state, timestamp from rfidActivity where sysUUID = '${id}' and activity_id =
  (select MAX(activity_id) from devices.rfidActivity where sysUUID = '${id}');`
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
      record.events[i].sourceTimestamp-=0
      record.events[i].recogTimestamp-=0
    }
    if(i<record.summaries.length) record.summaries[i].timestamp-=0;
  }
  //convert date values to long ints stop
  record.rfid=(await query(rfidQuery(box_id),devices))[0] //state: "powered on" or "waiting"
  //console.log(JSON.stringify(record).length)
  return record
}
setInterval(function(){ cache.forEach(update) },4e3) //cached items updated every 4 seconds

function get_box_info(box_id,time_range){
  const key=JSON.stringify([box_id,time_range]), record=cache.get(key)
  if(record) return record;
  return update({},key) //promise returned, this is awaited in service.js
}
module.exports=get_box_info
