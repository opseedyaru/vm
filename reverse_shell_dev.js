home -> us <- ca
^    ^  ^  ^  ^
h    hu u  cu c

home = terminal
us = proxy
ca = bash

/*
idea{
  parts:{
    to_home
    to_proxy
    to_ca_serv
  }
}

*/

hu = home.xhr_shell(us);//api = terminal->proxy->bash
cu = ca.xhr_shell(us);// api = bash->proxy->terminal

xhr_shell("post",hosts[0]+"/rt_sh",qap_log,qap_log);

inp("");

ca,"/eval",code:"exec('node xhr_us_rt_sh.js');"
us,"/rt_sh",eval:"toR('eval')(run_bash);"

R=us_rt_sh
toR("eval"){
  var link=new_link();
  xhr_post,us,"/eval",exec,"node xhr_shell.js func='xhr_reverse_shell' to_host='us' link="+link.id;
  // now we got rt_sh request from ca to us
  link.z2func={
    exit:toR("ca.exit"),
    out:toR("ca.out"),
    err:toR("ca.err"),
    qap_log:toR("ca.qap_log")
  }
}
ca_xhr_to_us
us_






//main.js
var g_links={};
var gen_link_id=()=>{return rand()+getDateTime();}
var new_link()=>{var out={id:gen_link_id()};g_links[out.id]=out;return out;}

