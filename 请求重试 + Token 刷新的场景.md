# 请求重试 + Token 刷新的场景

你的场景是：

页面同时发起 10 个接口请求
其中某个请求返回 401（Token 过期）
需要刷新 Token
重新请求失败的那个接口
关键难点：如果多个请求同时失败，不能重复刷新 Token


## 第一层：先说场景（让面试官知道你理解问题）
这是一个很常见的场景。比如用户打开一个页面，页面需要同时请求用户信息、订单列表、商品列表等多个接口。如果这时候 Token 刚好过期了，这些请求几乎会同时返回 401。

如果不做处理，每个 401 请求都会触发一次 Token 刷新，就会导致重复刷新 10 次，这是不合理的。正确的做法应该是：只刷新一次 Token，其他请求等待，Token 刷新好后，所有请求用新 Token 重试。"

## 第二层：说核心思路
"我的解决方案用到三个核心机制：

1. 刷新标志（isRefreshing）：用一个布尔变量标记是否正在刷新 Token，防止重复刷新

2. 请求队列（failedQueue）：用一个数组存放等待的请求，Token 刷新好后统一处理

3. Promise 机制：让后续的请求通过 Promise 等待，Token 刷新好后通过 resolve 唤醒

这样就能保证：第一个 401 请求负责刷新 Token，后续的 401 请求加入队列等待，刷新完成后所有请求自动重试。"

## 第三层：讲具体实现

```javascript
let isRefreshing = false;
let failedQueue = [];
axios.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      
      // 第一个 401 请求
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshToken();
          
          // 处理队列中的请求
          failedQueue.forEach(item => {
            item.resolve(axios(item.config));
          });
          failedQueue = [];
          
          return axios(error.config);
        } finally {
          isRefreshing = false;
        }
      }
      
      // 后续的 401 请求
      else {
        return new Promise(resolve => {
          failedQueue.push({ resolve, config: error.config });
        });
      }
    }
    
    return Promise.reject(error);
  }
);
```

核心逻辑就是：第一个请求检查 isRefreshing 为 false，就设置为 true 并刷新 Token；后续请求检查 isRefreshing 为 true，就返回 Promise 加入队列等待；Token 刷新好后，遍历队列调用 resolve 唤醒所有等待的请求。"

## 第四层：说优化和边界情况

"这个方案还需要考虑几个边界情况：

1. 防止无限循环：给请求加一个 _retry 标志，避免刷新 Token 的接口也返回 401 导致无限循环

2. 刷新失败处理：如果 Token 刷新失败，需要清除本地 Token，跳转到登录页，并且拒绝队列中的所有请求

3. 并发安全：使用 finally 确保 isRefreshing 一定会被重置为 false

请求拦截器配合：在请求拦截器中自动添加 Token 到请求头，避免每个接口都手动添加

在实际项目中，我还会考虑添加重试机制，比如网络不稳定时自动重试 3 次，使用指数退避策略。"



