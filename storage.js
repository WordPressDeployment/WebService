//is a simulation right now but will handle communication with the database
const simulation_boxes={}, simulation_users={}, all={simulation_boxes,simulation_users}
setInterval(function simulate_changes(){
  let id=Math.floor(  Math.random()*Object.keys(simulate_data).length  )
  let box=simulation_boxes[id]
  if(Math.random()<0.5) box.online=!box.online; //flip online presence, 50% chance
},2e3)
function get_user_boxes(user_id){
  return simulation_users[user_id]
}
module.exports={get_user_boxes,all}