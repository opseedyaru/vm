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
int main(){
  bq<string> q0,q1;int n=2*1000*1000;
  auto bef=sec();
  thread t0([&](){
    for(int i=0;i<n;i++){
      q1.push("test");
      assert(q0.pop()=="test");
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
  cout<<"{sec:"<<t<<","<<"perf:"<<perf<<"}"<<endl;
  return 0;
}
