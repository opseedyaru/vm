var site='http://valid.x86.fr/';
execSync("curl http://valid.x86.fr/rzyidw>valid.x86.fr.html");
var off='style="display:none"';
var s=(fs.readFileSync("valid.x86.fr.html")+"").split("<script").join('<nahuy '+off).split("</script>").join("</nahuy>");
s=s.split('<section id="main__header" role="banner">').join('<section '+off+'>');
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
var arr0=mk_arr('"http://','http://','');
var arr1=mk_arr('<img src="/','','');
var arr=[...arr0,...arr1];
//return
mapkeys(m).map(e=>"curl "+site+m[e].raw+">./"+m[e].local).map(e=>execSync(e)).join("\n");
//return [json(m),out].join("\n");//inspect(out);
var h=s;mapkeys(m).map(e=>h=h.split(m[e].a+m[e].in_src).join(m[e].b+m[e].local));
//return txt(inspect(m)+h);
return html(h);
