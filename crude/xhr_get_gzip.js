/*var r=response;//return inspect(+""+url.parse("http://ya.ru"));
var xhr_get_gzip=(URL,ok,err)=>{
  if((typeof ok)!="function")ok=()=>{};
  if((typeof err)!="function")err=()=>{};
  var headers={'accept-encoding':'gzip,deflate'};
  var up=mapaddfront(url.parse(URL),{headers:headers});
  var secure=['https:','https'].includes(up.protocol);
  var req=(secure?https:http).get(up,(res)=>{
    var cb=ok;
    var rawData='';
    if(res.statusCode!==200){cb=(s,res)=>{err('Request Failed.\nStatus Code: '+res.statusCode+'\n'+s+'\n\n'+inspect(res.headers));}}
    var ce=res.headers['content-encoding'];
    var stream=res;
    if(ce=='gzip'){stream=res.pipe(require('zlib').createGunzip());}
    if(ce=='deflate'){stream=res.pipe(require('zlib').createInflate());}
    stream.on('data',(chunk)=>rawData+=chunk.toString("utf8"));
    stream.on('end',()=>{try{cb(rawData,res);}catch(e){err(qap_err('xhr_get.mega_huge_error',e),res);}});
  });
  call_cb_on_err(req,qap_log,'xhr_get');
  return req;
}
var html_utf8=s=>{r.writeHead(200,{"Content-Type":"text/html; charset=UTF-8"});r.end(s);};*/
resp_off();
xhr_get_gzip(qp.url,qp.txt?txt:html_utf8,txt);