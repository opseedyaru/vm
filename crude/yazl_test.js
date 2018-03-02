var yazl=hack_require("yazl",'https://github.com/thejoshwolfe/yazl/tarball/master');if(!yazl)return resp_off();
var bef=get_ms();
var zipfile = new yazl.ZipFile();
resp_off();
zipfile.outputStream.pipe(fs.createWriteStream("output.zip")).on("close",()=>{
  var ms=get_ms()-bef;
  txt('time = '+ms+' ms');
});
var add=fn=>zipfile.addFile(fn,fn);
//var dir='wmlogs';fs.readdirSync(dir).map(fn=>dir+'/'+fn).map(add);
var dir='wmtmp';fs.readdirSync(dir).filter(e=>e.includes('txt')).map(fn=>dir+'/'+fn).map(add);
zipfile.end();
//return execSync('echo done;exit;find -type f|grep -v heroku')+'\n\ntime = '+ms+' ms';  //adm_zip_time = 22361.532428264618 ms