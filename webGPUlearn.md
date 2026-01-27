记录了WebGPU的学习路线。先复习了WebGL，然后聚焦于WebGPU实现计算。

# WebGL着色器
## 顶点着色器
进行坐标变换的，最终目的是赋值给内置的全局变量 `gl_Position`赋上一个`vec4`类型的四维齐次坐标值。如果最后一维不是1会自动归一化。

对每个顶点都运行一次。如何实现每个顶点？涉及attribute的模式2，会对每次取到值执行该函数。

还有一个任务是对 `varying` 变量赋值。

还有一些支线，比如给 `gl_PointSize` 这个内置全局量赋值。这两个是WEBGL1拥有的一切。WebGL2还有几个，甚至有只读量。

## 片元着色器
进行颜色分配的，最终目标是赋值给内置的全局变量 `gl_FragColor` 赋上一个`vec4`类型的RGBA颜色值。

## 流程
1. 运行顶点着色器，输入为顶点attributes、全局变量uniform，得到所有顶点的gl_Position和对应的varying变量。
2. 按照图元类型装配成点、线、三角
3. 进行坐标归一化（除以坐标最后一维）；剪裁：丢弃视野外的部分
4. 光栅化，得到像素，并根据顶点的varying变量进行插值，得到每个像素的varying
5. 运行片元着色器，输入为每个像素插值的varying、全局变量uniform，得到gl_FragColor。

要获得插值，必须计算完所有相关顶点，因此上述阶段是串行的，但是可以对输入进行分组，组之间并行。

# WebGL 变量类别（不是类型）
## attributes
用来从外部向顶点着色器内传输数据，**只有顶点着色器能使用**，只能被声明为全局变量，用来表示“逐顶点”信息，attribute变量的类型只能是float、vec2、vec3、vec4、mat2、mat3和mat4。只能指定为float型

attributes的内容有两个来源（互斥）。两个来源的切换api：`gl.enableVertexAttribArray` / `disableVertexAttribArray`。
1. 直接赋值，默认这个模式
2. 从一个buffer按照规律一个个读取，相关api为：`gl.vertexAttribPointer`，用于规定怎么读取（从那开始，一次读取多少、什么格式等）。gl有一个指针 `gl.ARRAY_BUFFER`，固定从这个指针指向的buffer中读取，所以还有一个api是`bind`，用于将该指针指向实际的buffer。

模式二下，按照什么顺序读取？默认情况下按照自然顺序从前向后；但是三角形面元其实有很多顶点重合，为了复用这些顶点，需要有一个方法让顶点数据可以反复被用到。这个功能由`gl.ELEMENT_ARRAY_BUFFER`实现。类似于`gl.ARRAY_BUFFER`，这也是个指针，但是里面存储的是取点的顺序，会执行类似下面的逻辑：
```js
for (const idx of gl.ELEMENT_ARRAY_BUFFER) {
    // 根据idx，ARRAY_BUFFER从找值
    const data = gl.ARRAY_BUFFER.subarray(offset(idx), end(idx))
    yield data; // 传递给顶点着色器
}
```
若有多个启用了 `vertexAttribPointer` 的 `attribute`
，数据量（指可以取的次数）必须一样，不然会读取越界。

## uniform
uniform变量可以指定为除数组和结构体之外的任意类型。uniform变量可以在顶点着色器和片元着色器中使用，且必须是全局变量，uniform变量包含了“一致”(非逐顶点/逐片元的，各顶点或各片元共用)的数据。比如，变换矩阵就不是逐顶点的，而是所有顶点共用的，所以它在着色器中是uniform变量。

## varying
varying变量必须为全局变量，它的任务是从顶点着色器向片元着色器传输数据，**必须在两种着色器中声明同名、同类型的varying变量**。和attribute变量一样，varying变量只能是以下类型：float、vec2、vec3、vec4、mat2、mat3和mat4。

首先要在顶点着色器程序中给varying赋值，这个取值代表了在顶点处的取值。然后GPU进行光栅化，对于每个像素点会运行片元着色器，此时的varying就是插值之后的了。举两个例子：
1. 顶点着色器的varying是顶点的颜色，比如一端是红色，一端是白色，片元着色器得到的就是红白之间的过度颜色
2. 顶点着色器的varying代表了顶点纹理的uv坐标，那片元着色器的varying就是插值后的该像素的uv坐标，可以直接用于读取纹理值。

## GPU的变量和JS的关联
js给gl传递想要变量的变量名字符串，gl返回一个地址，举个例子：
```js
const posInGL = gl.getAttribLocation(gl.program, '变量名');
gl.vertexAttrib3fv(posInGL, new Float32Array([1,2,3]));
```

## 从WebGL 到 WebGPU
- 都有attribute: a way to specify data pulled from buffers and fed to each iteration of a vertex shader
- 都有uniform: a way to specify values shared by all iterations of a shader function
- 都有varying: a way to pass data from a vertex shader to a fragment shader and interpolate between values computed by the vertex shader when rasterizing via a fragment shader

WebGL是全局的：需要将某指针绑定到buffer，这个指针就是全局的。
WebGPU则使用*渲染管线*管理配置。

WebGL获取变量使用的是变量名；varying在两个着色器内需要相同的名字。
WebGPU完全通过index或offset获取

WebGL用`vertexAttribPointer`规定从哪、怎么取数据；而WebGPU只在创建pipeline时规定如何取，具体数据之后再说。

WebGL的内置变量变成了 `@builtin()` 前缀，变量名可以改了。

# WebGPU宏观理解
WGSL大概长这样：
```wgsl
// 一些类型定义
struct T {
    att_a: u32,
    att_b: u32,
    att_c: u32,
};
// 一堆来自JS的变量
@group(i) @binding(j) var<storage, read> external: T;

// 可能有的workgroup共享变量
var<workgroup> internal: array<f32, 固定长度>;

// 函数
fn ...

@是什么着色器（可选: compute vertex fragment）
@workgroup_size(线程数)
fn main(
    // 选择一些内置的变量（以`@builtin`开头），比如
    @builtin(workgroup_id) workgroup_id: vec3<u32>, // 本次dispatch中工作组的编号
    @builtin(local_invocation_id) local_id: vec3<u32>   // 本工作组中该线程的编号
    ...
// 最终需要的量。比如顶点着色器需要得到一个顶点的坐标
) -> @builtin(position) vec4<f32>
{
    // 函数体
}
```

`main`的名字可以改，不过要和JS对应上。

## workgroup
理解WGSL的逻辑需要理解GPU的并行。GPU可以同时并行很多个线程，每个线程都会独立运行`main`，且可以知道自己的编号，根据此编号，不同的线程处理不同的数据。比如有256个可以并行处理的数据，则线程1通过自己的编号`1`得知自己要处理第一个、线程N处理第N个，256个线程同时开工，仅用一次处理时间。

但是一个一个线程管理效率太低，所以将一把线程打包成一个“工作组”—— `workgroup` 统一管理。想象许多工人组成一个车间，几个人是开不起来的，所有工人要一起开工、一起下班。**`workgroup` 就是WebGPU的最小调度单元**：一整组同时运行，全部运行完后再离场。这意味着如果有某个线程运行特别慢，就会让其他线程等待（“XXX什么时候完成我们什么时候放学”既视感）。所以要尽量给一组内的线程分配尽量均衡的任务。

一个 `workgroup` 的大小N是可以自定的，就是WGSL中 `@workgroup_size(线程数)` 的传参，一般有上限“256”。此时，`main` 的参数 `@builtin(local_invocation_id) local_id: vec3<u32>` 就能
给我们一个范围是 `[0, N-1]` 的编号，代表该线程的“工号”。注意，这里的数据类型是 `vec3`，所以其实编号是由三部分构成的，相当于工人们不仅可以排成一列，还可以排成方阵、多层方阵。如果我们设置 `@workgroup_size(X, Y, Z)`，则一共有 `XYZ` 个线程，每个线程的 `main` 收到的 `local_invocation_id` 就是自己在团体中的坐标`(x, y, z)`。没设置的维度默认为1。

举个例子：输入一个长为16*16的图片数据`input`，计算他们的平方，放到`output`中，则可以写成：
```wgsl
// GPU中二维要转为一维
@group(0) @binding(0) var<storage, read> input: array<f32, 256>;
@group(0) @binding(1) var<storage, read_write> output: array<f32, 256>;

@compute @workgroup_size(16, 16)
fn main(
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let x = local_id.x;
    let y = local_id.y;
    let idx = y * 16u + x;
    output[idx] = input[idx] * input[idx];
}
```
这里写的 `@compute` 指的是函数专注于计算。

当然，我们完全可以将`workgroup_size`设置为256，这样就不用变换了。此外，如果资源紧缺，也可以让一个线程处理两个像素：
```wgsl
@compute @workgroup_size(128)
fn main(
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let x = local_id.x;
    let idx1 = x;
    let idx2 = x + 128;
    output[idx1] = input[idx1] * input[idx1];
    output[idx2] = input[idx2] * input[idx2];
}
```

## dispatch
如果输入256*256的图片，一个方法是让一组的每个线程处理256个数据，显然会过劳。因此可以设置多个工作组协作，比如第i个工作组处理第i行，一次派出256个工作组，每个工作组的第j个像素处理这一行的第j个像素。派出多少工作组由JS代码`dispatchWorkgroups(X,Y,Z)`指定，和workgroup类似，这里也能按照三个维度派遣，乘积表示总工作组的数目，每个工作组都能得到自己在**本次派遣**中的编号（不同dispatch之间是独立的），这个编号在 `main`的 `@builtin(workgroup_id) workgroup_id: vec3<u32>` 中。同一个工作组的线程得到的 `workgroup_id` 都是一样的。

dispatch的工作组数目可以很大很大，GPU内部会自动调度工作组（理解为场地有限，只能等一部分组完成后再让其他组入场），但一次dispatch的工作组之间是不知道运行顺序的。

现在让256个组处理256*256个数据的平方：
```wgsl
@group(0) @binding(0) var<storage, read> input: array<f32, 256*256>;
@group(0) @binding(1) var<storage, read_write> output: array<f32, 256*256>;

@compute @workgroup_size(256)
fn main(
    @builtin(workgroup_id) workgroup_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let row = workgroup_id.x;   // 第几行
    let col = local_id.x;       // 第几列
    let idx = row * 256u + col;
    output[idx] = input[idx] * input[idx];
}
```

总结 `@compute` 的 `main` 可以接收的参数：
- `@builtin(workgroup_id)`：当前工作组编号（vec3<u32>），用于区分不同组。

- `@builtin(num_workgroups)`：本次 dispatch 派发的工作组总数（vec3<u32>），有时用于边界判断。
- `@builtin(local_invocation_id)`：当前线程在本组内的空间索引（vec3<u32>）
- `@builtin(local_invocation_index)`：当前线程在本组内的线性索引（u32），等价于 local_id.x + local_id.y * size.x + local_id.z * size.x * size.y。
- `@builtin(global_invocation_id)`：全局线程编号（vec3<u32>），直接表示当前线程在本次dispatch中所有线程中的唯一编号，等价于 workgroup_id * workgroup_size + local_invocation_id。

最后，需要将WGSL编译成可运行的GPU程序。JS端这样写：
```js
const shaderModule = device.createShaderModule({
    label: 'Example Compute Shader',
    code: `... WGSL 代码 ...`
});
```

## 数据对接
首先理解WGSL的 `@group` 和 `@binding`。这里的group是资源绑定组（资源理解为外部输入），一个group下可以binding多个资源，不同的group物理实现没有区别，每个group有资源数目上限（只能绑定这么多，再想加就用新的group吧）。

group 和 binding 其实确定了 JS 和 WGSL 的数据对接接口，JS端将实际数据整理好，WGSL用 `@group` 和 `@binding` 两个坐标进行访问。下面是JS端为上面256*256例子的数据准备：
```js
const bindGroup = device.createBindGroup({
    label: '256*256 example',
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: outputBuffer } },
    ],
});
```
两个buffer是已经填充了数据的GPU内存。由于程序在哪里找数据已经在WGSL里写得清清楚楚，因此这里直接用`getBindGroupLayout(0)` 获取了 `computePipeline`（是WGSL编译后的对象）定义的 `group(0)` 的数据接口（当然也可以自己写layout，不过要和WGSL对应）。下面的 `entries` 就是具体到哪个接口填充哪个数据了。

这里只是创建，还没交给程序。用下面的代码执行（不完整）：
```js
pass.setPipeline(computePipeline);  // 把程序给GPU
pass.setBindGroup(0, bindGroup);    // 把资源给程序
pass.dispatchWorkgroups(256);       // 派遣256个工作组
```

group 可以用于批量切换一组 binding 的内容。比如我还有另一张图片要处理，一个方案是直接将数据填充到已有的`inputBuffer`中，但这要求新数据大小和buffer一样。假如新图片大小是1024*256，用group会更好：
```js
const bindGroup2 = device.createBindGroup({
    label: '1024*256',
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: inputBuffer1024 } },
        { binding: 1, resource: { buffer: outputBuffer1024 } },
    ],
});
pass.setBindGroup(0, bindGroup2);   // 把资源给程序
pass.dispatchWorkgroups(1024);      // 派遣1024个工作组
```

## GPU内存分配
GPU只是计算，内存分配、数据填充还是得JS来。GPU空间开辟使用 `device.createBuffer` 实现。

填充数据有两种形式：
1. 创建时就填充，之后动不了。缓冲区在GPU，所有权可以互斥地归属于CPU/GPU，从GPU到CPU使用 `buffer.getMappedRange`，其中`buffer`是使用`device.createBuffer`创建的。从CPU还给GPU使用`unmap`。CPU获得的是映射，可以直接用PCLe**直接读写**GPU。
    ```js
    const inputBuffer = device.createBuffer({
        label: "Kernel Info Buffer",
        size: inputjsdata.byteLength,
        usage: GPUBufferUsage.STORAGE,
        mappedAtCreation: true, // 这是关键
    });
    new Uint32Array(inputBuffer.getMappedRange()).set(inputjsdata);
    inputBuffer.unmap();
    ```
    mappedAtCreation 只能在创建时使用一次。一旦 unmap()，就不能再用 getMappedRange() 了。虽然可以通过 buffer.mapAsync(GPUMapMode.WRITE) 再次映射缓冲区来写入数据，但这通常比 writeBuffer 性能要差，因为它会引入 CPU-GPU 的同步点，可能导致管线停顿。因此如果要频繁更新内容，最好用下面的方式。

2. 创建后可以被GPU其他buffer修改（通过复制），或者用指令写：
    ```js
    const output1 = device.createBuffer({
        label: "可接受复制",
        size: outputBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, // COPY_DST是关键
    });
    // 复制
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(outputBuffer, 0, output1, 0, outputBufferSize);
    device.queue.submit([encoder.finish()]);
    // 用指令写 需要 COPY_DST
    device.queue.writeBuffer(output1, 0, new Uint32Array());
    ```

createBindGroupLayout时指定的buffer.type（能接收的）（前文没用这个而是从WGSL自动推断），要和WGSL的类型一致（程序声明的），还要和createBuffer的usage（实际数据）一致

计算着色器只能写storage，而STORAGE和MAP_READ互斥，意味着结果只能拷贝到MAP_READ和COPY_DES的buffer中，才能在让CPU访问。

## 从GPU读取数据到CPU
有一种方式：
```js
const gpuReadBuffer = device.createBuffer({
  size: resultMatrixBufferSize,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ  // MAP_READ是关键
});

// 先拷贝到这个可读的buffer中 要求resultMatrixBuffer是COPY_SRC
commandEncoder.copyBufferToBuffer(resultMatrixBuffer, gpuReadBuffer);
// 发送指令让GPU执行复制
const gpuCommands = commandEncoder.finish();
device.queue.submit([gpuCommands]);

// 可以读了 GPU操作在等下面的await中执行完
await gpuReadBuffer.mapAsync(GPUMapMode.READ);
const arrayBuffer = gpuReadBuffer.getMappedRange();
console.log(new Float32Array(arrayBuffer));
```

注意 `getMappedRange` 底层的数据还在GPU上，下面的 `new Float32Array` 只不过为这个GPU数据创建了一个view，最好再套一层 `new Float32Array` 进行数据的复制。

最后记得释放GPU内存：`buffer.destroy()`

## 命令
上文出现了很多 `encoder` 和 `pass`，都可以视为对GPU命令的编码，最后统一提交到 `devide.queue` 等待被GPU处理。每条什么时候被执行？不知道，也不重要。