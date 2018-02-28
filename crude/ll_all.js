var wm_ids_src={"os3":"1,2","vm10":"34,33","vm20":"37,38"};
var a=wm_ids_src;var c=g_conf_info;
resp_off();
var axhr_get=url=>new Promise((ok,err)=>{xhr_get(url,ok,err);return;});
Promise.all(
  mapkeys(a).map(e=>"http://"+c.vh2host[e]+"/ll").map(axhr_get)
).then(arr=>jstable(arr.map(e=>{return {data:e}})));
//return inspect(.map(e=>xhr_get(e+'/ll',)));