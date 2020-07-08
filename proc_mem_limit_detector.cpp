#include <time.h>
#include <iostream>
#include <string>
#include <vector>
#include <stdlib.h>
#include <stdio.h>
#include <cstring>
#ifndef _MSC_VER
#include <unistd.h>
#include <sys/time.h>
unsigned long long get_tot_sysmem(){return sysconf(_SC_PHYS_PAGES)*sysconf(_SC_PAGE_SIZE);}
#else
#include <windows.h>
unsigned long long get_tot_sysmem(){MEMORYSTATUSEX t;t.dwLength=sizeof(t);GlobalMemoryStatusEx(&t);return t.ullTotalPhys;}
#endif
using namespace std;
static vector<string> split(const string&s,const string&needle)
{
  vector<string> arr;
  if(s.empty())return arr;
  size_t p=0;
  for(;;){
    auto pos=s.find(needle,p);
    if(pos==std::string::npos){arr.push_back(s.substr(p));return arr;}
    arr.push_back(s.substr(p,pos-p));
    p=pos+needle.size();
  }
  return arr;
}
static string join(const vector<string>&arr,const string&glue)
{
  string out;
  size_t c=0;
  size_t dc=glue.size();
  for(size_t i=0;i<arr.size();i++){if(i)c+=dc;c+=arr[i].size();}
  out.reserve(c);
  for(size_t i=0;i<arr.size();i++){if(i)out+=glue;out+=arr[i];}
  return out;
}
#ifndef _MSC_VER
double get_ms(){
  struct timeval tv;
  gettimeofday(&tv,NULL);
  auto v=(tv.tv_sec*1000+tv.tv_usec/1000.0);
  static auto prev=v;
  return v-prev;
}
#else
struct QapClock{
  typedef __int64 int64;
  int64 freq,beg,tmp;bool run;
public:
  QapClock(){QueryPerformanceFrequency((LARGE_INTEGER*)&freq);run=false;tmp=0;Start();}
  void Start(){QueryPerformanceCounter((LARGE_INTEGER*)&beg);run=true;}
  void Stop(){QueryPerformanceCounter((LARGE_INTEGER*)&tmp);run=false;tmp-=beg;}
  double Time(){if(run)QueryPerformanceCounter((LARGE_INTEGER*)&tmp);return run?double(tmp-beg)/double(freq):double(tmp)/double(freq);}
  double MS(){
    double d1000=1000.0;
    if(run)QueryPerformanceCounter((LARGE_INTEGER*)&tmp);
    if(run)return (double(tmp-beg)*d1000)/double(freq);
    if(!run)return (double(tmp)*d1000)/double(freq);
    return 0;
  }
};
double get_ms(){static QapClock c;return c.MS();}
#endif
void loop(size_t*p,size_t n){for(size_t i=0;i<n;i++)p[i]=7;}
void mset(size_t*p,size_t n){memset(p,7,n*sizeof(size_t));}
typedef const string&CSR;
void json_like(vector<string>&out,CSR n,CSR v,CSR u){
  auto q=[](CSR s){return "\""+s+"\"";};
  out.push_back(q(n)+":"+q(v+u));
}
void text_like(vector<string>&out,CSR n,CSR v,CSR u){
  auto q=[](CSR s){return s;};
  out.push_back(q(n)+"="+q(v+u));
}
const auto default_params=split("./app 50 mset all dual json no_detect_swap no_show_header print_units 900 nope"," ");
const auto v0=split("./app 128 mset all dual no_json no_detect_swap show_header print_units 10485760"," ");
int main(int argc,const char**argv)
{
  auto arr=default_params;
  if(argc==2&&string(argv[1])=="v0")arr=v0;
  if(bool use_pDP=true){
    static vector<const char*> ptrs;
    arr[0]=argv[0];
    auto cn=arr.size();auto N=std::max<size_t>(cn,argc);
    arr.resize(N);ptrs.resize(N);
    for(size_t i=0;i<N;i++){ptrs[i]=i<argc?argv[i]:(i<cn?arr[i].c_str():argv[i]);}
    argv=&ptrs[0];
    argc=arr.size();
  }
  int mb=128;
  if(argc>1){
    mb=std::stol(argv[1]);
  }
  auto*func=&mset;
  if(argc>2){
    if(string(argv[2])=="loop")func=&loop;
  }
  int show_dots=1;
  if(argc>3){
    auto s=string(argv[3]);
    show_dots=0;
    if(s=="dots")show_dots=1;
    if(s=="all")show_dots=2;
  }
  bool dual=false;
  if(argc>4){
    dual=string(argv[4])=="dual";
  }
  //
  bool json=false;
  if(argc>5){
    json=string(argv[5])=="json";
  }
  typedef decltype(json_like) t_func;
  auto f=json?json_like:text_like;
  //
  bool detect_swap=true;
  if(argc>6){
    detect_swap=string(argv[6])=="detect_swap";
  }
  bool show_header=true;
  if(argc>7){
    show_header=string(argv[7])=="show_header";
  }
  bool print_units=true;
  if(argc>8){
    print_units=string(argv[8])=="print_units";
  }
  size_t max_mb=10*1024*1024;
  if(argc>9){
    max_mb=std::stol(argv[9]);
  }
  if(show_header){
    cout<<"usage: a.out [buff_size/*in MiB*/] [mset/*memset*/ or loop/*for(...)*/] [dots|all|no] [dual] [json] [detect_swap] [show_header] [print_units] [max_mb]\n";
    cout<<"sizeof(void*) = "<<sizeof(void*)<<endl;
    cout<<"default_params: "<<join(default_params," ")<<endl;
    cout<<"v0: "<<join(v0," ")<<endl;
  }
  //cout<<argc;return 0;
  vector<size_t*> ptrs;ptrs.reserve(1024);
  bool done=false;
  for(size_t i=0;i<1000*64;i++){
    //#ifdef _MSC_VER
    if((i+1)*mb>max_mb)return 0;
    //#endif
    int n=1024*1024*mb;
    auto nocare=(size_t*)malloc(n);
    if(!nocare){cout<<"mem =  "<<i<<" MB"<<endl<<std::flush;return 0;}
    auto prev=get_ms();
    func(nocare,n/sizeof(size_t));
    auto t=get_ms()-prev;
    ptrs.push_back(nocare);
    auto init=double(mb)/t;
    string dots;if(show_dots)dots.resize(int(init*8),'.');
    static auto max_t=t*8;
    vector<string> line;
    #define F(NAME,VALUE,U)f(line,#NAME,to_string(VALUE),print_units?U:"");
    F(mem,(i+1)*mb," MiB");
    F(t,t," ms");
    F(init,mb/t," MiB/ms");
    string dots2;
    if(dual){
      auto bef=get_ms();
      func(nocare,n/sizeof(size_t));
      auto ms=get_ms()-bef;
      F(ms,ms," ms");
      F(using,mb/ms," MiB/ms");
      if(show_dots==2)dots2.resize(int(mb/ms),'.');
      static auto max_ms=ms*8;
      if(detect_swap)if(ms>max_ms){cerr<<"swap detected. // mem using"<<endl;done=true;}
    }
    if(show_dots)f(line,"dots",dots,"");
    if(show_dots==2)f(line,"dots2",dots2,"");
    #undef F
    string s=json?"{"+join(line,",")+"},":join(line,"    ");
    cout<<s<<"\n"<<std::flush;
    if(detect_swap)if(t>max_t){cerr<<"swap detected. // mem init"<<endl;done=true;}
    if(done)break;
    //usleep(1000*16);
  }
  return 0;
}
 
// g++ -std=c++11 -O2 mem.cpp -o main
