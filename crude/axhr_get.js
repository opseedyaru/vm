var c=g_conf_info;var a=c.wm_ids_src;
if('show_links' in qp)return mapkeys(a).map(e=>"http://"+c.vh2host[e]+"/wmlogs.all.txt.tgz").join("\n");
resp_off();
var code=encodeURIComponent(
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
    exec_with_stream('cat wmlogs/*.*>wmlogs.all.txt;tar -czvf wmlogs.all.txt.tgz wmlogs.all.txt;ls -l',response);
    return resp_off();
    return txt(inspect(trash)+get_ms()+'');
  }).toString().split("\n").slice(1,-1).join("\n");
);
var path="/eval?&nolog&code="+code;
Promise.all(
  mapkeys(a).map(e=>axhr_get("http://"+c.vh2host[e]+path,c.vh2host[e]))
).then(arr=>jstable(arr.map(e=>{return {host:e.ud,data:e.data}}))).catch(err=>txt('promise.all failed with: '+inspect(err)));