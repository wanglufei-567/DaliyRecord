// function *read() {
//   const a = yield 1;
//   const b = yield 2;
//   const c = yield 3;
// }
// 生成器函数的实现就是下面这样的，通过switch...case来实现

let regeneratorRuntime = {
    // iteratorFn就是Generator函数
    wrap(iteratorFn){
        // 创建一个上下文对象
        const context = {
            next:0,
            done:false, // 表示迭代器没有执行完毕
            stop(){
                context.done = true; // 表示整个函数执行完毕
            },
            sent:null
        }
        // 创建一个Iterator
        let it = {};

        // 创建Iterator的next方法
        it.next = function(value){ // 此value会传递给上一次yield的返回值
            context.sent = value;
            // 执行Generator函数，参数是上下文对象context
            let v = iteratorFn(context);
            return {
                value:v,
                done:context.done
            }
        }
        // 将Iterator返回出去
        return it;
    }
}

function read() {
  var a, b, c;
  /**
   * regeneratorRuntime.wrap接收一个Generator函数
   * 返回一个Iterator对象
   * 每次调用Iterator对象的next方法，便会继续执行Generator函数
   * 通过 上下文对象_context.next来匹配具体的case，也就是yield
   */
  return regeneratorRuntime.wrap(function(_context) {
    /**
     * _context是接收到的上下文对象
     * 通过上下文对象的_context.next属性，来匹配case
     * 每一个case对应一个yield
     * 每一个case中会切换_context.next属性为下一个case
     */
      switch (_context.prev = _context.next) {
        // 这里每一个case对应一个yield
        case 0:
          // 将_context.next切换成下一个case
          _context.next = 2;
          return 1;
        case 2:
          // 获取到next方法传入的数据
          a = _context.sent;
          console.log(a);
          // 将_context.next切换成下一个case
          _context.next = 6;
          return 2;
        case 6:
          b = _context.sent;
          console.log(b);
          // 将_context.next切换成下一个case
          _context.next = 10;
          return 3;
        case 10:
          c = _context.sent;
          console.log(c);
        case 12:
        case "end":
          return _context.stop();
      }
  });
}

let it = read()
{
    let {value,done} = it.next('无意义的');
    console.log(value,done)
}
{
    let {value,done} = it.next('a');
    console.log(value,done)
}
{
    let {value,done} = it.next('b');
    console.log(value,done)
}
{
    let {value,done} = it.next('c');
    console.log(value,done)
}
{
    let {value,done} = it.next('c');
    console.log(value,done)
}