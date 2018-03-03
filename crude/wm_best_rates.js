var xml2js=hack_require('xml2js');if(!xml2js)return;
resp_off();
var ok=xml=>{
    var f=obj=>obj["wm.exchanger.response"]["WMExchnagerQuerys"][0].query.map(e=>e['$']).map(e=>select(e,'id,querydate,amountin,amountout'));
    var cb=(err,obj)=>/*txt(inspect*/jstable((obj.response.row.map(e=>e['$'])));
    return xml2js.parseString(xml,cb);
  //txt(xml);
};

xhr_get("https://wm.exchanger.ru/asp/XMLbestRates.asp",ok,txt);