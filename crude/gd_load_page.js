/*
cd gd
du -h
grep -rnI "/flame/forum/id" ./
ls -lht
*/
//return exec_post_data();
return txt("// under construction.\n"+POST.code);
var r=response;
var html_1251=s=>{qsqs=s;r.writeHead(200,{"Content-Type":"text/html; charset=windows-1251"});r.end(s);}
resp_off();

var t=0;var id=58601;
var load_page=(id,page)=>{  
  var fn="gd/"+id+"p"+page+".html";
  if(fs.existsSync(fn))return false;
  xhr_get("https://gamedev.ru/flame/forum/?id="+id+"&from=zqn0&page="+page,s=>{fs.writeFileSync(fn,s,"binary");},txt);
  return true;
};
clear_interval(g_58601);
g_58601=set_interval(()=>{for(;;){t++;if(t>1130)return txt("done");var ok=load_page(id,t);if(ok)break;}},100);
//xhr_get("https://gamedev.ru/code/forum/?id=199132&from=zqn0&page=1",s=>{fs.writeFileSync("gd3.html",s,"binary");txt("done+\n"+execSync("ls -lht *.html"));},html_1251);

return;

var iconv =require('iconv-lite');
resp_off();
return html_utf8(iconv.decode(qsqs,'win1251'));
