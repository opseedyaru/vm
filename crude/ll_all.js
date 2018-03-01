resp_off();
var c=g_conf_info;
var a=c.vh2host;
if('wm' in qp)return a=c.wm_ids_src;
var out_func=jstable;
if('jstable_right' in qp)out_func=arr=>jstable_right(arr);
if('json' in qp)out_func=arr=>txt(json(arr));
var path='/ll';
if('path' in qp)path=qp.path;
var axhr_get=(url,ud)=>{
  return new Promise((ok,err)=>xhr_get(url,
    s=>ok((typeof ud)==="undefined"?s:{ud:ud,data:s}),
    s=>err(new Error('axhr_get::'+inspect({url:url,userdata:ud,body:s})))
  ));
}

        var safe_promise_all_to=(err_cb,arr)=>Promise.all(arr).catch(err=>err_cb(qap_err('Promise.all',err)));
        var safe_promise_all=arr=>safe_promise_all_to(txt,arr);
safe_promise_all(
  mapkeys(a).map(e=>
    axhr_get("http://"+c.vh2host[e]+path,{vhost:e,host:c.vh2host[e],bef_ms:get_ms()}).
    then(e=>mapaddfront(e,{ms:get_ms()-e.ud.bef_ms}))
  )
).then(arr=>jstable(arr.map(e=>{return {vhost:e.ud.vhost,ms:e.ms.toFixed(3),data:e.data}})));