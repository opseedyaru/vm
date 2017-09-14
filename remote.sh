unlink main20170914.elf
nice -n15 g++ -fopenmp -Wmultichar -fpermissive -DQAP_DEBUG -std=c++11 main20170914.cpp -O2 -o main20170914.elf
OUT=$?
if [ $OUT -ne 0 ];then
  exit
fi
./main20170914.elf
exit $?
