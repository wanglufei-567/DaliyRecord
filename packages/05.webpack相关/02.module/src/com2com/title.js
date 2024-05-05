// const name = 'title'
// const inform = 'just a title'
// module.exports = name + inform;
let count = 1;
module.exports = {
  count,
  add() {
    count += 1;
  },
  get() {
    return count;
  },
};
