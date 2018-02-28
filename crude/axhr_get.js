var wm_ids_src={"os3":"1,2","vm10":"34,33","vm20":"37,38"};
var a=wm_ids_src;var c=g_conf_info;
if('show_links' in qp)return mapkeys(a).map(e=>"http://"+c.vh2host[e]+"/wmlogs.all.txt.tgz").join("\n");
resp_off();
var axhr_get=(url,ud)=>{
  return new Promise((ok,err)=>{xhr_get(url,s=>ok((typeof ud)==="undefined"?s:{ud:ud,data:s}),err);return;});
}
var code=encodeURIComponent(POST.data);
var path="/eval?&nolog&code="+code;
Promise.all(
  mapkeys(a).map(e=>axhr_get("http://"+c.vh2host[e]+path,c.vh2host[e]))
).then(arr=>jstable(arr.map(e=>{return {host:e.ud,data:e.data}}))).catch(err=>txt('promise.all failed with: '+inspect(err)));
//POST.data below
/*
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
var exec_with_stream=(cmd,stream,cb)=>{
  var to_stream=s=>stream.write(s);
  var p=spawn('bash',[]);
  p.stdin.end(cmd+"\n");
  p.stdout.on('data',to_stream);
  p.stderr.on('data',to_stream);
  p.on('exit',cb?()=>cb(stream):()=>stream.end());
  return p;
}
exec_with_stream('cat wmlogs/*.*>wmlogs.all.txt;tar -czvf wmlogs.all.txt.tgz wmlogs.all.txt;ls -l',response);
return resp_off();
return txt(inspect(trash)+get_ms()+'');
*/