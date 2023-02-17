//根据虚拟DOM构建成的fiber树
let A1 = { type: 'div', props: { id: 'A1' } };
let B1 = { type: 'div', props: { id: 'B1' }, return: A1 };
let B2 = { type: 'div', props: { id: 'B2' }, return: A1 };
let C1 = { type: 'div', props: { id: 'C1' }, return: B1 };
let C2 = { type: 'div', props: { id: 'C2' }, return: B1 };

//A1的第一个子节点B1
A1.child = B1;
//B1的弟弟是B2
B1.sibling = B2;
//B1的第一个子节点C1
B1.child = C1;
//C1的弟弟是C2
C1.sibling = C2;

//下一个工作单元
let nextUnitOfWork = null;

// 模拟浏览器的剩余空闲时间
const hasTimeRemaining = () =>
  Math.floor(Math.random() * 10) % 2 == 0;

/**
 * @description 完成当前工作单元的方法
 */
function completeUnitOfWork(fiber) {
  console.log('completeUnitOfWork', fiber.props.id);
}

/**
 * @description 处理当前fiber，并返回当前fiber的子fiber
 */
function beginWork(fiber) {
  // 这里做些当前fiber的逻辑处理
  console.log('beginWork', fiber.props.id);
  return fiber.child; //B1
}

/**
 * @description 执行当前工作单元
 */
function performUnitOfWork(fiber) {
  let child = beginWork(fiber);
  //如果执行完A1之后，会返回A1的第一个子节点
  if (child) {
    return child;
  }

  //如果没有子节点说明当前节点已经完成了渲染工作
  while (fiber) {
    //结束此fiber的渲染了
    completeUnitOfWork(fiber);

    if (fiber.sibling) {
      //如果它有兄弟fiber就返回兄弟fiber
      return fiber.sibling;
    }

    //如果没有兄弟fiber就让父fiber也完成，之后就找叔叔fiber
    fiber = fiber.return;
  }
}

/**
 * @description render工作循环
 */
function workLoop() {
  /**
   * 工作循环每一次处理一个fiber,处理完以后可以暂停
   * 如果有下一个任务并且有剩余的时间的话，执行下一个工作单元，也就是一个fiber
   */
  while (nextUnitOfWork && hasTimeRemaining()) {
    //执行一个任务并返回下一个任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  console.log('render阶段结束');
}

nextUnitOfWork = A1;

workLoop();
