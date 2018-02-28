var wm_ids_src={"os3":"1,2","vm10":"34,33","vm20":"37,38"};
var a=wm_ids_src;var c=g_conf_info;
resp_off();
var axhr_get=(url,ud)=>{
  return new Promise((ok,err)=>{xhr_get(url,s=>ok((typeof ud)==="undefined"?s:{ud:ud,data:s}),err);return;});
}
var code=encodeURIComponent(POST.data);
var path="/eval?&nolog&code="+code;
Promise.all(
  mapkeys(a).map(e=>axhr_get("http://"+c.vh2host[e]+path,c.vh2host[e]))
).then(arr=>jstable(arr.map(e=>{return {host:e.ud,data:e.data}})));
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
return txt(inspect(trash)+get_ms()+'');
*/