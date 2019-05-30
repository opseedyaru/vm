function upd(v){
  var ug={};
  var f=v=>{return (v*255/1000)|0};
  Object.keys(c).map(e=>{
    var bar=document.getElementById(e);
    if(bar)bar.value=v[e];
    c[e]=v[e];ug[e]=f(c[e]);
  });
  var s=JSON.stringify(c);document.getElementById("value").innerHTML=s;
  document.body.style.backgroundColor="rgb("+[ug.r,ug.g,ug.b].join(",")+")";
  console.log(JSON.stringify(v));
}
function showVal(t){
  c[t.id]=t.value|0;
  c.iter++;
  upd(c);
  fetch('/c/share_color.js?set_v='+JSON.stringify(c))
    .then(function(response) {
      return response.json();
    })
    .then(function(myJson) {
      var s=JSON.stringify(myJson);
      console.log(s);
    });
}
function sync(){
  fetch('/c/share_color.js?get_v')
    .then(function(response) {
      return response.json();
    })
    .then(function(myJson) {
      var v=JSON.parse(myJson.mem.v);
      if(v.iter<c.iter)return;
      upd(v);
    });
}
var funcs="upd,showVal,sync".split(",").map(e=>eval(e+".toString()")).join("\n");
var mk_html=s=>`
<html>
<style>.slidecontainer{width:100%;}.slider{width:100%;height:50px;background:#d3d3d3;}</style>
<script>
var c={r:0,g:0,b:0,iter:0};
`+funcs+`
//sync();
if(`+s+`)setInterval(sync,1000);
</script>
<body onload="sync()">
<center><h1 id="value">value</h1></center>
<div class="slidecontainer">
  <input type="range" min="1" max="1000" value="500" class="slider" id="r" oninput="showVal(this)" onchange="showVal(this)">
  <input type="range" min="1" max="1000" value="500" class="slider" id="g" oninput="showVal(this)" onchange="showVal(this)">
  <input type="range" min="1" max="1000" value="500" class="slider" id="b" oninput="showVal(this)" onchange="showVal(this)">
</div>
</body></html>
`;
if('reader' in qp)return html(mk_html("true"));
if('writer' in qp)return html(mk_html("false"));
if('get_v' in qp)return inspect({fn:fn,mem:getmap(g_obj,fn)});
if('set_v' in qp)getmap(g_obj,fn).v=qp.set_v;
if(!('set_v' in qp)){
  var arr="menu,reader,writer,get_v".split(",");
  var cfn="./"+fn.slice("./crude/".length);
  return html(links2table(
    arr.map(e=>cfn+'?&'+e))
  );
}
return inspect({fn:fn,mem:getmap(g_obj,fn)});
