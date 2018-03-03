//return parseFloat('1.2')+"";
var r=response;
resp_off();
var xml2js=hack_require('xml2js');if(!xml2js)return;
var d=s=>parseFloat(s.split(",").join("."));
var div=(a,b)=>d(a)/d(b);
var out_in=(out,e)=>{out['out/in']=div(e.amountout,e.amountin).toFixed(3)};
var in_out=(out,e)=>{out['in/out']=div(e.amountin,e.amountout).toFixed(3)};

var ids=('profit' in qp)?'1,2,33,34,37,38':'1,2';
if('ids' in qp){ids=qp.ids;}
var ids_arr=ids.split(",");
var type2dir=t=>{return "33,34,37,38".split(",").includes(t)?0:1};

var tables={};
var check_done=()=>{
  if(mapkeys(tables).length!=ids_arr.length)return;
  if('profit' in qp)
  {
    var pf=parseFloat;
    var div_with_dir=(dir,a,b)=>!dir?a/b:b/a;
    var g=(e,dir)=>div_with_dir(dir,pf(e.amountout),pf(e.amountin));
    var t=tables;
    var a=[34,37,1].map(e=>g(t[e|0][0],0));
    var b=[2,38,33].map(e=>g(t[e|0][0],0));

    var f=x=>x-x*0.0025;
    e1=f(f(f(100)*a[0])*a[1])*a[2];
    e2=f(f(f(100)*b[0])*b[1])*b[2];
    return txt(inspect({'WMZ->WMX->WMR->WMZ':e1,'WMZ->WMR->WMX->WMZ':e2}));
  }
  if('json' in qp){return txt(json(tables));}
  var t1=tables[ids_arr[0]];
  if(ids_arr.length==1)return jstable(t1);
  if(ids_arr.length==2)
  {
    var t2=tables[ids_arr[1]];
    var t2_keys=mapkeys(t2[0]).reverse();
    jstable(t1.map((e,i)=>{
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
    var pretty=s=>{
      var a=s.split('.');
      var n=a[0].length;var out="";
      for(var i=0;i<n;i++){
        out=a[0][n-1-i]+out;
        //if((i%3==2)&&(i+1!=n))out=' '+out;
      }
      a[0]=out;
      return '         '.slice(0,-a[0].length)+a.join('.');
    };
    var select=(e,arr)=>{var out={};arr.split(',').map((k,i)=>out[k]=(i==2||i==3)?pretty(d(e[k]).toFixed(2)):e[k]);insert_special_field(out,e);return out;};
    var f=obj=>obj["wm.exchanger.response"]["WMExchnagerQuerys"][0].query.map(e=>e['$']).map(e=>select(e,'id,querydate,amountin,amountout'));
    var cb=(err,obj)=>g(f(obj));
    return xml2js.parseString(xml,cb);
  }
  return xhr_get("https://wmeng.exchanger.ru/asp/XMLWMList.asp?exchtype="+exchtype,ok,txt);
}
ids_arr.map(run);
return;
