if(!('sure' in qp))return 'sure in qp required';
//clear_interval(g_intervals[4]);
//return inspect(g_intervals);
//return set_interval+"";
//return ""+g_wmlog_iter;
g_wmlog_iter=0;
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
