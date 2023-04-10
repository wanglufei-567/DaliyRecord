/**
 * 返回一个方法，内部执行store的dispatch方法，
 * dispatch方法接收的action是actionCreator执行的结果
 */
function bindActionCreator(actionCreator, dispatch) {
  return (...args) => {
    return dispatch(actionCreator.apply(null, args));
  };
}

/**
 * 将actionCreator与dispatch进行绑定
 * @param actionCreators 长这样 {add(){return {type:"ADD"}}}
 * @param dispatch store的dispatch方法
 */
function bindActionCreators(actionCreators, dispatch) {
  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    // 从actionCreators取出actionCreator与dispatch进行绑定
    boundActionCreators[key] = bindActionCreator(
      actionCreator,
      dispatch
    );
  }
  return boundActionCreators;
}

// export default bindActionCreators;

/**
 * actionCreators={
 * add(){
 *   return {type:"ADD"}
 * }
 * }
 *
 * boundActionCreators={
 * add(){
 * dispatch({type:"ADD"});
 * }
 * }
 */

// function createStore(reducer) {
//   // store中的state
//   let state;

//   // 用于存放监听函数
//   const listeners = [];

//   /**
//    * 获取store的state
//    */
//   function getState() {
//     return state;
//   }

//   /**
//    * 向仓库派发一个动作，会调用reducer,根据老状态和新动作计算新状态
//    * @param {*} action
//    */
//   function dispatch(action) {
//     state = reducer(state, action);
//     listeners.forEach(l => l());
//   }

//   /**
//    * 订阅状态变化事件，当状态发生改变后执行所有的监听函数
//    * @param {*} listener
//    * @returns 返回一个清除当前监听函数的方法
//    */
//   function subscribe(listener) {
//     listeners.push(listener);
//     return () => {
//       let index = listeners.indexOf(listener);
//       listeners.splice(index, 1);
//     };
//   }

//   dispatch({ type: '@@REDUX/INIT' });

//   return {
//     getState,
//     subscribe,
//     dispatch
//   };
// }

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

// // dispatch一个action，触发reducer执行改变state
// function edit(payload) {
//   return { type: 'EDIT', payload };
// }

// // 创建 Action Creators
// const actions = { edit };

// // 将 Action Creators 和 dispatch 函数绑定在一起
// const boundActions = bindActionCreators(actions, store.dispatch);

// // 触发action
// boundActions.edit('beijing');
// console.log('dispatch修改后的state', store.getState());
