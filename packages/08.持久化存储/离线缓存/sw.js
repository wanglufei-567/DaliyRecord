// 缓存名称，用于标识和管理缓存版本
const CACHE_NAME = 'offline-cache-v1';

// 需要预缓存的静态资源列表
// 这些资源将在 Service Worker 安装时被缓存
const STATIC_CACHE_URLS = [
  '/style.css',    // CSS 样式文件
  '/logo.png'      // Logo 图片
];

/**
 * 判断请求是否为 JSON 文件
 * 用于区分应用不同的缓存策略
 * @param {Request} request - 请求对象
 * @return {boolean} 如果是 JSON 文件请求则返回 true
 */
function isJsonRequest(request) {
  return request.url.endsWith('.json');
}

/**
 * 安装事件处理
 * 当 Service Worker 首次安装或更新时触发
 * 在此阶段预缓存静态资源，为离线访问做准备
 */
self.addEventListener('install', event => {
  console.log('[SW] 安装中...');
  // waitUntil() 确保 Service Worker 不会在里面的操作完成前安装完成
  event.waitUntil(
    // 打开指定名称的缓存
    caches.open(CACHE_NAME).then(cache => {
      // 添加所有静态资源到缓存中
      // addAll() 会获取资源并将响应添加到缓存
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
});

/**
 * 激活事件处理
 * 当新的 Service Worker 取得控制权时触发
 * 通常用于清理旧版本的缓存
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    // 获取所有缓存的名称
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          // 如果缓存名称不是当前使用的名称，则删除它
          if (key !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

/**
 * 拦截请求事件处理
 * 当页面发出请求时触发
 * 根据请求类型应用不同的缓存策略
 */
self.addEventListener('fetch', event => {
  const request = event.request;

  // 对于 JSON 文件使用网络优先策略
  // 优先从网络获取最新数据，网络失败时回退到缓存
  if (isJsonRequest(request)) {
    event.respondWith(
      networkFirstStrategy(request)
    );
  }
  // 对于其他静态资源使用缓存优先策略
  // 优先从缓存获取资源，提高加载速度，缓存未命中时从网络获取
  else {
    event.respondWith(
      cacheFirstStrategy(request)
    );
  }
});

/**
 * 网络优先策略实现
 * 先尝试从网络获取资源，如果成功则更新缓存
 * 如果网络请求失败，则尝试从缓存获取
 *
 * @param {Request} request - 请求对象
 * @return {Promise<Response>} 响应对象
 */
async function networkFirstStrategy(request) {
  try {
    // 先尝试从网络获取
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);

    // 克隆响应并存入缓存
    // 注意：响应体只能被读取一次，所以需要克隆
    cache.put(request, networkResponse.clone());
    console.log('[SW] 网络优先: 从网络获取并更新缓存', request.url);

    return networkResponse;
  } catch (error) {
    // 网络请求失败，尝试从缓存获取
    console.log('[SW] 网络优先: 网络请求失败，尝试从缓存获取', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果缓存中也没有，则返回错误响应
    // 对于 JSON 请求，返回一个 JSON 格式的错误信息
    console.log('[SW] 网络优先: 缓存中也没有资源', request.url);
    return new Response('{"error": "离线状态且缓存中无此资源"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 缓存优先策略实现
 * 先尝试从缓存获取资源，如果缓存未命中则从网络获取
 * 适用于不经常变化的静态资源
 *
 * @param {Request} request - 请求对象
 * @return {Promise<Response>} 响应对象
 */
async function cacheFirstStrategy(request) {
  // 先尝试从缓存获取
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[SW] 缓存优先: 从缓存获取', request.url);
    return cachedResponse;
  }

  // 缓存中没有，从网络获取
  try {
    console.log('[SW] 缓存优先: 缓存未命中，从网络获取', request.url);
    const networkResponse = await fetch(request);

    // 将网络响应存入缓存以便下次使用
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.log('[SW] 缓存优先: 网络请求失败', request.url);

    // 对于图片资源，返回特定的错误响应
    if (request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      return new Response('图片加载失败', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 对于其他资源，返回通用错误响应
    return new Response('资源加载失败', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
