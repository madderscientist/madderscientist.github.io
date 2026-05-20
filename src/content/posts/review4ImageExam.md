---
title: 图象分析与理解复习
description: 为5/29的考试做准备
pubDate: 2026-05-20
tags: [理论, 图像, 复习]
---

# 形态学
## 形态学运算定义
二值形态学与灰度形态学 扩张(Dialtions)、侵蚀(Erosions)、开运算(Opening)、闭运算(Closing) 的定义

### 二值形态学
**Structing Elements (SE)** 结构元，也就是卷积核非0部分的形状。后面记为 $B \in Z^2$，是二维坐标（向量）的集合。

**二值·侵蚀(Erosions)**: $ A \ominus B = \{ p \mid (B)_p \subseteq A \} $
表现为白色缩了一圈、黑色扩了一圈。
其中 $(B)_p = \{b + p | b \in B\}$，整个式子的意思是：$B$ 平移后在 $A$ 中的点构成的图，叫做 $B$ 侵蚀 $A$ 的结果。

**二值·扩张(Dialtions)**: $ A \oplus B = \{ p \mid (\hat{B})_p \cap A \neq \emptyset \} $
表现为黑色缩了一圈、白色扩了一圈。
其中 $\hat{B} = \{(-x,-y) | (x, y) \in B\}$，也就是移回去在 $A$ 内的点的集合。
更简单的写法：$ A \oplus B = \bigcup_{p \in A} (B)_p $

对原图的操作 $\Leftrightarrow$ 对补图的另一个操作的补（对偶）：
$$
\begin{aligned}
    \left( A \ominus B \right)^c &= A^c \oplus \hat{B}\\
    \left( A \oplus B \right)^c &= A^c \ominus \hat{B}
\end{aligned}
$$
用上面的定义可以很简单地证明。

**开运算(Opening)**: $ A \circ B = (A \ominus B) \oplus B $ —— 先小后大
**闭运算(Closing)**: $ A \bullet B = (A \oplus B) \ominus B $ —— 先大后小

**性质：**
1. 幂等——做1w次=做1次
2. 不改变包含关系
3. 大小关系: $ A \bullet B \subseteq A \subseteq A \circ B $
4. 对偶

### 灰度形态学
灰度时取补就是相反数（二值时取非）。

如果不是为了考试，其实记灰度的就够了。这个更统一更好背。推广到二值就是把 max 变成了 OR，把 min 变成了 AND。

**flat SE**: SE是二值的MASK，“平的”
- 侵蚀: $\left[ f \ominus b \right](x, y) = \min_{(s,t) \in b} \left\{ f(x + s, y + t) \right\}$
- 扩张: $ \left[ f \oplus b \right](x, y) = \max_{(s,t) \in b} \left\{ f(x - s, y - t) \right\} $

**nonflat SE**: 有相对大小变化的SE
- 侵蚀: $ \left[ f \ominus b_N \right](x, y) = \min_{(s,t) \in b_N} \left\{ f(x + s, y + t) - b_N(s, t) \right\} $
- 扩张: $ \left[ f \oplus b_N \right](x, y) = \max_{(s,t) \in b_N} \left\{ f(x - s, y - t) + b_N(s, t) \right\} $

开闭运算定义不变，不过此时集合倒是不存在了——所以只有**幂等**和**对偶**性。

## 形态学的应用
### 二值形态学重建
目标：二值图 $G$ 有多个不连通的部分，给你一个部分的种子，要把包含这个种子的部分提取出来。

本质上就是从这个种子开始 广度优先 遍历图内像素，不过这里用 扩张运算 实现了广度优先。评价为计算开销更大，垃完了。

记种子图为 $I_0$，具体做法：
$$
I_k = (I_{k-1} \oplus B) \cap G
$$
也就是先扩张，然后把区域外的切掉，循环直到收敛。显然部分之间的最小间距不能比SE半径窄（还有限制，真不如广度优先一根）。

但是把 $\cap$ 看作 $\land$，进而变为“min”，就能得到灰度形态学重建：

### 灰度形态学重建 H-dome
此时形态学的优势才体现出来。种子图 $I_0 = G - c$，显然 $I_0$ 就是原图暗了一些。
$$
\begin{aligned}
I_k &= \min(I_{k-1} \oplus B, G) \\
G' &= G-I_{\infin}
\end{aligned}
$$
迭代过程中像素值和原值的差异在 $c$ 以内，而深色部分和原值的差异比浅色部分更小，因为扩张是求max，是局部最亮拉动局部最暗，但局部最亮没有像素拉，导致其与原始的差值始终为 $c$。

这个“局部”是用min实现的，如果没有min，经过无数次迭代，整张图就成局部了。min制造了沟壑，防止了蔓延。

由此可见：$c$ 是重建后的最大灰度，也是对“局部范围内，前景和背景灰度差”的估计。

### Convex Hull 找凸包
二值形态学中的。基本原理：
$$
\begin{aligned}
    I_{i,k} &= (I_{i,k-1} \ominus B_i) \cup I_{i,k-1} \\
    I_{ch} &= \bigcup_{i=1,2,3\dots} I_{i, K}
\end{aligned}
$$
其中 $B_i$ 的设计很有意思：如果要生成的边为45°的方形，那么一共设置4个 $B$，生成左边那个尖角的SE长这样：
```txt
0 0 1
0 0 1
0 0 1
```
为什么生成的的是90°？因为“1”和中心点的连线覆盖了90°。所以如果是下面的形态元：
```txt
0 0 0 0 1
0 0 0 0 1
0 0 0 0 1
```
生成结果左边的尖角会是 $2\arctan(0.5)$。显然取最终并集的时候得到的不是凸包——会有四个向内凹陷的钝角。

为什么是“并”？很显然——侵蚀会减小面积；
为什么是 “侵蚀”？需要思考一下：仅有当结构元处都是1，才能将“与中心连线”的那个三角填上颜色。如果是 “扩张”，那就变成广度优先遍历了。

### 顶帽变换 Top-Hat Transform
本质上是提取高频（比结构元小的东西）。之所以叫“顶帽”，指的就是得到的是小突起（整张图像是广场，最高的是帽子）。

对灰度图，作业里用这个方法求不均匀光照下的二值化：先用这个变换消除背景的不均匀，再全局阈值。

记原图为 $f$，形态元为 $b$，结果为 $h$，背景暗而目标亮使用:
$$
h = f - (f \circ b)
$$
灰度的开运算结果一定比原值小，相当于提取了背景。形象化的理解是：开运算把亮的部分消除了，并用临近值填充了原来亮的位置。

如果背景暗而目标亮，就反过来：
$$
h = (f \bullet b) - f
$$

要求形态元比要保留的大。作业里是松散的米粒，何尝不是一种 cherry pick。

### 边缘提取
以提取浅色区域为例：
$$
h = f - (f \ominus b)
$$
非常显然，相当于白色先缩小一点，让出边界的位置。

# 模糊方法
## 模糊集合论基本定义
元素 $z$ 属于模糊集 $A$ 的程度——隶属度
$$
\mu_A(z) \in [0,1]
$$

定义集合需要用 *(元素,隶属度)* 的二元组的集合:
$$
A = \{ (z, \mu_A(z)) | z \in Z\}
$$
对，全集 $Z$ 的每一个元素都在A里，只不过是隶属度的高低罢了。

**模糊集的运算**：对 $\forall z \in Z$:
- 空: $\mu_A(z) = 0$
- 集合相等: $\mu_A(z) = \mu_B(z)$
- **子集**: $\mu_A(z) \leq \mu_B(z)$
- 补(NOT): $\mu_{\bar{A}}(z) = 1 - \mu_A(z)$
- 并(OR): $\mu_{A \cup B}(z) = \max(\mu_A(z), \mu_B(z))$
- 交(AND): $\mu_{A \cap B}(z) = \min(\mu_A(z), \mu_B(z))$

## 模糊推断系统基本概念
- **模糊化**(Fuzzification)：将 crisp 输入转换为模糊语言变量（使用隶属函数）
- **知识库**(Knowledge Base)：包含隶属函数和模糊规则
- **推理机制**(Inference)：应用 if-then 规则将模糊输入映射为模糊输出
- **去模糊化**(Defuzzification)：将模糊输出转换为 crisp 输出

### 规则
专家知识就是规则，表现为一系列“if-then”:
- 规则**内部**的条件使用 AND 连接多个前提。then 的处理分为两大方法，见下
- 规则**之间**使用 OR 连接

> 例子：图像增强
> Expert knowledge (linguistic rule)
> - If a pixel is dark, then make it darker
> - If a pixel is gray, then keep it gray
> - If a pixel is bright, then make it brighter
>
> 记输入为 $i_1$，输出为 $i_2$，有：
> Expert knowledge (reiterated)
> 1. $i_1$  is “dark” **and** $i_2$  is “darker” 
> 2. $i_1$  is “gray” and $i_2$  is “gray” 
> 3. $i_1$  is “bright” and $i_2$  is “brighter”

这里为什么“蕴含”也用了AND？这是 Mamdani 模型，类似联合概率；而“以条件隶属度为权值对then进行加权”是 Takagi-Sugeno 模型。

课上只讲了 Mamdani 模型。举个例子：
1. 如果输入满足条件1 => 输出满足要求1
2. 如果输入满足条件2 => 输出满足要求2
3. 否则 输出满足要求3

- 规则1隶属度(输出)=min(条件1(输入), 要求1(输出))
- 规则2隶属度(输出) = min(条件2(输入), 要求2(输出))
- 规则3隶属度(输出) = min(条件3(输入), 要求3(输出))

> 每个隶属度的具体计算需要定义，也就是“知识库”
> 这里没有考虑 if-else 的关系：规则之间平行

$$
\begin{aligned}
&\text{总隶属度}(\text{输出})=\max(\\
&\quad\quad\text{规则1隶属度}(\text{输出}),\\
&\quad\quad\text{规则2隶属度}(\text{输出}),\\
&\quad\quad\text{规则3隶属度}(\text{输出})\\
&)
\end{aligned}
$$

“总隶属度”是变量“输出”的函数，下一步就是遍历所有可能的输出值，计算每个输出值的总隶属度，最后用某种去模糊方法（见下）得到最终结果。

### 去模糊化方法
- **重心法(centroid of gravity)**: 对上面的例子来说，就是用每个“输出”的隶属度作为权重，对“输出”计算加权平均。
- **Bisector of area**：找到一个输出值，使得这个输出值的总隶属度曲线下面积被分成两半。
- **Mean of maximum**：找到总隶属度曲线的最大值，求出所有输出值对应的总隶属度等于这个最大值的输出值的平均。
- **Smallest of maximum**：找到总隶属度曲线的最大值，求出所有输出值对应的总隶属度等于这个最大值的输出值中的最小。
- **Largest of maximum**：找到总隶属度曲线的最大值，求出所有输出值对应的总隶属度等于这个最大值的输出值中的最大。

## 大津法、模糊分割方法优化的目标函数

## 模糊聚类方法基本概念


# 统计方法
## 基本统计模型，包括伯努利统计等

## 贝叶斯统计基本概念

## 基本的优化方法
包括最速降线法、Momentom法等


# 图象采集与处理
## 拜尔滤镜
拜尔滤镜基本概念，怎么通过拜尔滤镜获得彩色图像


# 图象分割与配准
哈里斯角点检测法
graph cuts图像分割方法基本概念
Meanshift图像分割算法
主动轮廓算法基本概念
图像的仿射变换与投影（透视）变换基本概念


