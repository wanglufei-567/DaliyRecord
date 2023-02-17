import { getFiberCurrentPropsFromNode } from '../client/ReactDOMComponentTree';

/**
 * 获取此fiber上对应的回调函数
 * @param {*} inst fiber节点
 * @param {*} registrationName React事件名
 */
export default function getListener(inst, registrationName) {
  const { stateNode } = inst;
  if (stateNode === null) return null;

  // 从当前fiber节点对应的真实DOM上获取props
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (props === null) return null;

  // 获取事件监听方法
  const listener = props[registrationName]; //props.onClick
  return listener;
}
