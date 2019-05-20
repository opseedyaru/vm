echo required os = ubuntu 1604
g++ --verbose -std=c++14 -O2 proc_mem_limit_detector.cpp -o mem_detect.out
g++ --verbose -std=c++14 -O2 -pthread bq_perf_test.cpp -o bq_perf_test.out
