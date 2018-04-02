var child_process=require('child_process');
var fs=require('fs');
var execSync=child_process.execSync;
var qs = require('querystring');
var http = require("http"),
    https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    os = require("os"),
crypto = require('crypto');
const assert=require('assert');

var call_cb_on_err=(emitter,cb,...args)=>{
  emitter.on('error',err=>{
    cb("'inspect({args,err}) // stack': "+inspect({args:args,err:err})+" // "+err.stack.toString());
  });
}

var qap_log=s=>console.log("["+getDateTime()+"] "+s);

var qap_err=(context,err)=>context+" :: err = "+inspect(err)+" //"+err.stack.toString();
var log_err=(context,err)=>qap_log(qap_err(context,err));

var json=JSON.stringify;
var mapkeys=Object.keys;var mapvals=(m)=>mapkeys(m).map(k=>m[k]);
var inc=(m,k)=>{if(!(k in m))m[k]=0;m[k]++;return m[k];};

var FToS=n=>(n+0).toFixed(2);
var mapswap=(k2v)=>{var v2k={};for(var k in k2v){v2k[k2v[k]]=k;}return v2k;}
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
var getdef=(m,k,def)=>{if(!(k in m))m[k]=def;return m[k];};

var qap_foreach_key=(obj,cb)=>{for(var k in obj)cb(obj,k,obj[k]);return obj;}

process.on('uncaughtException',err=>log_err('uncaughtException',err));

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

var file_exist=fn=>{try{fs.accessSync(fn);return true;}catch(e){return false;}}
var rand=()=>(Math.random()*1024*64|0);

var ee_logger_v2=(emitter,name,cb,events)=>{
  events.split(',').map(event=>emitter.on(event,e=>cb(name+' :: Got '+event)));
  call_cb_on_err(emitter,cb,name);
}

var emitter_on_data_decoder=(emitter,cb)=>{
  var rd=Buffer.from([]);
  var err=qap_log;
  emitter.on('data',data=>{
    rd=Buffer.concat([rd,data]);
    var e=rd.indexOf("\0");
    if(e<0)return;
    var en=e+1;
    var zpos=rd.indexOf('\0',en);
    if(zpos<0)return;
    var zn=zpos+1;
    var blen=rd.slice(0,e);
    var len=blen.toString("binary")|0;
    if(!Buffer.from((len+"").toString("binary")).equals(blen)){
      err("error chunk.len is not number: "+json({as_buff:blen,as_str:blen.toString("binary")}));
    }
    if(rd.length<zn+len)return;
    var bz=rd.slice(en,en+zpos-en);var z=bz.toString("binary");
    var bmsg=rd.slice(zn,zn+len);var msg=bmsg.toString("binary");
    rd=rd.slice(zn+len);
    cb(z,msg,bz,bmsg);
  });
}

var stream_write_encoder=(stream,z)=>data=>{
  var sep=Buffer.from([0]);
  stream.write(Buffer.concat([
    Buffer.from(!data?"0":(data.length+""),"binary"),sep,
    Buffer.from(z,"binary"),sep,
    Buffer.from(data?data:"","binary")
  ]));
};

var ps1=(()=>{
  //COLUMNS=180;
  //STARTCOLOR='\e[0;32m';
  //ENDCOLOR="\e[0m"
  //export PS1="$STARTCOLOR[\$(date +%k:%M:%S)] \w |\$?> $ENDCOLOR"
  //export TERM='xterm'
  //alias rollback='pkill -f npm'
  //alias cls='clear'
  //alias ll='ls -alh --color=always'
  //alias grep='grep --color=always'
  //LS_COLORS=$LS_COLORS:'di=0;33:' ; export LS_COLORS
  //ps -aux
}).toString().split("\n").slice(1,-1).join("\n").split("  //").join("");


var press_insert_key=String.fromCharCode(27,91,50,126);

var xhr_blob_upload=(method,URL,ok,err,fn)=>{
  if(typeof(fn)=='undefined')fn="mask_basepix_log.txt";
  var fromR=(z,msg)=>{if(z in z2func)z2func[z](msg);};
  var z2func={
    out:msg=>process.stdout.write(msg),
    err:msg=>process.stderr.write(msg),
    qap_log:msg=>qap_log("formR :: "+msg),
    exit:msg=>process.exit()
  };
  var req=qap_http_request_decoder(method,URL,fromR,()=>{process.exit();});
  
  var toR=z=>stream_write_encoder(req,z);
  toR("eval")(
    (()=>{
      var q=a=>toR("qap_log")("["+getDateTime()+"] :: "+a);
      var stream=false;var off=s=>{if(!s)return;s.destroy();}
      Object.assign(z2func,{
        fn:(msg,buf)=>{off(stream);stream=fs.createWriteStream(msg);q("fn = "+msg);},
        data:(msg,buf)=>{stream.write(buf);q(msg.length);},
        end:msg=>{stream.on('close',()=>on_exit());stream.end();q("done!");/*q(execSync("ls -l")+"");*//*on_exit();*/}
      });
      q("begin");
      on_exit_funcs.push(()=>off(stream));
    }).toString().split("\n").slice(1,-1).join("\n")
  );
  var f=fn=>{
    toR("fn")(fn);
    fs.createReadStream(""+fn).on('data',toR("data")).on('end',()=>{toR("end")();});
  }
  f(fn);
  var ping=toR("ping");var iter=0;setInterval(()=>ping(""+(iter++)),500);
  return req;
}

var qap_http_request_decoder=(method,URL,fromR,on_end)=>{
  qap_log("qap_http_request_decoder.url = "+URL);
  var up=url.parse(URL);var secure=up.protocol=='https:';
  var options={
    hostname:up.hostname,port:up.port?up.port:(secure?443:80),path:up.path,method:method.toUpperCase(),
    headers:{'qap_type':'rt_sh','Transfer-Encoding':'chunked'}
  };
  var req=(secure?https:http).request(options,(res)=>
  {
    qap_log("qap_http_request_decoder.request.res = "+URL);
    if(res.statusCode!==200)
    {
      var err=qap_log;
      var cb=(s,res)=>{
        err('Request Failed.\nStatus Code: '+res.statusCode+'\n'+s);
        res.destroy();req.destroy();
      }
      var rawData='';res.on('data',(chunk)=>rawData+=chunk.toString("binary"));
      res.on('end',()=>{try{cb(rawData,res);}catch(e){err(qap_err('qap_http_request_decoder.mega_huge_error',e),res);}});
      return;
    }
    ee_logger_v2(res,'qhrd.res',qap_log,'end,abort,aborted,connect,continue,response,upgrade');
    emitter_on_data_decoder(res,fromR);
    res.on('end',on_end);
  });
  ee_logger_v2(req,'qhrd.req',qap_log,'end,abort,aborted,connect,continue,response,upgrade');
  req.setNoDelay();
  return req;
};

var xhr_shell=(method,URL,ok,err)=>{
  var fromR=(z,msg)=>{/*qap_log("\n"+json({z:z,msg:msg}));*/if(z in z2func)z2func[z](msg);};
  var z2func={
    out:msg=>process.stdout.write(msg),
    err:msg=>process.stderr.write(msg),
    qap_log:msg=>qap_log("formR :: "+msg),
    exit:msg=>process.exit()
  };
  var req=qap_http_request_decoder(method,URL,fromR,()=>process.exit());
  var toR=z=>stream_write_encoder(req,z);
  toR("eval")(
    (()=>{
      var q=a=>toR("qap_log")("["+getDateTime()+"] :: "+a);
      var sh=spawn('bash',['-i'],{detached:true});on_exit_funcs.push(()=>sh.kill('SIGHUP'));
      var finish=msg=>{
        q(msg);
        toR("exit")();
        on_exit();
      }
      sh.stderr.on("data",toR("err")).on('end',()=>q("end of bash stderr"));
      sh.stdout.on("data",toR("out")).on('end',()=>q("end of bash stdout"));
      sh.on('close',code=>finish("bash exited with code "+code));
      call_cb_on_err(sh,qap_log,'sh');
      z2func['inp']=msg=>sh.stdin.write(msg);
      on_exit_funcs.push(()=>{delete z2func['inp'];});
      q("begin");
    }).toString().split("\n").slice(1,-1).join("\n")
  );
  var inp=toR("inp");
  var ping=toR("ping");var iter=0;setInterval(()=>ping(""+(iter++)),500);
  var set_raw_mode=s=>{if('setRawMode' in s)s.setRawMode(true);}
  set_raw_mode(process.stdin);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',data=>{if(data==='\u0003')process.exit();inp(data);});
  inp(press_insert_key);
  inp(ps1+"\n");
  inp("echo xhr_shell URL = "+json(URL)+"\n");
  inp("echo welcome\n");
  process.stdin.resume();
  return req;
}

var json=JSON.stringify;

var xhr_get=(URL,ok,err)=>{
  if((typeof ok)!="function")ok=()=>{};
  if((typeof err)!="function")err=()=>{};
  var secure=['https:','https'].includes(url.parse(URL).protocol);
  var req=(secure?https:http).get(URL,(res)=>{
    var cb=ok;
    if(res.statusCode!==200){cb=(s,res)=>err('Request Failed.\nStatus Code: '+res.statusCode+'\n'+s);}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk.toString("binary"));
    res.on('end',()=>{try{cb(rawData,res);}catch(e){err(qap_err('xhr_get.mega_huge_error',e),res);}});
  });
  call_cb_on_err(req,qap_log,'xhr_get');
  return req;
}

var xhr=(method,URL,data,ok,err)=>{
  if((typeof ok)!="function")ok=()=>{};
  if((typeof err)!="function")err=()=>{};
  var up=url.parse(URL);var secure=['https:','https'].includes(up.protocol);
  var options={
    hostname:up.hostname,port:up.port?up.port:(secure?443:80),path:up.path,method:method.toUpperCase(),
    headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}
  };
  var req=(secure?https:http).request(options,(res)=>{
    var cb=ok;
    if(res.statusCode!==200){cb=(s,res)=>err('Request Failed.\nStatus Code: '+res.statusCode+'\n'+s);}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk.toString("binary"));
    res.on('end',()=>{try{cb(rawData,res);}catch(e){err(qap_err('xhr.mega_huge_error',e),res);}});
  });
  call_cb_on_err(req,qap_log,'xhr');
  req.end(data);
  return req;
}

var xhr_add_timeout=(req,ms)=>req.on('socket',sock=>sock.on('timeout',()=>req.abort()).setTimeout(ms));

var xhr_post=(url,obj,ok,err)=>xhr('post',url,qs.stringify(obj),ok,err);
var xhr_post_with_to=(url,obj,ok,err,ms)=>xhr_add_timeout(xhr('post',url,qs.stringify(obj),ok,err),ms);

  
  
var xhr_shell_writer=(method,URL,ok,err,link_id)=>{
  var fromR=(z,msg)=>{}
  var req=qap_http_request_decoder(method,URL,fromR,()=>{qap_log("writer end");process.exit();});
  var toR=z=>stream_write_encoder(req,z);
  toR("eval")(
    "var link_id="+json(link_id)+";"+
    (()=>{
      var sh=spawn('bash',['-i'],{detached:true});on_exit_funcs.push(()=>sh.kill('SIGHUP'));
      call_cb_on_err(sh,qap_log,'sh');
      z2func.inp=msg=>sh.stdin.write(msg);
      on_exit_funcs.push(()=>{delete z2func['inp'];});
      var link=getmap(g_links,link_id);
      link.sh=sh;
      link.on_up(sh,on_exit);
      on_exit_funcs.push(()=>{delete g_links[link_id];});
    }).toString().split("\n").slice(1,-1).join("\n")
  );
  var inp=toR("inp");
  var ping=toR("ping");var iter=0;setInterval(()=>ping(""+(iter++)),500);
  var set_raw_mode=s=>{if('setRawMode' in s)s.setRawMode(true);}
  set_raw_mode(process.stdin);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',data=>{if(data==='\u0003')process.exit();inp(data);});

  inp(press_insert_key);
  inp(ps1+"\n");
  inp("echo xhr_shell URL = "+json(URL)+"\n");
  inp("echo welcome\n");
  process.stdin.resume();
  return req;
}
/*
var xhr_proxy_shell_writer_concept=(method,PROXY_URL,URL,ok,err,link_id)=>{
  var desktop=[process.stdin];
  var proxy_link_id=desktop.wget(PROXY_URL,'gen_link_id();');
  // this already work
  var link_id=desktop.wget(URL,'gen_link_id();');
  desktop.read_from(URL).as_stream().also(link_id,'env.link_id.sh=spawn_sh();env.link_id.sh.stdout.pipe(remote_side)');
  // this need implement
  desktop.write_to(PROXY_URL).also(proxy_link_id,'env.proxy_link_id.stream=new_read_stream(remote_side);').as_stream().pipe_from(stdin);
  desktop.wget(URL,'/eval','this_node.wget(POST.proxy,"/rt_sh",);',{proxy:PROXY_URL,proxy_link_id:proxy_link_id,link_id:link_id});
                       this_zeit_node.read_from(POST.proxy,"/rt_sh").also(POST.proxy_link_id,"env.proxy_link_id.stream.pipe(remote_side);").as_stream().pipe(env.link_id.sh.stdin);
}*/

var xhr_proxy_shell_writer_impl=(method,URL,ok,err,proxy_link_id,HOST_URL)=>{
  var fromR=(z,msg)=>{}
  var req=qap_http_request_decoder(method,URL,fromR,()=>{qap_log("writer end");process.exit();});
  var toR=z=>stream_write_encoder(req,z);
  toR("eval")(
    "var proxy_link_id="+json(proxy_link_id)+";\n"+
    (()=>{
      // this_proxy
      var link=getmap(g_links,proxy_link_id);
      if(!('proxy' in link)){
        link.proxy={buff:[]};
        link.proxy.toR_v2=(z,msg)=>link.proxy.buff.push([z,msg]);
      }
      z2func.zmsg=zmsg=>{var t=JSON.parse(zmsg);link.proxy.toR_v2(t[0],t[1]);}
    }).toString().split("\n").slice(1,-1).join("\n")
  );
  var inp=msg=>toR("zmsg")(json(['inp',msg]));
  var ping=toR("ping");var iter=0;setInterval(()=>ping(""+(iter++)),500);
  var set_raw_mode=s=>{if('setRawMode' in s)s.setRawMode(true);}
  set_raw_mode(process.stdin);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',data=>{if(data==='\u0003')process.exit();inp(data);});
  inp([
    (press_insert_key),
    (ps1+"\n").split('\n').filter(e=>!e.includes('PS1')&&!e.includes("grep")).join('\n'),
    ('export PS1="$STARTCOLOR[\$(date)] \$(pwd) |\$?> $ENDCOLOR"\n'),
    ("echo proxy URL = "+json(URL)+"\n"),
    ("echo host URL = "+json(HOST_URL)+"\n"),
    ("echo welcome\n"),
    ('ps|grep -v cpulimit|grep -v "now-report";ll;\n'),
  ].join(""));
  process.stdin.resume();
  return req;
}

//URL without /rt_sh
var xhr_proxy_shell_writer=(method,PROXY_URL,URL,ok,err,link_id)=>{
  //var desktop=[process.stdin];
  var with_proxy_link_id=proxy_link_id=>
  {
    var ok_run_writer=s=>{
      qap_log('ok_run_writer: s = '+s);
      xhr_proxy_shell_writer_impl(method,PROXY_URL+'/rt_sh',ok,err,proxy_link_id,URL);
    }
    // this_shell_js
    var func_to_var_decl=func=>"var "+func+"="+eval("("+func+").toString()")+";\n";
    var code=func_to_var_decl('qap_http_request_decoder')+(()=>{
      // this_zeit
      var xhr_shell_reader_but_to_stdin=(method,URL,ok,err,link_id,proxy_link_id)=>{
        // this_zeit
        var sh=spawn('bash',['-i'],{detached:true});
        call_cb_on_err(sh,qap_log,'sh');
        var link=getmap(g_links,link_id);
        link.sh=sh;
        link.on_up(sh,/*on_exit*/()=>{
          qap_log("xhr_shell_reader_but_to_stdin.link.on_up.on_exit: req.abort();");req.abort();
          sh.kill('SIGHUP');delete z2func['inp'];delete g_links[link_id];
        });
        // this_zeit
        var fromR=(z,msg)=>{/*qap_log("\n"+json({z:z,msg:msg}));*/if(z in z2func)z2func[z](msg);};
        var z2func={inp:msg=>sh.stdin.write(msg),exit:()=>{qap_log("xhr_shell_reader_but_to_stdin.zfunc.exit: got it");}};
        var req=qap_http_request_decoder(method,URL,fromR,()=>{qap_log("wtf? reader end? usally i call 'process.exit()' there, but not now; // url = "+URL);});
        var toR=z=>stream_write_encoder(req,z);
        toR("eval")(
          "var proxy_link_id="+json(proxy_link_id)+";"+
          (()=>{
            // this_proxy
            var stream_write_encoder_v2=(stream,z,data)=>{
              var sep=Buffer.from([0]);
              stream.write(Buffer.concat([
                Buffer.from(!data?"0":(data.length+""),"binary"),sep,
                Buffer.from(z,"binary"),sep,
                Buffer.from(data?data:"","binary")
              ]));
            };
            var toR_v2_impl=(z,msg)=>stream_write_encoder_v2(response,z,msg);
            var link=getmap(g_links,proxy_link_id);
            if('proxy' in link){
              link.proxy.buff.map(e=>toR_v2_impl(e[0],e[1]));link.proxy.buff=[];
              link.proxy.toR_v2=toR_v2_impl;
              qap_log("link.proxy.buff used :)");
            }else{
              link.proxy={};
            }
            link.proxy.toR_v2=toR_v2_impl;
            //z2func.zmsg=zmsg=>{var t=JSON.parse(zmsg);link.proxy.toR_v2(t[0],t[1]);}
          }).toString().split("\n").slice(1,-1).join("\n")
        );
        req.end();
        return req;
      }
      xhr_shell_reader_but_to_stdin('post',qp.proxy+'/rt_sh',qap_log,qap_log,qp.link_id,qp.proxy_link_id);
      return 'done';
    }).toString().split("\n").slice(1,-1).join("\n");
    var post_params={code:code,proxy:PROXY_URL,proxy_link_id:proxy_link_id,link_id:link_id};
    fs.writeFileSync('dbg.json','post_params = '+json(post_params));
    xhr_post(URL+"/eval?nolog",post_params,ok_run_writer,s=>qap_log("xhr_proxy_shell_writer.xhr_evalno_log.url fails: "+s));
  }
  xhr_post(PROXY_URL+"/eval?nolog",{code:'return new_link().id;'},with_proxy_link_id,s=>qap_log("xhr_proxy_shell_writer.xhr_evalno_log.proxy fails: "+s));
}

var xhr_shell_reader=(method,URL,ok,err,link_id)=>{
  var fromR=(z,msg)=>{/*qap_log("\n"+json({z:z,msg:msg}));*/if(z in z2func)z2func[z](msg);};
  var z2func={
    out:msg=>process.stdout.write(msg),
    err:msg=>process.stderr.write(msg),
    qap_log:msg=>qap_log("formR :: "+msg),
    exit:msg=>process.exit(),
    ok:msg=>ok(msg)
  };
  var req=qap_http_request_decoder(method,URL,fromR,()=>{qap_log("qap_http_request_decoder.on_end: process.exit();");process.exit();});
  var toR=z=>stream_write_encoder(req,z);
  toR("eval")(
    "var link_id="+json(link_id)+";"+
    (()=>{
      /*response.writeHead(200,{
        "Content-Type":"text/plain",
        'Transfer-Encoding':'chunked',
        'X-Content-Type-Options':'nosniff',
        'Cache-Control':'no-transform',
        'content-encoding':'br'
      });
      toR('qap_log')("inspect(request) = "+inspect(request));
      response.end();
      */
      response.socket.setNoDelay()
      var q=a=>toR("qap_log")("["+getDateTime()+"] :: "+a);
      var finish=msg=>{
        q(msg);
        toR("exit")();
        on_exit();
      }
      var stream_write_encoder_v2=(stream,z,data)=>{
        var sep=Buffer.from([0]);
        stream.write(Buffer.concat([
          Buffer.from(!data?"0":(data.length+""),"binary"),sep,
          Buffer.from(z,"binary"),sep,
          Buffer.from(data?data:"","binary")
        ]));
      };
      var toR_v3=z=>msg=>{
        //response.socket.cork();
        stream_write_encoder_v2(response,z,msg);
        //stream_write_encoder_v2(response,'toR_v3::dev_test','\r\n\0');
        //response.socket.uncork();
        //need use HTTP/2
      }
      getmap(g_links,link_id).on_up=(sh,onexit)=>{
        on_exit_funcs.push(onexit);
        sh.stderr.on("data",toR_v3("err")).on('end',()=>q("end of bash stderr"));
        sh.stdout.on("data",toR_v3("out")).on('end',()=>q("end of bash stdout"));
        sh.on('close',code=>finish("bash exited with code "+code));
      }
      q("begin");
      toR("ok")();
    }).toString().split("\n").slice(1,-1).join("\n")
  );
  req.end();
  return req;
}

var force_http=false;
var g_conf={};
var with_protocol=host=>{
  assert(!url.parse(host).protocol);
  var c=g_conf;
  if(!(host in c.host2vh))return host;
  var vh=c.host2vh[host];
  var a=['http://','https://'];
  return a[c.inp.without_https.includes(vh)?0:1]+host;
};

var main=(h2dns)=>{
  var fn="mask_basepix_log.txt";
  var api="duplex";var host="";var proxy="";
  
  var f=(key,val)=>{
    if(key==="http"){force_http=true;}
    if(key==="api"){api=val;}
    if(key==="fn"){fn=val;}
    if(key==="host"){if(val in h2dns){host=with_protocol(h2dns[val]);}else{host=with_protocol(val);}}
    if(key==="proxy"){if(val in h2dns){proxy=with_protocol(h2dns[val]);}else{proxy=with_protocol(val);}}
  };
  
  process.argv.map(e=>{var t=e.split("=");if(t.length!=2)return;f(t[0],t[1]);});
  if(!host.length)return qap_log("no way // host.length == 0");
  qap_log("host = "+host);

  if(api=="inspect")qap_log(inspect(process.argv));
  if(api=="shell")xhr_shell("post",host+"/rt_sh",qap_log,qap_log);
  if(api=="upload")xhr_blob_upload("post",host+"/rt_sh",qap_log,qap_log,fn);
  if(api=="proxy"){
    var with_link_id=link_id=>{
      var ok=s=>{
        xhr_proxy_shell_writer("post",proxy,host,qap_log,qap_log,link_id);
      }
      xhr_shell_reader("post",host+"/rt_sh",ok,qap_log,link_id);
    }

    var code=`return new_link().id;`;
    xhr_post(host+"/eval?nolog",{code:code},with_link_id,s=>qap_log("xhr_evalno_log fails: "+s));
  }
  if(api=="duplex"||api=="dup"){
    var with_link_id=link_id=>{
      var ok=s=>{
        xhr_shell_writer("post",host+"/rt_sh",qap_log,qap_log,link_id);
      }
      xhr_shell_reader("post",host+"/rt_sh",ok,qap_log,link_id);
    }

    var code=`return new_link().id;`;
    xhr_post(host+"/eval?nolog",{code:code},with_link_id,s=>qap_log("xhr_evalno_log fails: "+s));
  }
}

var hosts={};var hosts_err_msg='';var need_coop_init=true;

var hosts_update=hosts=>{
  var conv=x=>{
    var out={power:{},host2vh:{},public:[]};
    for(var host in x.host2str){var a=x.host2str[host].split("|");out.host2vh[host]=a[0];out.power[a[0]]=a[1];}
    out.public=x.public.split("|").map(e=>mapswap(out.host2vh)[e]);
    mapkeys(x.host2str).map(k=>{if(out.public.includes(k))return;out.public.push(k);});
    return out;
  };
  hosts.main_out=conv(hosts.main);
  var src=hosts.main_out;
  src.inp=hosts.main;
  mapkeys(src).map(key=>g_conf[key]=src[key]);
  g_conf.vh2host=mapswap(src.host2vh);
  qap_log("mapkeys(g_conf.power) = "+mapkeys(g_conf.power).join(","));
  main(mapswap(hosts.main_out.host2vh));
  return hosts;
};

var hosts_sync=(bef,aft)=>{
  if((typeof bef)!="function")bef=()=>{};
  if((typeof aft)!="function")aft=()=>{};
  xhr_get('https://raw.githubusercontent.com/adler3d/qap_vm/gh-pages/trash/test2017/hosts.json?t='+rand(),
    s=>{
      bef(s);
      try{hosts=JSON.parse(s);}catch(e){cb(qap_err('hosts_sync.JSON.parse.hosts',e)+'\n\n'+s);return;}
      try{hosts=hosts_update(hosts);}catch(e){cb(qap_err('hosts_sync.hosts_update',e)+'\n\n'+s);return;}
      aft(s);
    },
    s=>{hosts_err_msg=s;cb(s);}
  );
};
hosts_sync(qap_log);