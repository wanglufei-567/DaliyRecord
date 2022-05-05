/*
一般来说，前端是不需要考虑编码的，但是后段需要读取数据、操作文件，需要用到编码，所以学习node有必要掌握编码知识。

在引入 TypedArray 之前，JavaScript 语言没有用于读取或操作二进制数据流的机制。但在处理像TCP流或文件流时，必须使用到二进制数据。 因此在 Node.js中，定义了一个 Buffer 类，该类用来创建一个专门存放二进制数据的缓存区。

在 Node.js 中，Buffer 类是随 Node 内核一起发布的核心库。Buffer 库为 Node.js 带来了一种存储原始数据的方法，可以让 Node.js 处理二进制数据，每当需要在 Node.js 中处理I/O操作中移动的数据时，就有可能使用 Buffer 库。原始数据存储在 Buffer 类的实例中。一个 Buffer 类似于一个整数数组，但它对应于 V8 堆内存之外的一块原始内存。


计算机内存中存储的数据都是二进制的，而Buffer是16进制的，其目的是为了简短
另外node中只支持utf-8

Buffer 与Stream 紧密相连。 当流处理器接收数据的速度快于其消化的速度时，则会将数据放入 buffer 中。

*/

/* 简而言之，Buffer是Node用来操作二进制数据的机制，一个Buffer可以类比为一个整数数组，只不过它的内存不是V8分配的栈内存 */


/* --------------------------------------------------------------------- */

/*
Buffer.alloc(size[, fill[, encoding]])： 返回一个指定大小的 Buffer 实例，如果没有设置 fill，则默认填满 0， encoding是编码,默认utf-8
*/
// 2进制以0b开头 8进制以0o开头 16进制以0x开头
// 单位是字节，8个byte
const buf1 = Buffer.alloc(3);
console.log('buf1', buf1) // <Buffer 00 00 00>

const buf2 = Buffer.alloc(1, 255);
console.log('buf1', buf2) // <Buffer ff>

const buf3 = Buffer.alloc(3, '草')
console.log(buf3) // <Buffer e8 8d 89>


/*
Buffer.from(string[, encoding])： 返回一个被 string 的值初始化的新的 Buffer 实例
*/

const buf4 = Buffer.from('卧槽')
console.log('buf4', buf4) // <Buffer e5 8d a7 e6 a7 bd>
console.log(buf4.toString()); // 卧槽
console.log(buf4.toString('utf-8')); // 卧槽
console.log(buf4.toString('base64')); // 5Y2n5qe9

const buf5 = Buffer.from('卧') // <Buffer e5 8d a7 >
const buf6 = Buffer.from('槽') // <Buffer e6 a7 bd>
const buf7 = Buffer.alloc(6); // <Buffer 00 00 00 00 00 00>
buf5.copy(buf7, 0, 0, 3)
buf6.copy(buf7, 3, 0, 3)
console.log(buf7.toString()) // 卧槽

/* ---------------------------------------------------------------- */

/*
写入 缓冲区
buf.write(string[, offset[, length]][, encoding])
string - 写入缓冲区的字符串。
offset - 缓冲区开始写入的索引值，默认为 0 。
length - 写入的字节数，默认为 buffer.length
encoding - 使用的编码。默认为 'utf8' 。

根据 encoding 的字符编码写入 string 到 buf 中的 offset 位置。 length 参数是写入的字节数。 如果 buf 没有足够的空间保存整个字符串，则只会写入 string 的一部分。 只部分解码的字符不会被写入。

返回实际写入的大小。如果 buffer 空间不足， 则只会写入部分字符串。
*/

buf = Buffer.alloc(256);

len = buf.write("卧槽wocao");

console.log("写入字节数 : "+  len); // 11 2X3+5