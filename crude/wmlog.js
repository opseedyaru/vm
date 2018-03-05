//return parseFloat('1.2')+"";
var r=response;
resp_off();
//---
  var dir2wms=JSON.parse(fs.readFileSync('dir2wms.json')+'');
  var qap_foreach_key=(obj,cb)=>{for(var k in obj)cb(obj,k,obj[k]);return obj;}

  var mid2info={};//money_id_to_info
  qap_foreach_key(dir2wms,(obj,k,v)=>getdef(mid2info,v[0],{mid:v[0],outmid2dir:{}}).outmid2dir[v[1]]=k);
  
  var dir_from_to=(from,to)=>{
    if(!(from in mid2info))txt(qap_err("field 'from' - not found",new Error(inspect({from:from,to:to,mid2info}))));
    return mid2info[from].outmid2dir[to];
  }
  var reverse_dir=dir=>{var wms=dir2wms[dir];return mid2info[wms[1]].outmid2dir[wms[0]]};

  var wms_path_to_buydirs=arr=>{
    var out=[];
    for(var i=1;i<arr.length;i++){
      var prev=arr[i-1];
      var cur=arr[i-0];
      out.push(dir_from_to(cur,prev));// reverse direction because we need buydirs
    }
    return out;
  };
  var gen_paths=(from,to,levels)=>{
    var clone=w=>w.slice();
    var wm_arr=mapkeys(mid2info).filter(e=>!'WMB'.split(',').includes(e));
    var out=[];
    var arr=wm_arr.filter(e=>e!=from);
    var way=[from];
    var func=(way,arr,LVL)=>{
      if(!LVL)return out.push(way);
      arr.map(mid=>{
        var next=clone(way);next.push(mid);
        func(next,wm_arr.filter(e=>e!=mid),LVL-1);
      });
    };
    for(var i=1;i<=levels;i++)func([from],arr,i);
    out.filter(e=>e[e.length-1]!=to).map(e=>e.push(to));
    return out.map(e=>e.join("->"));
  };
  //return txt(inspect(paths));
  //return inspect(paths);
//---
var xml2js=hack_require('xml2js');if(!xml2js)return;
var d=s=>parseFloat(s.split(",").join("."));
var div=(a,b)=>d(a)/d(b);
var out_in=(out,e)=>{out['out/in']=div(e.amountout,e.amountin).toFixed(3)};
var in_out=(out,e)=>{out['in/out']=div(e.amountin,e.amountout).toFixed(3)};
//qp.json=1;qp.profit=1;
//if(uri==='/eval')qp.profit=1;
var dir2str=qap_foreach_key(dir2wms,(obj,k,v)=>{obj[k]=v.join('->');});//return txt(inspect(dir2str));
var ids=('profit' in qp)?mapkeys(dir2str).join(','):'1,2';
if('ids' in qp){ids=qp.ids;if(ids==='all')ids=mapkeys(dir2str).join(',');}
var ids_arr=ids.split(",");
var type2dir=t=>{return "33,34,37,38".split(",").includes(t)?0:1};
var fee_koef='fee' in qp?parseFloat(qp.fee):0.0025;
var pay_fee=x=>x-x*fee_koef;
var tables={};
var bef_ms=get_ms();
var check_done=()=>{
  if(mapkeys(tables).length!=ids_arr.length)return;
  //return txt(inspect([mapkeys(tables).length,ids_arr.length,ids_arr,tables]));
  var load_time=get_ms()-bef_ms;
  if('profit' in qp)
  {
    var pf=parseFloat;
    var div_with_dir=(dir,a,b)=>!dir?a/b:b/a;
    var g=(e,dir)=>div_with_dir(dir,pf(e.amountout),pf(e.amountin));
    var t=tables;
    fs.writeFileSync("wm_tables.txt",json(tables));
    var bullshits=[];
    for(var k in t){
      if(!t[k].length)bullshits.push(k);
    }
    if(bullshits.length)txt(inspect(bullshits));
    var WM='wm' in qp?qp.wm:'100';var WM=pf(WM.split(",").join("."));
    var paths=[];
    if('any' in qp){
      WM=100;
      mapkeys(mid2info)
        .filter(e=>!'WMB'.split(',')
        .includes(e))
        .map(mid=>paths=paths.concat(gen_paths(mid,mid,4).map(e=>e.split('->'))));
    }else{
      var from='from' in qp?qp.from:'WML';
      var to='to' in qp?qp.to:'WMZ';
      paths=gen_paths(from,to,5).map(e=>e.split('->'));
    }
    var out={WM:WM,load_time:load_time,fee_koef:fee_koef,paths_info:{},paths:[],};
    //var wmout=fs.createWriteStream('wmout.txt');
    //var path_index=0;
    paths.map(path=>{//path_index++;
      var buydirs=wms_path_to_buydirs(path);
      buydirs.map(e=>{
        if(!(e in t))txt(inspect(["WTH?",path,e,buydirs,t]));
        var tmp=t[e];
        if(!(0 in tmp))txt(inspect(['hm.hm...',path]));
      });
      var rates=buydirs.map(e=>g(t[e][0],0));
      var arr=[];
      var add=inp=>{
        var cur_v=inp;
        var log=buydirs.map((e,i)=>[dir2str[e],[rates[i],1.0/rates[i]],t[e][0],[cur_v,cur_v/rates[i],cur_v=pay_fee(cur_v)/rates[i]]]);
        arr.push({path:path,inp:inp,out:cur_v,log:log});
      }
      add(WM);
      out.paths.push({path:path.join("->"),arr:arr});
      /*if(path_index%130==0){
        qapsort(out.paths,e=>e.arr[0].out);
        out.paths.length=128;
      }*/
      //var rec=json({path:path.join("->"),arr:arr})+"\n";
      //wmout.write(rec);
      //eval_impl_response.write(rec);
    });
    //wmout.end();
    //return;
    //qapsort(out.paths,e=>e.arr[0].out).slice(0,128).map(e=>out.paths_info[e.path]=e.arr[1].out+" %     // or out = "+e.arr[0].out);
    qapsort(out.paths,e=>e.arr[0].out).slice(0,128).map(e=>out.paths_info[e.path]=e.arr[0].out);
    out.paths=out.paths.slice(0,16).map(e=>e.arr.map(e=>{
      e.log.map(e=>{e[2]=mapclone(e[2]);return e;});
      return e;
    }));
    var txtout=inspect(out);fs.writeFileSync("wm.txt",txtout);
    return txt(txtout);
  }
  if('json' in qp){return txt(json(tables));}
  //return txt("debug:\n"+json(tables));
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
    var g=obj=>{tables[exchtype]=obj;check_done(obj);};//0?(obj=>txt(inspect(obj))):obj=>jstable(obj);
    var pretty=s=>s;
    var select=(e,arr)=>{var out={};arr.split(',').map((k,i)=>out[k]=(i==2||i==3)?pretty(d(e[k]).toFixed(2)):e[k]);insert_special_field(out,e);return out;};
    var f=obj=>{
      var wer=obj["wm.exchanger.response"];
      if(!'WMExchnagerQuerys' in wer){txt(inspect(['error in wm.exchanger.response for ',obj]));}
      wer_weq=wer.WMExchnagerQuerys;
      if(!'0' in wer_weq){txt(inspect(['error in wm.exchanger.response.WMExchnagerQuerys for ',obj]));}
      return wer_weq[0].query.map(e=>e['$']).map(e=>select(e,'id,querydate,amountin,amountout'));
    }
    var cb=(err,obj)=>g(f(obj));
    return xml2js.parseString(xml,cb);
  }
  return xhr_get("https:/"+"/wmeng.exchanger.ru/asp/XMLWMList.asp?exchtype="+exchtype,ok,txt);
}
ids_arr.map(run);
return;

if(0)
{  
  var dir2wms=JSON.parse(POST.data);
  var qap_foreach_key=(obj,cb)=>{for(var k in obj)cb(obj,k,obj[k]);return obj;}

  var mid2info={};//money_id_to_info
  qap_foreach_key(dir2wms,(obj,k,v)=>getdef(mid2info,v[0],{mid:v[0],outmid2dir:{}}).outmid2dir[v[1]]=k);
  
  var dir_from_to=(from,to)=>mid2info[from].outmid2dir[to];
  var reverse_dir=dir=>{var wms=dir2wms[dir];return mid2info[wms[1]].outmid2dir[wms[0]]};
  var pay_fee=x=>x-x*0.0025;

  var wms_path_to_buydirs=arr=>{
    var out=[];
    for(var i=1;i<arr.length;i++){
      var prev=arr[i-1];
      var cur=arr[i-0];
      out.push(dir_from_to(cur,prev));// reverse direction because we need buydirs
    }
    return out;
  };
  var paths=[
    'WMZ->WMR->WMX->WMZ',
    'WMZ->WMX->WMR->WMZ',
    'WMZ->WMX->WMB->WMZ',
    'WMZ->WMB->WMX->WMZ',
    'WMZ->WMX->WMU->WMZ',
    'WMZ->WMU->WMX->WMZ',
    'WMZ->WMX->WML->WMZ',
    'WMZ->WML->WMX->WMZ',
    'WMZ->WMX->WMH->WMZ',
    'WMZ->WMH->WMX->WMZ',
    'WMZ->WMR->WMG->WMZ',
    'WMZ->WMG->WMR->WMZ',
  ].map(e=>e.split('->')).map(arr=>wms_path_to_buydirs(arr));
  return inspect(paths);
  /*m=qap_unique(m);

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
  }*/

  return txt(inspect(m));
}












