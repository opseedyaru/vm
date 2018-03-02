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
var g=(e,dir)=>div_with_dir(1,pf(e.amountout),pf(e.amountin));

var points=[];
var p=split_reader('wmlog.vm30.txt','}{',s=>{
  //if(s==="{")return;
  //if(s==="{}")return;
  try{
    var e=JSON.parse(s)[2][0];
  }catch(err){
    qap_log(qap_err('split_reader.cb.'+points.length+'\n/* s ------> ------> ------> */\n'+s+'\n/* <------ <------ <------ s */',err));
    return;
  }
  e=g(e);
  points.push({x:points.length,y:e});
},()=>{
  var data=[
    {type:"line",dataPoints:points}
  ];
  var out=json(data);
  html(POST.data.split("@@@").join("var data="+out));
});
return resp_off();;

exec_with_stream("ls -lh;exit;cd ./wmtmp/;\n"+mapkeys(c.wm_ids_src).map(e=>"tar -xzvf "+e+'.tgz;mv wmlogs.all.txt wmlog.'+e+'.txt').join(";\n")+";ls -l",eval_impl_response);
})();