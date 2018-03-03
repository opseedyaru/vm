var xml2js=hack_require('xml2js');if(!xml2js)return;
resp_off();
var out_func=jstable;
var full=0;if('full' in qp)full=true;
var mini=0;if('mini' in qp)mini=true;
if((mini&&!full)||'json' in qp)out_func=arr=>txt(json(arr));
var ok=xml=>{
    var u=obj=>obj.response.row.map(e=>e['$']).map(e=>{
      return full?e:{dir:e.Direct.split(' - '),id:e.exchtype};
    })
    var f=obj=>{
      var m={};
      if(!mini||full)return u(obj);
      u(obj).map(e=>{m[e.id]=e.dir;});
      return m;
    }
    var cb=(err,obj)=>out_func(f(obj));
    return xml2js.parseString(xml,cb);
  //txt(xml);
};

xhr_get("https://wm.exchanger.ru/asp/XMLbestRates.asp",ok,txt);