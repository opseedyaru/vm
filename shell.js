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
  "http://vm-vm.1d35.starter-us-east-1.openshiftapps.com",
  "http://agile-eyrie-44522.herokuapp.com",
  "http://vm-vm.193b.starter-ca-central-1.openshiftapps.com"
];

var xhr_shell=(method,URL)=>{
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
    if(!linked)
    {
      var rawData='';
      res.on('data',data=>{

        rawData+=data.toString("binary");
        var e=rawData.indexOf("\0");
        if(e<0)return;
        var t=rawData.split("\0");
        if(t.length<3)return;
        var len=t[0]|0;
        var out=t.slice(2).join("\0");
        if(out.length<len)return;
        var z=t[1];
        var msg=out.substr(0,len);
        rawData=out.substr(len);
        if(z==="out"||z==="err")process.stdout.write(msg);
        
        //process.stdout.write(data);
      });
      res.on('error',e=>{qap_log('Got error: '+e.message,null);});
      linked=true;
    }
  }).on('error',e=>{qap_log('Got error: '+e.message,null);});

  var to_req=z=>data=>{
    req.write(data.length+"\0"+z+"\0"+data)
  };
  var inp=to_req("inp");
  var ping=to_req("ping");
  
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',data=>{
    if(data==='\u0003')process.exit();
    inp(data);
  });
  process.stdin.resume();
  inp("echo welcome!\n");
  var ps1=(()=>{
    //STARTCOLOR='\e[0;32m';
    //ENDCOLOR="\e[0m"
    //export PS1="$STARTCOLOR[\$(date +%k:%M:%S)] \w |\$?> $ENDCOLOR"
  }).toString().split("\n").slice(1,-1).join("\n").split("    //").join("");
  inp(ps1+"\n");
  var iter=0;setInterval(()=>ping(""+(iter++)),500);
  return req;
}

var json=JSON.stringify;

var s=(()=>{
  var f=(request,response)=>{
    response.writeHead(200,{"Content-Type":"text/plain",'Transfer-Encoding':'chunked'});
    var sh=spawn('bash',['-i']);
    var to_resp=z=>data=>{
      response.write(data.length+"\0"+z+"\0"+data);
    };
    var ping=to_resp("ping");
    var iter=0;set_interval(()=>ping(""+(iter++)),500);
    sh.stderr.on("data",to_resp("err"));
    sh.stdout.on("data",to_resp("out"));
    to_resp("out")("\n["+getDateTime()+"] :: begin\n");
    var rawData='';
    request.on("data",data=>{
      rawData+=data.toString("binary");
      var e=rawData.indexOf("\0");
      if(e<0)return;
      var t=rawData.split("\0");
      if(t.length<3)return;
      var len=t[0]|0;
      var out=t.slice(2).join("\0");
      if(out.length<len)return;
      var z=t[1];
      var msg=out.substr(0,len);
      rawData=out.substr(len);
      if(z==="inp")sh.stdin.write(msg);
    });
  };
  f(request,response);
}).toString().split("\n").slice(1,-1).join("\n");

var code="g_obj.rt_sh="+json(s)+";return '['+getDateTime()+'] :: ok';//g_obj.rt_sh = ...\\n'+g_obj.rt_sh;";

xhr(
  "post",
  hosts[2]+"/eval",
  qs.stringify({code:code}),
  s=>{
    qap_log(s);
    xhr_shell("post",hosts[2]+"/rt_sh");
  },qap_log
);


































































