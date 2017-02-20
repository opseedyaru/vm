const util = require('util');
const vm = require('vm');

var http = require("http"),
    https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

var qs = require('querystring');
var g_obj={};
process.on('uncaughtException',err=>console.log(err));

var json=s=>JSON.stringify(s);
var mapkeys=Object.keys;var mapvals=(m)=>mapkeys(m).map(k=>m[k]);
var inc=(m,k)=>{if(!(k in m))m[k]=0;m[k]++;return m[k];};

var getarr=(m,k)=>{if(!(k in m))m[k]=[];return m[k];};
var getmap=(m,k)=>{if(!(k in m))m[k]={};return m[k];};

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

var hosts={};var hosts_err_msg='';

var hosts_sync=(cb)=>{
  if(typeof cb=='undefined')cb=()=>{};
  xhr_get('http://adler3d.github.io/qap_vm/trash/test2017/hosts.json',s=>{hosts=JSON.parse(s);cb(s);},s=>{hosts_err_msg=s;cb(s);});
};

hosts_sync();

var is_public=host=>hosts[host]=='public';
var is_shadow=host=>hosts[host]=='shadow';

var http_server=http.createServer((a,b)=>requestListener(a,b)).listen(port,ip);
var requestListener=(request, response)=>{
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);

  console.log("uri = "+uri);
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
    var is_dir=fn=>fs.statSync(filename).isDirectory();
    fs.exists(filename,ok=>{if(ok&&is_dir(filename))filename+='/index.html';func(filename);});
    var func=filename=>fs.exists(filename,function(exists) {
      var txt=((res)=>{var r=res;return s=>{r.writeHead(200,{"Content-Type":"text/plain"});r.end(s);}})(response);
      var qp=qs.parse(url.parse(request.url).query);
      var POST=POST_BODY.length?qs.parse(POST_BODY):{};
      var shadow=mapkeys(hosts)[mapvals(hosts).indexOf('shadow')];
      var collaboration=cb=>{
        if(!is_public(request.headers.host)){cb();return;}
        xhr_post('http://'+shadow+uri,qp,s=>cb(),s=>txt('coop_fail:\n'+s));
        return;
      };
      response.off=()=>response={writeHead:()=>{},end:()=>{}};
      var coop=collaboration;
      mapkeys(POST).map(k=>qp[k]=POST[k]);
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
      if("/"==uri){
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("count="+inc(g_obj,'counter'));
        return;
      }
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
    });
  });
}

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
