var execSync=require('child_process').execSync;
var f=cmd=>execSync(cmd)+"";
var mem=e=>"MemTotal,MemFree,MemAvailable".split(",").includes(e.split(":")[0]);
var s=f([
  "cat /proc/cpuinfo|grep 'model name'|awk 'NR==0;END{print}'",
  "cat /proc/cpuinfo|grep 'cache size'|awk 'NR==0;END{print}'",
  "cat /proc/cpuinfo|grep 'cpu MHz'|awk 'NR==0;END{print}'",
  "echo 'nproc --all : '`nproc --all`",
  "echo 'nproc       : '`nproc`",
  "cat /etc/os-release|grep PRETTY_NAME;cat /etc/os-release|grep 'VERSION='",
  ""
].join("\n"))+"\n"+
f("cat /proc/meminfo").split("\n").filter(mem).join("\n");
console.log(s);
