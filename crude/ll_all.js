resp_off();
var c=g_conf_info;
Promise.all(
  mapkeys(c.wm_ids_src).map(e=>"http://"+c.vh2host[e]+"/ll").map(e=>axhr_get(e).then())
).then(arr=>jstable(arr.map(e=>{return {data:e}}))).catch(err=>txt('promise.all failed with: '+inspect(err)));