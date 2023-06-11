function debounce(fn, interval = 1000) {
  let timer = null;
  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        fn.call(this, ...args);
      }, interval);
    }
  };
}

/**
 * @param anchorsContainer 高亮锚点的容器
 * @param ScrollContainer 滚动内容区域的容器
 * @param strategy 高亮的策略
 */
class AutoHighLightAnchor {
  constructor(
    anchorsContainer,
    ScrollContainer,
    strategy = AutoHighLightAnchor.Strategies.type1
  ) {
    this.anchors = anchorsContainer.querySelectorAll('a');
    this.ScrollContainer = ScrollContainer;
    this.strategy = strategy;
    this.init();
  }

  /**
   * @description 初始化方法，注册滚动事件监听方法
   * 初始化时会执行一次策略方法，更新锚点高亮位置
   */
  init(strategy = this.strategy) {
    if (this.throttleFn) {
      this.remove();
    }
    this.throttleFn = debounce(this[strategy].bind(this), 100);
    this.throttleFn(); // 初始执行一次，更新位置
    this.ScrollContainer.addEventListener(
      'scroll',
      this.throttleFn,
      {
        passive: true
      }
    );
  }

  /**
   * @description 移除滚动事件监听方法
   */
  remove() {
    this.ScrollContainer.removeEventListener(
      'scroll',
      this.throttleFn,
      {
        passive: true
      }
    );
  }

  /**
   * @description 高亮锚点的方法
   */
  highLightAnchor(id) {
    this.anchors.forEach(element => {
      element.classList.remove('highLight');
      if (element.hash.slice(1) == id) {
        element.classList.add('highLight');
      }
    });
  }

  /**
   * @description 策略1 冒头就高亮
   *
   */
  type1() {
    let highLightId;
    // 获取窗口
    const windowHeight = this.ScrollContainer.offsetHeight;
    this.anchors.forEach(element => {
      // 获取a标签上href属性hash值中对应的元素id
      const id = element.hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        const { top } = target.getBoundingClientRect();
        // 当元素头部可见时
        if (top < windowHeight) {
          highLightId = id;
        }
      }
    });
    if (highLightId) {
      this.highLightAnchor(highLightId);
    }
  }

  /**
   * @description 策略2 占据屏幕比例大就高亮
   */
  type2() {
    let highLightId;
    let maxRatio = 0;
    const windowHeight = this.ScrollContainer.offsetHeight;
    this.anchors.forEach(element => {
      const id = element.hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        let visibleRatio = 0;
        let { top, height, bottom } = target.getBoundingClientRect();
        // 当元素全部可见时
        if (top >= 0 && bottom <= windowHeight) {
          visibleRatio = height / windowHeight;
        }
        // 当元素就头部可见时
        if (top >= 0 && top < windowHeight && bottom > windowHeight) {
          visibleRatio = (windowHeight - top) / windowHeight;
        }
        // 当元素占满屏幕时
        if (top < 0 && bottom > windowHeight) {
          visibleRatio = 1;
        }
        // 当元素尾部可见时
        if (top < 0 && bottom > 0 && bottom < windowHeight) {
          visibleRatio = bottom / windowHeight;
        }
        if (visibleRatio >= maxRatio) {
          maxRatio = visibleRatio;
          highLightId = id;
        }
      }
    });
    if (highLightId) {
      this.highLightAnchor(highLightId);
    }
  }

  /**
   * @description 策略3 显示的自身百分比大就高亮
   */
  type3(e) {
    let highLightId;
    let maxRatio = 0;
    const windowHeight = this.ScrollContainer.offsetHeight;
    this.anchors.forEach(element => {
      const id = element.hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        let visibleRatio = 0;
        let { top, height, bottom } = target.getBoundingClientRect();
        // 当元素全部可见时
        if (top >= 0 && bottom <= windowHeight) {
          visibleRatio = 1;
        }
        // 当元素就头部可见时
        if (top >= 0 && top < windowHeight && bottom > windowHeight) {
          visibleRatio = (windowHeight - top) / height;
        }
        // 当元素占满屏幕时
        if (top < 0 && bottom > windowHeight) {
          visibleRatio = windowHeight / height;
        }
        // 当元素尾部可见时
        if (top < 0 && bottom > 0 && bottom < windowHeight) {
          visibleRatio = bottom / height;
        }
        if (visibleRatio >= maxRatio) {
          maxRatio = visibleRatio;
          highLightId = id;
        }
      }
    });
    if (highLightId) {
      this.highLightAnchor(highLightId);
    }
  }

  /**
   * @description 策略4 离顶部近就高亮
   */
  type4(offsetTop = 0) {
    let highLightId = Array.prototype.reduce.call(
      this.anchors,
      (prev, curr) => {
        const id = curr.hash.slice(1);
        const target = document.getElementById(id);
        if (target) {
          const { top } = target.getBoundingClientRect();
          // 当元素头部距离顶部小于规定范围时 即 top <= offsetTop
          return top <= offsetTop && top > prev.top
            ? {
                id,
                top
              }
            : prev;
        } else {
          return prev;
        }
      },
      {
        id: null,
        top: -Infinity
      }
    ).id;
    if (highLightId) {
      this.highLightAnchor(highLightId);
    }
  }
}

AutoHighLightAnchor.Strategies = {
  type1: 'type1',
  type2: 'type2',
  type3: 'type3',
  type4: 'type4'
};

const high = new AutoHighLightAnchor(
  document.querySelector('ul'),
  document.querySelector('#container'),
  AutoHighLightAnchor.Strategies.type1
);

document.querySelectorAll('input[type=radio]').forEach(element => {
  element.onchange = e => high.init(e.target.value);
});

document.querySelector('input[name=bug]').onchange = e => {
  const value = e.target.checked;
  const elements = document.querySelectorAll('#container>div');
  if (value) {
    const abnormality = [30, 120, 20, 30, 50];
    elements.forEach((element, index) => {
      element.style.height = abnormality[index] + 'vh';
    });
  } else {
    elements.forEach((element, index) => {
      element.style.height = 100 - 10 * index + 'vh';
    });
  }
};

document.querySelector('input[name=friendly_link]').onchange = e => {
  const value = e.target.checked;
  const element = document.querySelector('#friendly_link');
  if (value) {
    element.style.display = 'block';
  } else {
    element.style.display = 'none';
  }
};
