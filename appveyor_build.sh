echo required os = ubuntu 1604
g++ -std=c++14 -O2 proc_mem_limit_detector.cpp -o mem_detect.out
g++ -std=c++14 -O2 -pthread bq_perf_test.cpp -o bq_perf_test.out

wget https://raw.githubusercontent.com/adler3d/simple_cpp11_vm_like_x86/master/cpu_cycles_per_cmd.cpp
g++ -DUSE_SSD_MEM -std=c++14 -O2 -pthread cpu_cycles_per_cmd.cpp -o cpu_cycles_per_cmd_ssd.out
g++ -DUSE_DEF_MEM -std=c++14 -O2 -pthread cpu_cycles_per_cmd.cpp -o cpu_cycles_per_cmd_mem.out

cp *.out artifacts/

echo npm --version
npm -version
echo node --bersion
node --version

echo os_info
node crude/os.js|tee artifacts/os_js.txt

echo more lulz
./cpu_cycles_per_cmd_ssd.out>>artifacts/os_js.txt
./cpu_cycles_per_cmd_mem.out>>artifacts/os_js.txt
./bq_perf_test.out>>artifacts/os_js.txt

cat artifacts/os_js.txt

echo ok
