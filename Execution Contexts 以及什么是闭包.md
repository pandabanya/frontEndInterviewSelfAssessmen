# Execution Contexts 以及什么是闭包

## 什么是Execution Contexts 执行上下文

顾名思义，执行上下文是在Javascript代码执行的时候产生，可以理解文执行时的“环境”

执行上下文的三种类型

```javascript
// 全局执行上下文
var globalVal = "global";

// 2. 函数执行上下文(Function Execution Context)
function foo() {
  var funcVar = "function";
}
```

## 执行上下文包含什么?

执行上下文包含三个重要部分：

```javascript

ExecutionContext = {
	// 1. 变量对象(Variable Object, VO) 函数的上下文里面是AO (活动对象 Activation Object)
  //    存储变量、函数声明、函数参数
  VO:{
  	变量声明，
    函数声明，
    函数参数
  }，
  // 2. 作用域链(Scope Chain)
  //    用于查找变量
  ScopeChain: [当前VO, 父级VO, ..., 全局VO],
	// 3. this指向
  this: 指向某个对象待定,调用时确定
}

```

## 执行上下文的生命周期

### 1. 创建阶段

#### 全局上下文:

在代码执行前，js引擎会：

- 创建全局对象 brower -> window ,node-> global
- 创建VO
- 声明的变量初始化是 undefined
- 看到function声明，创建函数对象

#### 函数上下文:

在代码执行前，js引擎会：

- 创建AO
- 扫描形参 → 赋值实参或undefined
- 声明的变量初始化是 undefined
- 看到function声明，创建函数对象

#### 2. 建立作用域链

```plaintxt
作用域链 = [当前AO/VO, 外层AO/VO, ..., 全局VO]
```

#### 3. this绑定

- 预留this的位置,但具体值要等到调用时才确定
- 不同的调用方式决定不同的this值

## 那什么是闭包？

也就是有权访问另一个函数作用域中变量的函数

```javascript
function outer() {
  var count = 0; // 外部变量

  return function inner() {
    count++; // 内部函数访问外部变量
    console.log(count);
  };
}
const counter = outer();
counter(); // 1
counter(); // 2
counter(); // 3
// 为什么count没有被销毁?
// 因为inner函数的作用域链中保存了对outer的AO的引用:
// innerEC = {
//   scopeChain: [innerAO, outerAO, GlobalVO]
// }
即使outer函数执行完被销毁了，但inner还在引用outerAO,所以outerAO不会被垃圾回收。
```

## 经典闭包陷阱: for + var + setTimeout

```javascript
// 错误:全部输出10
for (var i = 0; i < 10; i++) {
  setTimeout(function () {
    console.log(i);
  }, 1000);
}
// 输出: 10, 10, 10, ... (10次)
```

### 为什么全部输出10?

原因: `var` 没有块级作用域，`i` 直接挂在全局 VO 上，10个回调共享同一个 `i`。
而 `setTimeout` 是异步的，等回调执行时循环早已结束，`i` 已经是 10。

```plaintext
时间线:
  ┌─ 同步阶段(立刻执行) ──────────────────────────────────┐
  │ i=0 → 注册回调1 → i=1 → 注册回调2 → ... → i=10 循环结束 │
  └────────────────────────────────────────────────────────┘
                        ↓ 1秒后
  ┌─ 异步阶段(回调执行) ─────────────────────────────┐
  │ 回调1: 沿作用域链找i → GlobalVO{i:10} → 输出10   │
  │ 回调2: 沿作用域链找i → GlobalVO{i:10} → 输出10   │
  │ ...全部都是10                                    │
  └──────────────────────────────────────────────────┘
```

### 解决方案1: 用IIFE创建闭包(ES5)

```javascript
// 用立即执行函数(IIFE)给每次循环创建一个独立的函数作用域
for (var i = 0; i < 10; i++) {
  (function (j) {
    // j 是形参，存在这个IIFE自己的AO里
    setTimeout(function () {
      console.log(j); // 沿作用域链找j → IIFE的AO{j:当时的值}
    }, 1000);
  })(i); // 把当时的i作为实参传进去
}
// 输出: 0, 1, 2, ..., 9
// 每个IIFE都有自己的AO，里面各存了一份j的值
```

### 解决方案2: 用let(ES6)

```javascript
// let有块级作用域，每次循环都会创建一个新的绑定
for (let i = 0; i < 10; i++) {
  setTimeout(function () {
    console.log(i);
  }, 1000);
}
// 输出: 0, 1, 2, ..., 9
// let使得每次循环的i都是独立的变量，互不影响
```
