var ps1=(()=>{
  //COLUMNS=180;
  //STARTCOLOR='\e[0;32m';
  //ENDCOLOR="\e[0m"
  //export PS1="$STARTCOLOR[\$(date +%k:%M:%S)] \w |\$?> $ENDCOLOR"
  //export TERM='xterm'
  //alias rollback='pkill -f npm'
  //alias cls='clear'
  //alias ll='ls -alh --color=always'
  //alias grep='grep --color=always'
  //LS_COLORS=$LS_COLORS:'di=0;33:' ; export LS_COLORS
}).toString().split("\n").slice(1,-1).join("\n").split("  //").join("");

fs.writeFileSync("ps1.sh",ps1.split("\r").join(""));

var fn_bashrc=process.env.HOME+"/.bashrc";

if(!fs.existsSync(fn_bashrc)){
  fs.writeFileSync(fn_bashrc,"# this is ~/.bashrc");
}

var drop_slash_r=s=>s.split("\r").join("");

if(1===drop_slash_r(fs.readFileSync(fn_bashrc)+"").split(drop_slash_r(ps1)).length){
  execSync('echo "">>~/.bashrc;cat ps1.sh>>~/.bashrc');
}

var out=[];

var f=cmd=>out.push("\n\n>"+cmd+"\n"+execSync(cmd));

f("mkdir -p /etc/rc.d;mkdir -p /etc/systemd/system;mkdir -p /usr/lib/systemd/system/");

var mk_service_in_centos7=drop_slash_r((()=>{
  //[Unit]
  //Description=gitseo_vm
  //After=sshd.service
  //
  //[Service]
  //ExecStart=/bin/bash -c "set -e;export PORT=80;cd /home/adler/vm;npm start;"
  //Restart=on-failure
  //RestartSec=42s
  //
  //[Install]
  //WantedBy=multi-user.target
}).toString().split("\n").slice(1,-1).join("\n").split("  //").join(""));

fs.writeFileSync("/usr/lib/systemd/system/gitseo_vm.service",mk_service_in_centos7);
f("systemctl enable gitseo_vm.service");
//f("systemctl status gitseo_vm.service");

var gsvm=()=>{
  var vm_sh=(()=>{
    //#!/bin/bash
    //export PORT=80
    //pushd /home/adler/vm
    //echo "/etc/rc.d/vm.sh">autorunned_from.vm.sh.txt
    //nohup npm start&
    //popd
    //
    //exit 0
  }).toString().split("\n").slice(1,-1).join("\n").split("    //").join("");

  fs.writeFileSync("/etc/rc.d/vm.sh",drop_slash_r(vm_sh));

  var gitseo_vm=(()=>{
    //#!/bin/bash
    //# chkconfig: 345 99 10
    //# description: auto start apex listener
    //#
    //case "$1" in
    // 'start')
    //   /etc/rc.d/vm.sh;;
    // 'stop')
    //   echo "put something to shutdown or kill the process here";;
    //esac
  }).toString().split("\n").slice(1,-1).join("\n").split("    //").join("");
  f("chmod +x /etc/rc.d/vm.sh");
  return gitseo_vm;
};

var gen_gsvm=vm_sh=>{return drop_slash_r(eval((gsvm+"").split("vm.sh").join(vm_sh))())};

fs.writeFileSync("/etc/init.d/gitseo_vm",gen_gsvm("vm_init_d.sh"));
fs.writeFileSync("/etc/systemd/system/gitseo_vm",gen_gsvm("vm_sysmd_sys.sh"));

f("sudo update-rc.d gitseo_vm defaults 2>&1;echo end;exit 0;");
f("sudo update-rc.d gitseo_vm enable 2>&1;echo end;exit 0;");
f("ls -lh /etc/rc.d/");
return out.join("\n\n");

//response.off();return xhr_get(POST.data,s=>{g_obj=JSON.parse(s);return txt("done");},txt);
//https://gist.githubusercontent.com/gitseo/1f0fd0fb6d9be1edec0dbdab9d3ce75b/raw/91246e9618778609490bf84fb94906936caab1a1/g_obj.json

/*
sudo update-rc.d gitseo_vm defaults
sudo update-rc.d gitseo_vm enable

unlink /etc/rc.d/vm.sh
unlink /etc/init.d/gitseo_vm
pkill -f "node"
*/
