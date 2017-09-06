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

var qap_log=s=>console.log("["+getDateTime()+"] "+s);
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

var file_exist=fn=>{try{fs.accessSync(fn);return true;}catch(e){return false;}}
var rand=()=>(Math.random()*1024*64|0);

var xhr=(method,URL,data,ok,err)=>{
  var up=url.parse(URL);var secure=up.protocol=='https';
  var options={
    hostname:up.hostname,port:up.port?up.port:(secure?443:80),path:up.path,method:method.toUpperCase(),
    headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}
  };
  var req=(secure?https:http).request(options,(res)=>{
    var statusCode=res.statusCode;var contentType=res.headers['content-type'];var error;
    if(statusCode!==200){error=new Error('Request Failed.\nStatus Code: '+statusCode);}
    if(error){err(error.message,res);res.resume();return;}
    //res.setEncoding('utf8');
    var rawData='';res.on('data',(chunk)=>rawData+=chunk.toString("binary"));
    res.on('end',()=>{try{ok(rawData,res);}catch(e){err(e.message,res);}});
  }).on('error',e=>{err('Got error: '+e.message,null);});
  req.end(data);
  return req;
}

var hosts=[
  "http://vm-vm.1d35.starter-us-east-1.openshiftapps.com/eval",
  "http://agile-eyrie-44522.herokuapp.com/eval"
];

var xhr_shell=(method,URL,data,ok,err)=>{
  var up=url.parse(URL);var secure=up.protocol=='https';
  var options={
    hostname:up.hostname,port:up.port?up.port:(secure?443:80),path:up.path,method:method.toUpperCase(),
    headers:{'qap_type':'rt_sh','Transfer-Encoding':'chunked'}
    //headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}
  };
  var linked=false;
  var req=(secure?https:http).request(options,(res)=>{
    var statusCode=res.statusCode;var contentType=res.headers['content-type'];var error;
    if(statusCode!==200){error=new Error('Request Failed.\nStatus Code: '+statusCode);}
    if(error){err(error.message,res);res.resume();return;}
    //res.setEncoding('utf8');
    if(!linked)
    {
      res.pipe(process.stdout);
      res.on('error',e=>{qap_log('Got error: '+e.message,null);});
      linked=true;
    }
    //var rawData='';res.on('data',(chunk)=>rawData+=chunk.toString("binary"));
    //res.on('end',()=>{try{ok(rawData,res);}catch(e){err(e.message,res);}});
  }).on('error',e=>{qap_log('Got error: '+e.message,null);});
  process.stdin.on("data",data=>{
    req.write((data+"").split("\r").join(""));
    //process.stdin.resume();
  });
  //process.stdin.resume();
  //process.stdin.pipe(req);
  //var i=0;
  //setInterval(()=>{if(i<96)req.write("echo hehehehe\n");i++;},16);
  //req.end(data);
  //qap_log(req.end.toString());
  return req;
}

xhr_shell("post","http://vm-vm.1d35.starter-us-east-1.openshiftapps.com/rt_sh");

/*
var json=JSON.stringify;

var s=(()=>{
  var f=(response)=>{
    response.writeHead(200,{"Content-Type":"text/plain",'Transfer-Encoding':'chunked'});
    var i=0;
    response.write("begin\n"+getDateTime()+"\n");
    if(0)set_interval(
      ()=>{
        if(i<96)response.write("hi form rt_sh "+i+"\n");
        i++;
      },
      16
    );
    var sh=spawn('sh');
    var to_resp=data=>response.write(data);
    sh.stdout.on("data",to_resp);
    sh.stderr.on("data",to_resp);
    request.on("data",data=>sh.stdin.write(data));
    //sh.stdout.pipe(response);
    //sh.stderr.pipe(response);
    //request.pipe(sh.stdin);
  };
  f(response);
}).toString().split("\n").slice(1,-1).join("\n");

var code="g_obj.rt_sh="+json(s)+";return inspect(g_obj.rt_sh);";

xhr(
  "post",
  hosts[0],
  qs.stringify({code:code}),
  qap_log,qap_log
);/**/


































































