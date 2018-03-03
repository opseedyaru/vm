//return parseFloat('1.2')+"";
var r=response;
resp_off();
var xml2js=hack_require('xml2js');if(!xml2js)return;
var d=s=>parseFloat(s.split(",").join("."));
var div=(a,b)=>d(a)/d(b);
var out_in=(out,e)=>{out['out/in']=div(e.amountout,e.amountin).toFixed(3)};
var in_out=(out,e)=>{out['in/out']=div(e.amountin,e.amountout).toFixed(3)};
//qp.json=1;
if(uri==='/eval')qp.profit=1;
var white_list='Z,R,X,E,B,G';
if('profit' in qp){
  var qap_foreach_key=(obj,cb)=>{for(var k in obj)cb(obj,k,obj[k]);return obj;}
  var dir2wms=JSON.parse(POST.data);
  var dir2str=qap_foreach_key(dir2wms,(obj,k,v)=>{obj[k]=v.join('->');});//return txt(inspect(dir2str));
}else{
  var dir2str={
    1:'WMZ->WMR',37:'WMR->WMX',34:'WMX->WMZ',50:'WMX->WMB',24:'WMB->WMR',29:'WMR->WMG',26:'WMG->WMZ'
  };
  mapkeys(dir2str).map(k=>k|0).map(k=>dir2str[k+(k%2==1?+1:-1)]=dir2str[k].split('->').reverse().join('->'));
}
var ids=('profit' in qp)?mapkeys(dir2str).join(','):'1,2';
if('ids' in qp){ids=qp.ids;}
var ids_arr=ids.split(",");
var type2dir=t=>{return "33,34,37,38".split(",").includes(t)?0:1};
var fee_koef='fee' in qp?parseFloat(qp.fee):0.0025;
var tables={};
var check_done=()=>{
  if(mapkeys(tables).length!=ids_arr.length)return;
  if('profit' in qp)
  {
    var pf=parseFloat;
    var div_with_dir=(dir,a,b)=>!dir?a/b:b/a;
    var g=(e,dir)=>div_with_dir(dir,pf(e.amountout),pf(e.amountin));
    var t=tables;
    var f=x=>x-x*fee_koef;
    var rot=(arr,reverse)=>{return (reverse?arr.unshift(arr.pop()):arr.push(arr.shift())),arr};
    var WM='4.37';var WM=pf(WM.split(",").join("."));
    var ad=[34,37,1];var a=ad.map(e=>g(t[e|0][0],0));var cur_v=WM;var aa=ad.map((e,i)=>[dir2str[e],a[i],t[e][0],[cur_v,cur_v/a[i],cur_v=f(cur_v)/a[i]]]);
    var bd=[2,38,33];var b=bd.map(e=>g(t[e|0][0],0));var cur_v=WM;var bb=bd.map((e,i)=>[dir2str[e],b[i],t[e][0],[cur_v,cur_v/b[i],cur_v=f(cur_v)/b[i]]]);

    e1=f(f(f(100)/a[0])/a[1])/a[2];
    e2=f(f(f(100)/b[0])/b[1])/b[2];
    return txt(inspect({{fee_koef:fee_koef},'WMZ->WMX->WMR->WMZ':e1,'WMZ->WMR->WMX->WMZ':e2,a:aa,b:bb}));
  }
  if('json' in qp){return txt(json(tables));}
  var t1=tables[ids_arr[0]];
  if(ids_arr.length==1)return jstable_right(t1);
  if(ids_arr.length==2)
  {
    var t2=tables[ids_arr[1]];
    var t2_keys=mapkeys(t2[0]).reverse();
    jstable_right(t1.map((e,i)=>{
      t2_keys.map(k=>e[k+'`']=t2[i][k]);
      return e;
    }));
  }
  if(ids_arr.length>2)return txt('ids_arr.length>2\nno way');
};
//var exchtype=2; // 1={in:WMZ,out:WMR}; 2={in:WMR,out:WMZ};
var run=exchtype=>{
  var insert_special_field=exchtype%2==type2dir(exchtype)?out_in:in_out;
  var ok=xml=>{
    var g=obj=>{tables[exchtype]=obj;check_done();};//0?(obj=>txt(inspect(obj))):obj=>jstable(obj);
    var pretty=s=>s;
    var select=(e,arr)=>{var out={};arr.split(',').map((k,i)=>out[k]=(i==2||i==3)?pretty(d(e[k]).toFixed(2)):e[k]);insert_special_field(out,e);return out;};
    var f=obj=>obj["wm.exchanger.response"]["WMExchnagerQuerys"][0].query.map(e=>e['$']).map(e=>select(e,'id,querydate,amountin,amountout'));
    var cb=(err,obj)=>g(f(obj));
    return xml2js.parseString(xml,cb);
  }
  return xhr_get("https://wmeng.exchanger.ru/asp/XMLWMList.asp?exchtype="+exchtype,ok,txt);
}
ids_arr.map(run);
return;
/*
if(0)
{
  var getdef=(m,k,def)=>{if(!(k in m))m[k]=def;return m[k];};
  
  var dir2wms=JSON.parse(POST.data);
  var qap_foreach_key=(obj,cb)=>{for(var k in obj)cb(obj,k,obj[k]);return obj;}

  var mid2info={};//money_id_to_info
  qap_foreach_key(dir2wms,(obj,k,v)=>getdef(mid2info,v[0],{mid:v[0],outmid2dir:{}}).outmid2dir[v[1]]=k);
  
  var dir_from_to=(from,to)=>mid2info[from].outmid2dir[to];
  var pay_fee=x=>x-x*0.0025;
    
  return inspect(dir_from_to('WMX','WMZ'));
  m=qap_unique(m);

  t_world{
    mid;
    amount;
    t_move{
      wmid;
    }
    use{
      var dir=dir_from_to(w.mid,w.mid);
      w.amount=pay_fee(w.amount)*rate[reverse_dir(dir)];
      w.mid=dir2wms[dir][1];
    }
  }

  return txt(inspect(m));
}




*/







