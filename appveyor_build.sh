echo required os = ubuntu 1604
g++ -std=c++14 -O2 proc_mem_limit_detector.cpp -o mem_detect.out
g++ -std=c++14 -O2 -pthread bq_perf_test.cpp -o bq_perf_test.out

wget https://raw.githubusercontent.com/adler3d/simple_cpp11_vm_like_x86/master/cpu_cycles_per_cmd.cpp
g++ -std=c++14 -O2 -pthread cpu_cycles_per_cmd.cpp -o cpu_cycles_per_cmd.out

cp *.out artifacts/
echo os_info
node crude/os.js>artifacts/os_js.txt
