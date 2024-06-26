const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql')
const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}, boxes={}

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
  db.query(q,function(err,result){resolve(err?[]:result)}) //soft error handling because yes
  return await p
}
function queryString(id){
  return 'select * from `'+id+'` where eventIndex=(select MAX(eventIndex) from `'+id+'`);'
}
function rfidQuery(id){
  return `select state, timestamp from rfidActivity where sysUUID = '${id}' and activity_id =
  (select MAX(activity_id) from devices.rfidActivity where sysUUID = '${id}');`
}
async function loadBoxes(){
  (await query('show tables',deviceEventLogs))
  .map(obj=>Object.values(obj)[0]).filter(text=>text.startsWith('mCylia'))
  .forEach(async function(id){
    boxes[id]={
      events:await query(queryString(id),deviceEventLogs),
      summaries:await query(queryString(id),deviceEventSummaryLogs),
      rfid:(await query(rfidQuery(id),devices))[0] //state: "powered on" or "waiting"
      //rfid object queued
    }
  })
}
loadBoxes()
setInterval(loadBoxes,1e4) //check for new data every 10 seconds

function get_user_boxes(box_id,time_range){
  return boxes[box_id]||Object.values(boxes)[0]
}
module.exports=get_user_boxes
