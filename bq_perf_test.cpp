//inspired by https://github.com/eliben/code-for-blog/blob/master/2018/threadoverhead/channel-msgpersec.go
#include <mutex>
#include <condition_variable>
#include <deque>
#include <stdio.h>
#include <string>
#include <iostream>
#include <thread>
#include <assert.h>
using namespace std;
template <typename T>
struct bq
{
  std::mutex              d_mutex;
  std::condition_variable d_condition;
  std::deque<T>           d_queue;
  void push(T const& value) {
    {
        std::unique_lock<std::mutex> lock(this->d_mutex);
        d_queue.push_front(value);
    }
    this->d_condition.notify_one();
  }
  T pop() {
    std::unique_lock<std::mutex> lock(this->d_mutex);
    this->d_condition.wait(lock, [=]{ return !this->d_queue.empty(); });
    T rc(std::move(this->d_queue.back()));
    this->d_queue.pop_back();
    return rc;
  }
};
#include <sys/time.h>
#include <unistd.h>
#include <stdarg.h>
double sec(){struct timeval tv;gettimeofday(&tv,NULL);return tv.tv_sec+tv.tv_usec*1e-6;}
template<class TYPE>
void foo(string name,TYPE test_val){
  bq<TYPE> q0,q1;int n=2*1000*10;
  auto bef=sec();
  thread t0([&](){
    for(int i=0;i<n;i++){
      q1.push(test_val);
      assert(q0.pop()==test_val);
    }
  });
  thread t1([&](){
    for(int i=0;i<n;i++){
      auto s=q1.pop();
      q0.push(s);
    }
  });
  t0.join();t1.join();
  auto t=(sec()-bef);
  auto perf=double(n)/t;
  string q="\"";
  cout<<q+name+q<<":{\"sec\":"<<t<<","<<"\"perf\":"<<perf<<"},"<<endl;
}
template<class TYPE>
void raw(string name,TYPE test_val){
  std::deque<TYPE> q0;auto&q1=q0;int n=20*1000*1000;
  auto bef=sec();
  {
    #define push push_front
    #define pop pop_back
    for(int i=0;i<n;i++){
      q1.push(test_val);
      auto s=q1.back();q1.pop();
      q0.push(s);
      assert(q0.back()==test_val);q0.pop();
    }
  }
  auto t=(sec()-bef);
  auto perf=double(n)/t;
  string q="\"";typedef long long int int64;
  cout<<q+name+q<<":{\"sec\":"<<t<<","<<"\"perf\":"<<int64(perf)<<"},"<<endl;
}
int main(){
  cout<<"{"<<endl;;
  foo<string>("string","test");
  foo<int>("int",9000);
  raw<string>("raw_string","test");
  raw<int>("raw_int",9000);
  cout<<"}"<<endl;;
  return 0;
}
