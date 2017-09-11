const util = require('util');
const vm = require('vm');

var child_process=require('child_process');
var execSync=child_process.execSync;var exec=child_process.exec;
var spawnSync=child_process.spawnSync;var spawn=child_process.spawn;

var qs = require('querystring');
var http = require("http"),
    https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    os = require("os"),
    crypto = require('crypto');

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

var get_tick_count=()=>new Date().getTime();

var g_interval=false;var g_ping_base=get_tick_count();
var g_obj={};

var QapNoWay=()=>{qap_log("QapNoWay :: no impl");qap_log("no way");}

var call_cb_on_err=(emitter,cb,...args)=>{
  emitter.on('error',err=>{
    cb("'inspect({args,err}) // stack': "+inspect({args:args,err:err})+" // "+err.stack.toString());
  });
}

var qap_err=(context,err)=>context+" :: err = "+inspect(err)+" //"+err.stack.toString();
var log_err=(context,err)=>qap_log(qap_err(context,err));

process.on('uncaughtException',err=>log_err('uncaughtException',err));

var rand=()=>(Math.random()*1024*64|0);
var qap_add_time=s=>"["+getDateTime()+"] "+s;
var qap_log=s=>console.log(qap_add_time(s));

var json=JSON.stringify;
var mapkeys=Object.keys;var mapvals=(m)=>mapkeys(m).map(k=>m[k]);
var inc=(m,k)=>{if(!(k in m))m[k]=0;m[k]++;return m[k];};

var FToS=n=>(n+0).toFixed(2);
var qapavg=(arr,cb)=>{if(typeof cb=='undefined')cb=e=>e;return arr.length?arr.reduce((pv,ex)=>pv+cb(ex),0)/arr.length:0;}
var qapsum=(arr,cb)=>{if(typeof cb=='undefined')cb=e=>e;return arr.reduce((pv,ex)=>pv+cb(ex),0);}
var qapmin=(arr,cb)=>{if(typeof cb=='undefined')cb=e=>e;var out;var i=0;for(var k in arr){var v=cb(arr[k]);if(!i){out=v;}i++;out=Math.min(out,v);}return out;}
var qapmax=(arr,cb)=>{if(typeof cb=='undefined')cb=e=>e;var out;var i=0;for(var k in arr){var v=cb(arr[k]);if(!i){out=v;}i++;out=Math.max(out,v);}return out;}
var qapsort=(arr,cb)=>{if(typeof cb=='undefined')cb=e=>e;return arr.sort((a,b)=>cb(b)-cb(a));}
var mapdrop=(e,arr,n)=>{var out=n||{};Object.keys(e).map(k=>arr.indexOf(k)<0?out[k]=e[k]:0);return out;}
var mapsort=(arr,cb)=>{if(typeof cb=='undefined')cb=(k,v)=>v;var out={};var tmp=qapsort(mapkeys(arr),k=>cb(k,arr[k]));for(var k in tmp)out[tmp[k]]=arr[tmp[k]];return out;}

var qap_unique=arr=>{var tmp={};arr.map(e=>tmp[e]=1);return mapkeys(tmp);};var unique_arr=qap_unique;

var mapaddfront=(obj,n)=>{for(var k in obj)n[k]=obj[k];return n;}
var mapclone=obj=>mapaddfront(obj,{});

var getarr=(m,k)=>{if(!(k in m))m[k]=[];return m[k];};
var getmap=(m,k)=>{if(!(k in m))m[k]={};return m[k];};

var json_once=(obj,replacer,indent,limit)=>{
  var objs=[];var keys=[];if(typeof(limit)=='undefined')limit=2048;
  return json(obj,(key,v)=>{
    if(objs.length>limit)return 'object too long';
    var id=-1;objs.forEach((e,i)=>{if(e===v){id=i;}});
    if(key==''){objs.push(obj);keys.push("root");return v;}
    if(id>=0){
      return keys[id]=="root"?"(pointer to root)":
        ("\1(see "+((!!v&&!!v.constructor)?v.constructor.name.toLowerCase():typeof(v))+" with key "+json(keys[id])+")");
    }else{
      if(v!==null&&typeof(v)==="object"){var qk=key||"(empty key)";objs.push(v);keys.push(qk);}
      return replacer?replacer(key,v):v;
    }
  },indent);
};
var json_once_v2=(e,v,lim)=>json_once(e,v,2,lim);
var inspect=json_once_v2;

function getDateTime() {
  var now     = new Date(); 
  var year    = now.getFullYear();
  var f=v=>(v.toString().length==1?'0':'')+v;
  var month   = f(now.getMonth()+1); 
  var day     = f(now.getDate());
  var hour    = f(now.getHours());
  var minute  = f(now.getMinutes());
  var second  = f(now.getSeconds()); 
  var dateTime = year+'.'+month+'.'+day+' '+hour+':'+minute+':'+second;   
  return dateTime;
}

var emitter_on_data_decoder=(emitter,cb)=>{
  var rawData='';var pos=0;
  emitter.on('data',data=>{
    rawData+=data.toString("binary");
    var e=rawData.indexOf("\0",pos);
    if(e<0){pos=rawData.length;return qap_log("(1.wait_len)");}
    pos=e;
    var en=e+1;
    var zpos=rawData.indexOf('\0',en);
    if(zpos<0)return qap_log("(2.wait_z)");
    var zn=zpos+1;
    var len=rawData.substr(0,e)|0;
    if(rawData.length<zn+len)return qap_log("(3.wait_data)"+json({"rawData.length":rawData.length,"zn+len":zn+len,pos:pos}));
    var out=rawData.substr(zn,len);
    var z=rawData.substr(en,zpos-en);
    var msg=out.substr(0,len);
    rawData=rawData.substr(zn+len);pos=0;
    cb(z,msg);
    qap_log("(4.ok)"+json({len:len,z:z,msg:len<80?msg:"*over 80*"}));
    //return "(4.ok)\n"+JSON.stringify({z:z,msg:msg,rd:rawData});
  });
}
/*
// http://adler3d.github.io/test2013/
var data="4|ping-5|data_shit".split("|").join("\0");
var rawData=data;var pos=0;
//rawData+=data.toString("binary");
var e=rawData.indexOf("\0",pos);
if(e<0){pos=rawData.length;return "(1.wait_len)";}
pos=e;
var en=e+1;
var zpos=rawData.indexOf('\0',en);
if(zpos<0)return "(2.wait_z)";
var zn=zpos+1;
var len=rawData.substr(0,e)|0;
if(rawData.length<zn+len)return "(3.wait_data)";
var out=rawData.substr(zn,len);
var z=rawData.substr(en,zpos-en);
var msg=out.substr(0,len);
rawData=rawData.substr(zn+len);
return "(4.ok)\n"+JSON.stringify({z:z,msg:msg,rd:rawData});
*/

var cl_and_exec_cpp=(code,async_cb,flags)=>{
  var rnd=rand()+"";rnd="00000".substr(rnd.length)+rnd;
  var fn="main["+getDateTime().split(":").join("-").split(" ").join("_")+"]_"+rnd+".cpp";
  var out="./"+fn+".out";
  //fn=json(fn);out=json(out);
  fs.writeFileSync(fn,code);
  var cmdline="g++ "+(flags?flags:"")+"-Wmultichar -fpermissive -DQAP_DEBUG -std=c++11 "+fn+" -O2 -o "+out+"\n"+out;
  if(async_cb){
    if((typeof async_cb)!="function")async_cb=()=>{};
    var proc=exec(cmdline,async_cb);
    return "async...";
  }
  return ""+execSync(cmdline);
}

var get_backup=()=>{
  var tmp=JSON.parse(json(g_obj));var data=json(mapdrop(mapclone(g_obj),'g_obj.json'));
  getarr(tmp,'g_obj.json').push({
    time:getDateTime(),
    hostname:os.hostname(),
    size:Buffer.byteLength(data),
    sha1:crypto.createHash('sha1').update(data).digest('hex')
  });
  return tmp;
}

var get_hosts_by_type=type=>mapkeys(hosts).filter(e=>hosts[e]==type);

var send_backup=()=>{
  var nope=()=>{};
  var fn=crypto.createHash('sha1').update(os.hostname()).digest('hex')+".json";
  var backup_servers=get_hosts_by_type('backup');
  backup_servers.map(e=>
    xhr_post('http://'+e+'/vm/backup/?write&from='+os.hostname(),{fn:fn,data:json(get_backup())},nope,nope)
  );
}

var g_intervals=[];

var set_interval=(func,ms)=>{
  g_intervals.push({data:getDateTime(),func:func,ref:setInterval(func,ms)});
  return g_intervals.slice(-1)[0];
}

var clear_interval=(ref)=>{
  clearInterval(ref.ref);g_intervals.splice(g_intervals.indexOf(ref),1);
}

var start_auto_backup=()=>{
  set_interval(send_backup,10*60*1000);
}
//return cl_and_exec_cpp(POST);

var ee_logger=(emitter,name,events)=>{
  events.split(',').map(event=>emitter.on(event,e=>qap_log(name+' :: Got '+event)));
}

var ee_logger_v2=(emitter,name,cb,events)=>{
  events.split(',').map(event=>emitter.on(event,e=>cb(name+' :: Got '+event)));
  call_cb_on_err(emitter,cb,name);
}

var xhr_get=(url,ok,err)=>{
  if((typeof ok)!="function")ok=()=>{};
  if((typeof err)!="function")err=()=>{};
  var req=(url.substr(0,"https".length)=="https"?https:http).get(url,(res)=>{
    if(res.statusCode!==200){err('Request Failed.\nStatus Code: '+res.statusCode);res.destroy();req.destroy();return;}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk);
    res.on('end',()=>{try{ok(rawData,res);}catch(e){err(e.message,res);}});
  });
  call_cb_on_err(req,qap_log,'xhr_get');
  return req;
}

var xhr=(method,URL,data,ok,err)=>{
  if((typeof ok)!="function")ok=()=>{};
  if((typeof err)!="function")err=()=>{};
  var up=url.parse(URL);var secure=up.protocol=='https';
  var options={
    hostname:up.hostname,port:up.port?up.port:(secure?443:80),path:up.path,method:method.toUpperCase(),
    headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}
  };
  var req=(secure?https:http).request(options,(res)=>{
    if(res.statusCode!==200){err('Request Failed.\nStatus Code: '+res.statusCode);res.destroy();req.destroy();return;}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk.toString("binary"));
    res.on('end',()=>{try{ok(rawData,res);}catch(e){err(e.message,res);}});
  });
  call_cb_on_err(req,qap_log,'xhr');
  req.end(data);
  return req;
}

var xhr_add_timeout=(req,ms)=>req.on('socket',sock=>sock.on('timeout',()=>req.abort()).setTimeout(ms));

var xhr_post=(url,obj,ok,err)=>xhr('post',url,qs.stringify(obj),ok,err);
var xhr_post_with_to=(url,obj,ok,err,ms)=>xhr_add_timeout(xhr('post',url,qs.stringify(obj),ok,err),ms);

var hosts={};var hosts_err_msg='';var need_coop_init=true;

var hosts_sync=(cb)=>{
  if((typeof cb)!="function")cb=()=>{};
  xhr_get('https://raw.githubusercontent.com/adler3d/qap_vm/gh-pages/trash/test2017/hosts.json?t='+rand(),
    s=>{try{hosts=JSON.parse(s);}catch(e){cb('JSON.parse error:\n'+e+'\n\n'+s);}cb(s);},
    s=>{hosts_err_msg=s;cb(s);}
  );
};

hosts_sync();

var on_start_sync=()=>{
  if((typeof cb)!="function")cb=()=>{};
  xhr_get('https://raw.githubusercontent.com/gitseo/vm/master/on_restart.js?t='+rand(),
    s=>{fs.writeFileSync("on_restart.js",s);eval(s);},
    s=>{fs.writeFileSync("on_restart.js.errmsg",s);}
  );
};

on_start_sync();

var is_public=host=>hosts[host]=='public';
var is_shadow=host=>hosts[host]=='shadow';

var request_to_log_object=request=>{
  var h=request.headers;
  return {
    time:getDateTime(),
    ip:h['x-forwarded-for']||request.connection.remoteAddress,
    request_uri:request.url,
    user_agent:h["user-agent"],
    method:request.method,
    referer:h.referer,
    host:request.headers.host,
    hostname:os.hostname()
  }
};
var http_server=http.createServer((a,b)=>requestListener(a,b)).listen(port,ip);
var g_http_server_debug=true;var g_err_socks={};var g_err_socks_func=(err,socket)=>{
  if(inspect(socket.address())=="{}")return;
  var info={};(
    "bufferSize,bytesRead,bytesWritten,connecting,"+
    "destroyed,localAddress,localPort,remoteAddress,remotePort"
  ).split(",").map(e=>info[e]=socket[e]);
  var all={err:err,socket:info,incoming_headers:socket.parser.incoming.headers};
  getarr(g_err_socks,json(err)).push(all);
  var short_info={
    ip:all.incoming_headers["x-forwarded-for"],
    err:err,bytesRead:info.bytesRead,bytesWritten:info.bytesWritten
  };
  qap_log("http_server::on_clientError : "+json(short_info));
};
http_server.on('clientError',(err,socket)=>{
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  if(!g_http_server_debug)return;
  g_err_socks_func(err,socket);
});

var g_links={};
var gen_link_id=()=>{return rand()+getDateTime();}
var new_link=()=>{var out={id:gen_link_id()};g_links[out.id]=out;return out;}

var requestListener=(request,response)=>{
  var purl=url.parse(request.url);var uri=purl.pathname;var qp=qs.parse(purl.query);
  var filename = path.join(process.cwd(), uri);

  qap_log("url = "+purl.path);
  
  if("/rt_sh"==uri)
  {
    response.writeHead(200,{"Content-Type":"text/plain",'Transfer-Encoding':'chunked','X-Content-Type-Options':'nosniff'});
    var toR=z=>data=>{var d=data?data:"";response.write(d.length+"\0"+z+"\0"+d);};
    var pipe_from_to_func=(stream,func)=>stream.on("data",func).on("end",func);
    var pipe_from_to=(stream,z)=>{var f=toR(z);pipe_from_to_func(stream,f);}
    var ping=toR("ping");var iter=0;var ping_interval=set_interval(()=>ping(""+(iter++)),500);
    //toR("log")("["+getDateTime()+"] :: hi");
    var on_exit_funcs=[];
    var on_exit=()=>{
      if(!ping_interval)return;
      clear_interval(ping_interval);ping_interval=false;
      on_exit_funcs.map(f=>f());
      request.destroy();
      response.destroy();
    }
    var fromR=(z,msg)=>{if(z in z2func)z2func[z](msg);};
    var mem={};
    var z2func={
      eval:msg=>{
        try{
          var system_tmp=eval("()=>{"+msg+"\n;return;}");
          system_tmp();
          return;
        }catch(err){
          QapNoWay();
          response.writeHead(500,{"Content-Type":"text/plain"});
          qap_log(qap_err("rt_sh.eval.msg",err));
          response.end(qap_err("rt_sh.eval.msg",err));
          on_exit();
          return;
        }
      }
    };
    emitter_on_data_decoder(request,fromR);
    ee_logger_v2(request,'rt_sh.request',qap_log,'end,abort,aborted,connect,continue,response,upgrade');
    ee_logger_v2(response,'rt_sh.response',qap_log,'end,abort,aborted,connect,continue,response,upgrade');
    request.on('aborted',on_exit);
    response.on('aborted',on_exit);
    return;
  }
  var contentTypesByExtension={
    '.html': "text/html", // "/eval.html" "/eval_hljs.html"
    '.css':  "text/css",
    '.js':   "text/javascript",
    '.txt':  "text/plain",
    '.php':  "text/plain",
    '.json':  "text/plain",
    '.log':  "text/plain", // "/mainloop.log"
    '.mem':  "application/octet-stream",
    '.bin':  "application/octet-stream",
    '.png':  "image/png",
    '.ico':  "image/x-icon"
  };
  var on_request_end=(cb)=>{
    var body=[];
    call_cb_on_err(request,qap_log,'http_server.requestListener.on_request_end');
    request.on('data',chunk=>body.push(chunk));
    request.on('end',()=>cb(Buffer.concat(body).toString()));
  };
  call_cb_on_err(response,qap_log,'http_server.requestListener');
  var g_logger_func=request=>{
    var f=request=>{
      var h=request.headers;
      return {
        time:getDateTime(),
        ip:h['x-forwarded-for']||request.connection.remoteAddress,
        request_uri:request.url,
        user_agent:h["user-agent"],
        method:request.method,
        referer:h.referer
      }
    };
    var arr=getarr(getmap(g_obj,'logs'),os.hostname()).push(f(request));
  };
  on_request_end((POST_BODY)=>{
    var POST=POST_BODY.length?qs.parse(POST_BODY):{};
    mapkeys(POST).map(k=>qp[k]=POST[k]);POST=qp;
    g_logger_func(request);
    var is_dir=fn=>fs.statSync(filename).isDirectory();
    fs.exists(filename,ok=>{if(ok&&is_dir(filename))filename+='/index.html';func(filename);});
    var func=filename=>fs.exists(filename,function(exists) {
      var raw_quit=()=>{setTimeout(()=>process.exit(),16);}
      var quit=()=>{raw_quit();return txt("["+getDateTime()+"] ok");}
      var png=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"image/png"});r.end(new Buffer(s,"binary"));}})(response);
      var binary=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"application/octet-stream"});r.end(new Buffer(s,"binary"));}})(response);
      var txtbin=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/plain"});r.end(new Buffer(s,"binary"));}})(response);
      var html=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/html"});r.end(s);}})(response);
      var txt=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/plain"});r.end(s);}})(response);
      var async_cl_and_exec_cpp=(code,flags)=>{
        cl_and_exec_cpp(
          code,
          (error,stdout,stderr)=>txt(
            "so...\n"+(error?"err: "+inspect(error)+"\n"+stderr+"\n\n ***--- stdout: ---*** \n\n"+stdout:"ok: "+(stdout))
          ),
          flags
        );
      }
      var shadows=get_hosts_by_type('shadow');
      var shadow=shadows[0];
      var master=get_hosts_by_type('public')[0];
      var req_handler=()=>{
        response.off=()=>response={writeHead:()=>{},end:()=>{}};
        var resp_off=()=>{response.off();}
        var jstable=arr=>{
          response.off();
          //  safe_json=obj=>json(obj).split("</script>").join("<\\/script>");
          var safe_json=obj=>json(obj).split("/").join("\\/");
          var cb=data=>html(data.split("</body>").join("<script>draw("+safe_json(arr)+");</script></body>"));
          fs.readFile("json2table_fish.html",(err,data)=>{if(err)throw err;cb(""+data);})
          return;
        }; 
        var yt_title=s=>{
          response.off();
          var safe_json=obj=>json(obj).split("/").join("\\/");
          var cb=data=>html(data.split("</body>").join("<script>draw("+safe_json(s)+");</script></body>"));
          fs.readFile("yt.title.fish.html",(err,data)=>{if(err)throw err;cb(""+data);})
          return;
        }; 
        if("/g_obj.json"==uri){
          if('raw' in qp)return txt(json(g_obj));
          if('data' in qp)return json(mapdrop(mapclone(g_obj),'g_obj.json'));
          txtbin(json(get_backup()));
          return;
        }
        if("/hosts.json"==uri){
          hosts_sync(s=>txt(s));
          return;
        }
        if("/shadows_links"==uri){
          response.off();var ls='<a href="/fetch?quit">this/fetch?quit</a><hr><a href="/ls">this/ls</a>';
          return html(ls+"<hr>"+shadows.map(e=>"http://"+e+"/fetch?quit").map(e=>'<a href="'+e+'">'+e+'</a>').join("<hr>"));
        }
        var log_incdec_sumator=log=>{
          return log.map(e=>e.request_uri).map(e=>url.parse(e).pathname).
          map(e=>e=="/inc"?+1:(e=="/dec"?-1:0)).reduce((p,v)=>p+v,0);
        }
        if("/ll"==uri){return txt(execSync("ls -l"));}
        if("/ps_aux"==uri){return txt(execSync("ps -aux"));}
        if("/ps_aux_ll"==uri){return txt(execSync("ps -aux\nls -l"));}
        if("/top"==uri){
          var files=g_obj.files;
          var cb=arr=>jstable(arr);
          var filter=fn=>fn.indexOf("eval/rec[")<0;
          if('all' in qp)filter=any=>any;
          if('evalrecs' in qp)filter=fn=>fn.indexOf("eval/rec[")>=0;
          if('raw' in qp)cb=arr=>txt(inspect(arr));
          if('json' in qp)cb=arr=>txt(json(arr));
          return cb(qapsort(mapkeys(files).filter(filter).map(fn=>(
            {fn:fn,mass:log_incdec_sumator(files[fn].log)}
          )),e=>e.mass));
        }
        if("/evals"==uri)
        {
          var none=()=>{};
          var f=g_obj.files;
          if('drop_if_over4k' in qp)
          {
            var data_filter=e=>e?e.length>1024*4:e;
            return txt(
              mapkeys(f).filter(e=>e.includes("eval/")).reverse().
                map(e=>({fn:e,log_size:f[e].log.length,code:null,data:JSON.parse(f[e].data)})).
                filter(e=>data_filter(e.data.data)).
                map(e=>mapaddfront({code:e.data.code,data:data_filter(e.data.data)},e)).
                map(e=>({cmd:"http://vm-vm.1d35.starter-us-east-1.openshiftapps.com/del?fn="+e.fn})).
                map(e=>xhr_get(e.cmd,none,none)+"  "+e.cmd).join("\n")
            );
          }
          var data_filter=e=>(e?e.length>1024*4:e)?"*** over 4k ***":e;
          if('drop_if_trash' in qp)
          {
            var algo=e=>e?e.indexOf('trash')==0:0;
            return jstable(
              mapkeys(f).filter(e=>e.includes("eval/")).reverse().
                map(e=>({fn:e,log_size:f[e].log.length,code:null,data:JSON.parse(f[e].data)})).
                filter(e=>algo(e.data.code)).
                map(e=>mapaddfront({code:e.data.code,data:data_filter(e.data.data)},e)).
                map(e=>({cmd:"http://vm-vm.1d35.starter-us-east-1.openshiftapps.com/del?fn="+e.fn})).
                map(e=>xhr_get(e.cmd,none,none)+"  "+e.cmd).join("\n") //*/
            );
          }
          if('all' in qp)data_filter=e=>e;
          return jstable(
            mapkeys(f).filter(e=>e.includes("eval/")).reverse().map(e=>({fn:e,log_size:f[e].log.length,code:null,data:JSON.parse(f[e].data)})).
              map(e=>mapaddfront({code:e.data.code,data:data_filter(e.data.data)},e))
          );
        }
        if("/hops"==uri){
          return jstable(g_obj['g_obj.json'].map(e=>e).reverse());
        }
        if("/logs"==uri){
          var m=getmap(g_obj,'logs');
          var func=e=>txt(inspect(e));
          if('json' in qp)func=e=>txt(json(e));
          if('all' in qp)return func(m);
          var func=jstable;
          if('json' in qp)func=e=>txt(json(e));
          var arr=m['hostname' in qp?qp.hostname:os.hostname()];
          return func(arr);
        }
        if("/sitemap"==uri){
          var hide="close,exit,inc,dec,del,put,get,internal,eval,tick,ping".split(",");
          var head=("<html><style>div{"+
            "position:absolute;top:10%;left:50%;margin-top:-50px;margin-left:-50px;width:100px;height:100px;"+
            "}</style><body><div><h3>"
          );
          return html(head+qap_unique(
            (fs.readFileSync("main.js")+"").split('"'+'/').map(e=>e.split('"')[0]).slice(1).filter(e=>e.length)
          ).filter(e=>hide.indexOf(e)<0).map(e=>'/'+e).map(e=>'<a href="'+e+'">'+e+'</a><br>').join("\n"));
        }
        var cmds={
          "/del":(qp,log_object)=>{
            var files=getmap(g_obj,'files');
            delete files[qp.fn];
            return json(get_tick_count());
          },
          "/put":(qp,log_object)=>{
            var f=getmap(getmap(g_obj,'files'),qp.fn);
            f.data=qp.data;
            getarr(f,'log').push(log_object);
            return json(get_tick_count());
          },
          "/get":(qp,log_object)=>{
            var files=getmap(g_obj,'files');
            if(!(qp.fn in files))return json(['not found',qp.fn]);
            var f=files[qp.fn];
            getarr(f,'log').push(log_object);
            if('raw' in qp)return ('safe' in qp?"found:\n":"")+f.data;
            if(!('full' in qp)){
              var ignore="host,hostname,method".split(",");
              f=mapclone(f);f.log=f.log.map(e=>mapdrop(e,ignore));
            }
            return json(f,null,2);
            //return json(['found at '+os.hostname(),f],null,2);
          },
          "/ls":(qp,log_object)=>{
            return mapkeys(getmap(g_obj,'files')).join("\n");
          }
        };
        ["/inc","/dec"].map(e=>(cmds[e]=(qp,log_object)=>{
          var files=getmap(g_obj,'files');
          if(!(qp.fn in files))return json(['not found',qp.fn]);
          var f=files[qp.fn];
          getarr(f,'log').push(log_object);
          return ""+log_incdec_sumator(f.log);
        }));
        var collaboration=cb=>{
          var pub=is_public(request.headers.host);var server=pub?shadow:master;
          if(!pub)return txt("coop error: request denied, because conf = not public");
          var tmp=request_to_log_object(request);
          var f=qp=>({qp:json(qp),tmp:json(tmp)});
          /*
            wrong design lead to:
            request order problem
            waiting response from all shadows problem
            any shadow crash lead to OOS
            then more shadow then more OOS
          */
          var tasks=[];var tasks_n=shadows.length;
          var on=(host,mode)=>(s=>{
            tasks.push({mode:mode,host:host,s:s});if(tasks_n!=tasks.length)return;
            if(tasks.filter(e=>e.mode=='ok').length==tasks_n){
              cb(tasks,tmp);
            }else txt('coop_fail:\n'+inspect(tasks));// but on some shadows server requests performed...
          });
          if(!tasks_n)cb(tasks,tmp);
          shadows.map(e=>xhr_post_with_to('http://'+e+'/internal?from='+os.hostname()+'&url='+uri,f(qp),on(e,'ok'),on(e,'fail'),1000*5));
          return;
        };
        var coop=collaboration;
        if("/internal"==uri)((params)=>{
          var qp=JSON.parse(params.qp);
          var tmp=JSON.parse(params.tmp);var log_object=tmp;
          var uri=url.parse(tmp.request_uri).pathname;
          if(uri in cmds){return txt(cmds[uri](qp,log_object));}
          return txt("error: unknow cmd - '"+uri+"'");
        })(qp);
        var arrjoin=(a,b)=>a[0];
        if(uri in cmds){
          var need_png=false;if('fn' in qp)if('raw' in qp)if(!('safe' in qp))need_png=qp.fn.split('.').slice(-1)[0]=='png';
          var func=need_png?png:txt;
          if('binary' in qp)func=binary;
          if('bin' in qp)func=binary;
          if('html' in qp)func=html;
          if('txtbin' in qp)func=txtbin;
          return coop(
            (arr,log_object)=>func(
              //arrjoin(
              //  [
                  cmds[uri](qp,log_object)
              //  ],
              //  arr
              //)
            )
          );
        }
        if("/hostname"==uri){return txt(os.hostname());}
        if("/fetch"==uri){
          (()=>{
            var repo="https://raw.githubusercontent.com/gitseo/vm/master/";
            if('git' in qp)
            {
              var run=cmd=>execSync(cmd)+"";
              var f=cmd=>run(cmd).split("\n").map(e=>e.substr("vm/".length)).filter(e=>e.length);
              var out=[
                run(`rm -rf vm`),
                run(`git clone https://github.com/gitseo/vm.git`),
                f("find vm/* -type d").map(e=>"mkdir -p "+e).map(run).join("\n"),
                f("find vm/* -type f").map(e=>"cp vm/"+e+" "+e).map(run).join("\n"),
                run(`rm -rf vm`),
                execSync("ls -lh"),
                ""
              ];
              if('quit' in qp)raw_quit();
              return out.join("\n\n");
            }
            var fn=('fn' in qp)?qp.fn:"main.js";
            xhr_get(repo+fn+'?t='+rand(),s=>{
              fs.writeFileSync(fn,s);
              txt("["+getDateTime()+"] fetch done //length = "+Buffer.byteLength(s));
              if('quit' in qp)raw_quit();
            },txt);
          })();
          return;
        }
        if("/rollback"==uri){fs.unlinkSync("fast_unsafe_auto_restart_enabled.txt");quit();}
        if("/close"==uri||"/quit"==uri||"/exit"==uri)quit();
        if("/"==uri)return txt("count = "+inc(g_obj,'counter'));
        if("/yt.title"==uri){
          response.off();response.off=()=>{};
          xhr("GET","https://www.youtube.com/get_video_info?video_id="+qp.v,"",
            yt_title,s=>txt("yt.title('failed')\n"+s)
          );
          return;
        }
        if("/tick"==uri){g_ping_base=get_tick_count();return txt("tick = "+inc(g_obj,'tick'));}
        if("/ping"==uri){g_ping_base=get_tick_count();return txt(getDateTime());}
        if("/eval"==uri){
          var impl=()=>{
            try{
              var system_tmp=eval("()=>{"+POST['code']+"\n;return '';}");
              system_tmp=system_tmp();
              if(response){
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.end(system_tmp);
                return;
              }
            }catch(err){
              response.writeHead(500,{"Content-Type":"text/plain"});
              response.end(qap_err('/eval.POST.code',err));
              return;
            }
          };
          if('nolog' in qp)return impl();
          var rnd=rand()+"";rnd="00000".substr(rnd.length)+rnd;
          var rec="http://"+master+'/put?fn=eval/rec['+getDateTime()+"]"+rnd+"_"+os.hostname()+".json";
          xhr_post(rec,{data:json({code:qp.code,data:qp.data})},impl,err=>txt('rec_error:\n'+err));
          return;
        }
        if(!exists){
          response.writeHead(404, {"Content-Type": "text/plain"});
          response.end("404 Not Found\n");
          return;
        }
        fs.stat(filename,(error,stat)=>{
          if(error){throw error;}
          response.writeHead(200,{
            'Content-Type':contentTypesByExtension[path.extname(filename)],
            'Content-Length':stat.size
          })
          fs.createReadStream(filename).pipe(response).on('end',()=>{response.destroy();request.destroy()});
        });
      };
      if(need_coop_init)
      {
        need_coop_init=false;
        var pub=is_public(request.headers.host);var none=()=>{};
        if(g_interval){clearInterval(g_interval);g_interval=false;}
        var period=1000*30;var net_gap=1000*10;
        if(!pub){
          g_interval=setInterval(()=>{
            var ctc=get_tick_count();
            if(ctc-g_ping_base<=period+net_gap)return;
            g_ping_base=ctc;
            xhr_post('http://'+master+'/ping?from='+os.hostname(),{},none,none);
          },1000);
        }
        var send_tick_to_shadows=()=>{
          get_hosts_by_type('shadow').map(e=>xhr_post('http://'+e+'/tick?from='+os.hostname(),{},none,none));
        };
        if(pub)g_interval=setInterval(send_tick_to_shadows,period);
        var server=pub?shadow:master;
        xhr_post('http://'+server+'/g_obj.json?from='+os.hostname(),{},s=>{g_obj=JSON.parse(s);req_handler();},s=>txt('coop_init_fail:\n'+s));
        return;
      }
      req_handler();
    });
  });
}
qap_log("Static file server running at http://localhost:"+port);
qap_log("CTRL + C to shutdown");
