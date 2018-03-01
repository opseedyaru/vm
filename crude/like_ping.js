var c=g_conf_info;
resp_off();
var code=encodeURIComponent("var unixtime=()=>(new Date()/1000);var t=unixtime()-parseFloat(POST.unixtime);return (t*1e3).toFixed(1)+' ms';");
var path="/eval?&nolog&code="+code;
Promise.all(
  mapkeys(c.vh2host).map(e=>axhr_get("http://"+c.vh2host[e]+path+'&unixtime='+unixtime(),{vhost:e,host:c.vh2host[e],bef_ms:get_ms()}).then(e=>mapaddfront(e,{ms:get_ms()-e.ud.bef_ms})))
).then(arr=>jstable_right(arr.map(e=>{return {vhost:e.ud.vhost,host:e.ud.host,ms:e.ms.toFixed(3),data:e.data,bef_ms:e.ud.bef_ms.toFixed(3)}}))).catch(err=>txt('promise.all failed with: '+inspect(err)));