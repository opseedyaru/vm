var net = require('net');

var fs=require('fs');

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

var stream_write_encoder_v2=(stream,z,data)=>{
  var sep=Buffer.from([0]);
  stream.write(Buffer.concat([
    Buffer.from(!data?"0":(data.length+""),"binary"),sep,
    Buffer.from(z,"binary"),sep,
    Buffer.from(data?data:"","binary")
  ]));
};

var net = require('net');
//

var mode='proxy';var fn="phub.MPLOG";var show="false";var no_dump="false";
var ray='127.0.0.1:45631';
var hub='140.82.34.102:45600';

var f=(key,val)=>{
  if(key==="mode"){mode=val;}
  if(key==="fn"){fn=val;}
  if(key==="ray"){ray=val;}
  if(key==="hub"){hub=val;}
  if(key==="show"){show=val;}
  if(key==="no_dump"){no_dump=val;}
};
process.argv.map(e=>{var t=e.split("=");if(t.length!=2)return;f(t[0],t[1]);});

if('ray2hub'===mode)
{
  qap_log('ray2hub client runned // params = '+json({ray:ray,hub:hub}));
  var say=(msg)=>qap_log("ray2hub :: "+msg);
  var connect_to_hub=(host,port)=>{
    var client=new net.Socket();
    client.connect(port,host,()=>{
      say("hub.connected // addr = "+host+":"+port);
      stream_write_encoder_v2(client,'qap_log',"agent:rt_cat v1.0");
      stream_write_encoder_v2(client,'cmd',"ray2hub");
    });
    client.on('close',()=>{
      say("hub.close // addr = "+host+":"+port);
    });
    return client;
  }
  var cpp2hub=(host,port,hub_ip,hub_port)=>{
    var client=new net.Socket();
    client.connect(port,host,()=>{
      say("cpp_app.connected // addr = "+host+":"+port);
      var to_hub=connect_to_hub(hub_ip,hub_port);
      client.on('data',stream_write_encoder(to_hub,'ray'));
      to_hub.on('close',()=>{
        client.destroy();to_hub.destroy();
      });
      client.on('close',()=>{
        to_hub.destroy();
      });
    });
    client.on('close',()=>{
      say("cpp_app.close // addr = "+host+":"+port);
    });
  }
  var src=ray.split(":");var dest=hub.split(":");
  cpp2hub(src[0],src[1]|0,dest[0],dest[1]|0);// nc 140.82.34.102 45600
}

var parse_ray=(msg)=>{
  var buf=Buffer.from(msg,"binary");
  var ints='version,size,x,y,raw_wins';//readInt32LE
  var rc='int n;double r,g,b;';//readDoubleLE
  var rcs='frag,only_details,simple_frag';
  var pos=0;
  var out={};
  var read_rc=()=>{
    var out={};
    out.n=buf.readInt32LE(pos);pos+=4;
    pos+=4;// skip padding
    'r,g,b'.split(',').map(e=>{out[e]=buf.readDoubleLE(pos);pos+=8;});
    return out;
  }
  ints.split(',').map(e=>{out[e]=buf.readInt32LE(pos);pos+=4;});
  pos+=4;// skip padding
  rcs.split(',').map(e=>{out[e]=read_rc();});
  out.ms=buf.readDoubleLE(pos);pos+=8;
  return out;
  //struct t_pix_info{LIST(F);t_lights_rays_color frag,only_details,simple_frag;real ms;};
  //buf.readDoubleLE()
}

var hex=msg=>Buffer.from(msg,"binary").toString('hex');

if('hub2ray'===mode)
{
  var hub2app=(host,port,no_dump)=>{
    qap_log('hub2ray client runned // params = '+json({show:show,hub:hub,fn:fn,no_dump:no_dump}));
    var client=new net.Socket();
    client.connect(port,host,()=>{
      var ip_port=client.remoteAddress+":"+client.remotePort;
      var say=(msg)=>qap_log("hub2ray["+ip_port+"] :: "+msg);
      say("hub.connected // addr = "+host+":"+port);
      stream_write_encoder_v2(client,'cmd',"hub2ray");
      var fromR=(z,msg)=>{if(z in z2func)z2func[z](msg);};
      var show_cmds={
        false:()=>{return ()=>{}},
        json:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].json = "+json(msg));},
        size:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].size = "+msg.length);},
        stdout:()=>(msg)=>process.stdout.write(msg),
        hex:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].hex = "+hex(msg));},
        parse_ray:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].parse = "+inspect(parse_ray(msg)));},
      };
      var show_cmd=()=>{};
      if(show in show_cmds)show_cmd=show_cmds[show]();
      var out=no_dump?0:fs.createWriteStream(fn,{flags:'a'});
      var z2func={
        ray:(msg)=>{
          show_cmd(msg);
          if(!no_dump)out.write(Buffer.from(msg,"binary"));
        },
        qap_log:msg=>say("formR :: "+msg)
      };
      emitter_on_data_decoder(client,fromR);
    });
    client.on('close',()=>{
      say("hub.close // addr = "+host+":"+port);
    });
  }
  var dest=hub.split(":");
  hub2app(dest[0],dest[1]|0,no_dump!="false");// nc 140.82.34.102 45600
}

if('hub'===mode)
{
  qap_log('hub server runned // params = '+json({hub:hub,show:show,fn:fn,no_dump:no_dump}));
  var hub_server=(port)=>
  {
    let hub={ray2hub:[],hub2app:[],hub2ray:[]};
    var server=net.createServer(socket=>
    {
      var ip_port=socket.remoteAddress+":"+socket.remotePort;
      var say=(msg)=>qap_log("hub["+ip_port+"] :: "+msg);
      say("opened");
      var fromR=(z,msg)=>{if(z in z2func)z2func[z](msg);};
      var show_cmds={
        false:()=>{return ()=>{}},
        json:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].json :: "+json(msg));},
        size:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].size :: "+msg.length);},
        stdout:()=>(msg)=>process.stdout.write(msg),
        hex:()=>{var i=0;return (msg)=>say("ray["+(i++)+"].hex :: "+hex(msg));},
        parse_ray:()=>{var i=0;return (msg)=>qap_log("ray["+(i++)+"].parse :: "+inspect(parse_ray(msg)));},
      };
      var show_cmd=()=>{};
      if(show in show_cmds)show_cmd=show_cmds[show]();
      var out=fs.createWriteStream(fn,{flags:'a'});
      var z2func={
        cmd:msg=>{
          if('hub2ray,hub2app,ray2hub'.split(",").includes(msg))
          {
            var arr=hub[msg];
            say('hub.'+msg+'['+arr.length+'] :: opened');
            arr.push(socket);
            delete z2func['cmd'];
          }
        },
        ray:(msg)=>{
          show_cmd(msg);
          out.write(Buffer.from(msg,"binary"));
          for(var i=0;i<hub.hub2app.length;i++)hub.hub2app[i].write(msg);
          for(var i=0;i<hub.hub2ray.length;i++)stream_write_encoder_v2(hub.hub2ray[i],'ray',msg);
        },
        qap_log:msg=>say("formR :: "+msg)
      };
      emitter_on_data_decoder(socket,fromR);
      socket.on('close',()=>{
        say("closed");
        mapkeys(hub).map(k=>{var id=hub[k].indexOf(socket);if(id<0)return;say('hub.'+k+'['+id+'] :: closed');hub[k].splice(id,1);});
      });
    });
    server.listen(port,'0.0.0.0');
    qap_log('hub_server running at port '+port);
  };
  var dest=hub.split(":");
  hub_server(dest[1]|0);
}
var exec_v2=cmd=>{
  var p=spawn('bash',[]/*,{detached:true}*/);
  p.stdin.end(cmd+"\n");
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  return p;
}
if('vultr_hub'==mode){
  qap_log('vultr_hub - v1.6');
  [
    "node rt_cat.js mode=hub hub=127.0.0.1:45600",
    "node rt_cat.js mode=ray2hub hub=127.0.0.1:45600 ray=127.0.0.1:45631",
  ].map(e=>exec_v2(e));
  //setTimeout(()=>{qap_log("timeout");process.exit();},30000);
}

// vultr_ip > nohup node rt_cat.js mode=ray2hub hub=127.0.0.1:45600 ray=127.0.0.1:45631 show=false 2>&1 > ray2hub.log &
// vultr_ip > nohup node rt_cat.js mode=hub hub=127.0.0.1:45600 2>&1 > hub.log &
// vm51 > nohup node ./rt_cat.js mode=ray2hub 2>&1 >ray2hub.log &