if(!('sure' in qp))return 'sure in qp required';
var counter=10000;
if('counter' in qp)counter=qp.counter|0;
var r=request;
var dir='./wmlogs';
fs.mkdir("./wmlogs",err=>{
  exec_with_stream('ls '+dir,r,()=>{
    r.write('\n\n');
    set_interval(()=>{
      xhr_get("http://vm-os3.7e14.starter-us-west-2.openshiftapps.com/c/wmlog.js?json",
        s=>{
          var fn=dir+'/'+counter+'.json';
          fs.writeFileSync(fn,s);
          if(!r.finished)r.write(fn+'    // '+s.length);
          counter++;
        },
        qap_log
      );
    },30*1000);
  });
});
return resp_off();