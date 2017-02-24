var http = require("http"),
    https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    os = require("os");

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
var fn="main.js";
xhr_get(repo+fn+'?t='+rand(),s=>{
  fs.writeFileSync(fn,s);
  console.log("["+getDateTime()+"] fetch done //length = "+Buffer.byteLength(s));
},console.error);
