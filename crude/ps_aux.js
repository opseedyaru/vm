var pu=hack_require('pidusage');if(!pu)return "wait a bit";
var es=s=>execSync(s)+"";
var r=response;resp_off();
var arr=es('pgrep '+json('expr' in qp?qp.expr:"")).split("\n").filter(e=>e.length);

var safe_get=pid=>{
  try{
    return fs.readFileSync("/proc/"+pid+"/cmdline").toString('binary').split("\0").join(" ").trim();
  }catch(e){
    return "... look like bug ...";
  }
};
var g=m=>mapkeys(m).map(pid=>{
  var t=m[pid];if(!t)return {};
  t.cmd=safe_get(pid);
  t.elapsed=toHHHMMSS(t.elapsed/1000);
  t.timestamp=getDateTime(new Date(t.timestamp));
  return t;
});
var f=1?obj=>jstable(obj):s=>txt(inspect(s));
return pu(arr,(err,obj)=>f(g(obj)));