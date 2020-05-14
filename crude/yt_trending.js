var a=""+execSync("curl https://www.youtube.com/feed/trending 2>/dev/null");

var end="</a>";
var arr=a.split("/watch?v=").slice(1).map(e=>e.split('"')[0]);
var out={};
for(var k in arr){
  var e=arr[k];
  if(e.includes(end)){e=e.split(end)[0];break;}
  out[e]=1;
}
var foo=e=>{return (
'<br/><br/><div class="youtube_container">'+
'<div class="youtube" id="yt_id_'+e+'" data-value="'+e+'">'+
'<a href="https://www.youtube.com/watch?v='+e+'">'+
'<img data-value="'+e+'" src="https://img.youtube.com/vi/'+e+'/maxresdefault.jpg" onload="yt_img_onload(event)">'+
'</a></div></div>'
);}
var bar=e=>"[youtube="+e+"]";
return html(mapkeys(out).map(foo).join("\n"));
