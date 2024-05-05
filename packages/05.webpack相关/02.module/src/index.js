if (Math.random() * 10 > 5) {
  import(/* webpackChunkName: "hello" */ './hello').then(result => {
    console.log(result.default);
  });
}
