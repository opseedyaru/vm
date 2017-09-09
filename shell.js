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

var call_cb_on_err=(emitter,cb,...args)=>{
  emitter.on('error',err=>{
    cb("'inspect({args,err}) // stack': "+inspect({args:args,err:err})+" // "+err.stack.toString());
  });
}

var qap_log=s=>console.log("["+getDateTime()+"] "+s);

var qap_err=(context,err)=>context+" :: err = "+inspect(err)+" //"+err.stack.toString();
var log_err=(context,err)=>qap_log(qap_err(context,err));

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

var ee_logger=(emitter,name,events)=>{
  events.split(',').map(event=>emitter.on(event,e=>qap_log(name+' :: Got '+event)));
}

var emitter_on_data_decoder=(emitter,cb)=>{
  var rawData='';
  emitter.on('data',data=>{
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
    cb(z,msg);
  });
}

var hosts=[
  "http://vm-vm.1d35.starter-us-east-1.openshiftapps.com",
  "http://agile-eyrie-44522.herokuapp.com",
  "http://vm-vm.193b.starter-ca-central-1.openshiftapps.com"
];

var xhr_shell=(method,URL,ok,err)=>{
  var up=url.parse(URL);var secure=up.protocol=='https';
  var options={
    hostname:up.hostname,port:up.port?up.port:(secure?443:80),path:up.path,method:method.toUpperCase(),
    headers:{'qap_type':'rt_sh','Transfer-Encoding':'chunked'}
    //headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}
  };
  var once=false;
  var req=(secure?https:http).request(options,(res)=>
  {
    var statusCode=res.statusCode;
    if(res.statusCode!==200){err('Request Failed.\nStatus Code: '+res.statusCode);res.destroy();req.destroy();return;}
    ee_logger(res,'xhr_shell.res','end,abort,aborted,connect,continue,response,upgrade');
    call_cb_on_err(res,qap_log,'xhr_shell.res');
    var fromR=(z,msg)=>{if(z in z2func)z2func[z](msg);};
    var z2func={
      out:msg=>process.stdout.write(msg),
      err:msg=>process.stderr.write(msg),
      qap_log:msg=>qap_log("formR :: "+msg),
      exit:msg=>process.exit()
    };
    emitter_on_data_decoder(res,fromR);
    res.on('end',()=>process.exit());
  });
  ee_logger(req,'xhr_shell.req','end,abort,aborted,connect,continue,response,upgrade');
  call_cb_on_err(req,qap_log,'xhr_shell.req');

  req.setNoDelay();
  var toR=z=>data=>req.write(data.length+"\0"+z+"\0"+data);
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
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',data=>{if(data==='\u0003')process.exit();inp(data);});
  var ps1=(()=>{
    //STARTCOLOR='\e[0;32m';
    //ENDCOLOR="\e[0m"
    //export PS1="$STARTCOLOR[\$(date +%k:%M:%S)] \w |\$?> $ENDCOLOR"
    //export TERM='xterm'
    //alias rollback='pkill -f npm'
    //alias cls='clear'
    //alias ll='ls -all --color=always'
    //alias grep='grep --color=always'
    //LS_COLORS=$LS_COLORS:'di=0;33:' ; export LS_COLORS
    //ps -aux
  }).toString().split("\n").slice(1,-1).join("\n").split("    //").join("");
  var press_insert_key=String.fromCharCode(27,91,50,126);
  inp(press_insert_key);
  inp(ps1+"\n");
  inp("echo welcome!\n");
  process.stdin.resume();
  return req;
}

var json=JSON.stringify;

xhr_shell("post",hosts[2]+"/rt_sh",qap_log,qap_log);
































































