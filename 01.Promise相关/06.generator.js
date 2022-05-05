// 简单来讲：迭代器是可迭代对象，而生成器是创建迭代器的函数。迭代器具有Symbol.iterator方法和next()方法

function *test() {
  const a = yield 1; // data1
  const b = yield 2; // data2
  const c = yield 3; // data3
}

// 调用生成器函数会产生一个生成器对象。生成器对象一开始处于暂停执行（suspended）的状态。与迭代器相似，生成器对象也实现了 Iterator 接口，因此具有 next()方法。调用这个方法会让生成器开始或恢复执行。next()方法的返回值类似于迭代器，有一个 done 属性和一个 value 属性。函数体为空的生成器 函数中间不会停留，调用一次 next()就会让生成器到达done: true 状态

const it = test();

// const it2 = [...it] // [1,2,3],


const data1 = it.next('data1'); // { value: 1, done: false }

const data2 = it.next('data2'); // { value: 2, done: false }

const data3 = it.next('data3'); // { value: 3, done: false }

const data4 = it.next('data4'); // { value: undefined, done: true }


// 调用生成器函数会产生一个生成器对象。生成器对象一开始处于暂停执行（suspended）的状态。与迭代器相似，生成器对象也实现了 Iterator 接口，因此具有 next()方法
console.log([...{
    0: 1,
    1: 2,
    2: 3,
    length: 3,
    // [Symbol.iterator]: function() {
    //     let arr = this;
    //     let index = 0;
    //     return {
    //         next(){ // 迭代时会调用next方法  必须要返回两个属性 {value,done}
    //            return {value:arr[index],done:index++ == arr.length}
    //         }
    //     }
    // }
    [Symbol.iterator]:function *() {
        let index = 0;
        while (index != this.length) {
            yield this[index++];
        }
    }
}])