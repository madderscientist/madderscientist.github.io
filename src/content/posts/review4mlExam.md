---
title: 机器学习考试复习
description: 为6/12的考试做准备
pubDate: 2026-06-08
tags: [理论, 机器学习, 复习]
---
这门课什么也没学到。都是老生常谈。

## 1. 不同行业中机器学习方法应用
简述不同行业中机器学习方法应用，包括：研究问题，机器学习方法如何应用（注：并非三个AI研究子领域）

就举例医疗和司法吧。

## 2. 不同深度神经网络
简述不同深度神经网络，包括：名称、主要结构特点
pass

## 3. 推导线性回归
假设数据为 $\{(x_i, y_i)\}_{i=1}^n$，线性回归模型为 $y = wx + b$（输入和输出都是向量），损失函数为均方误差：
$$
L(w, b) = \frac{1}{n} \sum_{i=1}^n \|y_i - (wx_i + b)\|^2\\
$$

给 $x$ 的第一维加上偏置项，定义 $\tilde{x}_i = [1; x_i]$ 和 $\tilde{w} = [b; w]$，则损失函数可以重写为：
$$
\begin{aligned}
L(\tilde{w}) &= \frac{1}{n} \sum_{i=1}^n \|y_i - \tilde{w}^T \tilde{x}_i\|^2 \\
&= \frac{1}{n} (\tilde{w}\tilde{X} - Y)^T (\tilde{w}\tilde{X} - Y)
\end{aligned}
$$

求导过程在[《图象分析与理解复习》](/posts/review4imageexam/#1-最小二乘复原) 中用通用方法进行；这里用运算率：
$$
\begin{aligned}
nL'(\tilde{w}) &= \tilde{X}^T (\tilde{w}\tilde{X} - Y) + (\tilde{w}\tilde{X} - Y)^T \tilde{X} \quad \text{两项相乘的求导} \\
&= 2\tilde{X}^T (\tilde{w}\tilde{X} - Y) \quad \text{标量直接转置} \\
&= 2\tilde{X}^T \tilde{w}\tilde{X} - 2\tilde{X}^T Y := 0 \\
\Rightarrow \tilde{w} &= (\tilde{X}^T \tilde{X})^{-1} \tilde{X}^T Y
\end{aligned}
$$

如果是非线性呢？可以加上高次项，比如标量自变量 $x$ 变为向量 $[x, x^2, x^3...]^T$。

## 3.5. 逻辑回归
也就是做分类，$y_i \in \{0, 1\}$。用 sigmoid 函数将线性输出转为概率（此处的 $x$ 和 $\theta$ 已经包含了偏置，懒得打波浪号了）：
$$
p(y = 1 | x; \theta) = \sigma(\theta^T x) = \frac{1}{1 + e^{-\theta^T x}} \\
p(y = 0 | x; \theta) = 1 - p(y = 1 | x; \theta)
$$

目标是最大化似然函数：
$$
\begin{aligned}
\theta &= \argmax_\theta \prod_{i=1}^n p(y_i | x_i; \theta) \\
&= \argmax_\theta \sum_{i=1}^n \log p(y_i | x_i; \theta) \\
&= \argmax_\theta \sum_{i=1}^n \left[y_i \log \sigma(\theta^T x_i) + (1 - y_i) \log (1 - \sigma(\theta^T x_i))\right]
\end{aligned}
$$

最后一步利用了 $y$ 的二值特性，最后就是交叉熵损失函数了。下面求导：
$$
\begin{aligned}
\frac{\partial}{\partial \theta} L &= \sum_{i=1}^n \left[y_i \frac{1}{\sigma(\theta^T x_i)} \sigma'(\theta^T x_i) x_i + (1 - y_i) \frac{1}{1 - \sigma(\theta^T x_i)} (-\sigma'(\theta^T x_i)) x_i\right] \\
&= \sum_{i=1}^n \left[y_i (1 - \sigma(\theta^T x_i)) x_i - (1 - y_i) \sigma(\theta^T x_i) x_i\right] \\
&= \sum_{i=1}^n (y_i - \sigma(\theta^T x_i)) x_i
\end{aligned}
$$

逻辑回归没有解析解，只能用数值方法求解，比如梯度下降；不过这里要最大化似然函数，所以是梯度上升：
$$
\theta := \theta + \alpha X^T (Y - \sigma(X\theta)) 
$$

## 4. 贝叶斯网络计算
上学期复习“人工智能导论”时总结过贝叶斯网络：[条件随机场CRF 通俗速通 直观理解](https://zhuanlan.zhihu.com/p/1983164975603278375)；下面给一些重点。

条件概率链式法则：
$$
P(X_1, X_2, ..., X_n) = P(X_n | X_1, X_2, ..., X_{n-1}) P(X_1, X_2, ..., X_{n-1})
$$

条件贝叶斯公式，即贝叶斯公式全部加一个条件：
$$
\underbrace{P(Y \mid X, e)}_{\text{后验}} = \frac{ \overbrace{P(X \mid Y, e)}^{\text{似然(在e下)}} \cdot \overbrace{P(Y \mid e)}^{\text{先验(在e下)}}}{\underbrace{P(X \mid e)}_{\text{边际(在e下)}}}
$$

没啥好说的，最笨的方法就是直接算。如果联合概率不包括所有节点，就加上并积掉。这个过程最麻烦的是算分母的归一化因子，因为还得把 $Y$ 积掉。

## 5. 决策树计算特征选取
大二下的《模式识别》课学过。首先重温一下算法原理——信息增益。

假设二分类，训练过程中，某个分支下，有a个正例，b个反例，一共 $ S=a+b $ 个，此时信息熵为
$$
\begin{align*}
H_0 &= -\sum_{c=0}^{2} p_c \cdot \log(p_c) \\
    &= -\frac{a}{S} \log\left(\frac{a}{S}\right) - \frac{b}{S} \log\left(\frac{b}{S}\right)
\end{align*}
$$
这里是一坨数据中正例和反例混在一起的熵。下面进行一次分类，选中某个分类指标，假设是布尔量（直接硬分类），则将 $S$ 个数据分为两垛：T垛有c个正例和d个反例，F垛有e个正例和f个反例。显然，
$$
c+e=a \\
d+f=b \\
c+e+d+f=S
$$

这两垛的信息熵分别为：
$$
\begin{align*}
H_T &= -\frac{c}{c+d} \log\frac{c}{c+d} - \frac{d}{c+d} \log\frac{d}{c+d} \\
H_F &= -\frac{e}{e+f} \log\frac{e}{e+f} - \frac{f}{e+f} \log\frac{f}{e+f}
\end{align*}
$$

然后，书上定义此时整个节点的信息熵为两垛期望值，而信息增益就是求差：
$$
\begin{align*}
H_1 &= E[H_{sub}] = \frac{c+d}{S} H_T + \frac{e+f}{S} H_F \\
&= -\frac{c}{S} \log\frac{c}{c+d} -\frac{d}{S} \log\frac{d}{c+d} - \frac{e}{S} \log\frac{e}{e+f} - \frac{f}{S} \log\frac{f}{e+f} \\

\Delta H &= H_0 - H_1
\end{align*}
$$

困惑！$ H_1 $ 的计算和熵的定义完全不一样的：熵为子分支熵的期望？展开后也不是"$p\log p$"的样子，为什么可以叫做熵？如何理解？（作为一个本科信息工程的学生表示非常不舒服！$ H_1 $ 根本不是熵！）

其实这里应该从“信息增益的期望”开始，而不是先求“熵的期望”再算信息增益。考虑如下情况：

假设我们就用这个属性为分类指标。在某一次推理中，样本的这个指标为真，所以我们进入了T分支，此时我们面对的信息复杂度就是 $H_T$，相比进入分支前，减少了这么多信息熵：
$$
\Delta H_T = H_0 - H_T
$$

而我们进入这个分支的概率是 $ \frac{c+d}{S} $ （理想情况下训练集很大，根据大数定律，训练集的分布足以代表实际数据的分布，所以可以用训练集的频率代替概率）。如果进入的是F分支，也同理。

此时算信息增益的期望就合理多了——衡量信息增益的平均水平：
$$
\begin{align*}
\Delta H &= E[\Delta H_{sub}]\\
&= \frac{c+d}{S} (H_0 - H_T) + \frac{e+f}{S} (H_0 - H_F) \\
&= H_0 - (\frac{c+d}{S} H_T + \frac{e+f}{S} H_F)\\
&= H_0 - E[H_{sub}]
\end{align*}
$$

舒坦！

注意，**信息增益选择属性只是一种启发式算法**，并不意味着得到的是最优的决策树；直接遍历所有可能的决策树、以错误率选择才是最优的。对于层数较少的情况，可以用这个方式；但对于层数较多的情况，直接遍历所有可能的决策树是 NP-hard 的，所以只能用启发式算法来选择属性了。

## 6. Adaboost 算法
根据数据和数据的权重，训练一个弱分类器，根据其“错误率”计算分类器权重，更新样本权重（被正确分类的样本权重降低，被错误分类的样本权重提高），重复上述过程；最终的强分类器是弱分类器的加权组合。
### 0. 初始化样本权重
每个样本的权重初始化为 $ \frac{1}{n} $（一视同仁），其中 $ n $ 是样本总数。

### 1. 训练弱分类器
一般用一层的决策树（决策树桩）作为弱分类器。由于只有一层，遍历所有可能的属性、选择误差最小的。训练时考虑样本权重，即在计算误差时加权。

### 2. 计算分类器权重
错误率 $ \epsilon $ 是被分错类别的样本的权重之和，分类器权重为 $ \alpha = \frac{1}{2} \ln\left(\frac{1 - \epsilon}{\epsilon}\right) $
观察此函数：
- 在 $(0, 1)$ 内递减，从 $ +\infty $ 递减到 $ -\infty $；
- 在 $ \epsilon = 0.5 $ 时，$ \alpha = 0 $

如果 $ \epsilon > 0.5 $，可以把预测结果反过来，错误率变为 $ 1 - \epsilon $，使得 $ \alpha > 0 $。

为什么是这个公式呢？

原始目标是对每个分类器最小化下述损失函数：
$$
L = \sum_{i=1}^n w_i e^{-y_i \alpha h(x_i)} = e^\alpha \sum_{i=1}^n w_i e^{-y_i h(x_i)}
$$
其中 $ w_i $ 是样本权重，$ y_i $ 是样本的真实标签（$ \pm 1 $），$ h(x_i) $ 是弱分类器的预测结果（$ \pm 1 $）。

可以将损失函数重写为：
$$
L = e^{-\alpha} \sum_{i=1}^n w_i \mathbb{I}(h(x_i) = y_i) + e^{\alpha} \sum_{i=1}^n w_i \mathbb{I}(h(x_i) \neq y_i)
$$
为了最小化损失函数，对 $ \alpha $ 求导并设置为0：
$$
\begin{aligned}\frac{\partial L}{\partial \alpha} &= -e^{-\alpha} \sum_{i=1}^n w_i \mathbb{I}(h(x_i) = y_i) + e^{\alpha} \sum_{i=1}^n w_i \mathbb{I}(h(x_i) \neq y_i) = 0 \\
\Rightarrow e^{2\alpha} &= \frac{\sum_{i=1}^n w_i \mathbb{I}(h(x_i) \neq y_i)}{\sum_{i=1}^n w_i \mathbb{I}(h(x_i) = y_i)} = \frac{\epsilon}{1 - \epsilon} \\
\Rightarrow \alpha &= \frac{1}{2} \ln\left(\frac{1 - \epsilon}{\epsilon}\right)
\end{aligned}
$$
加权错误率 $ \epsilon = \frac{\sum_{i=1}^n w_i \mathbb{I}(h(x_i) \neq y_i)}{\sum_{i=1}^n w_i} = \sum_{i=1}^n w_i \mathbb{I}(h(x_i) \neq y_i) $，利用了权重的归一化性质。

### 3. 更新样本权重
正确分类的样本权重乘以 $ e^{-\alpha} $，错误分类的样本权重乘以 $ e^{\alpha} $，然后归一化（权重求和为1）。
重复上述过程，直到达到预设的弱分类器数量或错误率满足要求。

### 4. 最终强分类器
最终的强分类器是弱分类器的加权组合：
$$
H(x) = \text{sign}\left(\sum_{t=1}^T \alpha_t h_t(x)\right)
$$
由于是分类问题，因此分类器权重不需要归一化。

## 7. 基本线性代数、矩阵、概率计算方法
求特征值：
对非零向量 $ x $ 和标量 $ \lambda $：
$$
Ax = \lambda x \\
\Rightarrow (A - \lambda I)x = 0 \\
$$
由于 $x$ 非零，因此 $A - \lambda I$ 的行列式为0：
$$
\det(A - \lambda I) = 0
$$
解这个方程就可以得到特征值 $\lambda$，再代入就可以求出对应的特征向量 $x$。

求行列式：代数余子式展开 或 特征值乘积。后者用变换法可以避免求出每个特征值、直接得到乘积。
行变换相当于左乘，一般会改变特征值，行列式有规律：
- 交换两行：特征值乘以 $ -1 $；
- 将一行乘以 $ k $：特征值乘以 $ k $；
- 将一行加到另一行：特征值不变。

行变换后得到一个上三角矩阵，此时矩阵的特征值就是对角线，虽然和之前不一样，但是乘积不变。