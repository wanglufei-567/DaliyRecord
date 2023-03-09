//每种虚拟DOM都会对应自己的fiber tag类型

export const FunctionComponent = 0;//函数组件
export const ClassComponent = 1; //类组件
export const IndeterminateComponent = 2; // 未定的类型
export const HostRoot = 3; //根Fiber的tag
export const HostComponent = 5; //原生节点 span div h1
export const HostText = 6; //纯文件节点

