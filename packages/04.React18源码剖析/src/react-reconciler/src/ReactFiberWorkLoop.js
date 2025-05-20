import {
    scheduleCallback as Scheduler_scheduleCallback,
    shouldYield,
    ImmediatePriority as ImmediateSchedulerPriority,
    UserBlockingPriority as UserBlockingSchedulerPriority,
    NormalPriority as NormalSchedulerPriority,
    IdlePriority as IdleSchedulerPriority,
    cancelCallback as Scheduler_cancelCallback,
    now,
} from './scheduler'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { completeWork } from './ReactFiberCompleteWork'
import { NoFlags, MutationMask, Placement, Update, ChildDeletion, Passive } from './ReactFiberFlags'
import {
    commitMutationEffectsOnFiber, //执行DOM操作
    commitPassiveUnmountEffects, //执行destroy
    commitPassiveMountEffects, //执行create
    commitLayoutEffects,
} from './ReactFiberCommitWork'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates'
import {
    NoLanes,
    markRootUpdated,
    getNextLanes,
    getHighestPriorityLane,
    SyncLane,
    includesBlockingLane,
    NoLane,
    markStarvedLanesAsExpired,
    includesExpiredLane,
    markRootFinished,
    NoTimestamp,
    mergeLanes,
} from './ReactFiberLane'
import {
    getCurrentUpdatePriority,
    lanesToEventPriority,
    DiscreteEventPriority,
    ContinuousEventPriority,
    DefaultEventPriority,
    IdleEventPriority,
    setCurrentUpdatePriority,
} from './ReactEventPriorities'
import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { scheduleSyncCallback, flushSyncCallbacks } from './ReactFiberSyncTaskQueue'

// 正在进行中的工作，也就是正在计算中的fiber
let workInProgress = null
//正在构建中的根节点
let workInProgressRoot = null
//此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false
//具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let rootWithPendingPassiveEffects = null
// 当前渲染的优先级
let workInProgressRootRenderLanes = NoLanes

//构建fiber树正在进行中
const RootInProgress = 0
//构建fiber树已经完成
const RootCompleted = 5
//当渲染工作结束的时候当前的fiber树处于什么状态,默认进行中
let workInProgressRootExitStatus = RootInProgress

//保存当前的事件发生的时间
let currentEventTime = NoTimestamp

/**
 * @description 在fiber上调度更新 也就是计划更新root
 * 源码中此处有一个任务的功能，这里后续再实现
 * @param root 根 FiberRootNode
 * @param lane 车道 初次渲染时是默认事件车道 DefaultLane 16
 * @param eventTime 当前事件发生的时间，用于后续给lanes计算过期时间
 */
export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
    console.log('scheduleUpdateOnFiber', lane)
    // 给当根 root 标记更新的车道
    markRootUpdated(root, lane)
    // 确保调度执行root上的更新
    ensureRootIsScheduled(root, eventTime)
}

/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root, currentTime) {
    //先获取当前根上执行任务
    const existingCallbackNode = root.callbackNode

    /**
     * @description 标记所有饥饿赛道为过期
     * root上有个属性expirationTimes用于记录31条lane的过期时间（默认值为-1）
     * 当root.pendingLanes不为NoLanes时
     * 第一次会为pendingLanes的每条lane计算过期时间expirationTime
     * 后面会比较expirationTime和currentTime
     * 若expirationTime<currentTime，说明对应的lane已经过期
     * 过期的lane会被记录到root.expiredLanes
     */
    markStarvedLanesAsExpired(root, currentTime)

    //获取当前优先级最高的车道
    const nextLanes = getNextLanes(root, workInProgressRootRenderLanes) //16

    /**
     * ‼️重要
     * 如果没有更新车道，也就是没有要执行的任务，直接退出调度
     * 这点很重要，因为commit之后会再次调用ensureRootIsScheduled
     * 以防root上有跳过更新还没有调度
     * 那么如何判断root上是否还有更新呢？
     * 就是通过这个判断nextLanes === NoLanes
     * 没有lanes就没有更新任务
     * 一个更新任务完成会将其对应的lane从root.pendingLanes上去掉
     * 标识该lanes的更新已经完成
     * 当所有的更新都完成，root.pendingLanes便为NoLanes
     */
    if (nextLanes === NoLanes) {
        return
    }

    //获取新的调度优先级
    let newCallbackPriority = getHighestPriorityLane(nextLanes) //16
    console.log('ensureRootIsScheduled', newCallbackPriority)
    //新的回调任务
    let newCallbackNode = null

    //获取现在根上正在运行的优先级
    const existingCallbackPriority = root.callbackPriority

    /**
     * 如果新的优先级和老的优先级一样，则可以进行批量更新
     * 为何能批量更新？
     * 因为不管后面走同步渲染（微任务）还是并发渲染（宏任务）
     * 都是在同步代码走完之后才执行的，也就是说渲染都是在同步逻辑走完之后进行的
     * 那当组件中多次更新并调用scheduleUpdateOnFiber时
     * 就没有必要多次创建微任务和宏任务，一个就可以了
     * 因为所有的更新都在concurrentQueues这个全局变量上了
     * 后面prepareFreshStack时会将更新挂到对应的fiber上
     * 这样一次渲染就可以完成所有更新
     */
    if (existingCallbackPriority === newCallbackPriority) {
        return
    }

    /**
     * 高优先级打断低优先级
     * existingCallbackNode表示当前当前根上执行任务
     * 调用Scheduler_cancelCallback会将当前任务的callback置空
     * scheduler中workLoop时会将该任务弹出
     * 后面高优先级任务再执行
     * 从而实现高优先级打断低优先级
     */
    if (existingCallbackNode !== null) {
        console.log('cancelCallback')
        Scheduler_cancelCallback(existingCallbackNode)
    }

    if (newCallbackPriority === SyncLane) {
        //如果新的优先级是同步的话

        //先把performSyncWorkOnRoot添回到同步队列中
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
        //再把flushSyncCallbacks放入微任务
        queueMicrotask(flushSyncCallbacks)
        //如果是同步执行的话
        newCallbackNode = null
    } else {
        //如果不是同步，就需要调度一个新的任务

        // 调度的优先级
        let schedulerPriorityLevel

        switch (
            lanesToEventPriority(nextLanes) //将lane转成事件优先级
        ) {
            //离散事件优先级 click onchange
            case DiscreteEventPriority:
                // 立刻执行优先级 1
                schedulerPriorityLevel = ImmediateSchedulerPriority
                break

            //连续事件的优先级 mousemove
            case ContinuousEventPriority:
                //用户阻塞操作优先级 2 用户点击 ，用户输入
                schedulerPriorityLevel = UserBlockingSchedulerPriority
                break

            //默认事件车道
            case DefaultEventPriority:
                // 正常优先级 3
                schedulerPriorityLevel = NormalSchedulerPriority
                break

            //空闲事件优先级
            case IdleEventPriority:
                // 空闲优先级 5
                schedulerPriorityLevel = IdleSchedulerPriority
                break

            default:
                // 正常优先级 3
                schedulerPriorityLevel = NormalSchedulerPriority
                break
        }

        /**
         * 调度执行更新任务
         * newCallbackNode是scheduleCallback创建的任务newTask
         * 而newTask.callback是performConcurrentWorkOnRoot
         */
        newCallbackNode = Scheduler_scheduleCallback(
            schedulerPriorityLevel,
            performConcurrentWorkOnRoot.bind(null, root)
        )
    }
    //在根节点记录当前执行的任务是newCallbackNode
    root.callbackNode = newCallbackNode
    root.callbackPriority = newCallbackPriority
}

/**
 * 在根上执行同步工作
 */
function performSyncWorkOnRoot(root) {
    //获得最高优的lane
    const lanes = getNextLanes(root)
    //渲染新的fiber树
    renderRootSync(root, lanes)
    //获取新渲染完成的fiber根节点
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    commitRoot(root)
    return null
}

/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root  根 FiberRootNode
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
    // console.log('performConcurrentWorkOnRoot__didTimeout', didTimeout);
    //先获取当前根节点上的任务
    const originalCallbackNode = root.callbackNode

    //获取当前优先级最高的车道 初次渲染时是默认事件车道 DefaultLane 16
    const lanes = getNextLanes(root, NoLanes) //16
    if (lanes === NoLanes) {
        return null
    }

    /**
     * 如果不包含阻塞的车道、不包含过期的车道、并且任务没有超时，
     * 就可以并行渲染,就是启用时间分片
     * 所以说默认更新车道是同步的,不能启用时间分片（没有开启Concurrent Mode的模式）
     * 当任务超时之后就不能使用时间分片，直接走同步渲染
     */
    //是否不包含阻塞车道
    const nonIncludesBlockingLane = !includesBlockingLane(root, lanes)
    //是否不包含过期的车道
    const nonIncludesExpiredLane = !includesExpiredLane(root, lanes)
    //时间片没有过期
    const nonTimeout = !didTimeout
    //三个变量都是真，才能进行时间分片，也就是进行并发渲染，也就是可以中断执行
    const shouldTimeSlice = nonIncludesBlockingLane && nonIncludesExpiredLane && nonTimeout
    console.log('shouldTimeSlice', shouldTimeSlice)

    /**
     * 执行渲染，得到退出的状态，也就是fiber树的构建状态，null or 进行中 or 完成
     * 同步渲染renderRootSync返回null,等价于完成状态，因为同步渲染不会中断
     * 并发渲染renderRootConcurrent会走时间切片逻辑，5ms没将fiber树构建完成就会退出
     */
    const exitStatus = shouldTimeSlice
        ? renderRootConcurrent(root, lanes)
        : renderRootSync(root, lanes)

    //如果不是渲染中的话，那说明肯定渲染完了
    // RootInProgress表示构建fiber树正在进行中
    if (exitStatus !== RootInProgress) {
        //开始进入提交阶段，就是执行副作用，修改真实DOM
        const finishedWork = root.current.alternate
        // FiberRootNode上记录新HostRootFiber
        root.finishedWork = finishedWork
        commitRoot(root)
    }

    //说明任务没有完成
    if (root.callbackNode === originalCallbackNode) {
        /**
         * 将此函数返回，下个时间切片继续执行
         * scheduler中的workLoop中判断若是callback返回值是函数，
         * 则任务继续，最小堆中任务没有被清出
         * 下个时间切片继续执行这个任务
         * 另外由于全局变量workInProgress记录下了fiber树构建到哪个节点
         * 所以保证了下个时间切片中可以从正确的fiber节点继续构建
         */
        return performConcurrentWorkOnRoot.bind(null, root)
    }
    return null
}

/**
 * @description 并发渲染方法
 */
function renderRootConcurrent(root, lanes) {
    //因为在构建fiber树的过程中，此方法会反复进入，会进入多次
    //只有在第一次进来的时候会创建新的fiber树，或者说新fiber
    if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
        prepareFreshStack(root, lanes)
    }

    /**
     * 在当前分配的时间片(5ms)内执行fiber树的构建或者说渲染
     * 一个fiber单元performUnitOfWork计算完成后，
     * 会调用scheduler的shouldYield判断当前时间切片是过期
     * 若是过期则退出循环，这里继续往下走
     * 返回fiber树的构建状态
     */
    workLoopConcurrent()

    /**
     * 如果 workInProgress不为null，说明fiber树的构建还没有完成
     * fiber树构建完成时，workInProgress为HostRootFiber的return，也就是null
     */
    if (workInProgress !== null) {
        // 返回RootInProgress表示构建fiber树还正在进行中
        return RootInProgress
    }

    /**
     * 如果workInProgress是null了说明渲染工作完全结束了
     * 返回workInProgressRootExitStatus(当前的fiber树处于什么状态 进行中 or 完成)
     * completeUnitOfWork最后会将workInProgressRootExitStatus改成完成
     */
    return workInProgressRootExitStatus
}

/**
 * @description 同步渲染方法
 */
function renderRootSync(root, renderLanes) {
    //如果新的根和老的根不一样，或者新的渲染优先级和老的渲染优先级不一样
    if (root !== workInProgressRoot || workInProgressRootRenderLanes !== renderLanes) {
        //开始构建fiber树
        prepareFreshStack(root, renderLanes)
    }
    // 开启工作循环
    workLoopSync()
    return RootCompleted
}

/**
 * @description 根据老的fiber树创建一个全新的fiber树，后续用于替换掉老的fiber树
 */
function prepareFreshStack(root, renderLanes) {
    // 创建一个workInProgress（执行中的工作）
    workInProgress = createWorkInProgress(root.current, null)
    workInProgressRootRenderLanes = renderLanes
    workInProgressRoot = root
    // 完成队列并发更新，完成更新队列queue的创建
    finishQueueingConcurrentUpdates()
}

/**
 * @description 并发模式的工作循环方法
 */
function workLoopConcurrent() {
    /*
    ‼️重要重要重要
    如果有下一个要构建的fiber并且时间片没有过期就继续循环
    若是shouldYield返回true表示当前时间切片过期了，需要退出循环
    退出循环后renderRootConcurrent中会返回一个值，表示当前fiber树是否构建完成
    shouldYield是scheduler中用来判断时间切片是否过期的方法
   */
    while (workInProgress !== null && !shouldYield()) {
        sleep(2000)
        performUnitOfWork(workInProgress)
    }
    // console.log('shouldYield', shouldYield())
}

/**
 * @description 同步模式的工作循环方法
 */
function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress)
    }
}

/**
 * @description 执行一个工作单元
 * @param unitOfWork 正在计算中的fiber
 */
function performUnitOfWork(unitOfWork) {
    //获取老fiber
    const current = unitOfWork.alternate

    const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes)

    //完成当前fiber的子fiber链表构建后，将等待生效的props标记为已经生效的props
    unitOfWork.memoizedProps = unitOfWork.pendingProps

    if (next === null) {
        //如果没有子节点表示当前的fiber已经完成了
        completeUnitOfWork(unitOfWork)
    } else {
        //如果有子节点，就让子节点成为下一个工作单元
        workInProgress = next
    }
}

/**
 * @description 完成一个工作单元的执行
 * @param unitOfWork 正在计算中的fiber
 */
function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork
    do {
        const current = completedWork.alternate
        const returnFiber = completedWork.return
        //执行此fiber 的完成工作,如果是原生组件的话就是创建真实的DOM节点
        completeWork(current, completedWork)

        //如果有弟弟，就构建弟弟对应的fiber子链表
        const siblingFiber = completedWork.sibling
        if (siblingFiber !== null) {
            workInProgress = siblingFiber
            return
        }

        //如果没有弟弟，说明这当前完成的就是父fiber的最后一个节点
        //也就是说一个父fiber,所有的子fiber全部完成了
        completedWork = returnFiber
        workInProgress = completedWork
    } while (completedWork !== null)

    //如果走到了这里，说明整个fiber树全部构建完毕,把构建状态设置为完成成
    // 即将workInProgressRootExitStatus由RootInProgress(构建fiber树正在进行中)
    // 改成RootCompleted(构建fiber树已经完成)
    if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted
    }
}

/**
 * @description 执行卸载副作用 和 挂载副作用
 */
function flushPassiveEffects() {
    if (rootWithPendingPassiveEffects !== null) {
        const root = rootWithPendingPassiveEffects
        //执行卸载副作用，destroy
        commitPassiveUnmountEffects(root.current)
        //执行挂载副作用 create
        commitPassiveMountEffects(root, root.current)
    }
}

/**
 * @description 提交方法
 * @param root 根节点
 */
function commitRoot(root) {
    const previousUpdatePriority = getCurrentUpdatePriority()
    try {
        //把当前的更新优先级设置为1，提交阶段的优先级最高，不能切片
        setCurrentUpdatePriority(DiscreteEventPriority)
        commitRootImpl(root)
    } finally {
        setCurrentUpdatePriority(previousUpdatePriority)
    }
}

/**
 * @description 提交阶段的具体逻辑
 * @param root 根节点
 */
function commitRootImpl(root) {
    //先获取新的构建好的fiber树的根fiber tag=3
    const { finishedWork } = root
    console.log('commit', finishedWork.child.memoizedState.memoizedState)
    workInProgressRoot = null
    workInProgressRootRenderLanes = NoLanes
    root.callbackNode = null
    root.callbackPriority = NoLane

    //合并统计当前新的根上剩下的车道
    const remainingLanes = mergeLanes(
        finishedWork.lanes, // 根fiber自己的lanes
        finishedWork.childLanes // 所有子fiber的lanes
    )

    // 将除了根上剩下的车道以外的所有车道标记为已完成
    markRootFinished(root, remainingLanes)

    if (
        (finishedWork.subtreeFlags & Passive) !== NoFlags ||
        (finishedWork.flags & Passive) !== NoFlags
    ) {
        if (!rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = true
            Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffects)
        }
    }
    //判断子树有没有副作用
    const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags
    //如果自己的副作用或者子节点有副作用就进行提交DOM操作
    if (subtreeHasEffects || rootHasEffect) {
        //当DOM执行变更之后
        commitMutationEffectsOnFiber(finishedWork, root)
        //执行layout Effect
        commitLayoutEffects(finishedWork, root)
        if (rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = false
            rootWithPendingPassiveEffects = root
        }
    }
    //等DOM变更后，就可以把让root的current指向新的fiber树
    root.current = finishedWork

    //在提交之后，因为根上可能会有跳过的更新，所以需要重新再次调度
    ensureRootIsScheduled(root, now())
}

/**
 * @description 请求一个更新车道
 * 先获取当前更新优先级，默认值是NoLane 没有车道
 * 若更新优先级为NoLane，则获取当前事件优先级
 * 若没有事件则，返回默认事件车道 DefaultLane 16
 */
export function requestUpdateLane() {
    // 获取当前更新优先级，默认值是NoLane 没有车道
    const updateLane = getCurrentUpdatePriority()
    if (updateLane !== NoLanes) {
        return updateLane
    }
    // 获取当前事件优先级，若没有事件则，返回默认事件车道 DefaultLane 16
    const eventLane = getCurrentEventPriority()
    return eventLane
}

//请求当前的时间
export function requestEventTime() {
    currentEventTime = now()
    return currentEventTime //performance.now()
}

function sleep(duration) {
    const timeStamp = new Date().getTime()
    const endTime = timeStamp + duration
    while (true) {
        if (new Date().getTime() > endTime) {
            return
        }
    }
}
