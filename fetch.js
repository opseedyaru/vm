var http = require("http"),
    https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    os = require("os");

var qap_log=s=>console.log("["+getDateTime()+"] "+s);
var qap_err=(context)=>(s=>console.log("["+getDateTime()+"] "+context+": "+s));

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
var rand=()=>(Math.random()*1024*64|0);

var repo="https://raw.githubusercontent.com/gitseo/vm/master/";
"main.js|fetch.js|json2table_fish.html".split("|").map(fn=>
  xhr_get(repo+fn+'?t='+rand(),s=>{
    fs.writeFileSync(fn,s);
    qap_log("fetch done //length = "+Buffer.byteLength(s));
  },qap_err('xhr_get fail'));
);
