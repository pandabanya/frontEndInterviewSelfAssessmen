# Vue 的 $nextTick 原理详解

## 一、先搞懂前提：为什么 Vue 的 DOM 更新是异步的？

```js
this.count = 1
this.count = 2
this.count = 3
```

如果每次修改数据都立刻触发 DOM 更新，那上面的代码会导致 **3 次 DOM 操作**，但最终页面上显示的就是 `3`。前 2 次更新完全浪费了。

所以 Vue 的策略是：**数据变了，先不急着更新 DOM，而是把这些更新攒起来，最后一次性批量更新。**

这个「攒起来、一次性更新」的机制，就依赖 JavaScript 的事件循环（Event Loop）。

---

## 二、核心前置知识：JavaScript 事件循环

这是理解 `$nextTick` 的基石，必须先搞懂。

### 2.1 宏任务 vs 微任务

```
┌─────────────────────────────────────┐
│            调用栈 (Call Stack)        │
└─────────────────────────────────────┘
         ↓ 执行完，取下一个任务
┌─────────────────────────────────────┐
│        任务队列 (Task Queue)         │
│  ┌─────────────────────────────┐    │
│  │ 宏任务队列                   │    │
│  │ setTimeout / setInterval    │    │
│  │ UI 渲染                     │    │
│  │ 用户事件(click/input 等)     │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 微任务队列                   │    │
│  │ Promise.then                │    │
│  │ MutationObserver            │    │
│  │ queueMicrotask              │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**关键规则：**

1. 执行完一个宏任务后，引擎会**清空所有微任务**，才去执行下一个宏任务
2. 微任务的执行时机比宏任务**早**
3. Promise.then 属于微任务，setTimeout 属于宏任务

### 2.2 用代码感受一下

```js
console.log('1. 同步代码')

setTimeout(() => {
  console.log('2. 宏任务 setTimeout')
}, 0)

Promise.resolve().then(() => {
  console.log('3. 微任务 Promise.then')
})

console.log('4. 同步代码')

// 输出顺序：
// 1. 同步代码
// 4. 同步代码
// 3. 微任务 Promise.then    ← 微任务先执行！
// 2. 宏任务 setTimeout     ← 宏任务后执行！
```

**记住这个顺序：同步 → 微任务 → 宏任务。这是理解 $nextTick 的关键。**

---

## 三、$nextTick 到底干了什么？

### 3.1 一句话定义

`$nextTick` 就是把一个回调函数塞进**微任务队列**，保证在 DOM 更新完成之后再执行。

### 3.2 不用 $nextTick 会怎样？

```js
// 假设模板：<div ref="box">{{ count }}</div>

this.count = 100

// 此时 DOM 还没更新！你拿到的是旧值
console.log(this.$refs.box.textContent) // 还是旧值，不是 100

// 使用 $nextTick，等 DOM 更新完了再拿
this.$nextTick(() => {
  console.log(this.$refs.box.textContent) // 100 ✅
})
```

### 3.3 为什么不用 setTimeout？

```js
// setTimeout 是宏任务，也能拿到更新后的值
setTimeout(() => {
  console.log(this.$refs.box.textContent) // 100 ✅
}, 0)
```

能用，但 **setTimeout 比 $nextTick 慢**。看执行顺序：

```
同步代码（修改数据） → 微任务（Vue 批量更新 DOM） → 微任务（$nextTick 回调） → 宏任务（setTimeout 回调）
```

`$nextTick` 是微任务，紧跟在 Vue DOM 更新之后；`setTimeout` 是宏任务，排在更后面。

---

## 四、$nextTick 的内部实现原理

### 4.1 Vue2 的实现

```
数据变化 → 触发 setter → 通知 Watcher → Watcher 被推入队列（异步） → 异步清空队列执行 DOM 更新 → $nextTick 回调执行
```

核心就是利用**微任务**来延迟执行。Vue2 内部有一个降级策略：

```js
// 简化版原理代码
const callbacks = []
let pending = false

function nextTick(cb) {
  callbacks.push(cb)

  if (!pending) {
    pending = true
    // 按优先级选择异步方式
    if (typeof Promise !== 'undefined') {
      // 优先用 Promise（微任务）
      Promise.resolve().then(flushCallbacks)
    } else if (typeof MutationObserver !== 'undefined') {
      // 其次用 MutationObserver（微任务）
      const observer = new MutationObserver(flushCallbacks)
      observer.observe(textNode, { characterData: true })
      textNode.data = 1
    } else if (typeof setImmediate !== 'undefined') {
      // 再次用 setImmediate（宏任务）
      setImmediate(flushCallbacks)
    } else {
      // 最后用 setTimeout（宏任务）
      setTimeout(flushCallbacks, 0)
    }
  }
}

function flushCallbacks() {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]() // 依次执行所有回调
  }
}
```

**降级顺序：Promise → MutationObserver → setImmediate → setTimeout**

优先选微任务，保证执行时机尽可能早。只有在旧浏览器不支持微任务时，才降级到宏任务。

### 4.2 Vue3 的实现

Vue3 更简单直接，直接用 `Promise`：

```js
// Vue3 简化版
const resolvedPromise = Promise.resolve()

function nextTick(fn) {
  return fn ? resolvedPromise.then(fn) : resolvedPromise
}
```

因为 Vue3 已经不再支持 IE，所以不需要降级策略了。

---

## 五、完整执行流程图（面试重点）

```
this.count = 100
      │
      ▼
┌─────────────┐
│  触发 setter  │
└──────┬──────┘
       ▼
┌─────────────────────┐
│  Dep 通知所有 Watcher  │
└──────┬──────────────┘
       ▼
┌─────────────────────────┐
│  Watcher 被推入队列       │  ← 同步操作，只推队列，不更新
│  （nextTick 异步批量更新） │
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│  你调用了 this.$nextTick  │
│  回调被推入 callbacks     │  ← 同步操作，只是注册回调
└──────┬──────────────────┘
       ▼
┌──────────────────────────────────┐
│  当前同步代码全部执行完毕           │
└──────┬───────────────────────────┘
       ▼
┌──────────────────────────────────┐
│  微任务阶段开始                    │
│  ① 先执行 Vue 的 flushSchedulerQueue│  ← 批量更新 DOM
│  ② 再执行 $nextTick 的回调         │  ← 此时 DOM 已更新 ✅
└──────────────────────────────────┘
```

**核心原理：Vue 的 DOM 更新和 $nextTick 的回调都在微任务队列中，DOM 更新在前，$nextTick 回调在后，所以回调执行时 DOM 一定已经更新了。**

---

## 六、面试高频场景

### 场景 1：数据修改后立即操作 DOM

```js
// ❌ 错误：DOM 还没更新
this.list.push(newItem)
const height = this.$refs.list.scrollHeight // 拿到的是旧高度

// ✅ 正确
this.list.push(newItem)
this.$nextTick(() => {
  const height = this.$refs.list.scrollHeight // 拿到的是新高度
  this.$refs.list.scrollTop = height // 滚动到底部
})
```

### 场景 2：created 中操作 DOM

```js
created() {
  // ❌ 错误：created 阶段 DOM 还没挂载
  this.$refs.box.style.color = 'red'

  // ✅ 正确
  this.$nextTick(() => {
    this.$refs.box.style.color = 'red'
  })
}
```

### 场景 3：连续多次修改数据

```js
this.count = 1
this.count = 2
this.count = 3

// $nextTick 只会执行一次，因为 Vue 会合并同一轮的多次数据修改
this.$nextTick(() => {
  // DOM 已经一次性更新为 3
  console.log(this.$refs.box.textContent) // '3'
})
```

---

## 七、一句话总结

> `$nextTick` 的本质就是把回调塞进微任务队列，利用「微任务在当前宏任务结束后立即执行」的特性，确保回调在 Vue 异步批量 DOM 更新完成之后运行。

---

## 八、记忆口诀

| 问题 | 答案 |
|------|------|
| DOM 更新是什么时机？ | 异步的，微任务 |
| $nextTick 用了什么？ | 微任务（Promise） |
| 为什么不直接用 setTimeout？ | setTimeout 是宏任务，比微任务慢 |
| Vue2 降级策略？ | Promise → MutationObserver → setImmediate → setTimeout |
| Vue3 的实现？ | 直接用 Promise，不支持 IE 不需要降级 |
| $nextTick 回调里能拿到最新 DOM 吗？ | 能，因为 DOM 更新和回调都在微任务中，DOM 更新先执行 |
