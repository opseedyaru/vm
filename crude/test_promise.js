resp_off();
let promise=new Promise((resolve,reject)=>{
  setTimeout(() => {
    if(rand()%2==0)reject('fail');
    resolve("result");
  },16);
});
promise
  .then(
    result => {
      txt("Fulfilled: "+result);
    },
    err => {
      txt("Rejected: "+err);
    }
  );
  
/*

var wm_ids_src={"os3":"1,2","vm10":"34,33","vm20":"37,38"};

var trash=[];
var check=(fn,data)=>{try{var data=fs.readFileSync(fn);JSON.parse(data);}catch(e){trash.push(fn);return false;}return true;}
fs.readdirSync('wmlogs').map(fn=>'wmlogs/'+fn).map(check);

exec_with_stream("cat wmlogs/*.*>wmlogs.all.txt;tar -czvf wmlogs.all.txt.tgz wmlogs.all.txt;",response,(r)=>{
  var arr=(fs.readFileSync("wmlogs.all.txt")+'').split("][").join("],\n[").split(",\n");
  
}



resp_off();exec('cat mainloop.log|tail -n 64|grep wmlog|grep -v grep',(err,so,se)=>txt(so));


https://learn.javascript.ru/generator

//google: nodejs check yield support
//google: nodejs check async/await support

//var fn = async function () {}; fn[Symbol.toStringTag] === "AsyncFunction";


await fs_write_file('logs.txt',1);
await fs_read_file('bobz.txt');

http://thecodebarbarian.com/common-async-await-design-patterns-in-node.js.html

*/