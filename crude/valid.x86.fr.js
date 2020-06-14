var href="http://valid.x86.fr/rzyidw";if('href' in qp)href=qp.href;if('url' in qp)href=qp.url;
var hp=url.parse(href);
if(!hp.protocol||!hp.protocol.includes("http"))return "protocol - required in:"+inspect(hp);
var hpp=hp.protocol+'//';
var site=hp.protocol+"//"+url.parse(href).host+'/';var folder=hp.host;var host=request.headers.host;
execSync("mkdir -p "+folder);
execSync("curl "+href+">"+folder+"/index.html");
var off='style="display:none"';
var s=(fs.readFileSync(folder+"/index.html")+"").split("<script").join('<nahuy '+off).split("</script>").join("</nahuy>");
s=s.split('<section id="main__header" role="banner">').join('<section '+off+'>');
s=s.split('data-hide="false"').join('data-hide="true"');
var m={};
var is_normext=e=>"css,jpg,gif,svg,png".split(",").map(k=>e.includes("."+k)?"1":"").join("").length;
var arr2out=(prefix,a,b,arr)=>arr.filter(is_normext).map(e=>{m[e]={
  site:e.split("/")[0],
  raw:e.split("/").slice(1).join("/"),
  in_src:e,
  local:e.split("/").slice(-1)[0],
  prefix,a,b
};return e;}).join('\n');
var mk_arr=(prefix,a,b)=>arr2out(prefix,a,b,s.split(prefix).slice(1).map(e=>e.split('"')[0]));
var b='http://'+host+'/'+folder+'/';
var arr0=mk_arr('"http://','http://',b);
var arr0=mk_arr('"https://','https://',b);
var arr1=mk_arr('<img src="/','/',b);
var arr=[...arr0,...arr1];
//return
mapkeys(m).map(e=>"curl "+site+m[e].raw+">./"+folder+"/"+m[e].local).map(e=>execSync(e)).join("\n");
//return [json(m),out].join("\n");//inspect(out);
var h=s;mapkeys(m).map(e=>h=h.split(m[e].a+m[e].in_src).join(m[e].b+m[e].local));
//return txt(inspect(m)+h);
return html(h);
