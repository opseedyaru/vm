echo required os = ubuntu 1604
g++ -std=c++14 -O2 proc_mem_limit_detector.cpp -o mem_detect.out
g++ -std=c++14 -O2 -pthread bq_perf_test.cpp -o bq_perf_test.out

wget https://raw.githubusercontent.com/adler3d/simple_cpp11_vm_like_x86/master/cpu_cycles_per_cmd.cpp
g++ -DUSE_SSD_MEM -std=c++14 -O2 -pthread cpu_cycles_per_cmd.cpp -o cpu_cycles_per_cmd_ssd.out
g++ -DUSE_DEF_MEM -std=c++14 -O2 -pthread cpu_cycles_per_cmd.cpp -o cpu_cycles_per_cmd_mem.out

cp *.out artifacts/

appveyor_serv_info() {
  echo "npm --version"
  npm -version
  echo "node --version"
  node --version
  echo "g++ --version"
  g++ --version
  echo "clang++ --version"
  clang++ --version

  echo "os_info"
  node crude/os.js|tee artifacts/os_js.txt
  echo "more_lulz:{ssd:"
  ./cpu_cycles_per_cmd_ssd.out
  echo ","
  echo "mem:"
  ./cpu_cycles_per_cmd_mem.out
  echo ","
  echo "bq_perf_test_all:"
  ./bq_perf_test.out
  echo ","
  echo "bq_perf_test_one:"
  taskset -c 0 ./bq_perf_test.out
  echo "}:more_lulz"
}
appveyor_serv_info>artifacts/appveyor_serv_info.txt
cat artifacts/appveyor_serv_info.txt

npm install systeminformation
echo "require('systeminformation').getAllData(data=>console.log(JSON.stringify(data)));"|node|tee artifacts/is.json

echo ok
