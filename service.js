const create_server=require('./create_server.js'), {get_user_boxes,all}=require('./storage.js')
const {serve}=require('webject'), {AUTH_HEAD,AUTH_VALUE,ADMIN_ROUTE,ADMIN_TOKEN}=process.env //as for now, admin route is unused
let webject=null, fs=require('node:fs'), html=fs.readFileSync('iframe.html'), admin=fs.readFileSync('admin.html')

const server=create_server(async function(req,res){
  res.setHeader('Content-Type','text/html')
  if(webject.authTokens[decodeURIComponent(req.url.substring(1))]) return res.end(html); //for one user
  if(req.url.substring(1)===(ADMIN_ROUTE)) return res.end(admin); //for admin -------------
  if(req.headers[AUTH_HEAD]!==AUTH_VALUE) return res.end(""); //authentication barrier for creating new tokens
  const boxes=await get_user_boxes(req.headers['mcylia-user'])
  return res.end(webject.addToken(1,boxes)) //so to access the link, it'd be webservice_site/what_was_returnedhere
},8080)

webject=serve(all,server)
webject.addToken(1,all,(ADMIN_TOKEN)) //admin token to see all boxes ---------------
webject.addListener("connect",function(ev){
  clearTimeout(ev.token._inactive)
  ev.lock()
})
webject.addListener("disconnect",function(ev){
  ev.token._inactive=setTimeout(_=>webject.endToken(ev.token.authToken),2e4) //after 20 seconds, token is revoked
  ev.unlock()
})