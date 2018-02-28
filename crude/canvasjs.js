//ee_logger_v2(stdout,'stdout',qap_log,'readable,data,end,abort,aborted,connect,continue,response,upgrade,drain,error,pipe,finish,unpipe,close');
exec_with_stream('ls -l ./wmlogs;exit;wget http://vm-os3.7e14.starter-us-west-2.openshiftapps.com/wmlogs.tgz;tar -xvf wmlogs.tgz;',response);
return resp_off();
var limit = 100+0*10000;
var y = 0;var f=0;
var data = [];
var dataSeries = { type: "line" };
var dataPoints = [];
for (var i = 0; i < limit; i += 1) {
	f -= (Math.random() * 10 - 5);
  f*=0.95;
  y+=f;
	dataPoints.push({
		x: i,// - limit / 2,
		y: y                
	});
}
dataSeries.dataPoints = dataPoints;
data.push(dataSeries);
var out=json(data);
return html((''+fs.readFileSync('canvasjs.html')).split("@@@").join(out));