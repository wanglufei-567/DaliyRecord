import _set from 'lodash/set'
import _get from 'lodash/get'
import produce from 'immer'

export default class EditModel {
  constructor(data){
    this.state = data
    this.shared = {}
  }

  get(key, fallbackValue) {
    return _get(this.state, key) || fallbackValue
  }

  set(key, value){
     this.state = produce(this.state, draft => {
      _set(draft, key, value)
     })
  }

  getShared(key) {
    return _get(this.shared, key)
  }

  setShared(key, value) {
    _set(this.shared, key, value)
  }

  getState(){
    return this.state
  }
}

function bindClassProxyUpdate(target, updateKeys, updateFunc){
  updateKeys.forEach(key => {
    target[key] = new Proxy(target, {
      apply: (obj, ctx, args) => {
        // 方法本身执行结果
        const result = Reflect.apply(obj, ctx, args)
        // 插入的更新方法
        updateFunc()
        // 将结果返回
        return result
      }
    })
  });
}

// 对set和setShared方法进行代理，数据更新时触发更新方法
bindClassProxyUpdate(editModel, ['set', 'setShared'], updateFunc)

/**
 * React中updateFunc可以是一个setSate方法
 * 比如：
 * const [state, setState] = useState(0)
 * const updateFunc = setState(Math.random())
 */