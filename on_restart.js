setTimeout(()=>start_auto_backup(),30*1000);
set_interval(()=>xhr_get('http://qpe.000webhostapp.com/vm/ping?from='+os.hostname(),()=>{},()=>{}),60*1000);
var nope=()=>{};
xhr_get('http://qpe.000webhostapp.com/vm/on_start?from='+os.hostname(),nope,nope);
xhr_get('http://adler.hol.es/vm/on_start?from='+os.hostname(),nope,nope);
xhr_get('https://raw.githubusercontent.com/gitseo/vm/master/main.js?t='+rand(),
  s=>{
    qap_log("on_restart.js :: ok");
    if(fs.readFileSync("main.js")==s){qap_log("on_restart.js :: main.js is up-to-date");return;}
    qap_log("on_restart.js :: main.js is old");
    fs.writeFileSync("main.js",s);
    process.exit();
  },
  s=>{qap_log("on_restart.js :: fail :: "+s);fs.writeFileSync("main.js.errmsg","//from on_restart.js\n"+s);}
);
