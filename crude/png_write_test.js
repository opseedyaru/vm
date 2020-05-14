// "new version(with ffmpeg)" can be found at "https://gitlab.com/opseed_yaru/ff_bin.git"
if('show_code' in qp)return txt(POST.data);
if(!('run' in qp)){
  var arr="menu,run,show_code".split(",");
  var cfn="./"+fn.slice("./crude/".length);
  return html(links2table(
    arr.map(e=>cfn+'?&'+e))
  );
}
var Jimp=hack_require('jimp');
//return Jimp+"";
//return txt+"";
var r=response;
resp_off();
var n=256;
var dx=n;var dy=n;var pix=[0xffffff00,0xff000000,0xff0000ff];
var cb=(err,image)=>{
  if(err){txt(inspect(err+""));}
  var argb=(a,r,g,b)=>Jimp.rgbaToInt(b,g,r,a);
  var get=v=>Jimp.intToRGBA(v);
  var argb2rgba=v=>{
    var a=(v>>24)&0xff;
    var r=(v>>16)&0xff;
    var g=(v>>8 )&0xff;
    var b=(v    )&0xff;
    return Jimp.rgbaToInt(r,g,b,a);
  };
  for(var x=0;x<dx;x++)for(var y=0;y<dy;y++){
    var h=dx/2;var sqr=x=>x*x;
    var qq=Math.sqrt(sqr(x-h)+sqr(y-h))/h; qq=1.0-(qq>1?1:qq); qq=Math.cos((1.0-qq)*Math.PI/2);
    var q=(qq*255)|0;
    var c=Jimp.rgbaToInt(q,q,q,255);
    pix.map((v,i)=>image.setPixelColor(c,x+i*dx,y+0));
  }
  for(var x=0;x<dx;x++)for(var y=0;y<dy;y++){
    var h=dx/2;var sqr=x=>x*x;
    var qq=Math.sqrt(sqr(x-h)+sqr(y-h))/h; var fail=qq>1; qq=1.0-(qq>1?1:qq); qq=Math.cos((1.0-qq)*Math.PI/2);
    var q=(qq*255)|0;
    var c=Jimp.rgbaToInt(q,q,q,255);
    pix.map((v,i)=>image.setPixelColor(c,x+i*dx,y+0));
    if(fail)pix.map((v,i)=>image.setPixelColor(argb2rgba(v),x+i*dx,y+0));
  }
  var fn="foo.png";
  image.write(fn);
  setTimeout(()=>{
    fs.stat(fn,(error,stat)=>{
      if(error){throw error;}
      var arr=contentTypesByExtension;
      var ext=path.extname(fn);
      var ct=ext in arr?arr[ext]:'application/octet-stream';
      r.writeHead(200,{'Content-Type':ct,'Content-Length':stat.size})
      fs.createReadStream(fn).pipe(r).on('end',()=>{r.destroy();request.destroy()});
    });
  },500);
}
new Jimp(pix.length*dx,dy,0xff0000ff,cb);
return "ok";
