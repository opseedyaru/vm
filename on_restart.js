start_auto_backup();
set_interval(()=>xhr_get('http://qpe.000webhostapp.com/vm/ping?from='+os.hostname(),()=>{},()=>{}),60*1000);
var nope=()=>{};
xhr_get('http://qpe.000webhostapp.com/vm/on_start?from='+os.hostname(),nope,nope);
xhr_get('http://adler.hol.es/vm/on_start?from='+os.hostname(),nope,nope);
