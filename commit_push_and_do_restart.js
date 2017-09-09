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

var QapNoWay=()=>{qap_log("QapNoWay :: no impl");qap_log("no way");}

var call_cb_on_err=(emitter,cb,...args)=>{
  emitter.on('error',err=>{
    cb("'inspect({args,err}) // stack': "+inspect({args:args,err:err})+" // "+err.stack.toString());
  });
}

var qap_err=(context,err)=>context+" :: err = "+inspect(err)+" //"+err.stack.toString();
var log_err=(context,err)=>qap_log(qap_err(context,err));

process.on('uncaughtException',err=>log_err('uncaughtException',err));

var qap_add_time=s=>"["+getDateTime()+"] "+s;
var qap_log=s=>console.log(qap_add_time(s));

var json=JSON.stringify;

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

var hosts=[
  "http://vm-vm.1d35.starter-us-east-1.openshiftapps.com",
  "http://agile-eyrie-44522.herokuapp.com",
  "http://vm-vm.193b.starter-ca-central-1.openshiftapps.com"
];

var sh=spawn('sh.exe',['-c',"git commit -am 'upd'\ngit push"],{stdio:[0,1,2]});
var u=event=>sh.on(event,e=>qap_log('sh :: Got '+event));
'close,disconnect,error,exit,message'.split(',').map(u);
sh.on('close',()=>xhr_get(hosts[2]+"/fetch?quit",qap_log,qap_log));
































































