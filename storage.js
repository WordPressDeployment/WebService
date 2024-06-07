//is a simulation right now but will handle communication with the database
const simulation_data = {}
setInterval(function simulate_changes(){
  let id=Math.floor(  Math.random()*Object.keys(simulate_data).length  )
  let box=simulation_data[id]
  if(Math.random()<0.5) box.online=!box.online; //flip online presence, 50% chance
},2e3)
function get_boxes(data){
  //data is the header value
  const mcylia_boxes = data.split(';').map(id=>simulation_data[id])
  return mcylia_boxes
}
module.exports=get_boxes