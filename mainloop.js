var child_process=require('child_process');
var exec=child_process.execSync;
var safe_spawn=(cmd,args)=>child_process.spawn(cmd,args,{stdio:"inherit"});
var safe_spawn_with_cb=(cmd,args,cb)=>{
  var proc=safe_spawn(cmd,args);
  proc.on('close',code=>{qap_log("\nchild process exited with code "+code);cb();});
  proc.on('error',err=>{qap_log("\n"+err+"\n");cb();});
}
var qap_log=s=>console.log("["+getDateTime()+"] "+s);
function getDateTime() {
  var now     = new Date(); 
  var year    = now.getFullYear();
  var f=v=>(v.toString().length==1?'0':'')+v;
  var month   = f(now.getMonth()+1); 
  var day     = f(now.getDate());
  var hour    = f(now.getHours());
  var minute  = f(now.getMinutes());
  var second  = f(now.getSeconds()); 
  var dateTime = year+'.'+month+'.'+day+' '+hour+':'+minute+':'+second;   
  return dateTime;
}
var file_exist=fn=>{try{require('fs').accessSync(fn);return true;}catch(e){return false;}}
var fn="fast_unsafe_auto_restart_enabled.txt";
exec("echo created inside mainloop.js>"+fn);
var need_restart=true;
var do_restart=()=>need_restart=true;
var iter=0;
var mainloop=setInterval(()=>{
  if(!need_restart)return;
  need_restart=false;
  if(!file_exist(fn)){qap_log('mainloop::end');return clearInterval(mainloop);}
  iter++;
  exec('echo "'+iter+'">mainloop_iter.txt');
  qap_log('mainloop::iter = '+iter);
  safe_spawn_with_cb("node",["main.js"]);
},500);
