var page=`<html>
  <style>.slidecontainer{width:100%;}.slider{width:100%;height:50px;background:#d3d3d3;}</style>
  <body>
  <center><h1 id="value">value</h1></center>
  <div class="slidecontainer">
    <input type="range" min="1" max="1000" value="500" class="slider" id="r" oninput="showVal(this)" onchange="showVal(this)">
    <input type="range" min="1" max="1000" value="500" class="slider" id="g" oninput="showVal(this)" onchange="showVal(this)">
    <input type="range" min="1" max="1000" value="500" class="slider" id="b" oninput="showVal(this)" onchange="showVal(this)">
  </div>
    <script>
      var c={r:0,g:0,b:0,iter:0};
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
      var set_v=s=>{};
      function showVal(t){
        c[t.id]=t.value|0;
        c.iter++;
        upd(c);
        set_v(JSON.stringify(c));
      }
      function sync(obj){
        var v=JSON.parse(obj.mem.v);
        if(v.iter<c.iter)return;
        upd(v);
      }
      //sync();
      var HOST = location.origin.replace(/^http/, 'ws')
      var ws = new WebSocket(HOST);
      var el = document.getElementById('server-time');
      ws.onopen=()=>{set_v=s=>ws.send(s);};
      ws.onmessage = function (event) {
        //console.log(event.data);
        sync(JSON.parse(event.data));
        //el.innerHTML = 'Server time: ' + event.data;
      };
    </script>
  </body>
</html>
`;

if('get_v' in qp)return inspect({fn:fn,mem:getmap(g_obj,fn)});
if('set_v' in qp){getmap(g_obj,fn).v=qp.set_v;return 'done';}
if('html' in qp){return html(page);}
if(!('run' in qp)){
  var arr="menu,get_v,html,run".split(",");
  var cfn="./"+fn.slice("./crude/".length);
  return html(links2table(
    arr.map(e=>cfn+'?&'+e))
  );
}

if(fn in g_links){
  return "wss alredy runned";
}
var web_sock=hack_require('ws'); // don't work at now.sh v2.0
var wss=new web_sock.Server({noServer:true});
var link={wss:wss,iter:0};
g_links[fn]=link;
http_server.on('upgrade',(request,socket,head)=>{
  const pathname = url.parse(request.url).pathname;
  if(pathname.includes(fn)){
    wss.handleUpgrade(request,socket,head,ws=>{
      wss.emit('connection',ws,request);
    });
    return;
  }
  socket.destroy();
});
//var g_obj={};var fn="nope";var getmap=(m,k)=>{if(!(k in m))m[k]={};return m[k];};
wss.on('connection',ws=>{
  console.log('wss : client connected');
  ws.on('close',()=>qap_log('wss : client disconnected'));
  ws.on('message',s=>{qap_log(s);getmap(g_obj,fn).v=s;});
});
set_interval(()=>{
  link.iter++;
  wss.clients.forEach((client) => {
    var s=JSON.stringify({fn:fn,mem:getmap(g_obj,fn)});
    client.send(s);
  });
},16);
resp_off();
//return inspect({fn:fn,mem:getmap(g_obj,fn)});
