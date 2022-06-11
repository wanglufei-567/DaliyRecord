var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    effect: () => effect,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    shallowRef: () => shallowRef,
    toReactive: () => toReactive,
    toRef: () => toRef,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanEffect(effect2) {
    let deps = effect2.deps;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.parent = void 0;
      this.deps = [];
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = void 0;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options == null ? void 0 : options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, key) {
    if (activeEffect) {
      let depsMap = targetMap.get(target);
      if (!depsMap) {
        targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
      }
      let deps = depsMap.get(key);
      if (!deps) {
        depsMap.set(key, deps = /* @__PURE__ */ new Set());
      }
      trackEffects(deps);
    }
  }
  function trackEffects(deps) {
    let shouldTrack = !deps.has(activeEffect);
    if (shouldTrack) {
      deps.add(activeEffect);
      activeEffect.deps.push(deps);
    }
  }
  function trigger(target, key, value) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    let effects = depsMap.get(key);
    triggerEffects(effects);
  }
  function triggerEffects(effects) {
    if (effects) {
      effects = new Set(effects);
      effects.forEach((effect2) => {
        if (effect2 !== activeEffect) {
          if (effect2.scheduler) {
            effect2.scheduler();
          } else {
            effect2.run();
          }
        }
      });
    }
  }

  // packages/reactivity/src/baseHandler.ts
  function isReactive(value) {
    return value && value["__v_isReactive" /* IS_REACTIVE */];
  }
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, key);
      const res = Reflect.get(target, key, receiver);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      if (oldValue !== value) {
        let result = Reflect.set(target, key, value, receiver);
        trigger(target, key, value);
        return result;
      }
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function createReactiveObject(target, isReadonly) {
    if (!isObject(target)) {
      return target;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const existingProxy = reactiveMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }
  function reactive(target) {
    return createReactiveObject(target, false);
  }

  // packages/reactivity/src/computed.ts
  function computed(getterOrOptions) {
    let isGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    const fn = () => console.warn("computed is readonly ");
    if (isGetter) {
      getter = getterOrOptions;
      setter = fn;
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set || fn;
    }
    return new ComputedRefImpl(getter, setter);
  }
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this._dirty = true;
      this.__v_isRef = true;
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.deps);
        }
      });
    }
    get value() {
      if (activeEffect) {
        trackEffects(this.deps || (this.deps = /* @__PURE__ */ new Set()));
      }
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newValues) {
      this.setter(newValues);
    }
  };

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value)) {
      return value;
    }
    if (set.has(value)) {
      return value;
    }
    set.add(value);
    for (let key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb, { immediate } = {}) {
    let get;
    let oldValue;
    let cleanup;
    if (isReactive(source)) {
      get = () => traversal(source);
    } else if (isFunction(source)) {
      get = source;
    }
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    const job = () => {
      cleanup && cleanup();
      let newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(get, job);
    if (immediate) {
      job();
    }
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(rawValue, _shallow) {
      this.rawValue = rawValue;
      this._shallow = _shallow;
      this.__v_isRef = true;
      this._value = _shallow ? rawValue : toReactive(rawValue);
    }
    get value() {
      if (activeEffect) {
        trackEffects(this.dep || (this.dep = /* @__PURE__ */ new Set()));
      }
      return this._value;
    }
    set value(newVal) {
      if (newVal !== this.rawValue) {
        this.rawValue = newVal;
        this._value = this._shallow ? newVal : toReactive(newVal);
        triggerEffects(this.dep);
      }
    }
  };
  function createRef(rawValue, shallow) {
    return new RefImpl(rawValue, shallow);
  }
  function ref(value) {
    return createRef(value, false);
  }
  function shallowRef(value) {
    return createRef(value, true);
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
      this.__v_isRef = true;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  function toRefs(object) {
    let result = {};
    for (let key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, receiver) {
        let r = Reflect.get(target, key, receiver);
        return r.__v_isRef ? r.value : r;
      },
      set(target, key, value, receiver) {
        if (target[key].__v_isRef) {
          target[key].value = value;
          return true;
        }
        return Reflect.set(target, key, value, receiver);
      }
    });
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
