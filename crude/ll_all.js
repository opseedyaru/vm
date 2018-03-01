resp_off();
var c=g_conf_info;
var a=c.vh2host;
if('wm' in qp)a=c.wm_ids_src;
var out_func=jstable;
if('jstable_right' in qp)out_func=arr=>jstable_right(arr);
if('json' in qp)out_func=arr=>txt(json(arr));
var path='/ll';
if('path' in qp)path=qp.path;
safe_promise_all(
  mapkeys(a).map(e=>
    axhr_get("http://"+c.vh2host[e]+path,{vhost:e,host:c.vh2host[e],bef_ms:get_ms()}).
    then(e=>mapaddfront(e,{ms:get_ms()-e.ud.bef_ms}))
  )
).then(arr=>jstable(arr.map(e=>{return {vhost:e.ud.vhost,ms:e.ms.toFixed(3),data:e.data}})));