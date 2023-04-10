function createStore(reducer) {
  // store中的state
  let state;

  // 用于存放监听函数
  const listeners = [];

  /**
   * 获取store的state
   */
  function getState() {
    return state;
  }

  /**
   * 向仓库派发一个动作，会调用reducer,根据老状态和新动作计算新状态
   * @param {*} action
   */
  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach(l => l());
  }

  /**
   * 订阅状态变化事件，当状态发生改变后执行所有的监听函数
   * @param {*} listener
   * @returns 返回一个清除当前监听函数的方法
   */
  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      let index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  dispatch({ type: '@@REDUX/INIT' });

  return {
    getState,
    subscribe,
    dispatch
  };
}
export default createStore;

// function address(state = { address: 'china' }, action) {
//   switch (action.type) {
//     case 'EDIT':
//       return {
//         ...state,
//         address: action.payload // dispatch({type: 'EDIT', payload: 123})
//       };
//     default:
//       return state;
//   }
// }

// // 创建store
// let store = createStore(address);
// console.log('初始state', store.getState());

// // 订阅state的变化
// store.subscribe(() => console.log('订阅state的变化', store.getState()));

// // dispatch一个action，触发reducer执行改变state
// store.dispatch({
//   type: 'EDIT',
//   payload: 'beijing'
// });
// console.log('dispatch修改后的state', store.getState());
