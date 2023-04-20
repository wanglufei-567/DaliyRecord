const RESOLVED = 'resolved'
const REJECTED = 'rejected'
const PENDING = 'pending'

class MyPromise {
  constructor(executor) {
    const self = this
    self.data = null
    self.status = PENDING
    self.callBack = {}

    function

    try{
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }
}