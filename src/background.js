addEventListener('myCustomEvent', (resolve, reject, args) => {
  console.log("outside", JSON.stringify(args));
  
  resolve({data: new Date()});
});