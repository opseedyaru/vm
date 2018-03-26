var c=g_conf_info;
resp_off();
var code=("var unixtime=()=>(new Date()/1000);var t=unixtime()-parseFloat(POST.unixtime);return (t*1e3).toFixed(1)+' ms';");
var path="/eval?&nolog";
var out_func=jstable_right;
if('json' in qp)out_func=arr=>txt(json(arr));
safe_promise_all(
  mapkeys(c.vh2host).map(e=>axhr_post(with_protocol(c.vh2host[e])+path,{unixtime:unixtime(),code:code},{vhost:e,host:c.vh2host[e],bef_ms:get_ms()}).then(e=>mapaddfront(e,{ms:get_ms()-e.ud.bef_ms})))
).then(arr=>out_func(arr.map(e=>{return {vhost:e.ud.vhost,host:e.ud.host,ms:e.ms.toFixed(3),data:e.data,bef_ms:e.ud.bef_ms.toFixed(3)}})));
