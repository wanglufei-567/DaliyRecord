const EventEmitter = require('events');
const fs = require('fs');

class ReadStream extends EventEmitter {
  constructor(path, options = {}) {
    super();
    this.path = path;
    this.flags = options.flags || 'r';
    this.encoding = options.encoding || null;
    this.autoClose = options.autoClose || true;
    this.emitClose = options.emitClose || true;
    this.start = options.start || 0;
    this.end = options.end || undefined;
    this.highWaterMark = options.highWaterMark || 64 * 1024;

    this.flowing = false; // 非流动模式，还没有开始读取文件中的内容。后续 pause resume 就是更新这个flowing属性的

    this.open(); // 异步的

    // 订阅时间的时候，如果不是newListener事件就会触发newListener的回调,同步触发的
    this.on('newListener', type => {
      if (type === 'data') {
        this.flowing = true;
        // 只有在订阅 'data' 事件时才触发文件读取
        this.read();
      }
    });

    this.offset = this.start;
  }

  pipe(ws) {
    const rs = this;
    rs.on('data', function (chunk) {
      let flag = ws.write(chunk);
      if (!flag) {
        rs.pause();
      }
    });
    ws.on('drain', function () {
      rs.resume();
    });
  }

  destroy(err) {
    if (err) {
      return this.emit('error', err);
    }
    if (this.autoClose) {
      fs.close(this.fd, () => {
        if (this.emitClose) {
          this.emit('close');
        }
      });
    }
  }

  read() {
    if (typeof this.fd !== 'number') {
      // 这里的处理逻辑是，打开文件是异步的，打开文件之后会给this.fd赋值，当this.fd没有值时，说明文件还没有打开，这里订阅一次'open'事件，当文件打开时再一次调用read
      return this.once('open', () => this.read());
    }

    // 需要根据 用户提供的start 和 end 来进行读取
    let howMutchToRead = this.end
      ? Math.min(this.highWaterMark, this.end - this.offset + 1)
      : this.highWaterMark;

    // 这个地方每次都要产生一个新得buffer
    const buffer = Buffer.alloc(howMutchToRead);
    fs.read(
      this.fd,
      buffer,
      0,
      howMutchToRead,
      this.offset,
      (err, bytesRead) => {
        if (bytesRead) {
          this.offset += bytesRead;
          // 这里发布'data'事件，将缓冲区中的数据传递出去
          this.emit('data', buffer.slice(0, bytesRead));
          // 检查是否继续读取
          if (this.flowing) {
            this.read();
          }
        } else {
          this.emit('end');
          this.destroy();
        }
      }
    );
  }

  open() {
    fs.open(this.path, this.flags, (err, fd) => {
      if (err) {
        return this.destroy(err);
      }
      this.fd = fd;
      // 发布 'open' 事件
      this.emit('open', fd);
    });
  }

  resume() {
    if (!this.flowing) {
      this.flowing = true;
      // 继续读取
      this.read();
    }
  }

  pause() {
    this.flowing = false;
  }
}

module.exports = ReadStream;
