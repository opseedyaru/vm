setTimeout(()=>start_auto_backup(),30*1000);
var nope=()=>{};
set_interval(()=>get_hosts_by_type('backup').map(
  e=>xhr_get('http://'+e+'/vm/ping?from='+os.hostname(),nope,nope)
),60*1000);
get_hosts_by_type('backup').map(e=>xhr_get('http://'+e+'/vm/on_start?from='+os.hostname(),nope,nope));
xhr_get('http://adler.hol.es/vm/on_start?from='+os.hostname(),nope,nope);

var fetch_other_file=()=>["eval.html"].map(fn=>xhr_get('https://raw.githubusercontent.com/gitseo/vm/master/'+fn+'?t='+rand(),
  data=>{
    qap_log("fetch :: "+fn+" :: ok //"+data.length);
    fs.writeFile(fn,data);
  },
  s=>qap_log("fetch :: "+fn+" :: fail :: "+s)
));

xhr_get('https://raw.githubusercontent.com/gitseo/vm/master/main.js?t='+rand(),
  s=>{
    qap_log("on_restart.js :: ok");
    if(fs.readFileSync("main.js")==s){qap_log("on_restart.js :: main.js is up-to-date");return;}
    qap_log("on_restart.js :: main.js is old");
    fs.writeFileSync("main.js",s);
    //fetch_other_file();
    process.exit();
  },
  s=>{qap_log("on_restart.js :: fail :: "+s);fs.writeFileSync("main.js.errmsg","//from on_restart.js\n"+s);}
);
