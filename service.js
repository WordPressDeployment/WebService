const create_server=require('./create_server.js'), {get_box_info,get_state_info}=require('./storage.js')
const {serve}=require('webject'), {AUTH_HEAD,AUTH_VALUE}=process.env //as for now, admin route is unused
let webject=null, fs=require('node:fs'), html=fs.readFileSync('iframe.html')
function ATOB(data){
  try{return atob(data)}
  catch{return ""}
}

const server=create_server(async function(req,res){
  //console.log('I got pinged')
  //if(req.headers['state_activity']||req.headers['mcylia-box']) console.log(req.headers);
  res.setHeader('Content-Type','text/html')
  const iframe_token=ATOB(req.url.substring(1))
  if( webject.authTokens.get(iframe_token) ){
    clearTimeout( webject.authTokens.get(iframe_token)._inactive )
    return res.end(html); //for one user
  }
  if(req.headers[AUTH_HEAD.toLowerCase()]!==AUTH_VALUE) return res.end(""); //authentication barrier for creating new tokens
  const data=req.headers['state_activity']?
    await get_state_info(req.headers['state_activity']):
    await get_box_info(req.headers['mcylia-box'],req.headers['start-and-end'])
  //console.log(Object.keys(data),req.headers) //to toggle commented line for testing
  const token=webject.addToken(1,data)
  webject.authTokens.get(token)._inactive=setTimeout(_=>webject.endToken(token),1e4)
  //after 10 seconds without connecting, token is revoked
  return res.end(btoa(token)) //so to access the link, it'd be webservice_site/what_was_returnedhere
},8080)

webject=serve({},server)
webject.addListener("connect",function(ev){
  clearTimeout(ev.token._inactive)
  ev.lock()
})
webject.addListener("disconnect",function(ev){
  ev.unlock()
  ev.token._inactive=setTimeout(_=>webject.endToken(ev.token.authToken),1e4)
  //after 10 seconds without reconnecting, token is revoked
})

/*//ngrok block start
const ngrok=require('ngrok');
ngrok.connect(8080).then(console.log);
//ngrok block stop*/
