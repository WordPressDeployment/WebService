//is a simulation right now but will handle communication with the database
//const {DB_URL,DB_USER,DB_PASS}=process.env, DB_CLIENT=require('mysql')
//const db_opts={host:DB_URL,user:DB_USER,password:DB_PASS}
//const deviceEventLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventLogs'})
//const deviceEventSummaryLogs=DB_CLIENT.createConnection({...db_opts,database:'deviceEventSummaryLogs'})
const simulation_boxes={mcylia_abcd:{online:false}}
const simulation_users={undefined: {metadata:"whocares",boxes:{mcylia_abcd:simulation_boxes.mcylia_abcd}} }
const all={simulation_boxes,simulation_users}
setInterval(function simulate_changes(){
  let keys=Object.keys(simulation_boxes), id=keys[ Math.floor(Math.random()*keys.length) ]
  let box=simulation_boxes[id]
  if(Math.random()<0.5) box.online=!box.online; //flip online presence, 50% chance
},2e3)
function get_user_boxes(user_id){
  return simulation_users[user_id].boxes
}
module.exports={get_user_boxes,all}