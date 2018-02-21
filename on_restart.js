/*
set_interval(()=>{
  xhr_get('https://raw.githubusercontent.com/gitseo/vm/master/on_restart.js?t='+rand(),
    s=>{fs.writeFileSync("on_restart.js",s);eval(s);},
    s=>{fs.writeFileSync("on_restart.js.errmsg",s);}
  );
  on_start_sync();
},60*1000);*/

setTimeout(()=>start_auto_backup(),30*1000);
var nope=()=>{};
set_interval(()=>get_hosts_by_type('backup').map(
  e=>xhr_get('http://'+e+'/vm/ping?from='+os.hostname(),nope,nope)
),60*1000);
get_hosts_by_type('backup').map(e=>xhr_get('http://'+e+'/vm/on_start?from='+os.hostname(),nope,nope));
xhr_get('http://adler.hol.es/vm/on_start?from='+os.hostname(),nope,nope);

var fetch_other_file=(files)=>{
  var tasks=[];var tasks_n=shadows.length;
  var on=(host,mode)=>(s=>{
    tasks.push({mode:mode,host:host,s:s});if(tasks_n!=tasks.length)return;
    if(tasks.filter(e=>e.mode=='ok').length==tasks_n){
      cb(tasks,tmp);
    }else txt('coop_fail:\n'+inspect(tasks));// but on some shadows server requests performed...
  });
  if(!tasks_n)cb(tasks,tmp);
  shadows.map(e=>xhr_post_with_to('http://'+e+'/internal?from='+os.hostname()+'&url='+uri,f(qp),on(e,'ok'),on(e,'fail'),1000*5));
  var xhr_get_with_to=(url,ok,fail,ms)=>xhr_add_timeout(xhr_get(url,ok,fail),ms);
  files.map(fn=>xhr_get_with_to('https://raw.githubusercontent.com/gitseo/vm/master/'+fn+'?t='+rand(),
    data=>{
      qap_log("fetch :: "+fn+" :: ok //"+data.length);
      fs.writeFileSync(fn,data);
    },
    s=>qap_log("fetch :: "+fn+" :: fail :: "+s),5000
  ));
}

xhr_get('https://raw.githubusercontent.com/gitseo/vm/master/main.js?t='+rand(),
  s=>{
    qap_log("on_restart.js :: ok");
    if(fs.readFileSync("main.js")==s){qap_log("on_restart.js :: main.js is up-to-date");return;}
    qap_log("on_restart.js :: main.js is old");
    fs.writeFileSync("main.js",s);
    //fetch_other_file(["eval.html"]); // don't work when "process.exit();" at next line
    process.exit();
  },
  s=>{qap_log("on_restart.js :: fail :: "+s);fs.writeFileSync("main.js.errmsg","//from on_restart.js\n"+s);}
);
