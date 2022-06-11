/**
 * 当前正在执行的effect
 * 这里的activeEffect是全局变量，所以在reactive.ts中是可以直接拿到
 * 从而可以在响应式对象的get()方法中完成activeEffect对其所依赖属性的收集
 */
export let activeEffect = undefined;

/**
 * 清理effect收集的attr的deps(set集合, set存放的是effect)
 * set中存放的是attr收集的effect(是所有的effect，不只是当前的effect)
 * 这里只是从attr收集的所有effect中删除当前的effect
 * 所以这里有两步逻辑
 * 1、从attr收集的所有effect中删除当前的effect
 * 2、将当前effect的deps清空
 * 既清理了attr的依赖又清理了effect的依赖
 */
function cleanEffect(effect) {
  let deps = effect.deps;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}

/**
 * ReactiveEffect类
 * 包含了effect依赖的属性、激活状态等
 */
export class ReactiveEffect {
  public active = true; // effect的激活状态，默认激活，支持失活操作
  public parent = undefined; // 用于记录当前effect的父effect(为了解决嵌套effect场景)
  /**
   * 收集effect中使用到的属性，后续清理的时候要使用
   * 数据类型：set[]
   * 数组中存放的时set，
   * set中存放的是attr所有的effect(不只是当前的ReactiveEffect实例)
   */
  public deps = [];
  // 传递的fn、scheduler挂到this上
  constructor(public fn, public scheduler?) {}

  run() {
    if (!this.active) {
      // 不是激活状态，直接执行fn，不进行依赖收集
      return this.fn();
    }
    try {
      // 将activeEffect设置为当前ReactiveEffect实例的父effect，用作记录存储
      this.parent = activeEffect;
      // 再将当前ReactiveEffect实例设置为activeEffect
      activeEffect = this;
      /**
       * 清理当前ReactiveEffect实例中的deps
       * 在下面的fn()执行时会再次收集
       * 也就是先清理在收集，为什么这么处理
       * 是因为当前ReactiveEffect实例依赖的attr可能会发生变化
       * 这样做是为了更新effect依赖的attr
       */
      cleanEffect(this);
      /**
       * 外部传进来的fn中，若有响应式对象中属性的取值，
       * 则会执行proxy中的get()，
       * 在get()中，需要将当前的ReactiveEffect实例和这些属性建立绑定，
       * 方便后续响应式对象中属性变化后，effect再次执行fn
       */
      return this.fn();
    } finally {
      /**
       * 执行完毕后还原activeEffect，
       * 也就是当前的ReactiveEffect实例只对出现在自己fn方法中的属性进行依赖收集操作
       * 若不执行这一步，每一次响应式对象中有get()操作时都会将属性收集到activeEffect中
       */
      activeEffect = this.parent;
      this.parent = undefined;
    }
  }

  /**
   * 失活操作
   * 停止收集依赖
   */
  stop() {
    if (this.active) {
      this.active = false;
      cleanEffect(this);
    }
  }
}

/**
 * effect()方法的实现
 * 每一个effect()方法的执行都会创建一个ReactiveEffect实例
 * 其实就是watcher，不知道为啥要叫effect，叫watcher更容易理解
 * 就是监听响应是对像的变化，不同的属性变化，执行不同effect
 */
export function effect(fn, options = {} as any) {
  /**
   * 将外部传递进来的函数设置为响应式的effect
   * options为用户自定义的配置项
   */
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  // 让响应式effect默认执行一次
  _effect.run();
  // 更改runner中的this
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect; // 暴露effect的实例
  // effect返回runner的目的是让用户可以自己控制渲染逻辑
  return runner; // 用户可以手动调用runner重新执行
}

/**
 * 依赖收集的具体逻辑
 * 让attr记录所用到的effect是谁， 哪个effect对应了attr
 * track方法的执行在proxy的get()中
 * effect(fn)的fn中若有reactiveObject的取值，便会执行proxy的get()，
 * 从而执行track()，完成当前effect对attr的收集和attr对effect的收集
 */

// 记录依赖关系，数据格式{target: { attr: [effect, effect]}}
const targetMap = new WeakMap();
export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
      depsMap.set(key, (deps = new Set()));
    }
    // 依赖收集的存储操作
    trackEffects(deps);
  }
}

export function trackEffects(deps) {
  /**
   * 若是当前attr已经记录了此activeEffect
   * 则不再次收集
   */
  let shouldTrack = !deps.has(activeEffect);
  if (shouldTrack) {
    // attr 记录 effect
    deps.add(activeEffect);
    // effect 记录 attr 放的是set
    activeEffect.deps.push(deps);
  }
}

/**
 * 触发更新的具体逻辑
 * attr发生变化之后将其收集到的effect拿出来在执行一次
 */
export function trigger(target, key, value) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return; // 属性没有依赖任何的effect
  }
  let effects = depsMap.get(key);
  triggerEffects(effects);
}

export function triggerEffects(effects) {
  if (effects) {
    /**
     * 注意：这里的attr收集的effects在effect的deps中也有保存
     * 所以需要将effects复制一份，再进行操作，
     * 避免effect.run()中清理effect时的死循环
     */
    effects = new Set(effects);
    effects.forEach(effect => {
      /**
       * 保证要执行的effect不是当前的effect
       * 避免effect中直接改动attr引起的effect再次执行的死循环
       * 因为attr只要变化便会触发trigger
       * 这里做逻辑判断就是阻断掉effect中直接改动attr引起的trigger
       */
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          effect.scheduler(); // 可以提供一个调度函数，用户实现自己的逻辑
        } else {
          effect.run(); // 数据变化了，找到对应的effect 重新执行
        }
      }
    });
  }
}
