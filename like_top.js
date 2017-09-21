var child_process=require('child_process');
var execSync=child_process.execSync;

var f=()=>{
  var s=execSync("ps -eo user,pid,pcpu,pmem,vsz,rss,stat,ni,start_time,cputime,cmd")+"";
  var a=s.split("\n");
  var arr=a.map(e=>e.replace(/  +/g,' ').split(" ")).filter(e=>e.length>9).filter(e=>!e.includes("<defunct>"));
  var u=v=>(v/1024).toFixed(2)+" MB";
  arr.map((e,i)=>{if(!i)return e;e[4]=u(e[4]|0);e[5]=u(e[5]|0);});
  var len=[0,0,0,0,0,0,0,0,0,0];
  arr.map((e,i)=>{if(!i)len.length=e.length;e.map((s,j)=>len[j]=Math.max(s.length,len[j]));});
  var pad=(s,len)=>("                ".substr(0,len-s.length)+"   "+s);
  arr=arr.map((e,i)=>{return e.map((e,j)=>j>9?e:pad(e,len[j]));});
  return arr.map(e=>typeof e.join!="function"?e:e.join(" ")).join("\n")+"\n\n"/*+execSync("tail mainloop.log -n 20")*/;
};
var win7=false;
if(win7)
{
  var q=b=>process.stdout.write(b);
  var cls="";
  return q(cls+f());
}
var q=b=>process.stdout.write(b);
var cls=execSync("clear");
setInterval(()=>{q(cls+f());},330);

var set_raw_mode=s=>{if('setRawMode' in s)s.setRawMode(true);}
set_raw_mode(process.stdin);
process.stdin.setEncoding('utf8');
process.stdin.on('data',data=>{process.exit();});
