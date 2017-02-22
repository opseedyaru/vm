const util = require('util');
const vm = require('vm');

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

var qap_log=s=>console.log("["+getDateTime()+"] "+s);

var json=s=>JSON.stringify(s);
var mapkeys=Object.keys;var mapvals=(m)=>mapkeys(m).map(k=>m[k]);
var inc=(m,k)=>{if(!(k in m))m[k]=0;m[k]++;return m[k];};

var getarr=(m,k)=>{if(!(k in m))m[k]=[];return m[k];};
var getmap=(m,k)=>{if(!(k in m))m[k]={};return m[k];};

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
    if(error){err(error.message);res.resume();return;}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk);
    res.on('end',()=>{try{ok(rawData);}catch(e){err(e.message);}});
  }).on('error',(e)=>{err('Got error: '+e.message);});
  req.end(data);
  return req;
}

var xhr_post=(url,obj,ok,err)=>xhr('post',url,qs.stringify(obj),ok,err);

var hosts={};var hosts_err_msg='';var need_coop_init=true;

var hosts_sync=(cb)=>{
  if(typeof cb=='undefined')cb=()=>{};
  xhr_get('https://raw.githubusercontent.com/adler3d/qap_vm/gh-pages/trash/test2017/hosts.json',s=>{hosts=JSON.parse(s);cb(s);},s=>{hosts_err_msg=s;cb(s);});
};

hosts_sync();

var is_public=host=>hosts[host]=='public';
var is_shadow=host=>hosts[host]=='shadow';

var http_server=http.createServer((a,b)=>requestListener(a,b)).listen(port,ip);
var requestListener=(request, response)=>{
  var purl=url.parse(request.url);var uri=purl.pathname;var qp=qs.parse(purl.query);
  var filename = path.join(process.cwd(), uri);

  qap_log("uri = "+purl.path);
  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript",
    '.txt':  "text/plain"
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
      var txt=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/plain"});r.end(s);}})(response);
      var shadow=mapkeys(hosts)[mapvals(hosts).indexOf('shadow')];
      var master=mapkeys(hosts)[mapvals(hosts).indexOf('public')];
      var req_handler=()=>{
        var collaboration=cb=>{
          if(!is_public(request.headers.host)){cb();return;}
          xhr_post('http://'+shadow+uri,qp,s=>cb(),s=>txt('coop_fail:\n'+s));
          return;
        };
        response.off=()=>response={writeHead:()=>{},end:()=>{}};
        var coop=collaboration;
        if("/g_obj.json"==uri){
          txt(json(g_obj));
          return;
        }
        if("/hosts.json"==uri){
          hosts_sync(s=>txt(s));
          return;
        }
        if("/del"==uri){
          coop(()=>{
            var files=getmap(g_obj,'files');
            delete files[qp.fn];
            txt(json(qp));
          });
          return;
        }
        if("/put"==uri){
          coop(()=>{
            getmap(g_obj,'files')[qp.fn]=qp.data;
            txt(json(qp));
          });
          return;
        }
        if("/get"==uri){
          //coop(()=>{
            txt(getmap(g_obj,'files')[qp.fn]);
          //});
          return;
        }
        if("/list"==uri||"/ls"==uri){
          //coop(()=>{
            txt(mapkeys(getmap(g_obj,'files')).join("\n"));
          //});
          return;
        }
        if("/hostname"==uri){return txt(os.hostname());}
        if("/close"==uri||"/quit"==uri||"/exit"==uri){setTimeout(()=>process.exit(),16);return txt("ok");}
        if("/"==uri)return coop(()=>txt("count = "+inc(g_obj,'counter')));
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
            xhr_post('http://'+master+'/ping',{},none,none);
          },1000);
        }
        if(pub)g_interval=setInterval(()=>xhr_post('http://'+shadow+'/tick',{},none,none),period);
        var server=pub?shadow:master;
        xhr_post('http://'+server+'/g_obj.json',{},s=>{g_obj=JSON.parse(s);req_handler();},s=>txt('coop_init_fail:\n'+s));
        return;
      }
      req_handler();
    });
  });
}
qap_log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
