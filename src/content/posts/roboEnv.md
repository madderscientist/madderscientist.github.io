---
title: 机器人学习工具初探
description: 2026春学期对机器人研究工具的探索总结，工具包括 ROS2、Unitree Go2、Mujoco与MJLAB仿真框架，内容涵盖WSL2环境配置、ROS2安装调试、宇树机器人SDK桥接、Go2站立控制PD原理、Mujoco模型构建（含UR5e机械臂擦黑板案例）及MJLAB强化学习踩坑记录
pubDate: 2026-06-26
tags: [机器人, 仿真]
---

# WSL 配置
由于电脑网卡驱动没有Linux版本，只能在 WSL2 下用了。
## 代理
WSL setting 里设置 mirror 和自动代理，clash 用 TUN 模式

## GPU（仿真用）
```sh title="~/.bashrc"
export GALLIUM_DRIVER=d3d12
```

# ROS2 配置
## ROS2安装
直接上现成的安装脚本：
```bash
source <(wget -qO- http://fishros.com/install)
```
安装在 `/opt/ros/${distro}/`

> **问：为什么 `ros2 topic list -t` 在没运行 ros node 的时候也有输出？**
> 
> `ros2 topic list` 会启动一个临时节点用于获取信息，而节点一启动就会有这两个。
> 此时运行 `ps aux | grep -E "(ros|dds|fastrtps|cyclone|rmw)" | grep -v grep` 会发现有后台进程，就是这个命令导致的，目的是下次相应更快
> 可以用 `ros2 topic list --no-daemon` 防止该后台进程被守护。

## C++ 编译
VSCode 需要配置 includePath。增加 ros2 的库：`/opt/ros/${distro}/include/**`

实际编译的时候需要找库
- `-I` 处理缺失的头文件
- `-L` 处理缺少的链接库

这一部分当初做了记录：[关于Linux C语言](/everylearn/#2026-03-16-everylearn:102)；更多C++相关的直接看鱼香ROS的教程：[《使用gcc编译ROS2节点》](https://fishros.com/d2lros2/#/humble/chapt2/basic/1.%E4%BD%BF%E7%94%A8gcc%E7%BC%96%E8%AF%91ROS2%E8%8A%82%E7%82%B9)

## python 配置
向 `python.analysis.extraPaths `添加 `/opt/ros/${distro}/lib/python3.12/site-packages/`

运行 ros 代码不需要虚拟环境，只需要 `source` 一下就可以得到运行环境，原理是将 ros2 的 python 包路径加入到 `sys.path` 中、使 `import` 可以找到，和 `venv` 的做法一样。


# Unitree 宇树机器人
- `unitree-sdk2` 独立于 ROS，底层也是 DDS 通信，直接控制，和 ROS 一点关系没有
- `unitree-ros2` 是将机器人接入 ROS，可以用 ROS 那一套来控制

vscode的python配置：
```json title="~/.vscode/settings.json"
{
    "ROS2.distro": "humble",
    "python.autoComplete.extraPaths": [
        "/opt/ros/humble/lib/python3.10/site-packages",
        "/opt/ros/humble/local/lib/python3.10/dist-packages"
    ],
    "python.analysis.extraPaths": [
        "/opt/ros/humble/lib/python3.12/site-packages/",
        "./unitree_ros2/install/unitree_go/local/lib/python3.10/dist-packages",
        "./unitree_ros2/install/unitree_api/local/lib/python3.10/dist-packages",
        "./unitree_ros2/install/unitree_hg/local/lib/python3.10/dist-packages"
    ],
    "python.analysis.typeCheckingMode": "off"   // 库代码很多都会有类型检查报错
}
```

## unitree_ros2
`unitree_ros2` 只定义了消息结构，一切c代码都是 `rosidl_generate_interfaces` 自动生成的。

`RCLCPP_INFO` 相当于 `print`，但是会发布到 `rosout` 这个 topic，且有多种等级（可过滤），还自动包含时间戳、节点名称、文件名、行号，还有很多别的功能。

`/unitree_sdk2/include/unitree/dds_wrapper/robots/go2/go2_pub.h` 定义了 lowstate 的具体发布。由于 sdk 发布消息走独立的 CycloneDDS，没有经过 ROS，因此 `ros2 topic list` 看不到，但是由于底层也是 DDS，因此可以接收到。


## [unitree_mujoco](https://github.com/unitreerobotics/unitree_mujoco#) 仿真
总结仿真器遇到的问题和解决：
1. 编译 `unitree-mujoco` 依赖 `unitree-sdk2`
2. mujoco 得用文档里要求的老版本（3.3.6）; `pip install mujoco` 安装的是独立的 mujoco
3. 运行 mujoco 发现报错，详见 [unitree_mujoco/issues/103](https://github.com/unitreerobotics/unitree_mujoco/issues/103)
4. 运行后发现卡顿，是因为 WSL2 没有启用 `d3d12`，详见 [unitree_mujoco/issues/104](https://github.com/unitreerobotics/unitree_mujoco/issues/104)，做法[见上](#gpu仿真用)。
5. 编译 ROS 包报错找不到，是因为没有将 ROS 里面机器人的包暴露出来，需要 `source` 一下。和 sdk 无关

`python_sdk2` 似乎可以不装，mujoco 的 python 控制才要。但是在已经有 ros 的情况下，可以写 ros 的 python（见[后文](#启动仿真的流程)），不需要 sdk 的 python。所以不管 python 仿真了；下面基于 C++ 进行。

Mujoco 只负责物理，bridge 承担了其余一切，包括从 mujoco 中读取数据并整理成规定的消息 (在 `/unitree_mujoco/simulate/src/unitree_sdk2_bridge.h > RobotBridge::run` 中实现了对 mujoco 信息的收集、接收数据并发送给 mujoco、以及 DDS 话题的管理)。

仿真器话题**发布**：
- `rt/lowstate`
- `rt/sportmodestate`
- `rt/wirelesscontroller`（手柄状态）

**接收**：`rt/lowcmd`

### 控制原理
机器狗Go2站立的控制：
```cpp title="/unitree_mujoco/simulate/src/unitree_sdk2_bridge.h > RobotBridge::run"
for(int i(0); i<num_motor_; i++) {
    auto & m = lowcmd->msg_.motor_cmd()[i];
    mj_data_->ctrl[i] = m.tau() +
                        m.kp() * (m.q() - mj_data_->sensordata[i]) +
                        m.kd() * (m.dq() - mj_data_->sensordata[i + num_motor_]);
}
```
就是个PD控制器，输出为力矩。但是PD控制的D是对误差求导，应该没有常数项了。视为 **“位置P控制 并联 速度P控制”** 也许更合适。
没有积分项。因为不希望力一直积攒，这会损坏硬件。为了柔顺所以放弃了。

首先要理解各个参数的含义。`lowcmd` 是接收量，定义如下（摘自[官方：底层服务接口](https://support.unitree.com/home/zh/developer/Basic_services)）：
```cpp
struct LowCmd_ {
    octet head[2];             //帧头，数据校验用（0xFE,0xEF）
    
    octet level_flag;          //保留，目前不用
    octet frame_reserve;       //保留，目前不用
    unsigned long sn[2];       //保留，目前不用
    unsigned long version[2];  //保留，目前不用
    unsigned short bandwidth;  //保留，目前不用
      
    // FR_0 -> 0 , FR_1 -> 1  , FR_2 -> 2   电机控制顺序，目前只用12电机，后面保留
    // FL_0 -> 3 , FL_1 -> 4  , FL_2 -> 5
    // RR_0 -> 6 , RR_1 -> 7  , RR_2 -> 8
    // RL_0 -> 9 , RL_1 -> 10 , RL_2 -> 11
    unitree_go::msg::dds_::MotorCmd_ motor_cmd[20];   //电机控制命令数据
    unitree_go::msg::dds_::BmsCmd_ bms_cmd;           //电池控制命令数据

    octet wireless_remote[40];  //保留，目前不用
    octet led[12];              //已经改为内部控制，目前不用
    octet fan[2];               //已经改为内部控制，目前不用
    
    // &0xFE          自动充电打开             ,  |0x01       自动充电关闭
    // &0xFD          12个电机的电源开关打开    ,  |0x02       12个电机的电源开关关闭
    octet gpio;
      
    unsigned long reserve;  //保留位
    unsigned long crc;      //数据CRC校验用,为32crc校验用
};
```

其中 `motor_cmd` 的定义如下：
```c
uint8 mode;  // 电机控制模式 Foc模式（工作模式）-> 0x01 ，stop模式（待机模式）-> 0x00
float32 q;   // 关节目标位置 (rad)
float32 dq;  // 关节目标速度 (rad/s)
float32 tau; // 关节目标力矩 (N·m)
float32 kp;  // 关节刚度系数
float32 kd;  // 关节阻尼系数
unsigned long reserve[3];   //保留位
```
FOC 电流环的输入是参考电流，和实际力矩成正比。根据官方文档，这里 `tau` 就是力矩，内部转换成电流了。一般的 PMSM 电机都会给出这个参数。最终输出的 `ctrl` 就是 mujoco 要的力矩。

在知道参数含义后，根据控制代码可以列出方程:
$$
\begin{aligned}
m \ddot{x} &= \tau + k_p(x_t - x) + k_d(\dot{x}_t - \dot{x}) \\
m \ddot{x} + k_d \dot{x} + k_p x &= \tau +  k_p x_t +  k_d \dot{x}_t
\end{aligned}
$$
其中，$m$ 为转动惯量，对于非末端的关节，和姿态有关，很复杂。下面假设转动惯量为常数。$x$ 为 mujoco 中的关节角度。下标 $t$ 表示目标值。

**特解：**
假设稳态时速度不为0，则位置误差会随时间线性增加，导致方程不平衡。因此速度一定为0，此时加速度也为0。解得：
$$ x_{steady} = x_t + \frac{\tau}{k_p} + \frac{k_d}{k_p}\dot{x}_t $$
这说明 $\tau$ 和 $\dot{x}_t$ 的存在会让稳态偏离期望位置。所以官方 Go2 站立的代码里，这两项都是0。

**通解：**
$$
m \lambda^2 + k_d \lambda + k_p = 0 \\
\lambda_{1,2} = \frac{-k_d \pm \sqrt{k_d^2 - 4mk_p}}{2m} \\
$$
根据阻尼系数 $k_d$ 的大小，系统会有三种表现：
1.  **欠阻尼 ($k_d^2 < 4mk_p$)**：根是复数。震荡着接近目标值
2.  **过阻尼 ($k_d^2 > 4mk_p$)**：根是两个负实数。缓慢地爬向目标值，不会超调
3.  **临界阻尼 ($k_d^2 = 4mk_p$)**：根是两个相等的负实数。最快速度到达目标值

**最终解：**
$$
x = x_{steady} + \sum_i C_i e^{\lambda_i t}
$$
其中 $C_i$ 取值由初始状态决定。

<hr>

上文是如何从接收到的控制信号变为 mj 的控制。设置下一帧 mj 后，需要读取当前的 mj 状态用于反馈。反馈信息的部分定义如下：

```c title="/unitree_ros2/cyclonedds_ws/src/unitree/unitree_hg/msg/MotorState.msg"
uint8 mode      // 运动模式
float32 q       // 当前角度
float32 dq      // 当前角速度
float32 ddq     // 当前角加速度
float32 tau_est // 估计的外力
float32 q_raw   // 当前角度原始数值
float32 dq_raw  // 当前角速度原始数值
float32 ddq_raw // 当前角加速度原始数值
int8 temperature// 温度
uint32 lost
uint32[2] reserve
```

`RobotBridge::run` 的后半部分可以看到大量 `lowstate->msg_.xxx()[] =  mj_data_->xxx[]` 这样的赋值代码；最终 `lowstate` 被发布出去。


### 启动仿真的流程
SDK 太不通用，但 ROS 用 C++ 也太麻烦了。于是根据官方代码写了 python ROS2 的 Go2 站立控制脚本。

一个终端运行 mujoco ↓
```sh title="terminal 1"
# remove `/opt/ros/humble/lib/x86_64-linux-gnu` from LD_LIBRARY_PATH
# https://github.com/unitreerobotics/unitree_mujoco/issues/103
export LD_LIBRARY_PATH=/opt/ros/humble/opt/rviz_ogre_vendor/lib:/opt/ros/humble/opt/gz_math_vendor/lib:/opt/ros/humble/opt/gz_utils_vendor/lib:/opt/ros/humble/opt/gz_cmake_vendor/lib:/opt/ros/humble/lib
# Run mujoco
~/unitree/unitree_mujoco/simulate/build/unitree_mujoco
```

另一个终端运行 ros 控制 ↓
```sh title="terminal 2"
# source ~/unitree/unitree_ros2/install/setup.sh 可省，被下一个脚本覆盖到了
source ~/unitree/unitree_ros2/setup_local.sh
python stand_go2_ros.py
```

其中，`setup_local.sh` 的内容如下（修改了原来的）：
```sh
#!/bin/bash
echo "Setup unitree ros2 simulation environment"
source /opt/ros/humble/setup.bash
# source $HOME/unitree/unitree_ros2/cyclonedds_ws/install/setup.bash 用ROS2自带的DDS
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export CYCLONEDDS_URI='<CycloneDDS><Domain><General><Interfaces>
                            <NetworkInterface name="lo" priority="default" multicast="default" />
                        </Interfaces></General></Domain></CycloneDDS>'
# 仿真需要特殊设置 ROS_DOMAIN_ID
export ROS_DOMAIN_ID=1
# 进入install目录激活 即 source ~/unitree/unitree_ros2/install/setup.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/install/setup.sh" ]; then
    source "$SCRIPT_DIR/install/setup.sh"
else
    echo "Warning: $SCRIPT_DIR/install/setup.sh not found."
fi
```

`stand_go2_ros.py` 的内容如下：
```py
import rclpy
from rclpy.node import Node
from rclpy.executors import SingleThreadedExecutor
from unitree_go.msg import LowCmd, MotorCmd
import numpy as np
import time

class StandGo2Node(Node):
    def __init__(self):
        super().__init__('stand_go2_ros')
        self.publisher_ = self.create_publisher(LowCmd, 'lowcmd', 10)
        self.dt = 0.01  # 控制周期
        self.running_time = 0.0

        # 12个关节目标位置
        self.stand_up_joint_pos = np.array([0.00571868, 0.608813, -1.21763, -0.00571868, 0.608813, -1.21763,
                                            0.00571868, 0.608813, -1.21763, -0.00571868, 0.608813, -1.21763], dtype=float)
        self.stand_down_joint_pos = np.array([0.0473455, 1.22187, -2.44375, -0.0473455, 1.22187, -2.44375,
                                              0.0473455, 1.22187, -2.44375, -0.0473455, 1.22187, -2.44375], dtype=float)

        self.cmd = LowCmd()
        self.init_cmd()

    def init_cmd(self):
        self.cmd.motor_cmd = [MotorCmd() for _ in range(20)]
        for i in range(20):
            self.cmd.motor_cmd[i].mode = 0x01
            self.cmd.motor_cmd[i].q = 0.0
            self.cmd.motor_cmd[i].kp = 0.0
            self.cmd.motor_cmd[i].dq = 0.0
            self.cmd.motor_cmd[i].kd = 0.0
            self.cmd.motor_cmd[i].tau = 0.0

    def step(self):
        """单步控制更新，由外部循环按固定周期调用"""
        # 只在秒数变化时打印，避免刷屏
        if int(self.running_time) != int(self.running_time - self.dt):
            self.get_logger().info(f"Running time: {self.running_time:.1f}s")
        
        if self.running_time < 3.0:
            # 0~3秒：站起
            phase = np.tanh(self.running_time / 1.2)
            for i in range(12):
                self.cmd.motor_cmd[i].q = phase * self.stand_up_joint_pos[i] + (1 - phase) * self.stand_down_joint_pos[i]
                self.cmd.motor_cmd[i].kp = phase * 50.0 + (1 - phase) * 20.0
                self.cmd.motor_cmd[i].dq = 0.0
                self.cmd.motor_cmd[i].kd = 3.5
                self.cmd.motor_cmd[i].tau = 0.0
        else:
            # 3~7秒：蹲下
            phase = np.tanh((self.running_time - 3.0) / 1.2)
            for i in range(12):
                self.cmd.motor_cmd[i].q = phase * self.stand_down_joint_pos[i] + (1 - phase) * self.stand_up_joint_pos[i]
                self.cmd.motor_cmd[i].kp = 50.0
                self.cmd.motor_cmd[i].dq = 0.0
                self.cmd.motor_cmd[i].kd = 3.5
                self.cmd.motor_cmd[i].tau = 0.0
        
        self.publisher_.publish(self.cmd)
        self.running_time += self.dt
        
        return self.running_time < 7.0  # 返回 True 表示继续运行

def main(args=None):
    rclpy.init(args=args)
    node = StandGo2Node()
    executor = SingleThreadedExecutor()
    executor.add_node(node)
    
    dt = node.dt
    last_time = time.perf_counter()
    
    # 手动控制循环
    try:
        while rclpy.ok() and node.step():
            # 立即检查并处理一个就绪的 ROS 回调，如果没有就绪的回调则等一小会
            # 相比于 rclpy.spin_once，executor管理注册的
            executor.spin_once(timeout_sec=dt/2)
            
            # 控制循环频率
            elapsed = time.perf_counter() - last_time
            sleep_time = dt - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
            last_time = time.perf_counter()

    finally:
        node.destroy_node()
        rclpy.shutdown()
        print("Node exited successfully.")

if __name__ == '__main__':
    main()
```

# Mujoco 初探
不依赖宇树和 ROS 写一个简单的控制，[参考](https://blog.csdn.net/Vint_LU/article/details/147948556)。

这里使用 python 版本的 mujoco，需要虚拟环境和对应的包。

## 基本操控
首先拉取仓库 `mujoco_menagerie` 得到机械臂模型。加载：
```py title="sim.py"
import mujoco
import mujoco.viewer
 
def main():
    # 模型和数据分开
    model = mujoco.MjModel.from_xml_path('mujoco_menagerie/universal_robots_ur5e/scene.xml')
    data = mujoco.MjData(model)
 
    with mujoco.viewer.launch_passive(model, data) as viewer:
        while viewer.is_running():
            mujoco.mj_step(model, data) # 更新间隔写在模型里 默认0.002s
            viewer.sync()   # 没有则画面静止

if __name__ == "__main__":
    main()
```

此时会有一个GUI，操作右侧可以改变关节状态。点击左侧的 simulation 的 saveKey 会报错 `ERROR: mj_setKeyframe: keyframe index cannot be negative`，因为上面的 Key 的值是-1，点一下就变成了0，此时就可以保存了。

关于 `MjModel`、`MjData`、`MjSpec`（后面 mjlab 会用到） 的区别：

| 特性 | `MjSpec` (设计师) | `MjModel` (说明书) | `MjData` (运行状态) |
| :--- | :--- | :--- | :--- |
| **核心职责** | 模型的定义、创建和编辑 | 存储**不变**的模型物理参数和结构 | 存储**动态变化**的仿真状态和计算结果 |
| **可变性** | **可读写**。创建后可自由添加、修改元素 | **只读**。编译完成后，其结构不应被修改 | **可读写**。在仿真循环中被不断更新 |
| **产生方式** | 解析XML文件或程序化创建 | 由 `MjSpec` **编译 (compile)** 生成<br>`mujoco.mj_compile(spec, "")` | 基于 `MjModel` **创建 (make)**<br>`mujoco.MjData(model)` |
| **主要用途** | 程序化建模、修改模型、生成XML | 作为物理计算的**静态输入**<br>供所有仿真函数使用 | 存储**仿真循环**中不断变化的量<br>如位置、速度、力等 |

<hr>

操控：
```py
import mujoco.viewer
import time

model = mujoco.MjModel.from_xml_path('mujoco_menagerie/universal_robots_ur5e/scene.xml')
data = mujoco.MjData(model)
data.ctrl[:6] = [-1.57, -1.34, 2.65, -1.3, 1.55, 0]

with mujoco.viewer.launch_passive(model, data) as viewer:
    while viewer.is_running():
        mujoco.mj_step(model, data)
        viewer.sync()
        time.sleep(0.01) # 让动画速度变慢，不然更新太快看不清机械臂的运动过程
```

这里的 `ctrl` 是什么量？在 `scene.xml` 的开头能看到 `<include file="ur5e.xml"/>`，这是模型本体。打开 `ur5e.xml`，看到控制的关节：
```xml title="ur5e.xml"
<compiler angle="radian" meshdir="assets" autolimits="true"/>
...
<actuator>
    <general class="size3" name="shoulder_pan" joint="shoulder_pan_joint"/>
    <general class="size3" name="shoulder_lift" joint="shoulder_lift_joint"/>
    <general class="size3_limited" name="elbow" joint="elbow_joint"/>
    <general class="size1" name="wrist_1" joint="wrist_1_joint"/>
    <general class="size1" name="wrist_2" joint="wrist_2_joint"/>
    <general class="size1" name="wrist_3" joint="wrist_3_joint"/>
</actuator>
```

关节的默认类型是 `hinge`(铰链)，前面又规定了 `radian`，所以控制量是弧度。

`<general>` 是高度可定义的执行器：https://mujoco.readthedocs.io/en/latest/XMLreference.html#actuator-general，前面设置了其余参数：
```xml
<general 
    gaintype="fixed"                → gain_term = gainprm[0]
    biastype="affine"               → bias_term = biasprm[0] + biasprm[1]*length + biasprm[2]*velocity
    ctrlrange="-6.2831 6.2831"      ← 范围 ±2π 弧度（±360°）
    gainprm="2000"                  ← 比例 k = 2000
    biasprm="0 -2000 -400"          ← 偏差 b1 和 b2
    forcerange="-150 150"           ← 最终输出的力矩范围 ±150 Nm
/>
```

这里有一个量 `dyntype` 没有明确，默认是none，表示没有内部激活状态。此时的输出计算是这样的：
$$
F = k u + b_0 + b_1 l + b_2 \dot{l}
$$

$u$ 是输入的 *scalar control*，$k$ 是 `gainprm`，$b_i$ 是 `biasprm`。**$u$ 的含义可以用参数的配置体现**，对于位置控制，通常设置 $k = -b_1$：
$$
F = k (u - l) + b_0 + b_2 \dot{l}
$$
对于速度控制，通常设置 $k = -b_2$：
$$
F = k (u - \dot{l}) + b_0 + b_1 l
$$
所以上面的XML是位置控制，输入的是目标位置。

## 模型结构
Mujoco 的模型由XML定义。在父子结构中，子节点的坐标系是相对于父节点的。这里的黑板擦是 UR5e 末端的子节点，所以它的坐标系是相对于末端的。子坐标系相对于上级的偏移和朝向是由 `<body>` 的 `pos` 和 `quat` 定义的。

`<joint>` 的位置基于子坐标系的原点。比如铰链关节，有一个 `axis` 参数，定义了转轴的方向；转轴绘制出来就是经过子坐标系原点的直线。

`<inertial>` 定义了该 body（不包含其子节点）的惯性属性。

## 擦黑板
首先给原来的机器人末端加上黑板擦：
```xml title="ur5e copy.xml" ins={2-8,10} del={9}
<geom class="eef_collision" pos="0 0.08 0" quat="1 1 0 0" size="0.04 0.02"/>
<!-- 黑板擦软体 -->
<geom name="eraser" type="box" size="0.06 0.03 0.02" pos="0 0.12 0" 
    rgba="0.2 0.2 0.8 0.8" 
    friction="0.8 0.05 0.05"
    solref="0.02 1" solimp="0.9 0.95 0.001"
    mass="0.05" 
    material="black"/>
<site name="attachment_site" pos="0 0.1 0" quat="-1 1 0 0"/>
<site name="attachment_site" pos="0 0.15 0" quat="-1 1 0 0"/>
```

然后写一个有黑板的场景：
```xml title="scene copy.xml"
<mujoco model="ur5e scene">
  <include file="ur5e copy.xml"/>

  <statistic center="0.3 0 0.4" extent="0.8"/>
  <visual>
    <headlight diffuse="0.6 0.6 0.6" ambient="0.1 0.1 0.1" specular="0 0 0"/>
    <rgba haze="0.15 0.25 0.35 1"/>
    <global azimuth="120" elevation="-20"/>
  </visual>

  <asset>
    <texture type="skybox" builtin="gradient" rgb1="0.3 0.5 0.7" rgb2="0 0 0" width="512" height="3072"/>
    <texture type="2d" name="groundplane" builtin="checker" mark="edge" rgb1="0.2 0.3 0.4" rgb2="0.1 0.2 0.3"
      markrgb="0.8 0.8 0.8" width="300" height="300"/>
    <material name="groundplane" texture="groundplane" texuniform="true" texrepeat="5 5" reflectance="0.2"/>
  </asset>

  <worldbody>
    <light pos="0 0 1.5" dir="0 0 -1" directional="true"/>
    <!-- <geom name="floor" size="0 0 0.05" type="plane" material="groundplane"/> -->
    <!-- 竖直黑板 -->
    <geom name="blackboard" type="box" pos="0 0.51 0.6" size="1.0 0.01 0.6" rgba="0.1 0.1 0.1 1"/>

    <!-- 坐标轴 不参与碰撞 -->
    <body name="world_frame" pos="0 0 0">
        <geom name="X" type="cylinder" size="0.005" fromto="0 0 0 0.3 0 0" rgba="1 0 0 1" contype="0"
              conaffinity="0"/>
        <geom name="Y" type="cylinder" size="0.005" fromto="0 0 0 0 0.3 0" rgba="0 1 0 1" contype="0"
              conaffinity="0"/>
        <geom name="Z" type="cylinder" size="0.005" fromto="0 0 0 0 0 0.3" rgba="0 0 1 1" contype="0"
              conaffinity="0"/>
    </body>
  </worldbody>
</mujoco>
```
这里的 `<include>` 实现了模型文件的模块化组合（不是机械的文本拼接）；由于 `<worldbody>` 只能有一个，所以会把 include 的模型的 `worldbody` 和当前文件的 `worldbody` 合并。

注意 `size` 是半径（half-size）。

坐标轴的 `contype="0"` 表示不参与碰撞检测。在 Mujoco 中，`contype` 和 `conaffinity` 是用来定义碰撞组的，`contype` 数值的第 $i$ 个二进制位为1表示属于第 $i$ 个碰撞组，而 `conaffinity` 数值的第 $i$ 个二进制位为1表示可以与第 $i$ 个碰撞组发生碰撞。碰撞发生时，Mujoco 会检查两个物体的 `contype` 和 `conaffinity`，如果它们的**位与**运算结果不为零，则认为它们可以发生碰撞。所以这里设置其中一个为0，就能实现不发生碰撞。

按照参考网页说的使用了IK，但是坐标系不一样，需要绕 z 轴旋转 180°。此外IK还需要用 `urdf` 文件，从参考里面给出的仓库里下载了。基本的思路是每帧设置擦黑板的目标点，然后通过 IK 计算出机械臂的关节角度，最后将关节角度作为控制输入发送给 Mujoco。代码如下：
```py
import mujoco.viewer
import time
import ikpy.chain
import transforms3d as tf
import numpy as np

# URDF和MJ不一样，需要绕Z轴旋转180度
mjrotate = tf.euler.euler2mat(0, 0, 3.14)   # 默认顺序 xyz

def main():
    model = mujoco.MjModel.from_xml_path('mujoco_menagerie/universal_robots_ur5e/scene copy.xml')
    data = mujoco.MjData(model)
    my_chain = ikpy.chain.Chain.from_urdf_file("./ur5e_orig.urdf")

    def get_current_joint_angles(data):
        return [0] + list(data.qpos[0:6]) + [0]

    def get_ik_angle(target_pos, target_euler, ref=None):
        target_pos1 = mjrotate.dot(target_pos)
        target_orientation = mjrotate @ tf.euler.euler2mat(*target_euler)
        joint_angles = my_chain.inverse_kinematics(target_pos1, target_orientation, "all", initial_position=get_current_joint_angles(data) if ref is None else ref)
        return joint_angles[1:-1]

    # 压下去多少 产生压力
    y_offset = -0.05
    # y_offset = 0

    ee_pos0 = np.array([-0.5, 0.4, 1])
    ee_pos1 = np.array([-0.5, 0.5 + y_offset, 1])
    ee_pos2 = np.array([0.5, 0.5 + y_offset, 0.2])
    ee_euler = [0, 0, 1.57]

    n_steps = 50
    # 预计算正向和反向的关节轨迹
    joint_traj_forward = []
    joint_traj_backward = []
    for i in range(n_steps + 1):
        alpha = i / n_steps
        ee_pos_fwd = ee_pos1 * (1 - alpha) + ee_pos2 * alpha
        # 构造ref为8维，头尾补0
        if joint_traj_forward:
            ref_full = [0] + list(joint_traj_forward[-1]) + [0]
        else:
            ref_full = None
        joint_traj_forward.append(get_ik_angle(ee_pos_fwd, ee_euler, ref=ref_full))
    joint_traj_backward = joint_traj_forward[::-1]

    # 先到达ee_pos1
    data.ctrl[:6] = get_ik_angle(ee_pos0, ee_euler)
    with mujoco.viewer.launch_passive(model, data) as viewer:
        for _ in range(300):
            if not viewer.is_running():
                break
            mujoco.mj_step(model, data)
            viewer.sync()
            time.sleep(0.005)

        # 再开始插值循环
        step = 0
        r = 16
        direction = 1  # 1: pos1->pos2, -1: pos2->pos1

        while viewer.is_running():
            if step % r == 0:
                if direction == 1:
                    data.ctrl[:6] = joint_traj_forward[step // r]
                else:
                    data.ctrl[:6] = joint_traj_backward[step // r]

            mujoco.mj_step(model, data)
            viewer.sync()
            step += 1
            if step > n_steps * r:
                step = 0
                direction *= -1
 
if __name__ == "__main__":
    main()
```

运行效果是手腕处力不够，被摩擦力扭转了，导致板擦并没有始终贴合黑板。

# MJLAB
Mjlab 是一个基于 Mujoco 的强化学习框架，API 的设计和 Isaac 类似，都是声明式的。学习 mjlab 最好的方法是看官方文档的 [`carpole tutorial`](https://mujocolab.github.io/mjlab/main/source/tutorials/cartpole.html)。不过 `unitree_rl_mjlab` 使用的是较老的版本 `"mjlab==1.2.0"`（截至发文日），我写了一份基于这个版本的 [carpole](https://github.com/madderscientist/codeRoad/tree/main/cartpole_rl_mjlab1.2.0)。

层层包装，最后管理整个学习过程的是 `OnPolicyRunner`，这是 `register_mjlab_task` 的最后一个参数。`RslRlBaseRunnerCfg` 是 `OnPolicyRunner` 的配置（实际实现的时候变成dict解耦了，在 `train.py` 中）
`ManagerBasedRlEnvCfg` 在 `train.py` 中被用于创建 `ManagerBasedRlEnv`，后者的作用是从环境中采集数据、环境的生命周期，比如奖励什么的都在这里定义
reward等函数都会接收 `ManagerBasedRlEnv` ，然后是自己定义的参数，在 `ManagerBasedRlEnv.step` 中被使用
observation的key不能乱写，都是约定好的（写死在PPO代码 `construct_algorithm` 里了）
actor的distribution_cfg：方差直接可学习向量，并非从输入中推断。均值为输入中推断。

## libstdc++.so.6: version `CXXABI_1.3.15' not found
在 Ubuntu 22.04 系统上使用 Micromamba 创建并激活 `unitree_rl_mjlab` 环境后，运行项目脚本（如 `play.py`）时出现如下报错：
```txt
ImportError: /lib/x86_64-linux-gnu/libstdc++.so.6: version `CXXABI_1.3.15' not found
```

尽管 Conda (Micromamba) 环境内部安装了较新的库文件，但程序启动时仍然报错提示系统库版本过低，导致无法运行。

### 原因分析
该问题的根本原因在于**动态链接库的加载顺序**与**系统基础库版本限制**的冲突。
1.  **系统库版本限制**：Ubuntu 22.04 系统自带的 `libstdc++.so.6` 最高仅支持到 `GLIBCXX_3.4.30`，不包含程序所需的 `CXXABI_1.3.15` 符号（通常需要更新版本的 GCC 运行时库）。
2.  **符号链接机制**：Micromamba 环境中的 `libstdc++.so.6` 通常是一个符号链接，默认指向系统的 `libstdc++`。
3.  **加载优先级**：在默认情况下，Linux 动态链接器会优先在系统标准路径（如 `/lib/x86_64-linux-gnu/`）中查找依赖库。即使 Conda 环境中存在其他依赖库（如 `libicui18n`），它们在加载时也会因为链接器的默认搜索顺序，最终链向系统的旧版 `libstdc++`，从而引发版本不兼容错误。

### 解决方案
每次进入环境后执行：
```bash
export LD_LIBRARY_PATH=$CONDA_PREFIX/lib:$LD_LIBRARY_PATH
```
即可解决问题。

为了更便捷，可以通过配置 Conda/Micromamba 的**激活钩子**，在环境激活时自动修改 `LD_LIBRARY_PATH` 环境变量，强制程序优先加载 Conda 环境内部的库文件。

**操作步骤：**
1.  **激活目标环境**
    首先激活 Micromamba 环境：
    ```bash
    micromamba activate unitree_rl_mjlab
    ```
2.  **创建激活脚本目录**
    在环境配置目录下创建 `activate.d` 文件夹：
    ```bash
    mkdir -p $CONDA_PREFIX/etc/conda/activate.d
    ```
3.  **编写环境变量脚本**
    创建一个名为 `env_vars.sh` 的脚本文件，并将导出环境变量的命令写入其中。该命令会将 Conda 环境的 `lib` 目录置于系统库路径之前：
    ```bash
    echo 'export LD_LIBRARY_PATH=$CONDA_PREFIX/lib:$LD_LIBRARY_PATH' > $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh
    ```
4.  **验证配置**
    重新激活环境并检查环境变量是否生效：
    ```bash
    micromamba deactivate
    micromamba activate unitree_rl_mjlab
    echo $LD_LIBRARY_PATH
    ```
    如果输出路径的开头包含 `~/micromamba/envs/unitree_rl_mjlab/lib`，则说明配置成功。此后每次激活该环境，系统都会自动优先使用环境内的新版运行库，从而解决报错。

