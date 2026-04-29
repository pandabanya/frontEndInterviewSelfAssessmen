// class 被观察者 {
//   constructor() {
//     this.fans = [];
//   }
//   subscribe(fan) {
//     this.fans.push(fan);
//   }
//   unsubscribe(fan) {
//     this.fans = this.fans.filter((item) => item !== fan);
//   }
//   notify(message) {
//     this.fans.forEach((fan) => console.log(`${fan} 收到：${message}`));
//   }
// }

// class 观察者 {
//   constructor(name) {
//     this.name = name;
//   }
//   update(message) {
//     console.log(`${this.name} 收到：${message}`);
//   }
// }

// const up主 = new 被观察者();
// const 张三 = "张三";
// const 李四 = "李四";
// // console.log(up主.fans);
// up主.subscribe(张三);
// up主.subscribe(李四);
// console.log(up主.fans);
// up主.notify("新视频发布了，粉丝快来看啊！");

// up主.unsubscribe(张三);
// console.log(up主.fans);
// up主.notify("新视频发布了，粉丝快来看啊！");

// 观察者模式
// class Subject {
//     constructor() {
//         this.observers = [];
//     }
//     subscribe(observer) {
//         this.observers.push(observer);
//     }
//     unsubscribe(observer) {
//         this.observers = this.observers.filter((item) => item !== observer);
//     }
//     notify(message) {
//         this.observers.forEach((observer) => observer.update(message));
//     }
// }

// class Observer {
//     constructor(name) {
//         this.name = name;
//     }
//     update(message) {
//         console.log(`${this.name} 收到：${message}`);
//     }
// }

// const Dep = {
//    subs: [],
//    target: null,
//    depend(){
//     if(Dep.target){
//         this.subs.push(Dep.target);
//     }
//    },
//    notify(){
//     this.subs.forEach((watcher) => watcher.update());
//    }
// }

class Subject {
  constructor() {
    this.observers = []; // 订阅者列表
  }
  // 添加粉丝
  addObserver(observer) {
    this.observers.push(observer);
  }
  // 删除粉丝
  removeObserver(observer) {
    this.observers = this.observers.filter((item) => item !== observer);
  }
  notify(data) {
    this.observers.forEach((observer) => {
      observer.update(data); // 通知所有粉丝者更新数据，将数据传递给粉丝者，粉丝自己干自己想做的事
    });
  }
}

class Observer {
  constructor(name) {
    this.name = name;
  }
  update(data) {
    console.log(`${this.name} 收到更新：${data}`);
  }
}

const gzh = new Subject();
const you = new Observer("你自己");
gzh.addObserver(you);
gzh.notify("新视频发布了，粉丝快来看啊！");

// 观察者模式清楚了

const data = { msg: "hello" };
Object.defineProperty(data, "msg", {
  get() {
    console.log("有人读了 msg");
    return value;
  },
  set(newValue) {
    console.log("有人写了 msg");
    value = newValue;
  },
});

// ============================================================
// 第二步：数据劫持（单独看，还没和观察者模式结合）
// ============================================================
// 问题：上面的 Subject 需要手动 addObserver，手动 notify
// 能不能让"数据一改，自动通知"？—— 需要数据劫持

const data1 = { msg: "hello" };
let _msg = data1.msg; // 用一个变量保存真实值
Object.defineProperty(data1, "msg", {
  get() {
    console.log("有人读了 msg");
    return _msg;
  },
  set(newValue) {
    console.log("有人写了 msg");
    _msg = newValue;
  },
});
// data1.msg;          // → 有人读了 msg
// data1.msg = 'world' // → 有人写了 msg
// 但是！现在只是"知道有人读写了"，并没有通知任何人
// 所以需要把第一步的观察者模式塞进去 ↓

// ============================================================
// 第三步：数据劫持 + 观察者模式 = Vue 响应式核心
// ============================================================
// 这就是 Vue 做的事：把 Dep（公众号后台）藏在每个属性的 get/set 里

/** Dep：每个属性的"公众号后台"，管理粉丝列表 */
class Dep {
  constructor() {
    this.subs = []; // 粉丝列表（Watcher数组）
  }
  /** 收集粉丝 */
  addSub(watcher) {
    this.subs.push(watcher);
  }
  /** 通知所有粉丝 */
  notify() {
    this.subs.forEach((w) => w.update());
  }
}

// 全局挂牌位——谁正在渲染，就把谁挂上去
Dep.target = null;

/** Watcher：粉丝，收到通知后重新渲染 */
class Watcher {
  /**
   * @param {Object} vm - 数据对象
   * @param {Function} renderFn - 渲染函数（读数据 → 触发get → 自动收集）
   */
  constructor(vm, renderFn) {
    this.vm = vm;
    this.renderFn = renderFn;
    this.get(); // 首次执行，触发依赖收集
  }
  /** 挂牌 → 执行渲染 → 摘牌 */
  get() {
    Dep.target = this; // ① 挂牌：我是当前粉丝
    this.renderFn.call(this.vm); // ② 渲染：读属性 → 触发get → get里收集我
    Dep.target = null; // ③ 摘牌
  }
  /** 收到通知后的反应 */
  update() {
    console.log("Watcher: 收到通知，重新渲染！");
    this.get(); // 重新执行渲染函数
  }
}

/** 劫持一个属性，把 Dep 塞进 get/set */
function defineReactive(obj, key, val) {
  const dep = new Dep(); // 每个属性有自己的 Dep（公众号后台）

  Object.defineProperty(obj, key, {
    get() {
      // 有人挂牌了（说明有 Watcher 正在渲染）→ 收集它
      if (Dep.target) {
        dep.addSub(Dep.target);
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      dep.notify(); // 值变了 → 通知所有粉丝
    },
  });
}

// ---------- 测试：模拟 Vue 响应式 ----------
const vm = { name: "张三" };
defineReactive(vm, "name", vm.name);

// 创建一个 Watcher（相当于组件渲染）
// renderFn 里读了 this.name → 触发 get → 自动收集
new Watcher(vm, function () {
  console.log("页面显示：" + this.name);
});
// 输出：页面显示：张三

vm.name = "李四";
// 输出：Watcher: 收到通知，重新渲染！
//       页面显示：李四

vm.name = "王五";
// 输出：Watcher: 收到通知，重新渲染！
//       页面显示：王五

// ============================================================
// 第四步：引出 $nextTick —— 上面的代码有什么问题？
// ============================================================
// 问题：上面每次 set 都立刻执行 update（同步更新）
// 如果连续改 3 次：
//   vm.name = 'A'  → 立刻渲染
//   vm.name = 'B'  → 立刻渲染
//   vm.name = 'C'  → 立刻渲染
// 渲染了 3 次！但页面最终只显示 'C'，前 2 次白干了
//
// Vue 的解决方案：不立刻渲染，而是把 Watcher 推入队列，异步批量更新
// 这个"异步批量更新"的调度器，就是 nextTick
//
// 流程变成：
//   vm.name = 'A'  → Watcher 入队（不渲染）
//   vm.name = 'B'  → Watcher 已在队列中，跳过（去重）
//   vm.name = 'C'  → Watcher 已在队列中，跳过（去重）
//   同步代码跑完...
//   nextTick 触发 → 统一执行一次 Watcher.update() → 只渲染 1 次，显示 'C'
//
// 你调用 this.$nextTick(cb)：
//   就是把 cb 排在"Watcher统一更新"的后面
//   所以 cb 执行时，DOM 一定已经更新完了

// ============================================================
// 第五步：完整实现 nextTick + 异步批量更新（可运行）
// ============================================================

// ---------- nextTick：把回调塞进微任务 ----------
const callbacks = []; // 回调队列
let pending = false; // 是否已经安排了微任务

/** 把 fn 推入回调队列，在微任务中统一执行 */
function nextTick(fn) {
  callbacks.push(fn);
  if (!pending) {
    pending = true;
    // 用 Promise.then 把 flushCallbacks 放入微任务队列
    // （Vue2 这里有降级策略，Vue3 直接用 Promise）
    Promise.resolve().then(flushCallbacks);
  }
}

/** 微任务触发时：把队列里的回调全部执行 */
function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0; // 清空队列
  copies.forEach((fn) => fn());
}

// ---------- 异步更新队列：Watcher 去重 + 批量执行 ----------
const queue = []; // Watcher 队列
const has = {}; // 去重标记
let waiting = false; // 是否已经安排了刷新

/** 把 Watcher 推入队列（去重） */
function queueWatcher2(watcher) {
  const id = watcher.id;
  if (has[id]) return; // 已经在队列中 → 跳过
  has[id] = true;
  queue.push(watcher);

  if (!waiting) {
    waiting = true;
    // 关键：用 nextTick 异步执行 flushQueue
    // 这意味着 flushQueue 会在当前同步代码全部跑完后才执行
    nextTick(flushQueue);
  }
}

/** 统一刷新队列：排序 → 逐个执行 → 清空 */
function flushQueue() {
  queue.sort((a, b) => a.id - b.id); // 按 id 排序（父先子后）
  queue.forEach((w) => w.run()); // 逐个执行真正的更新
  // 清空
  queue.length = 0;
  for (const key in has) delete has[key];
  waiting = false;
}

// ---------- 改造版 Dep2 ----------
let watcherId = 0;

/** Dep2：和之前一样，管理粉丝列表 */
class Dep2 {
  constructor() {
    this.subs = [];
  }
  /** 收集粉丝 */
  addSub(watcher) {
    this.subs.push(watcher);
  }
  /** 通知所有粉丝 */
  notify() {
    this.subs.forEach((w) => w.update());
  }
}
Dep2.target = null;

/** Watcher2：update 不再直接执行，而是入队 */
class Watcher2 {
  /**
   * @param {Object} vm2 - 数据对象
   * @param {Function} renderFn - 渲染函数
   */
  constructor(vm2, renderFn) {
    this.id = ++watcherId; // 每个 Watcher 有唯一 id（用于去重和排序）
    this.vm2 = vm2;
    this.renderFn = renderFn;
    this.get();
  }
  /** 挂牌 → 渲染 → 摘牌 */
  get() {
    Dep2.target = this;
    this.renderFn.call(this.vm2);
    Dep2.target = null;
  }
  /** 收到通知 → 不直接渲染，而是入队（这是和之前的核心区别） */
  update() {
    queueWatcher2(this);
  }
  /** 真正执行渲染（由 flushQueue 调用） */
  run() {
    console.log(`Watcher2(id=${this.id}): 真正执行渲染`);
    this.get();
  }
}

/** 劫持属性（使用 Dep2） */
function defineReactive2(obj, key, val) {
  const dep = new Dep2();
  Object.defineProperty(obj, key, {
    get() {
      if (Dep2.target) dep.addSub(Dep2.target);
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      dep.notify();
    },
  });
}

// ---------- 测试：对比同步更新 vs 异步批量更新 ----------
console.log("\n===== 第五步：nextTick 异步批量更新 =====");

const vm2 = { name: "张三" };
defineReactive2(vm2, "name", vm2.name);

new Watcher2(vm2, function () {
  console.log("  页面显示：" + this.name);
});
// 输出：页面显示：张三（首次渲染）

console.log("--- 连续改 3 次 ---");
vm2.name = "A"; // Watcher 入队
vm2.name = "B"; // 已在队列，跳过
vm2.name = "C"; // 已在队列，跳过
console.log("同步代码还在跑，DOM 还没更新");

// 用 nextTick 注册回调——排在 Watcher 更新之后
nextTick(() => {
  console.log("  nextTick 回调：此时页面已经是 → " + vm2.name);
});

console.log("同步代码结束，接下来进入微任务...\n");
// 同步代码全部跑完后，微任务队列开始执行：
// 1. flushQueue → Watcher2.run() → 只渲染 1 次，显示 'C'
// 2. nextTick 回调 → 拿到更新后的值 'C'

// ============================================================
// Vue 响应式 + $nextTick 完整流转图
// ============================================================
//
//  ┌─────────────────────────────────────────────────────────┐
//  │                   初始化阶段                              │
//  │                                                         │
//  │  data: { msg: 'hello' }                                 │
//  │         │                                               │
//  │         ▼                                               │
//  │  Object.defineProperty(msg)                             │
//  │  给 msg 装上 get / set                                   │
//  │  同时创建 msg 的 Dep（公众号后台）                         │
//  │         │                                               │
//  │         ▼                                               │
//  │  new Watcher(渲染函数)  ← 组件挂载时创建                   │
//  │         │                                               │
//  │         ▼                                               │
//  │  Watcher.get() 首次执行                                  │
//  │  ┌──────────────────────────────┐                       │
//  │  │ ① Dep.target = this (挂牌)   │                       │
//  │  │ ② 执行渲染函数                │                       │
//  │  │    └→ 读 this.msg             │                       │
//  │  │       └→ 触发 msg 的 get      │                       │
//  │  │          └→ dep.addSub(当前Watcher)  ← 依赖收集 ✅    │
//  │  │ ③ Dep.target = null (摘牌)   │                       │
//  │  └──────────────────────────────┘                       │
//  │                                                         │
//  │  此时：msg 的 Dep.subs = [渲染Watcher]                    │
//  └─────────────────────────────────────────────────────────┘
//
//
//  ┌─────────────────────────────────────────────────────────┐
//  │                   数据更新阶段                             │
//  │                                                         │
//  │  this.msg = '新值'                                       │
//  │         │                                               │
//  │         ▼                                               │
//  │  触发 msg 的 set                                         │
//  │         │                                               │
//  │         ▼                                               │
//  │  dep.notify()  → 通知所有粉丝(Watcher)                    │
//  │         │                                               │
//  │         ▼                                               │
//  │  Watcher.update()                                       │
//  │         │                                               │
//  │         ▼                                               │
//  │  queueWatcher(watcher)                                  │
//  │  ┌──────────────────────────────┐                       │
//  │  │ has[id] 存在？                │                       │
//  │  │  ├─ 是 → 跳过（去重）         │                       │
//  │  │  └─ 否 → 入队 + 标记          │                       │
//  │  │         │                     │                       │
//  │  │         ▼                     │                       │
//  │  │  首次入队？                    │                       │
//  │  │  └─ 是 → nextTick(flushQueue) │  ← 安排异步刷新       │
//  │  └──────────────────────────────┘                       │
//  └─────────────────────────────────────────────────────────┘
//
//
//  ┌─────────────────────────────────────────────────────────┐
//  │              异步执行阶段（微任务）                         │
//  │                                                         │
//  │  当前同步代码全部执行完毕                                   │
//  │         │                                               │
//  │         ▼                                               │
//  │  ┌─────────────────────────────────────┐                │
//  │  │      callbacks 队列（先进先出）        │                │
//  │  │                                     │                │
//  │  │  ┌─ ① flushQueue ──────────────┐    │                │
//  │  │  │   排序(父先子后)              │    │                │
//  │  │  │   → watcher.run()           │    │                │
//  │  │  │   → 重新渲染 → DOM 更新 ✅    │    │                │
//  │  │  │   → 清空队列                 │    │                │
//  │  │  └─────────────────────────────┘    │                │
//  │  │                                     │                │
//  │  │  ┌─ ② 你的 $nextTick(cb) ─────┐    │                │
//  │  │  │   此时 DOM 已更新             │    │                │
//  │  │  │   cb 里拿到的是新 DOM ✅      │    │                │
//  │  │  └─────────────────────────────┘    │                │
//  │  └─────────────────────────────────────┘                │
//  └─────────────────────────────────────────────────────────┘
