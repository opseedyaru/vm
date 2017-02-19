const util = require('util');
const vm = require('vm');

var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";


var qs = require('querystring');
var g_obj={};
process.on('uncaughtException',err=>console.log(err));

var http_server=http.createServer((a,b)=>{return requestListener(a,b);}).listen(port,ip);
var requestListener=(request, response)=>{
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);

  console.log("uri = "+uri);
  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript",
    '.txt':  "text/plain"
  };
  
  var on_request_end=(cb)=>{
    var body=[];
    request.on('error',err=>console.error(err));
    request.on('data',chunk=>body.push(chunk));
    request.on('end',()=>cb(Buffer.concat(body).toString()));
  };
  response.on('error',err=>console.error(err));
  on_request_end((POST_BODY)=>{
    var is_dir=fn=>fs.statSync(filename).isDirectory();
    fs.exists(filename,ok=>{if(ok&&is_dir(filename))filename+='/index.html';func(filename);});
    var func=filename=>fs.exists(filename,function(exists) {
      if("/eval"==uri){
        var POST=qs.parse(POST_BODY);
        try{
          var system_tmp=eval("()=>{"+POST['code']+"\n;return '';}");
          system_tmp=system_tmp();
          if(response){
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(system_tmp);
            response.end();
            return;
          }
        }catch(err){
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write("Internal Server Error:\n"+err.toString());
          response.end();
          console.error(err);
          return;
        }
      }
      if(!exists) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }
      fs.readFile(filename, "binary", function(err, file) {
        if(err) {
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }
        var headers = {};
        var contentType = contentTypesByExtension[path.extname(filename)];
        if (contentType) headers["Content-Type"] = contentType;
        response.writeHead(200, headers);
        response.write(file, "binary");
        response.end();
      });
    });
  });
}

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
