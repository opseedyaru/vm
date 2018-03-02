let path='/wmlogs.all.txt.tgz';var c=g_conf_info;
var bef=get_ms();

//var out=fs.readFileSync("wmlog.vm30.txt").toString().split('}{').join("}\n{")

var fn="wmlog.vm30.txt";
var q=fs.createWriteStream('tmp30.txt');var r=response;
split_reader(fn,"}{",s=>q.write(s+"}\n{"),()=>{q.end("}");r.end('done in '+(get_ms()-bef)+' ms');});
resp_off();
fs.writeFileSync('tmp30.txt',out);
return 'done in'+(get_ms()-bef)+' ms';
//var fn=mapkeys(c.wm_ids_src).map(e=>'wmtmp/wmlog.'+e+'.txt')[0];
//var out=fs.readFileSync(fn).toString().split('}{').join("}\n{");
//fs.writeFileSync('tmp.txt',out);
//return ''+fs.readFileSync(fn).toString().split('}{').join("}\n{").split("\n").length;

var parse_wmdatetime=s=>{
  var t=s.split(' ');var ymd=t[0].split('.').reverse();var hms=t[1].split(':');
  return new Date(ymd[0],ymd[1],ymd[2],hms[0],hms[1],hms[2]);
}

var pf=parseFloat;var div_with_dir=(dir,a,b)=>!dir?a/b:b/a;
var g=(e,dir)=>//{return {qd:parse_wmdatetime(e.querydate)|1,y:
    div_with_dir(1,pf(e.amountout),pf(e.amountin))
  //}};
;
//return jstable(JSON.parse(fs.readFileSync('tmp.txt').toString().split("\n")[4803])['1']);//7989
var points=[];
split_reader('tmp30.txt','\n',s=>{
  var e=JSON.parse(s)[2][0];
  e=g(e);
  points.push({x:points.length,y:e});
})
//fs.readFileSync('tmp30.txt','binary').split("\n")/*.slice(0,128)*/.map(e=>JSON.parse(e)[2][0]).map(e=>g(e)).map((e,i)=>points.push({x:i,y:e}))

var limit = 100+0*10000;
var y = 0;var f=0;
var data = [];
var dataSeries = { type: "line"};
var dataPoints = points//[];

/*for (var i = 0; i < limit; i += 1) {
	f -= (Math.random() * 10 - 5);
  f*=0.95;
  y+=f;
	dataPoints.push({
		x: i,// - limit / 2,
		y: y                
	});
}*/
dataSeries.dataPoints = dataPoints;
data.push(dataSeries);
var out=json(data);
return html(POST.data.split("@@@").join("var data="+out));


resp_off();
exec_with_stream("ls -lh;exit;cd ./wmtmp/;\n"+mapkeys(c.wm_ids_src).map(e=>"tar -xzvf "+e+'.tgz;mv wmlogs.all.txt wmlog.'+e+'.txt').join(";\n")+";ls -l",eval_impl_response);
