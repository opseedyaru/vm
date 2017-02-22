var exec=require('child_process').execSync;
var file_exist=fn=>{try{require('fs').accessSync(fn);return true;}catch(e){return false;}}
var fn="fast_unsafe_auto_restart_enabled.txt";
exec("echo created inside mainloop.js>"+fn);
var need_restart=true;
var do_restart()=>need_restart=true;
var iter=0;
var mainloop=setInterval(()=>{
  if(!need_restart)return;
  need_restart=false;
  if(!file_exist(fn)){console.log('mainloop::end');return clearInterval(mainloop);}
  iter++;
  console.log('mainloop::iter = '+iter);
  require('child_process').spawn("node",["main.js"],{stdio:"inherit"}).on('close',do_restart).on('error',do_restart);
},1000);
