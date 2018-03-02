let path='/wmlogs.all.txt.tgz';var c=g_conf_info;
var fn=mapkeys(c.wm_ids_src).map(e=>'wmtmp/wmlog.'+e+'.txt')[0];
//var out=fs.readFileSync(fn).toString().split('}{').join("}\n{");
//fs.writeFileSync('tmp.txt',out);
//return ''+fs.readFileSync(fn).toString().split('}{').join("}\n{").split("\n").length;
var pf=parseFloat;var div_with_dir=(dir,a,b)=>!dir?a/b:b/a;var g=(e,dir)=>div_with_dir(dir,pf(e.amountout),pf(e.amountin));
return inspect(
  fs.readFileSync('tmp.txt').toString().split("\n").slice(0,128).map(e=>JSON.parse(e)[1][0]).map(e=>g(e)).map(parseFloat)
);

resp_off();

exec_with_stream("ls -lh;exit;cd ./wmtmp/;\n"+mapkeys(c.wm_ids_src).map(e=>"tar -xzvf "+e+'.tgz;mv wmlogs.all.txt wmlog.'+e+'.txt').join(";\n")+";ls -l",eval_impl_response);