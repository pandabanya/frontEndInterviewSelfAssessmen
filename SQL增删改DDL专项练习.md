# SQL增删改和DDL操作 - 事业单位考试补充

## 一、INSERT - 插入数据

### 基础插入
```sql
-- 插入完整记录
INSERT INTO Student (Sno, Sname, Ssex, Sage, Sdept)
VALUES ('005', '孙七', '男', 20, '计算机');

-- 插入多条记录
INSERT INTO Student VALUES 
  ('006', '周八', '女', 21, '软件工程'),
  ('007', '吴九', '男', 19, '信息管理');

-- 插入部分列
INSERT INTO Student (Sno, Sname)
VALUES ('008', '郑十');

-- 从查询结果插入
INSERT INTO Student_Backup
SELECT * FROM Student WHERE Sdept = '计算机';
```

---

## 二、UPDATE - 更新数据

### 基础更新
```sql
-- 更新单个字段
UPDATE Student SET Sage = 21 WHERE Sno = '001';

-- 更新多个字段
UPDATE Student 
SET Sage = 22, Sdept = '计算机' 
WHERE Sno = '002';

-- 批量更新
UPDATE Student SET Sage = Sage + 1 WHERE Sdept = '计算机';

-- 根据子查询更新
UPDATE Student 
SET Sage = Sage + 1 
WHERE Sno IN (SELECT Sno FROM SC WHERE Cno = 'C01');
```

---

## 三、DELETE - 删除数据

### 基础删除
```sql
-- 删除单条记录
DELETE FROM Student WHERE Sno = '001';

-- 批量删除
DELETE FROM Student WHERE Sage < 18;

-- 根据子查询删除
DELETE FROM Student 
WHERE Sno NOT IN (SELECT DISTINCT Sno FROM SC);

-- 删除所有记录
DELETE FROM Student;           -- 可回滚
TRUNCATE TABLE Student;        -- 不可回滚,更快
```

### DELETE vs TRUNCATE vs DROP
| 操作 | 作用 | 速度 | 回滚 | WHERE |
|------|------|------|------|-------|
| DELETE | 删除数据 | 慢 | 可以 | 可以 |
| TRUNCATE | 清空数据 | 快 | 不可以 | 不可以 |
| DROP | 删除表 | 快 | 不可以 | 不可以 |

---

## 四、CREATE TABLE - 创建表

### 基础创建
```sql
-- 简单表
CREATE TABLE Student (
  Sno VARCHAR(10) PRIMARY KEY,
  Sname VARCHAR(50) NOT NULL,
  Sage INT
);

-- 带约束的表
CREATE TABLE Student (
  Sno VARCHAR(10) PRIMARY KEY,
  Sname VARCHAR(50) NOT NULL,
  Ssex CHAR(1) CHECK (Ssex IN ('男', '女')),
  Sage INT CHECK (Sage >= 0 AND Sage <= 150),
  Sdept VARCHAR(50) DEFAULT '未分配',
  Email VARCHAR(100) UNIQUE
);

-- 带外键的表
CREATE TABLE SC (
  Sno VARCHAR(10),
  Cno VARCHAR(10),
  Grade INT,
  PRIMARY KEY (Sno, Cno),
  FOREIGN KEY (Sno) REFERENCES Student(Sno),
  FOREIGN KEY (Cno) REFERENCES Course(Cno)
);
```

### 常用约束
```sql
PRIMARY KEY      -- 主键(唯一且非空)
FOREIGN KEY      -- 外键(引用其他表)
NOT NULL         -- 非空
UNIQUE           -- 唯一
CHECK            -- 检查约束
DEFAULT          -- 默认值
AUTO_INCREMENT   -- 自增(MySQL)
IDENTITY         -- 自增(SQL Server)
```

---

## 五、ALTER TABLE - 修改表结构

### 列操作
```sql
-- 添加列
ALTER TABLE Student ADD Phone VARCHAR(20);

-- 删除列
ALTER TABLE Student DROP COLUMN Phone;

-- 修改列类型(MySQL)
ALTER TABLE Student MODIFY Sage SMALLINT;

-- 修改列类型(SQL Server)
ALTER TABLE Student ALTER COLUMN Sage SMALLINT;

-- 修改列名(MySQL)
ALTER TABLE Student CHANGE Sage Age INT;
```

### 约束操作
```sql
-- 添加主键
ALTER TABLE Student ADD PRIMARY KEY (Sno);

-- 添加外键
ALTER TABLE SC ADD FOREIGN KEY (Sno) REFERENCES Student(Sno);

-- 添加唯一约束
ALTER TABLE Student ADD UNIQUE (Email);

-- 添加检查约束
ALTER TABLE Student ADD CHECK (Sage >= 0);

-- 删除主键
ALTER TABLE Student DROP PRIMARY KEY;

-- 删除外键(需要约束名)
ALTER TABLE SC DROP FOREIGN KEY fk_name;
```

---

## 六、DROP TABLE - 删除表

```sql
-- 删除表
DROP TABLE Student;

-- 如果存在则删除
DROP TABLE IF EXISTS Student;

-- 删除多个表
DROP TABLE Student, Course, SC;
```

---

## 七、真题练习

### 真题1 (单选)
向学生表插入记录的正确语句是?

A. `ADD INTO Student VALUES ('001', '张三');`
B. `INSERT Student VALUES ('001', '张三');`
C. `INSERT INTO Student VALUES ('001', '张三');`
D. `ADD Student VALUES ('001', '张三');`

**答案: C**

---

### 真题2 (单选)
DELETE和TRUNCATE的区别,错误的是?

A. DELETE可以带WHERE,TRUNCATE不能
B. DELETE可以回滚,TRUNCATE不能
C. TRUNCATE比DELETE快
D. DELETE和TRUNCATE都会删除表结构

**答案: D** (都只删除数据,不删除表结构)

---

### 真题3 (单选)
给学生表添加电话列的正确语句是?

A. `ALTER TABLE Student INSERT Phone VARCHAR(20);`
B. `ALTER TABLE Student ADD Phone VARCHAR(20);`
C. `UPDATE TABLE Student ADD Phone VARCHAR(20);`
D. `MODIFY TABLE Student ADD Phone VARCHAR(20);`

**答案: B**

---

### 真题4 (填空)
删除学生表中年龄小于18的记录:
```sql
_____ FROM Student WHERE Sage < 18;
```

**答案: DELETE**

---

### 真题5 (填空)
将学号为'001'的学生年龄改为21:
```sql
_____ Student SET Sage = 21 WHERE Sno = '001';
```

**答案: UPDATE**

---

### 真题6 (简答)
创建课程表,包含课程号(主键)、课程名(非空)、学分(默认值2)。

**答案:**
```sql
CREATE TABLE Course (
  Cno VARCHAR(10) PRIMARY KEY,
  Cname VARCHAR(50) NOT NULL,
  Credit INT DEFAULT 2
);
```

---

### 真题7 (简答)
将所有计算机系学生的年龄加1。

**答案:**
```sql
UPDATE Student 
SET Sage = Sage + 1 
WHERE Sdept = '计算机';
```

---

### 真题8 (简答)
删除没有选课的学生。

**答案:**
```sql
DELETE FROM Student 
WHERE Sno NOT IN (SELECT DISTINCT Sno FROM SC);
```

---

## 八、常见错误

### 错误1: INSERT忘记INTO
```sql
-- ❌ 错误
INSERT Student VALUES ('001', '张三');

-- ✅ 正确
INSERT INTO Student VALUES ('001', '张三');
```

### 错误2: UPDATE/DELETE忘记WHERE
```sql
-- ❌ 危险(会更新/删除所有记录!)
UPDATE Student SET Sage = 20;
DELETE FROM Student;

-- ✅ 正确
UPDATE Student SET Sage = 20 WHERE Sno = '001';
DELETE FROM Student WHERE Sno = '001';
```

### 错误3: DELETE和DROP混淆
```sql
DELETE FROM Student;   -- 删除数据,保留表结构
DROP TABLE Student;    -- 删除整个表
TRUNCATE TABLE Student; -- 快速清空数据
```

---

## 九、考前速记

```
插入: INSERT INTO 表 VALUES (值)
更新: UPDATE 表 SET 列=值 WHERE 条件
删除: DELETE FROM 表 WHERE 条件

创建: CREATE TABLE 表 (列 类型 约束)
修改: ALTER TABLE 表 ADD/DROP/MODIFY 列
删除: DROP TABLE 表

约束: PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, CHECK, DEFAULT

DELETE vs TRUNCATE:
- DELETE: 可回滚,可WHERE,慢
- TRUNCATE: 不可回滚,不能WHERE,快

DELETE vs DROP:
- DELETE: 删除数据
- DROP: 删除表
```
