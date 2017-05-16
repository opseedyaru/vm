var f=execSync;

var drop_slash_r=s=>s.split("\r").join("");

fs.writeFileSync("/etc/rc.d/vm.sh",drop_slash_r(`#!/bin/bash
export PORT=80
pushd /root/vm
node mainloop.js 2>&1 | tee mainloop.log&
popd

exit 0
`));

fs.writeFileSync("/etc/init.d/gitseo_vm",drop_slash_r(`#!/bin/bash
# chkconfig: 345 99 10
# description: auto start apex listener
#
case "$1" in
 'start')
   /etc/rc.d/vm.sh;;
 'stop')
   echo "put something to shutdown or kill the process here";;
esac
`));

var out=[
  f("chmod +x /etc/rc.d/vm.sh"),
  f("chmod +x /etc/init.d/gitseo_vm"),
  f("sudo update-rc.d gitseo_vm defaults"),
  f("sudo update-rc.d gitseo_vm enable")
].join("\n\n");
return out+"\n---\n"+inspect(""+f("cat /etc/rc.d/vm.sh"));

//response.off();return xhr_get(POST.data,s=>{g_obj=JSON.parse(s);return txt("done");},txt);
//https://gist.githubusercontent.com/gitseo/1f0fd0fb6d9be1edec0dbdab9d3ce75b/raw/91246e9618778609490bf84fb94906936caab1a1/g_obj.json

/*
sudo update-rc.d gitseo_vm defaults
sudo update-rc.d gitseo_vm enable

unlink /etc/rc.d/vm.sh
unlink /etc/init.d/gitseo_vm
pkill -f "node"
*/
