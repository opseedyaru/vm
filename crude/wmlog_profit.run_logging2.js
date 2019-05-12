if('log' in qp){
  return (fs.readFileSync("mainloop.log")+"").split("\n").filter(e=>e.includes("by_timer")).join("\n");
}
if('read' in qp){
  //exec_post_data();
  //return jstable+"";
  var arr=(execSync("echo wmlog_profit/*.txt")+"").slice(0,-1).split(" ");
  var with_spoiler=s=>{var d="...";var u=e=>d+"spoiler_"+e+"_"+d;return u("beg")+s+u("end");}
  arr=arr.map(fn=>{
    var s=fs.readFileSync(fn)+"";
    if(!s.length)return "not found - "+fn;
    var p=JSON.parse(s).paths[0][0];
    return {wmpath:p.path,inp:p.inp,out:p.out,fn:fn,time:""+execSync('date -r '+fn+' "+%Y.%m.%d %H:%M:%S"')/*,p:with_spoiler(inspect(p))*/};
  });
  return jstable(arr);
}
if(('test' in qp)){
  return txt(fn);
}
if(!('sure' in qp)){
  var arr="menu,test,read,log,sure".split(",");
  var cfn="./c/"+s.slice("./crude/".length);
  return html(links2table(
    arr.map(e=>cfn+'?&'+e))
  );
  //return 'sure in qp required';
}
//clear_interval(g_intervals[4]);
//return inspect(g_intervals);
//return set_interval+"";
//return ""+g_wmlog_iter;
g_wmlog_iter=1000;
var doit=()=>{
  g_wmlog_iter++;
  var go=e=>{
    var p=JSON.parse(e).paths[0][0];
    qap_log("wmlog_by_timer: "+json({wmpath:p.path,inp:p.inp,out:p.out,iter:g_wmlog_iter}));
    if(p.inp<p.out){
      execSync("mkdir -p wmlog_profit");
      fs.writeFileSync("wmlog_profit/win_"+g_wmlog_iter+".txt",e);
    }
    //txt(inspect(p));
  }
  xhr_get("http://vm51.herokuapp.com/c/wmlog.js?profit",go,txt);
};
//resp_off();doit();
set_interval(doit,1000*90);
return POST.code;
