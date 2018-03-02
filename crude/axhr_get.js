var c=g_conf_info;
resp_off();
//var code=POST.data;
var code=(
  (()=>{
    var trash=[];
    var check=(fn)=>{
      try{var data=fs.readFileSync(fn)+'';
        if(!data.length)return trash.push(fn);
        if(data[0]!='{')return trash.push(fn);
        //JSON.parse(data);
      }catch(e){trash.push(fn);}
    }
    fs.readdirSync('wmlogs').map(fn=>'wmlogs/'+fn).map(check);
    fs.writeFileSync('trash.txt',json(trash));
    response.write(inspect(trash)+get_ms()+'\n');
    var out=fs.createWriteStream('wmlogs.all.txt');
    var dir='wmlogs';
    var arr=fs.readdirSync(dir).filter(e=>e.includes('json')).map(fn=>dir+'/'+fn);
    //return resp_off(response.end(inspect(arr)));
    var add=(i,func,end)=>{
      if(!(i in arr))return end();
      out.write('\n');
      resp.write('fn='+arr[i]+'\n');
      fs.createReadStream(arr[i],'binary').on('data',s=>out.write(s)).on('end',()=>{func(i+1,func,end)});
    }
    var resp=response;
    add(0,add,()=>{
      out.end();
      exec_with_stream('tar -czvf wmlogs.all.txt.tgz wmlogs.all.txt;ls -lh',resp);
    });
    return resp_off();
    if(false)exec_with_stream('cat wmlogs/*.*>wmlogs.all.txt;tar -czvf wmlogs.all.txt.tgz wmlogs.all.txt;ls -l',response);
    //exec_with_stream("ls -lh wmtmp;exit;cd ./wmtmp/;\n"+mapkeys(c.wm_ids_src).map(e=>"tar -xzvf "+e+'.tgz;mv wmlogs.all.txt wmlog.'+e+'.txt').join(";\n")+";ls -l",response);return resp_off();

    //exec_with_stream("mkdir wmtmp;\n"+mapkeys(c.wm_ids_src).map(e=>"curl http://"+c.vh2host[e]+path+">./wmtmp/"+e+'.tgz').join(";\n")+";\necho done");    return resp_off();

    //exec_with_stream('unlink wmlogs.all.txt;echo done',response);
    return resp_off();
  }).toString().split("\n").slice(1,-1).join("\n")
);
var path="/eval?&nolog";
var out_func=jstable;
if('json' in qp)out_func=arr=>txt(json(arr));
var isObject=a=>!!a&&a.constructor===Object;
safe_promise_all(
  mapkeys(c.vh2host).map(e=>{
    var url="http://"+c.vh2host[e]+path;
    var obj={unixtime:unixtime(),code:code};
    var ud={vhost:e,host:c.vh2host[e],bef_ms:get_ms()};
    return new Promise((ok,err)=>xhr_post(url,obj,
      s=>ok({url:url,obj:obj,ud:ud,data:s,err:false}),
      s=>ok({url:url,obj:obj,ud:ud,data:s,err:true})
    )).then(e=>mapaddfront(e,{ms:get_ms()-e.ud.bef_ms}));
  })
).then(arr=>out_func(arr.map(e=>{
  return {vhost:e.ud.vhost,host:e.ud.host,ms:e.ms.toFixed(3),data:e.data,error:e.err}
})));