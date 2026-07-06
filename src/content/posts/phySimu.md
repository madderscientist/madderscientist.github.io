---
title: 物理仿真的基本知识
description: 学习 mujoco 时需要了解的物理知识
pubDate: 2026-06-27
updatedDate: 2026-07-06
tags: [理论, 仿真, mujoco]
---


## 转动的物理计算
### 从力矩说起
“力矩”的定义是**相对于“点”的，而不是“轴”**。这暗示了力矩的方向并不总是沿着转轴。比如 $(1,0,1)$ 处有一个质量为1的质点，绕 z轴 逆时针旋转，则其相对于原点的力矩为 $\alpha(-1, 0, 1)$，可以看到除了轴向，还有一个 $-x$ 方向的分量。反作用力说明原点在此刻有一个向右的力矩，如果转轴和地面（不会动，可以提供任意力）在原点处通过一个铰链连接，启动时（从0加速）会看到轴杆向 $-y$ 偏转。但如果轴杆在 $(0,0,1)$ 处通过铰链和地面连接，铰链点算出来就只有轴向力矩，所以不会偏转。虽然也会受到向 $+x$ 的力，但这个力过轴，无力矩。

这个不沿着轴向的力矩的朝向和物体的位置有关，而轴向的力矩始终沿着转轴——这就是电机要提供的力矩。所以**计算电机的理论输出只需要考虑轴向的力矩**，即投影到轴向。可以先算出总的力矩，再投影到轴向（更通用的方法）；也可以算的时候就只在投影平面上算（高中物竞的做法）。

### 转动惯性张量推导
做物理仿真需要计算力矩，但是算力矩需要的转动惯量和质量分布、参考点的位置都有关。一方面质量分布没法存，另一方面每次根据质量分布算转动惯量也很麻烦。有没有什么解决方法？那就是**转动惯性张量 $I$**。它是一个3x3的矩阵，描述了物体在各个方向上的转动惯量。以前学物理时算转动惯量只算了沿着某个轴的，这里拓展到相对于某个点、任意方向。具体推导如下：

- 角加速度和线加速度的关系：$\vec{a} = \vec{\alpha} \times \vec{r}$

- 力矩 $\vec{\tau} = \vec{r} \times \vec{F} = \vec{r} \times m \vec{a} = m \cdot (\vec{r} \times (\alpha \times \vec{r})) = m \cdot (\vec{r} \times \alpha \times \vec{r})$ （叉乘点乘都不满足结合律，但是这里恰好相等）
如果先投影后算，这里的 $\vec{r}$ 就是转轴到质点的位移；否则就是参考点到质点的位移

- [带入计算：](https://zhuanlan.zhihu.com/p/672567095)$\vec{r} \times \alpha \times \vec{r} = \begin{bmatrix} r_y^2 + r_z^2 & -r_x r_y & -r_x r_z \\ -r_x r_y & r_x^2 + r_z^2 & -r_y r_z \\ -r_x r_z & -r_y r_z & r_x^2 + r_y^2 \end{bmatrix} \begin{bmatrix} \alpha_x \\ \alpha_y \\ \alpha_z \end{bmatrix} = (\vec{r}^T\vec{r}E-\vec{r}\vec{r}^T)\vec{\alpha}$

- 记上面这个矩阵为 $M$，对于微元（单质点） $dm$ 的惯性张量就是 $dI = M dm$。积分就能得到整个物体的惯性张量 $I = \int dI = \int M dm$

- 力矩 $\vec{\tau} = I \cdot \vec{\alpha}$，好比 $\vec{F} = (m \cdot E) \cdot \vec{a}$

可以看到 $I$ 的取值和坐标系有关。已知一种坐标系下的 $I$，如何推理出任意坐标系下的 $I$ 呢？坐标系变换可以视为先旋转再平移（不考虑空间变形）：
- 旋转：即坐标乘以一个 旋转矩阵 $R$，则 $\vec{r}' = R\vec{r}$，所以
    $$I' = \int (R\vec{r})^T(R\vec{r})E - (R\vec{r})(R\vec{r})^T dm = R \int \vec{r}^T\vec{r}E - \vec{r}\vec{r}^T dm R^T = RIR^T$$
- 平移：即坐标加上一个平移向量 $\vec{d}$，则 $\vec{r}' = \vec{r} + \vec{d}$，所以
    $$I' = \int (\vec{r} + \vec{d})^T(\vec{r} + \vec{d})E - (\vec{r} + \vec{d})(\vec{r} + \vec{d})^T dm = I + m(\vec{d}^T\vec{d}E - \vec{d}\vec{d}^T)$$

已知某坐标系下物体的 $I_0$，要求绕某个点的力矩，更实际的做法为：
1. 在 $I_0$ 的定义坐标系下，直接平移算转动惯量，然后算出力矩（向量）
2. 将力矩进行旋转对齐到观察坐标系（不要理解为 $I$ 的旋转；仅仅是力矩的坐标变换）

mujoco 中就是用 `<inertial>` 定义了 $I$。值得注意的是 `diaginertia` 可以只写对角线；这意味着其他位置都是0。由于 $I$ 是对称矩阵，进行特征分解后一定长这样：$I = R^T diag(\lambda_1, \lambda_2, \lambda_3) R$，其中 $R$ 是旋转矩阵。根据上面的旋转变换公式，相当于只要进行旋转就可以得到一个只有对角线的 $I'$。此时的方向（特征向量）叫做**惯性主轴**，三个值叫做**惯性主轴转动惯量**。仅当 $\alpha$ 的方向为某个惯性主轴时，力矩才和角加速度同向（特征值的含义）。

### 惯性张量的其他用途：角动量和角速度
用来实现角动量 ($J$) 和角速度 ($\vec{\omega}$) 的转换。下面考虑微元 $dm$ 的角动量：
$$
dJ = \vec{r} \times \vec{v} dm = \vec{r} \times (\vec{\omega} \times \vec{r})dm = (\vec{r} \times (\vec{\omega} \times \vec{r}))dm
$$
这里又出现了 $\vec{r} \times (\vec{\text{?}} \times \vec{r})$ 的形式，由上面的推导可知，可以变为 $(M \cdot \vec{\text{?}})$；再从微元积分得到整个物体的角动量：
$$
J = \int dJ = \int M dm \cdot \vec{\omega} = I \cdot \vec{\omega}
$$

### 基础的物理运动计算
复习一下物理。无阻力情况下，给某物体某个位置施加一个冲量 $p$，如何求解之后的运动状态？

首先看成质点，用动量定理求平动速度：$v = \frac{p}{m}$。然后算绕质心的转动。先计算转动张量 $I$，然后算角速度 $\omega = I^{-1} \cdot J$，其中 $J = r \times p$ 是角动量。最后根据速度和角速度更新位置和姿态。

为什么计算转动时算的是绕质点的？最重要的原因是省去了惯性力矩。

如果有约束，比如绕某个轴，直接以该轴算转动即可，不用管质心。注意，此时杆子会给予动量，因此不能用质点的动量定理算瞬时速度、再算角速度。


## 四元数和旋转
[这里](https://krasjet.github.io/quaternion/quaternion.pdf)讲的很清楚，下面是精练版。

### 三维空间旋转推导
先沿着转轴 $\vec{n}$（限定为单位长度）将待旋转分量 $\vec{x}$ 分解为平行分量 $\vec{x}_\parallel$ 和正交分量 $\vec{x}_\perp$：
$$
\begin{aligned}
\vec{x}_\parallel &= (\vec{x} \cdot \vec{n}) \vec{n}\\
\vec{x}_\perp &= \vec{x} - \vec{x}_\parallel
\end{aligned}
$$

只要表示出垂直分量旋转后的新垂直分量 $\vec{x}_\perp'$，就能得到旋转后的向量 $\vec{x}' = \vec{x}_\parallel + \vec{x}_\perp'$。垂直分量的旋转在 $\vec{n}$ 的垂直平面中进行，要表示这个平面内的向量，需要两个正交基，那就选择 $\vec{x}_\perp$ 和 $(\vec{n} \times \vec{x})$ （利用了叉乘的性质）。假设 $\vec{x}$ 和 $\vec{n}$ 的夹角为 $\theta$，则旋转 $\alpha$ 后 $\vec{x}_\perp'$ 的长度保持为 $\|\vec{x}_\perp\| = \|\vec{x}\|\sin\theta$，将两个正交基归一化并投影后可以得到公式：
$$
\begin{aligned}
\vec{x}_\perp' &= \|\vec{x}_\perp\| \cdot (\cos\alpha \cdot \frac{\vec{x}_\perp}{\|\vec{x}_\perp\|} + \sin\alpha \cdot \frac{\vec{n} \times \vec{x}}{\|\vec{n} \times \vec{x}\|})\\
&= \cos\alpha \cdot \vec{x}_\perp + \sin\alpha \cdot \frac{\|\vec{x}_\perp\|}{\|\vec{n} \times \vec{x}\|} \cdot (\vec{n} \times \vec{x})\\
&= \cos\alpha \cdot \vec{x}_\perp + \sin\alpha \cdot (\vec{n} \times \vec{x})
\end{aligned}
$$

这个过程中把 $sin\theta$ 消去了。最终可以改写为矩阵的形式（略）

### 用四元数表示
四元数最少的定义：
- 形式：$q = w + xi + yj + zk$
- 虚数单位：$i^2 = j^2 = k^2 = ijk = -1$

表示三维空间的点时，让实部为0，虚部系数为三维坐标。

绕轴 $\vec{n}$（单位向量）旋转 $\alpha$ 的四元数为：
$$
q = \cos\left(\frac{\alpha}{2}\right) + \mathbf{n} \sin\frac{\alpha}{2}
$$
此处 $\mathbf{n}$ 是 $\vec{n}$ 的四元数表示。将此旋转作用到向量 $\vec{x}$ 的结果为：
$$
\mathbf{x}' = q \mathbf{x} q^{-1}
$$

这个“夹心”的形式很眼熟：用矩阵描述空间变换也有类似的形式：$R = M R_{\text{轴}} M^{-1}$。不过矩阵作用的是变换本身，改变的是观察的坐标系，而四元数直接作用在向量上。

为什么用四元数？可以解决欧拉角的万向锁问题和插值问题、参数比矩阵少。虽然自由度都是3，但四元数比欧拉角多一个维度，避免了奇点，天然平滑。在实际引擎中三者都有使用：
- 美术/策划用欧拉角调参数（因为看得懂）。
- 底层运算（骨骼插值、姿态计算）用四元数（因为平滑高效）。
- 最终送入GPU渲染前，把四元数转成旋转矩阵（因为显卡只认矩阵）。

## 约束求解
[Mujoco Computation 文档](https://mujoco.readthedocs.io/en/stable/computation/index.html) 的开篇就提到了“LCP”——线性互补问题（Linear Complementarity Problem）。这里主要讲怎么将约束问题转变为LCP问题。

### LCP 问题的定义
一维线性互补问题：
$$
\begin{aligned}
y = ax + b\\
y \ge 0, x \ge 0\\
xy = 0
\end{aligned}
$$
显然解为直线在两个坐标轴上的交点。

高维线性互补问题：
$$
\begin{aligned}
\vec{y} = \mathbf{A}\vec{x} + \vec{b}\\
\vec{y} \ge \vec{0}, \vec{x} \ge \vec{0}\\
\vec{x}^T \vec{y} = 0
\end{aligned}
$$

怎么高效求解就不学了。

### 约束问题
已知当前时刻的速度 $\vec{v}_t$，根据牛二，下一时刻的速度为：
$$
\vec{v}_{A,t+1} = \vec{v}_{A,t} + \Delta t \cdot \vec{a} = \vec{v}_{A,t} + \Delta t \cdot \frac{\vec{f}_{ext,A} - \vec{f}_{contact}}{m_A}
$$
$$
\vec{v}_{B,t+1} = \vec{v}_{B,t} + \Delta t \cdot \vec{a} = \vec{v}_{B,t} + \Delta t \cdot \frac{\vec{f}_{ext,B} + \vec{f}_{contact}}{m_B}
$$
这里只考虑一维情况下的接触问题，不考虑旋转。

接触力 $\vec{f}_{contact}$ 必须遵循两个物理规则：
1. 每个物体上的法向力 $\vec{f}_n$ 必须指向物体内部，定义这个方向为正，则 $f_n \ge 0$，也就是只能推，不能拉。
下面定义接触法向 $\vec{n}$ 为 A 指向 B，则 A 受到的法向力为 $-f_n \vec{n}$，B 受到的法向力为 $f_n \vec{n}$。
2. 切向力 $\vec{f}_t$ 必须满足摩擦定律：$\|\vec{f}_t\| \le \mu \|\vec{f}_n\|$。这是非线性的，这里先不考虑。

物体（只考虑刚体）之间的接触间隙 $\phi$ 必须满足 $\phi \ge 0$，也就是不能穿透。

$\phi$ 和 $\vec{f}_n$ 的关系是互补的：如果 $\phi > 0$，则 $\vec{f}_n = 0$；如果 $\vec{f}_n > 0$，则 $\phi = 0$。也就是：
$$
\phi \ge 0, f_n \ge 0, \phi \cdot f_n = 0
$$

接触间隙的变化公式如下：
$$
\begin{aligned}
\phi_{t+1}&= \phi_t + \Delta t \cdot (\vec{v}_{B,t+1} - \vec{v}_{A,t+1})^T \vec{n} \\
&= \phi_t + \Delta t \cdot (\vec{v}_{B,t} - \vec{v}_{A,t})^T \vec{n} + \Delta t^2 \cdot (\frac{\vec{f}_{ext,B} + \vec{f}_{contact}}{m_B} - \frac{\vec{f}_{ext,A} - \vec{f}_{contact}}{m_A})^T \vec{n}\\
&= \phi_t + \Delta t \cdot (\vec{v}_{B,t} - \vec{v}_{A,t})^T \vec{n} + \Delta t^2 \cdot (\frac{\vec{f}_{ext,B}}{m_B} - \frac{\vec{f}_{ext,A}}{m_A})^T \vec{n} + \Delta t^2 \cdot (\frac{1}{m_A} + \frac{1}{m_B}) f_n \\
&= b + a f_n
\end{aligned}
$$

此时可以看到有线性关系。对于系数 $a$，当一方无法移动时，只要定义质量无穷大，此时 $\frac{1}{m} = 0$。

这样就凑成了一个 LCP 问题。用求解器可以算出 $f_n$，再代入上面的公式就能算出下一时刻的速度。

加上了转动也就是改变一下接触点的速度公式。

多物体、多接触点，系数 $a$ 变成了矩阵 $A$，非对角元素就体现了“别的接触点对本接触的外力影响”。这个矩阵好复杂，不过实际求解也不会直接构造这个矩阵，而是通过物理规则绕过。