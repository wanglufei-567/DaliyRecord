import assign from 'shared/assign';

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}

const MouseEventInterface = {
  clientX: 0,
  clientY: 0
};

/**
 * @description 创建合成事件对象
 */
function createSyntheticEvent(inter) {
  /**
   *合成事件的基类
   * @param {*} reactName React属性名 onClick
   * @param {*} reactEventType click
   * @param {*} targetInst 事件源对应的fiber实例
   * @param {*} nativeEvent 原生事件对象
   * @param {*} nativeEventTarget 原生事件源 span 事件源对应的那个真实DOM
   */
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;

    //把此接口上对应的属性从原生事件上拷贝到合成事件实例上
    for (const propName in inter) {
      if (!inter.hasOwnProperty(propName)) {
        continue;
      }
      this[propName] = nativeEvent[propName];
    }

    //是否已经阻止默认事件
    this.isDefaultPrevented = functionThatReturnsFalse;
    //是否已经阻止继续传播
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }

  assign(SyntheticBaseEvent.prototype, {
    preventDefault() { // 阻止默认事件
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        // Event.returnValue 属性表示该事件的默认操作是否已被阻止。
        // 默认情况下，它被设置为 true，即允许进行默认操作。
        // 将该属性设置为 false 即可阻止默认操作
        event.returnValue = false;
      }
      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation() { // 阻止冒泡
      const event = this.nativeEvent;
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        // cancelBubble 原生事件对象上的属性，将其值设置为true可阻止事件的传播
        event.cancelBubble = true;
      }
      this.isPropagationStopped = functionThatReturnsTrue;
    }
  });
  return SyntheticBaseEvent;
}

export const SyntheticMouseEvent = createSyntheticEvent(
  MouseEventInterface
);
