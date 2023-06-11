16:35
奈斯啊小刘超奈斯
sbuscribe不懂 




感觉redux 是状态管理最复杂的。。。 
难忘记nice
redux-saga不理解 
Dave
1 
青衣
源码不复杂，可能使用起来不习惯 
16:44
Dave
能不能 直接赋值 给state  
永远不要直接给this.state赋值

测不准
store 只是负责村数据。页面刷新还是页面自己的事是吧 



Dave
this.state = getstate() 
测不准
有像 vue 那种，store数据变了 页面直接更新的么。假如在store里写个定时器 
后面我们也会写类似的功能

redux
只有一个仓库，仓库里只有一个状态


难忘记nice
这里面好像没有命名空间了。就行vuex namespace那种的 
后面我们会讲dva,dva里就有命名空间，可以实类似的功能
奈斯啊小刘超奈斯
那 1 也有 ADD ,2也有ADD是不是 都会触发呀 
会的



20:13
bu
connect 第二个参数是一个对象吗？  
可以是第一个对象
也可以是一个函数
mapStateToProps   state=>state.counter1
mapDispatchToProps    dispatch=({add1(){dispatch({type:'ADD1'})}})
mapDispatchToProps  actionCreators

喜喜
state中有state.counter1这个属性吗 

20:23
喜喜
还有一个问题呀 
奈斯啊小刘超奈斯
有的 
奈斯啊小刘超奈斯
state是形参 


20:23
喜喜
还有一个问题呀 
奈斯啊小刘超奈斯
有的 
奈斯啊小刘超奈斯
state是形参 
20:31
bu
connect 第二个参数 什么场景会用到传函数？ 
喜喜
mapTodispatch看一下 
英剑คิดถึง
mapTodispatch 没听懂 
白开水
18行订阅状态那里详细说下 




react-redux的provider就是上下文呀 
Provider是使用react中的 上下文实现的


喜喜
react-redux的provider就是上下文呀 
20:56
bu
为啥有的时候reducer不返回一个新对象， 会导致不更新呢？ 

因为很多地方都有一个优化，如果新对象和老对象同一个对象的话，就不更新

let obj1 ={number:1}
obj1.number= 2;
obj1 ==== obj2
不更新了
所以一般来说要求reducer永远 要返回一个新的对象



21:29
a a a
dispatch不是引用数据类型吗  是的
英剑คิดถึง
store.dispatch 重新赋值了。不影响 



21:37
喜喜
参数也是固定的吗 是的
21:42
青衣
中间件实现应用了高阶函数吗 是的
柯里化
奈斯啊小刘超奈斯
日志就是log呀 



21:46
难忘记nice
柯里化 
bu
为了实现多个中间件吧  
喜喜
为了级联 

复杂的参数简单化吧 



middlewareApi里面的dispatch调用的是中间件的返回值吗？这里我不理解 
是的
英剑คิดถึง
这个组合函数 源码里面也这么写的吗 



middlewareApi里面的dispatch调用的是中间件的返回值吗？这里我不理解 
英剑คิดถึง
这个组合函数 源码里面也这么写的吗 
喜喜
let middlewareAPI = {
                getState: store.getState,
                dispatch: (action) => dispatch(action)
            };
            dispatch = middleware(middlewareAPI)(store.dispatch) 
难忘记nice
源码用的reduce 应该 
喜喜
就是这里 
bu
课件的 reduce 写法过一下吧， 不太明白 
难忘记nice
reduce不用明白。太绕了 老师写的这个和reduce一个意思 更好理解了 
bu
redux中间件中， 什么时候掉用next, 什么时候掉用newdispatch  
喜喜
函数的参数咋能调到  函数执行后的返回值呢？没明白 

先调用newDispatch 在newDispatch里调用next



20:42
喜喜
就刚说的那个diaptch 的问题 
bu
插件里面 第一层不是接收了 一个 dispatch 吗？ 会有场景掉用这个dispatch吗？ 

难忘记nice
比如鉴权，你的一个异步动作中检测到未登录，
需要调用全局的登录动作，那这个时候就最好用包装的dispatch去触发，我是这么想的 
英剑คิดถึง
co吧 
