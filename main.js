const util = require('util');
const vm = require('vm');

var child_process=require('child_process');

var http = require("http"),
    https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    os = require("os");

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

var get_tick_count=()=>new Date().getTime();

var qs = require('querystring');
var g_interval=false;var g_ping_base=get_tick_count();
var g_obj={};
process.on('uncaughtException',err=>qap_log(err));

var rand=()=>(Math.random()*1024*64|0);
var qap_log=s=>console.log("["+getDateTime()+"] "+s);

var json=JSON.stringify;
var mapkeys=Object.keys;var mapvals=(m)=>mapkeys(m).map(k=>m[k]);
var inc=(m,k)=>{if(!(k in m))m[k]=0;m[k]++;return m[k];};

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

var xhr_get=(url,ok,err)=>{
  var req=(url.substr(0,"https".length)=="https"?https:http).get(url,(res)=>{
    var statusCode=res.statusCode;var contentType=res.headers['content-type'];var error;
    if(statusCode!==200){error=new Error('Request Failed.\nStatus Code: '+statusCode);}
    if(error){err(error.message);res.resume();return;}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk);
    res.on('end',()=>{try{ok(rawData);}catch(e){err(e.message);}});
  }).on('error',(e)=>{err('Got error: '+e.message);});
  return req;
}

var xhr=(method,URL,data,ok,err)=>{
  var up=url.parse(URL);var secure=up.protocol=='https';
  var options={
    hostname:up.host,port:secure?443:80,path:up.path,method:method.toUpperCase(),
    headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}
  };
  var req=(secure?https:http).request(options,(res)=>{
    var statusCode=res.statusCode;var contentType=res.headers['content-type'];var error;
    if(statusCode!==200){error=new Error('Request Failed.\nStatus Code: '+statusCode);}
    if(error){err(error.message,res);res.resume();return;}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk);
    res.on('end',()=>{try{ok(rawData,res);}catch(e){err(e.message,res);}});
  }).on('error',e=>{err('Got error: '+e.message,null);});
  req.end(data);
  return req;
}

var xhr_post=(url,obj,ok,err)=>xhr('post',url,qs.stringify(obj),ok,err);

var hosts={};var hosts_err_msg='';var need_coop_init=true;

var hosts_sync=(cb)=>{
  if(typeof cb=='undefined')cb=()=>{};
  xhr_get('https://raw.githubusercontent.com/adler3d/qap_vm/gh-pages/trash/test2017/hosts.json?t='+rand(),
    s=>{try{hosts=JSON.parse(s);}catch(e){cb('JSON.parse error:\n'+e+'\n\n'+s);}cb(s);},
    s=>{hosts_err_msg=s;cb(s);}
  );
};

hosts_sync();

var is_public=host=>hosts[host]=='public';
var is_shadow=host=>hosts[host]=='shadow';

var request_to_log_object=request=>{
  var h=request.headers;
  return {
    time:getDateTime(),
    ip:h['x-forwarded-for'],
    request_uri:request.url,
    user_agent:h["user-agent"],
    method:request.method,
    referer:h.referer,
    host:request.headers.host,
    hostname:os.hostname()
  }
};

var http_server=http.createServer((a,b)=>requestListener(a,b)).listen(port,ip);
var requestListener=(request, response)=>{
  var purl=url.parse(request.url);var uri=purl.pathname;var qp=qs.parse(purl.query);
  var filename = path.join(process.cwd(), uri);

  qap_log("url = "+purl.path);
  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript",
    '.txt':  "text/plain",
    '.log':  "text/plain"
  };
  
  var on_request_end=(cb)=>{
    var body=[];
    request.on('error',err=>console.error(err));
    request.on('data',chunk=>body.push(chunk));
    request.on('end',()=>cb(Buffer.concat(body).toString()));
  };
  response.on('error',err=>console.error(err));
  on_request_end((POST_BODY)=>{
    var POST=POST_BODY.length?qs.parse(POST_BODY):{};
    mapkeys(POST).map(k=>qp[k]=POST[k]);POST=qp;
    var is_dir=fn=>fs.statSync(filename).isDirectory();
    fs.exists(filename,ok=>{if(ok&&is_dir(filename))filename+='/index.html';func(filename);});
    var func=filename=>fs.exists(filename,function(exists) {
      var raw_quit=()=>{setTimeout(()=>process.exit(),16);}
      var quit=()=>{raw_quit();return txt("["+getDateTime()+"] ok");}
      var html=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/html"});r.end(s);}})(response);
      var txt=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/plain"});r.end(s);}})(response);
      var shadow=mapkeys(hosts)[mapvals(hosts).indexOf('shadow')];
      var master=mapkeys(hosts)[mapvals(hosts).indexOf('public')];
      var req_handler=()=>{
        response.off=()=>response={writeHead:()=>{},end:()=>{}};
        if("/g_obj.json"==uri){
          txt(json(g_obj));
          return;
        }
        if("/hosts.json"==uri){
          hosts_sync(s=>txt(s));
          return;
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
            return json(['found at '+os.hostname(),f]);
          },
          "/ls":(qp,log_object)=>{
            return mapkeys(getmap(g_obj,'files')).join("\n");
          }
        };
        var collaboration=cb=>{
          var pub=is_public(request.headers.host);var server=pub?shadow:master;
          if(!pub)return txt("coop error: request denied, because conf = not public");
          var tmp=request_to_log_object(request);
          var f=qp=>({qp:json(qp),tmp:json(tmp)});
          xhr_post('http://'+server+'/internal?from='+os.hostname()+'&url='+uri,f(qp),s=>cb([s],tmp),s=>txt('coop_fail:\n'+s));
          return;
        };
        var coop=collaboration;
        if("/internal"==uri)((params)=>{
          var qp=JSON.parse(params.qp);
          var tmp=JSON.parse(params.tmp);var log_object=tmp;
          var uri=url.parse(tmp.request_uri).pathname;
          if(uri in cmds){return txt(json([cmds[uri](qp,log_object)]));}
          return txt("error: unknow cmd - '"+uri+"'");
        })(qp);
        if(uri in cmds){return coop((arr,log_object)=>txt(json([(cmds[uri](qp,log_object))].concat(arr))));}
        if("/hostname"==uri){return txt(os.hostname());}
        if("/fetch"==uri){
          (()=>{
            var repo="https://raw.githubusercontent.com/gitseo/vm/master/";
            var fn=('fn' in qp)?qp[fn]:"main.js";
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
        if("/tick"==uri){g_ping_base=get_tick_count();return txt("tick = "+inc(g_obj,'tick'));}
        if("/ping"==uri){g_ping_base=get_tick_count();return txt(getDateTime());}
        if("/eval"==uri){
          try{
            var system_tmp=eval("()=>{"+POST['code']+"\n;return '';}");
            system_tmp=system_tmp();
            if(response){
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.end(system_tmp);
              return;
            }
          }catch(err){
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.end("Internal Server Error:\n"+err.toString());
            console.error(err);
            return;
          }
        }
        if(!exists) {
          response.writeHead(404, {"Content-Type": "text/plain"});
          response.end("404 Not Found\n");
          return;
        }
        fs.readFile(filename, "binary", function(err, file) {
          if(err) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.end(err + "\n");
            return;
          }
          var headers = {};
          var contentType = contentTypesByExtension[path.extname(filename)];
          if (contentType) headers["Content-Type"] = contentType;
          response.writeHead(200, headers);
          response.write(file, "binary");
          response.end();
        });
      };
      if(need_coop_init){
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
        if(pub)g_interval=setInterval(()=>xhr_post('http://'+shadow+'/tick?from='+os.hostname(),{},none,none),period);
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
