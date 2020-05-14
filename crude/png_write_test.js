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
    pix.map((v,i)=>image.setPixelColor(argb2rgba(v),x+i*dx,y+0));
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
