const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql')
const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}, boxes={}

const deviceEventLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventLogs'})
deviceEventLogs.connect() //eventIndex,sourceTimeStamp,recogTimeStamp,sourceIndex,song_id,tm,tc,fm,fc,fMSE,tMSE,tinliers,finliers,samplePeriod,score,db,version,isNew
const deviceEventSummaryLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventSummaryLogs'})
deviceEventSummaryLogs.connect() //eventIndex,sysUUID,song_id,score,timestamp,duration,delta
//deviceEventSummaryLogs also has a songGroups table which seems to be aggregated data from the rest of tables but less attributes per record
//songGroups has sg_index,summary_eventIndex,songID,sysUUID

async function query(q,db){
  let resolve=null, p=new Promise(r=>resolve=r)
  db.query(q,function(err,result){resolve(err?[]:result)}) //soft error handling because yes
  return await p
}
async function loadBoxes(){
  (await query('show tables',deviceEventLogs))
  .map(obj=>Object.values(obj)[0]).filter(text=>text.startsWith('mCylia'))
  .forEach(async function(id){
    boxes[id]={
      events:await query('select * from `'+id+'`',deviceEventLogs),
      summaries:await query('select * from `'+id+'`',deviceEventSummaryLogs)
    }
  })
}
loadBoxes()
setInterval(loadBoxes,2e3) //check for new data every 60 seconds

function get_user_boxes(box_id){
  return boxes[box_id]
}
module.exports=get_user_boxes