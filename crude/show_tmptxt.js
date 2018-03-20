(()=>{
//-------------------------------------------dir2wms.json-----------------------------------------------------------
var dir2wms=JSON.parse(fs.readFileSync('dir2wms.json')+'');
var qap_foreach_key=(obj,cb)=>{for(var k in obj)cb(obj,k,obj[k]);return obj;}
var mid2info={};//money_id_to_info
qap_foreach_key(dir2wms,(obj,k,v)=>getdef(mid2info,v[0],{mid:v[0],outmid2dir:{}}).outmid2dir[v[1]]=k);
var dir_from_to=(from,to)=>{
  if(!(from in mid2info))txt(qap_err("field 'from' - not found",new Error(inspect({from:from,to:to,mid2info}))));
  return mid2info[from].outmid2dir[to];
}
var reverse_dir=dir=>{var wms=dir2wms[dir];return mid2info[wms[1]].outmid2dir[wms[0]]};
//-------------------------------------------dir2wms.json-----------------------------------------------------------
var wms_path_to_buydirs=arr=>{
  var out=[];
  for(var i=1;i<arr.length;i++){
    var prev=arr[i-1];
    var cur=arr[i-0];
    out.push(dir_from_to(cur,prev));// reverse direction because we need buydirs
  }
  return out;
};
var fee_koef='fee' in qp?parseFloat(qp.fee):0.0025;
var pay_fee=x=>x-x*fee_koef;
//-------------------------------------------MAIN CODE BELOW -----------------------------------------------------------

let path='/wmlogs.all.txt.tgz';var c=g_conf_info;

var need_make_tmp30txt=false;
if(need_make_tmp30txt){
  var bef=get_ms();
  var fn="wmlog.vm30.txt";
  var q=fs.createWriteStream('tmp30.txt');var r=response;
  split_reader(fn,"}{",s=>q.write(s+"}\n{"),()=>{q.end();r.end('done in '+(get_ms()-bef)+' ms');});
  return resp_off();
}

/*
//var fn=mapkeys(c.wm_ids_src).map(e=>'wmtmp/wmlog.'+e+'.txt')[0];
//var out=fs.readFileSync(fn).toString().split('}{').join("}\n{");
//fs.writeFileSync('tmp.txt',out);
//return ''+fs.readFileSync(fn).toString().split('}{').join("}\n{").split("\n").length;
*/

var pf=parseFloat;var div_with_dir=(dir,a,b)=>!dir?a/b:b/a;
var g=(e,dir)=>div_with_dir(dir,pf(e.amountout),pf(e.amountin));

// resp_off();exec_with_stream("curl http://vm30.ca.osa/wmlogs.all.txt.gz|gzip -d>wmlog.vm30.txt;ls -l",eval_impl_response);
var points=[];var points2=[];var show_profit=0;
var p=split_reader('wmlog.vm30.txt','\n',s=>{
  if(s==="")return;
  try{//34 WMX->WMZ //38 WMX->WMR //1 WMZ->WMR
    var t=JSON.parse(s);
    //WMZ->WMX->WMR->WMZ
    //34->37->1
    if(show_profit){
      var buydirs=wms_path_to_buydirs(path);
      var rates=buydirs.map(e=>g(t[e][0],0));
      unsaved....
      var a=[34,37,1].map(e=>g(t[e][0],0));
      var b=[2,38,33].map(e=>g(t[e][0],0));
    }else{
      var e1=t[1][0];
      var e2=t[2][0];
    }
  }catch(err){
    qap_log(qap_err('split_reader.cb.'+points.length+'\n/* s ------> ------> ------> */\n'+s+'\n/* <------ <------ <------ s */',err));
    return;
  }
  var f=x=>x-x*0.0025;
  if(show_profit){
    e1=f(f(f(100)/a[0])/a[1])/a[2];
    e2=f(f(f(100)/b[0])/b[1])/b[2];
  }else{
    e1=g(e1,0);
    e2=g(e2,1);
  }
  points.push({x:points.length,y:e1});
  points2.push({x:points2.length,y:e2});
},()=>{
  var data=[
    {name:"WMX",type:"line",color:"#F08080",dataPoints:points},
    {name:"WMR",type:"line",dataPoints:points2},
  ];
  var out=json(data);
  html(fs.readFileSync('canvasjs.html','binary').split("@@@").join("var data="+out));
});
return resp_off();;

exec_with_stream("ls -lh;exit;cd ./wmtmp/;\n"+mapkeys(c.wm_ids_src).map(e=>"tar -xzvf "+e+'.tgz;mv wmlogs.all.txt wmlog.'+e+'.txt').join(";\n")+";ls -l",eval_impl_response);
})();
