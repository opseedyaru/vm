var exec=require('child_process').exec;
var file_exist=fn=>{try{require('fs').accessSync(fn);return true;}catch(e){return false;}}
var fn="fast_unsafe_auto_restart_enabled.txt";
exec("echo created inside mainloop.js>"+fn);
for(;;){
  exec("node main.js")
  if(!file_exist(fn))break;
}
