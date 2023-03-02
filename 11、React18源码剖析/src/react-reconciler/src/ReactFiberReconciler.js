import { createFiberRoot } from './ReactFiberRoot';
import {
  createUpdate,
  enqueueUpdate
} from './ReactFiberClassUpdateQueue';
import {
  scheduleUpdateOnFiber,
  requestUpdateLane
} from './ReactFiberWorkLoop';

/**
 * @description 创建容器
 * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
 * @return 返回一个FiberRoot
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 * @description 更新容器，把虚拟DOM变成真实DOM插入到container容器中
 * @param {*} element 虚拟DOM
 * @param {*} container DOM容器 也就是FiberRootNode
 * 其中container.containerInfo 指向 div#root
 * container.current 指向 HostRootFiber
 */
export function updateContainer(element, container) {
  //获取当前的根fiber HostRootFiber
  const current = container.current;

  //请求一个更新车道 初次渲染时是默认事件车道 DefaultLane 16
  const lane = requestUpdateLane(current);

  //创建更新对象
  const update = createUpdate(lane);

  //给更新对象上添加要更新的虚拟DOM
  update.payload = { element };

  //把此更新对象添加到HostRootFiber的更新队列上，返回根节点
  const root = enqueueUpdate(current, update, lane);

  // 在fiber上调度更新
  scheduleUpdateOnFiber(root, current, lane);
}
