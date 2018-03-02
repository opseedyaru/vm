(()=>{
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

// curl http://vm30-vm30.193b.starter-ca-central-1.openshiftapps.com/wmlogs.all.txt.gz|gzip -d>wmlog.vm30.txt
var points=[];var points2=[];
var p=split_reader('wmlog.vm30.txt','\n',s=>{
  if(s==="")return;
  try{//34 WMX->WMZ //38 WMX->WMR //1 WMZ->WMR
    var t=JSON.parse(s);
    //WMZ->WMX->WMR->WMZ
    //34->37->1
    var a=[34,37,1].map(e=>g(t[e|0][0],0));
    var b=[2,38,33].map(e=>g(t[e|0][0],0));
    var e1=t[38][0];
    var e2=t[37][0];
  }catch(err){
    qap_log(qap_err('split_reader.cb.'+points.length+'\n/* s ------> ------> ------> */\n'+s+'\n/* <------ <------ <------ s */',err));
    return;
  }
  var f=x=>x-x*0.0025;
  e1=f(f(f(100)*a[0])*a[1])*a[2];
  e2=f(f(f(100)*b[0])*b[1])*b[2];
  //e1=g(e1,0);
  //e2=g(e2,1);
  points.push({x:points.length,y:e1});
  points2.push({x:points2.length,y:e2});
},()=>{
  var data=[
    {name:"WMX",type:"line",color:"#F08080",dataPoints:points},
    {name:"WMR",type:"line",dataPoints:points2},
  ];
  var out=json(data);
  html(POST.data.split("@@@").join("var data="+out));
});
return resp_off();;

exec_with_stream("ls -lh;exit;cd ./wmtmp/;\n"+mapkeys(c.wm_ids_src).map(e=>"tar -xzvf "+e+'.tgz;mv wmlogs.all.txt wmlog.'+e+'.txt').join(";\n")+";ls -l",eval_impl_response);
})();