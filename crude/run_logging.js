if(!('sure' in qp))return 'sure in qp required';
var counter=(new Date()/1000)|0;
if('counter' in qp)counter=qp.counter|0;
var ids='ids' in qp?"&ids="+qp.ids:'';
var r=response;
var dir='./wmlogs';
fs.mkdir("./wmlogs",err=>{
  exec_with_stream('ls '+dir,r,()=>{
    r.write('\n\n');
    set_interval(()=>{
      xhr_get("http://"+request.headers.host+"/c/wmlog.js?json"+ids,
        s=>{          
          if(!s.length)return;
          if(s[0]!='{')return;
          var fn=dir+'/'+counter+'.json';
          fs.writeFileSync(fn,s);
          if(!r.finished)r.write(fn+'    // '+s.length);
          counter++;
        },
        qap_log
      );
    },30*1000);
    r.write("begin\n");
  });
});
return resp_off();
