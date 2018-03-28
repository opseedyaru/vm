/*var bs=`
#include <iostream>

int main(){
        #if __cplusplus==201402L
        std::cout << "C++14" << std::endl;
        #elif __cplusplus==201103L
        std::cout << "C++11" << std::endl;
        #else
        std::cout << "C++" << std::endl;
        #endif
std::cout << "__cplusplus"<<__cplusplus << std::endl;
        return 0;
}`;
fs.writeFileSync("test2/bs.cpp",bs);*/

function escapeHtml(text)
  {
    if("string"!=(typeof text)){return text;}
    return text
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
  }
  function inc(map,key){if(!(key in map)){map[key]=0;}map[key]++;}
  function PrintMyTable(table)
  {
    function skip_field(field){
      var ignore=[];//["user_agent","request_uri","referrer"];
      for(var key in ignore)if(ignore[key]==field){return true;}
      return false;
    };
    if(!table.length){return 'table is empty';}
    if(!Object.keys(table[0]).length){return 'table is empty';}
    var km={};for(var i=0;i<table.length;i++){var ex=table[i];for(var k in ex){inc(km,k);}}
    var arr=Object.keys(km);
    var out="";var head="";
    for(var i in arr)
    {
      if(skip_field(arr[i]))continue;
      out+='<td>'+escapeHtml(arr[i])+'</td>';
    }
    var head='<thead><tr>'+out+'</tr></thead>';
    out="";
    for(var i=0;i<table.length;i++)
    {
      var tmp="";
      //var tmp_arr=table[table.length-i-1];
      var tmp_arr=table[i];
      for(var j=0;j<arr.length;j++){
        //if(skip_field(key))continue;
        var k=arr[j];var v="<b>0</b>";var bg="";
        if(k in tmp_arr){v=escapeHtml(tmp_arr[k]);}else{/*bg='class="bgw"';*/}
        tmp+='<td>'+v+'</td>';
      }
      out+='<tr>'+tmp+'</tr>';
    }
    out='<table>'+head+'<tbody>'+out+'</tbody></table>';
    return out;
  }

var body2html=s=>`
<!DOCTYPE html>
<html><head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta charset="utf-8">
  <title>table_gen JS</title>
<style type="text/css">
  body{font-family:consolas;}
  table{border-collapse:collapse;font-size:10pt;}
  thead{background:#ccc;text-align:center;font-weight:bold;}
  td,thead{border:1px solid #800;padding:4px;}
  textarea[readonly="readonly"]{background-color:#e8e8e8;}
</style></head>
<body>$$$</body></html>`.split("$$$").join("\n"+s+"\n");

var dest_dir="test2/";
var app=""+fs.readFileSync(0?"/usr/local/include/c++/7.3.0/bits/allocated_ptr.h":dest_dir+"app.cpp");
var cl=""+fs.readFileSync(dest_dir+"cl_log.txt");
var out=app.split("\n").map((e,i)=>({i:"app.cpp:"+(i+1)+":.",line:e}));
out=PrintMyTable(out);
var colorize=s=>{
  var kw={error:"#A00",warning:"#880",note:"#555"};
  for(var k in kw){s=s.split(k).join("<font color='"+kw[k]+"'><b>"+k+"</b></font>");}
  return s;
}
var eh=s=>colorize(escapeHtml(s));
out="<pre>"+eh(cl+"\n")+"<hr>"+out+"</pre>";
out=body2html(out);
return html(out);
