const create_server=require('./create_server.js'), get_user_boxes=require('./storage.js')
const {serve}=require('webject'), {AUTH_HEAD,AUTH_VALUE}=process.env //as for now, admin route is unused
let webject=null, fs=require('node:fs'), html=fs.readFileSync('iframe.html')

const server=create_server(async function(req,res){
  res.setHeader('Content-Type','text/html')
  if(webject.authTokens[decodeURIComponent(req.url.substring(1))]) return res.end(html); //for one user
  if(req.headers[AUTH_HEAD]!==AUTH_VALUE) return res.end(""); //authentication barrier for creating new tokens
  const boxes=await get_user_boxes(req.headers['mcylia-box'])
  const token=webject.addToken(1,boxes)
  webject.authTokens.get(token)._inactive=setTimeout(_=>webject.endToken(token),5e3)
  //after 5 seconds without connecting, token is revoked
  return res.end(token) //so to access the link, it'd be webservice_site/what_was_returnedhere
},8080)

webject=serve({},server)
webject.addListener("connect",function(ev){
  clearTimeout(ev.token._inactive)
  ev.lock()
})
webject.addListener("disconnect",function(ev){
  ev.token._inactive=setTimeout(_=>webject.endToken(ev.token.authToken),5e3)
  //after 5 seconds without connecting, token is revoked
  ev.unlock()
})
