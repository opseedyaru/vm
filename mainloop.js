var exec=require('child_process').execSync;
var file_exist=fn=>{try{require('fs').accessSync(fn);return true;}catch(e){return false;}}
var fn="fast_unsafe_auto_restart_enabled.txt";
exec("echo created inside mainloop.js>"+fn);
for(var i=1;i;i++){
  console.log('mainloop::iter = '+i);
  console.log(exec("node main.js")+"");
  if(!file_exist(fn))break;
}
console.log('mainloop::end');
