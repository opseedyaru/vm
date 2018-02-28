resp_off();
let promise=new Promise((resolve,reject)=>{
  setTimeout(() => {
    if(rand()%2==0)throw new Error('fail');
    resolve("result");
  },16);
});
promise
  .then(
    result => {
      txt("Fulfilled: " + result);
    },
    err => {
      txt("Rejected: " + err);
    }
  );