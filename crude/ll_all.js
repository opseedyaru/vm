resp_off();
Promise.all(
  mapkeys(g_conf_info.wm_ids_src).map(e=>"http://"+c.vh2host[e]+"/ll").map(axhr_get)
).then(arr=>jstable(arr.map(e=>{return {data:e}}))).catch(err=>txt('promise.all failed with: '+inspect(err)));