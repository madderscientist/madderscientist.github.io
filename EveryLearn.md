# 一天一个生活小妙招！
记录每一天学会的小技巧

## 2023 6 3
IEEE模板使用中文（以引用为例）：
1. 开头加入:
```
\usepackage{CJKutf8}
\newcommand{\chinesetext}[1]{\begin{CJK}{UTF8}{gbsn}#1\end{CJK}}
```
2. 要中文的地方用\chinesetext{中文内容}。比如在bib文件中：
```
@article{example,
  author =  {\chinesetext{中文作者}},
  title =  {\chinesetext{中文标题}},
  journal =  {\chinesetext{中文期刊}},
  year = {2022},
  note = {\chinesetext{中文信息}}
}
```
3. 使用`\cite`命令引用这些文献：
```
这里引用了一个中文文献 \cite{example}。
```
4. 文末添加：
```
\bibliographystyle{IEEEtran}
\bibliography{IEEEabrv,ref}
```
其中ref.bib是文件名

## 2023 6 4
ppt打印导出，直接ppt里面导出会有很大的边框。
1. ppt导出为pdf
2. Adobe中打开，选择打印，调整布局

## 2023 6 19
设计特斯拉参数，用到的网站[1](https://www.kechuang.org/tools/tc/teslacoil/HelicalCoil.html),[2](https://tools.makertime.org/tc/teslacoil/HelicalCoil.html)。我的漆包线线是.3mm的，初级准备2圈，按照4kV输出，至少670匝，则次级大概要21cm高。为了美观选择了75mm外径的pvc管（本来是63的。但是看到文章说频率低一点好，所以加大了一号）。
https://www.bilibili.com/read/cv132436/
https://www.bilibili.com/read/cv132450/

## 2023 6 24
线圈在昨天绕好并涂上了绝缘漆，打印了底座和顶部接口，用晾衣架做了初级线圈（2圈）。今天测试了音频功率输出和谐振频率。音频用一个IRF540即可，准备使用1:1变压器对反馈管的供电电压进行调制。用了最基本的电路（正反馈到s8050的基极）测试，最高给3V，不然易派就要过载。示波器接基极可以观察谐振频率。因为加了顶部的铝箔平板，所以测得535kHz，比理论略小。
同名端的问题，要形成正反馈就要初级和次级绕向相同。和电路图相反是因为位置不一样。
人手靠近会导致对地电容减小，频率降低。非常靠近时频率会突然翻倍，从波形上看是从波形的负半周“生长”出了一个尖峰，长到一定程度就稳定下来使频率翻倍（确切地说是比2倍还大）。上移初级线圈（再放回）可以恢复。用手触摸次级线圈中部也可以恢复。原因未知。但是绝对不能在大功率的时候用手摸！
没有装均压环。一个原因是3D打印机太小打不下均压环，另一个原因是：用珍珠棉长筒围了一个，用铝箔贴纸包裹弧形物体效果不理想，到处都是坑坑洼洼，肯定漏电。不如找锅碗瓢盆。
最后用12V锂电池试了试高功率。看到了两秒电弧，然后管子（两个并联）悄无声息地坏了。用一个直接炸。用三个都烧起来了。没有复现成功，等大功率管子。

## 2023 6 25
在三极管数据手册中，hFE是指三极管的直流放大倍数。其中，R、O、Y三栏是指不同工作条件下的hFE值。
R代表"Resistive Load"，即电阻性负载。在这种情况下，三极管的hFE值较高，因为电阻性负载对三极管的输出电流和输出电压的影响较小。
O代表"Output"，即输出参数。在这种情况下，hFE值较低，因为输出参数会对三极管的输出电流和输出电压产生较大的影响。
Y代表"Admittance"，即导纳参数。在这种情况下，hFE值介于R和O之间，因为导纳参数对三极管的输出电流和输出电压的影响介于电阻性负载和输出参数之间。

### 笛子制作
做笛子，不能太短！今日笛子制作大失败。因为缩小了总长，导致开孔间隔阴间，打坏两根管子；且从高音2开始都吹不了。原因未知。
具体过程如下：用PPR水管 外径*壁厚=20mm*2.8mm 雕笛子，吹嘴下端到笛子底端约31.0cm，筒音是B。音孔中心到底的距离为5.5cm、8.7cm、11.3cm、14.1cm、17.0cm、18.7cm。都需要从小到大一边听一遍扩孔。
用电钻打洞的时候，不要清除第一次钻入时附着的塑料，带着塑料继续钻孔，碎屑会附着（融化）在上面，并且增大钻头直径，提高扩孔效率；反之若清除，则后续会产生絮状翘起，难以清除，开孔的边缘毛糙且效率低。
厚壁水管效果不错，完胜薄壁的线管。以后做笛子，还是得按照比例再微调。有参照笛（薄壁线管），内径只比水管小不超过0.5mm，但是打孔的位置差别巨大，猜测是壁厚导致的，影响未知。以之为参考是导致今日失败的重要原因。

Oscillator的词根是oscill，来源于拉丁语oscillare，意思是“摇摆，振荡”¹。这个词根也可以拼写为oscil，如在oscillate和oscillation中。Oscillator是由词根oscill加上后缀-ator构成的，表示“产生或执行某种动作的人或物”²。Oscillator的意思是“振荡器，振子”¹。一些与oscillator相关的词有：

- oscillate [oscil 摇摆，-ate 动词后缀] v. 摇摆，振荡
- oscillation [oscil 摇摆，-ation 名词后缀] n. 摇摆，振荡
- oscillatory [oscil 摇摆，-ory ...的] adj. 摇摆的，振荡的
- oscillometer [oscil 摇摆，-meter 测量仪器] n. 振荡计

源: 与必应的对话， 2023/6/25(1) oscillator是什么意思_oscillator的翻译_音标_读音_用法 .... http://www.iciba.com/word?w=oscillator 访问时间 2023/6/25.
(2) 词源在线 | 英语词源词根词典 - Etymonline. https://www.etymonline.com/cn 访问时间 2023/6/25.
(3) 英语词根字典 - 词根词缀大全 - 趣词英语词根表. https://www.quword.com/root/ 访问时间 2023/6/25.

## 2023 6 26
stm32的FFT库自带了，在：
D:\program file\Keil5\Arm\Packs\ARM\CMSIS\5.9.0\CMSIS\DSP\Examples\ARM\arm_fft_bin_example

## 2023 7 1
画布 ctx.save() 和requestAnimationFrame() 和setTransform()
https://blog.csdn.net/lovefengruoqing/article/details/100148663：用translate实现无限画布

## 2023 7 2
Q:requestAnimationFrame()会延时吗？
A:`requestAnimationFrame()` 方法本身不会延时，它会在浏览器下一次重绘之前执行回调函数。换句话说，它会尽可能快地执行回调函数，通常会在每秒 60 帧的速率下执行回调函数。
`requestAnimationFrame()` 方法的执行时机，是在浏览器下一次重绘之前。这意味着，如果在执行回调函数之前需要等待一些任务完成，那么回调函数就会被延时执行。例如，如果回调函数中包含了一个需要等待网络请求返回的操作，那么回调函数就会被延时执行，直到网络请求返回并且浏览器准备好重绘页面为止。
另外，需要注意的是，`requestAnimationFrame()` 方法的执行速率受到多种因素的影响，例如浏览器的性能、当前页面的复杂度、硬件设备的性能等等。因此，在实际使用中，可能会出现回调函数被延时执行的情况，但这并不是 `requestAnimationFrame()` 方法本身的问题。
总的来说，`requestAnimationFrame()` 方法会尽可能快地执行回调函数，并在浏览器下一次重绘之前执行，但如果回调函数中包含了需要等待的操作，那么回调函数就会被延时执行。
Q:所以调用了这个方法之后，间隔1/60s后会重绘？
A:调用 requestAnimationFrame() 方法后，浏览器会在下一次重绘之前执行传入的回调函数。一般情况下，浏览器的重绘频率是 60 次/秒，也就是每秒钟会执行 60 次重绘操作。因此，如果连续多次调用 requestAnimationFrame() 方法，回调函数也会在接下来的一个重绘周期内被执行，而不是间隔固定的时间。在这个意义上，可以说 requestAnimationFrame() 方法会在大约 1/60 秒后重绘页面。
需要注意的是，requestAnimationFrame() 方法并不会保证回调函数在恰好 1/60 秒之后被执行。回调函数的执行时间会受到多种因素的影响，例如 CPU 的负载、当前页面的复杂度、设备的性能等等，因此实际的执行时间可能会略有偏差。
另外，如果回调函数执行的时间过长，可能会导致页面卡顿或者掉帧的现象，因此需要尽可能保证回调函数的执行时间较短，以便让浏览器在每个重绘周期内完成更多的工作。
Q:requestAnimationFrame(fun)会向fun传递什么参数？
A:在调用 requestAnimationFrame() 方法时，会向注册的回调函数传递一个时间戳参数 timestamp，表示当前回调函数被调用的时间。这个时间戳参数是一个 DOMHighResTimeStamp 类型的值，它的单位是毫秒，精度可以达到微秒级别。
回调函数可以利用这个时间戳参数来计算动画的状态，例如计算动画的当前位置、速度、加速度等。需要注意的是，由于 timestamp 参数的精度非常高，因此在计算动画状态时需要考虑浮点数精度的问题，避免出现舍入误差等问题。
Q:DOMHighResTimeStamp的范围是什么？
A:根据 W3C 的规范，DOMHighResTimeStamp 类型的时间戳范围是从页面加载开始到当前时间的毫秒数，精度可以达到微秒级别。具体来说，它是一个非负整数，可以表示的最大值取决于计算机的性能和浏览器的实现。
通常情况下，DOMHighResTimeStamp 的范围大约在2^48左右。这个范围足够大，可以满足大多数 Web 应用的需求。需要注意的是，由于 DOMHighResTimeStamp 的精度非常高，因此在使用时需要考虑浮点数精度的问题，避免出现舍入误差等问题。
Q:所以内部是纳秒，但是传参的时候转换成了毫秒？
A:是的，DOMHighResTimeStamp 内部使用纳秒来表示时间，但是在传递给回调函数时，浏览器会将其转换为毫秒，并将结果舍入为双精度浮点数。这种转换方式是因为，毫秒是 Web 开发中常用的时间单位，而且双精度浮点数可以表示更大范围的数值，因此浏览器会将纳秒转换为毫秒，以方便开发者使用。
Q:我想让requestAnimationFrame() 向回调传递纳秒，可以实现吗？
A:requestAnimationFrame() 函数的回调函数只能接收以毫秒为单位的时间戳，无法直接传递以纳秒为单位的时间戳。这是因为 requestAnimationFrame() 函数的回调函数是由浏览器调用的，浏览器会将时间戳转换为以毫秒为单位的时间戳，并将结果舍入为双精度浮点数。
如果您需要使用纳秒精度的时间戳，可以使用 performance.now() 函数来获取当前时间戳。performance.now() 函数返回的时间戳是以毫秒为单位的双精度浮点数，精度可以达到微秒级别。您可以将 performance.now() 函数返回的值乘以 1000000，得到以纳秒为单位精度更高的时间戳。
例如，以下代码演示了如何使用 performance.now() 函数和 requestAnimationFrame() 函数来实现以纳秒为单位的时间戳：
```js
let start = performance.now();
function animate(timestamp) {
  let elapsed = (timestamp - start) * 1000000; // 以纳秒为单位的时间戳
  // 在这里执行动画操作
  requestAnimationFrame(animate);
}
```
requestAnimationFrame比起setTimeout、setInterval的优势主要有亮点：
1. requestAnimationFrame会把每一帧中的所有DOM操作集中起来，在一次重绘或回流中就完成，并且重绘或回流的时间间隔紧紧跟随浏览器的刷新频率；浏览器屏幕刷新多少次，它就执行多少次。
setTimeout、setInterval它们的内在运行机制决定了 时间间隔参数 实际上只是指定了把动画代码添加到 浏览器UI线程队列 中以等待执行的时间。如果队列前面已经加入了其它任务，那动画代码就要等前面的 任务完成后 再执行，并且如果时间间隔过短（小于16.7ms）会造成丢帧，所以就会导致动画可能不会按照预设的去执行，降低用户体验。
2. 在隐藏或不可见的元素中，将不会进行重新重绘或回流；
3. requestAnimationFrame是由浏览器专门为动画提供的API，在运行时浏览器会自动优化方法的调用，并且如果页面不是激活状态下的话，动画会自动暂停，有效节省了CPU开销


1k bit，k为1000，表示带宽速度；1k byte，k为1024，表示数据存储。Windows内存用1024算，而linux和硬盘厂家用1000算。
关于声音的存储，看了文章[数字音频基础­­­­­－从PCM说起](https://zhuanlan.zhihu.com/p/212318683)。电脑采样和fft都是44100Hz，能保留20kHz以内的信息。对于128kbit/s的音频，采样频率为8kHz，而钢琴最高频为4kHz，故也能保留音乐的大部分信息。
“人的听力系统适应声音的动态变化，人们对这种适应及屏蔽特性音质研究后得出对声音压缩非常有用的理论。人们很早以前就知道利用这种特性来为磁带录音降低噪音了（当没有音乐时嘶嘶声很容易听到，而当音乐信号电平很高时嘶嘶声不容易听到）。当声音较强时产生屏蔽效应。在阈值曲线下的噪音或小信号声音无法被人耳听到。在较强的信号出现时，允许通过更多的信号。在此时增加被量化过的小信号数据（使用无用的位来携带更多的信息）可以达到一定程度的压缩的目的。通常情况下，MP3压缩器将原始声音通过FFT（快速傅立叶变换）变化到频域，然后通过一定的算法算出何种频率声音可以携带更多的信息。而在还原时解码器所需要做的仅仅是将其从频域再变换回来。”

audioContext.destination默认是扬声器，如果用audio.start()但没connect到destination就会自动连接。
启用摄像头和麦克风并且做音频滤波的一个好例子：https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext/createMediaStreamSource

# 2023 7 3
#define SREG     *(volatile unsigned long *) 0x5c
在嵌入式系统编程中，一般要求程序员能够利用C语言访问固定的内存地址。(volatile unsigned long *)强转为指针，最前面的\*表示引用，所以SREG就是寄存器值的引用。为了防止编译器优化，用volatile

# 2023 7 7
双标的数组构造函数
JS中各种Array的创建，如果参数是Array，则复制构造。如果是ArrayBuffer，那就是引用。
使用ArrayBuffer对象作为其他类型化数组对象的构造函数参数时，它们也会使用ArrayBuffer对象作为其内部缓冲区，并且它们之间存在直接的联系。这意味着当你更改ArrayBuffer对象中的数据时，所有与其共享的类型化数组对象都将反映这些更改。
这个区别的发现在于以下两个输出不同，前一个输出可以读，后一个则ArrayBuffer(0)：
```js
var temp = null;
// 用音频
function audiofft(files) {
    var reader = new FileReader();
    try {
        reader.readAsArrayBuffer(files);
        reader.onload = function () {
            temp = new Uint8Array(reader.result);
            console.log(temp)
            test();
        }
    }
    catch (err) {
    }
}
function test(){
    console.log(temp)
}
```
但如果用temp = new Uint8Array(reader.result).slice();就可以两次正常。因此猜测不是复制构造。

# 2023 7 8
html元素的“data-*”属性：
比如
```js
<button data-test-value="hello" data-another="4" id="btn">
console.log(document.getElementById("btn").dataset.testValue) // hello
```
会自动转换成驼峰命名。当然也可以用完整名字访问：getAttribute("data-test-value")
命名注意：小写。要大写的字母前面加'-'。第一个字母必须小写。
css也可以访问。
```css
btn[data-antother='4']::before {  // 选择器可以访问
  content: attr(data-test-value); // 内容也可以访问，但都是原名
}
```
甚至可以只有[data-?]{...}表示选择所有有这个属性的元素。
可以修改data-?以切换css
比如：
```css
[mode="maker"] .mode-maker,
[mode="edit"] .mode-edit,
[mode="blockly"] .mode-blockly {
  display: block;
}
```
这里用了后代选择器，选择了所有有mode属性的父层级下的mode类
https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Howto/Use_data_attributes

# 2023 7 9
AudioBuffer.getChannelData()返回的数组是引用的！
AudioBuffer是音频底层数据
```
var myArrayBuffer = audioCtx.createBuffer(channels, frameCount, audioCtx.sampleRate);
var newBuffering = myArrayBuffer.getChannelData(channel);
// 对newBuffering进行某些数组操作后
var source = audioCtx.createBufferSource();
source.buffer = myArrayBuffer;
source.connect(audioCtx.destination);
source.start();
```

# 2023 7 15
stm32C8T6 usart1波特率最小1200，而zet6最小600

关于ArrayBuffer，这是真的底层，一个元素一个字节(8bit)。所以用Float32Array和Uint8Array解析可以得到不同的数组，表现在长度和每个数不一样。
AudioBuffer内部是Float32Array的二维数组，元素范围为[-1,1]

# 2023 7 16
将采样率低的文件导入AudioContext，会根据线性插值变为AudioContext对应的采样率。
fft的采样率同样跟随AudioContext，如果采样率为200, fftsize为150，那么从原数据平均间隔200/150个数据选取一个用于fft，而这个数据从插值算法来。
用fft分析一段数据？如下。事实证明是不行的，analysernode只能实时分析，所以source没有start获取不了数据（指结果都是0）（实测结果）。
```js
// 加载音频文件
const audioContext = new AudioContext();
const audioSource = audioContext.createBufferSource();
const xhr = new XMLHttpRequest();
xhr.open('GET', 'audio.mp3', true);
xhr.responseType = 'arraybuffer';
xhr.onload = function() {
  audioContext.decodeAudioData(xhr.response, function(buffer) {
    // 发送音频数据到 AudioBufferSourceNode 对象
    audioSource.buffer = buffer;
    audioSource.connect(audioContext.destination);
    audioSource.start();
    // 创建 AnalyserNode 对象
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    // 将 AudioBufferSourceNode 对象连接到 AnalyserNode 对象
    audioSource.connect(analyser);
    // 获取频域数据
    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(frequencyData);
    // 计算时间点对应的样本数
    const sampleRate = audioContext.sampleRate;
    const timeInSeconds = 5; // 要分析的时间点为音频的第 5 秒
    const sampleNumber = timeInSeconds * sampleRate;
    // 获取时间点的音频样本数据
    const timeData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeData);
    const sampleData = timeData.subarray(sampleNumber, sampleNumber + analyser.fftSize);
    // 使用音频样本数据进行分析
    // ...
  });
};
xhr.send();
```

# 2023 7 20
AudioContext.currentTime是只读，用source.start()时会自动更新
每个AudioBufferSourceNode的start()只能调用一次。多次调用会报错**Failed to execute 'start' on 'AudioBufferSourceNode': cannot call start more than once.**
所以要实现播放器，每次暂停后播放或跳转播放都是创建了新的AudioBufferSourceNode。例子如下：
```js
// 创建AudioContext
const audioContext = new AudioContext();

// 加载音频文件
fetch('audio.mp3')
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
  .then((audioBuffer) => {
    // 创建AudioBufferSourceNode和AnalyserNode
    let source = null;
    const analyserNode = audioContext.createAnalyser();
    audioContext.destination.connect(analyserNode);
    // 记录当前播放的时间
    let currentTime = 0;
    // 创建播放函数
    const play = () => {
      // 创建新的AudioBufferSourceNode并开始播放
      source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserNode);
      const startTime = currentTime;
      source.start(audioContext.currentTime, startTime);
      // 监听ended事件，在音频播放完毕后停止
      source.onended = () => {
        stop();
      };
    };
    // 创建停止函数
    const stop = () => {
      // 停止当前的AudioBufferSourceNode
      if (source) {
        source.stop();
        source.disconnect();
      }
      source = null;
    };
    // 创建暂停函数
    const pause = () => {
      // 记录当前播放的时间，停止当前的AudioBufferSourceNode
      if (source) {
        currentTime = audioContext.currentTime - source.startTime;
        stop();
      }
    };
    // 创建从指定时间开始播放的函数
    const seek = (time) => {
      // 记录当前播放的时间，停止当前的AudioBufferSourceNode
      if (source) {
        currentTime = time;
        stop();
        play();
      }
    };
    // 绑定按钮的事件处理函数
    const playButton = document.getElementById('play');
    playButton.addEventListener('click', () => {
      play();
    });
    const pauseButton = document.getElementById('pause');
    pauseButton.addEventListener('click', () => {
      pause();
    });
    const seekButton = document.getElementById('seek');
    seekButton.addEventListener('click', () => {
      const time = parseFloat(document.getElementById('time').value);
      seek(time);
    });
    // 每秒获取一次频谱数据
    setInterval(() => {
      const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(frequencyData);
      console.log(`FFT analysis at time ${audioContext.currentTime}:`);
      console.log(frequencyData);
    }, 1000);
  });
```
但是用AudioContext.suspend()和AudioContext.resume()可以变相实现暂停。此举是暂停此环境下所有活动，包括播放和分析。audiosourcenode的stop是自杀，但是AudioContext.suspend()是宇宙时停，所以不需要创建新的audiosourcenode。

subarray和slice都是从一个数组中返回一个子数组，但是它们有一些不同点：
- subarray是TypedArray的一个方法，它只能用于类型化数组，而slice是Array的一个方法，它可以用于任何数组。
- subarray返回的子数组和原数组共享同一块内存空间，也就是说，修改子数组会影响原数组，而slice返回的子数组是原数组的一个浅拷贝，也就是说，修改子数组不会影响原数组。
- subarray接受两个参数：begin和end，表示开始和结束的索引（不包含结束索引），如果省略end参数，则默认为原数组的长度。slice也接受两个参数：start和end，表示开始和结束的索引（不包含结束索引），但是它们可以是负数，表示从后往前数的位置。
举个例子：
```js
var arr = [1, 2, 3, 4, 5];
var sub = arr.subarray(1, 3); // 返回 [2, 3]
var slc = arr.slice(1, 3); // 返回 [2, 3]
sub[0] = 9; // 修改子数组
slc[0] = 9; // 修改子数组
console.log(arr); // 输出 [1, 9, 3, 4, 5]
console.log(sub); // 输出 [9, 3]
console.log(slc); // 输出 [9, 3]
```
可以看到，subarray修改了原数组，而slice没有。

我靠，原来代码段后加上语言名可以给代码上色！

fft分析是一直进行的，分析的频率是多少？
分析的频率是指 AnalyserNode 对输入的音频流进行 FFT 分析的速率，也就是说，每秒钟进行多少次 FFT 分析。这个频率取决于两个因素：
- AnalyserNode 的 smoothingTimeConstant 属性，它表示 FFT 分析结果的平滑程度，范围在 0 到 1 之间。这个属性会影响 FFT 分析结果在内部缓冲区中的更新速度，如果它越大，那么更新速度就越慢，反之亦然。
- AudioContext 的 sampleRate 属性，它表示音频流的采样率，单位是赫兹。这个属性会影响 FFT 分析的精度和分辨率，如果它越大，那么 FFT 分析能够捕捉到更高的频率范围，但是每个频率分量的宽度也会变大，反之亦然。
根据这两个属性的值，我们可以计算出分析的频率的大致公式：
分析的频率 = sampleRate / (fftSize * smoothingTimeConstant)
例如，如果 sampleRate 是 44100 赫兹，fftSize 是 2048，smoothingTimeConstant 是 0.8，那么分析的频率大约是：
分析的频率 = 44100 / (2048 * 0.8) = 26.8 次/秒
当然，这个公式只是一个估计值，实际的分析频率可能会有一些波动和延迟。如果你想获取更准确的分析频率，你可以使用 performance.now() 方法来测量每次调用 getFloatFrequencyData 的时间间隔，并计算出平均值。

所以……之前的回答（7月16日）是错的？？？
以下的话都没有验证过（ai给的信息）。实际上如果audiocontext.suspend()可以获得时停的fft结果，但是播放完了再获取就是0了。（7/21测试结果）

    其实没大问题。fft分析的逻辑是这样的：fft一直在做（从connect之后就开始），有一个长度为fftsize的窗口，做一次移动一次，如果完全移出去就停止分析，直到你给它一个新的音频流或者重新设置它的参数。这个暂停是真的不做fft了，不占用cpu资源。如果fftsize=2048,且AudioBuffer大小为2048，做一次就停了。如果fftsize=2049，做两次，第二次剩下的2047个数据填充0，之后调用getFloatFrequencyData得到的是第二次的结果。
    唯一的问题是，如果connect之后立马getFloatFrequencyData，可能因为来不及fft而导致只能得到半成品结果。

用offlineaudiocontext也解决不了。虽然分析做了，但是一直覆盖，最后留在Float32Array中的是最后一刻的fft结果。s

# 2023 7 21
smoothingTimeConstant的作用：
这一次频域结果（这一次调用getFloatFrequencyData的结果）=上一次频域结果（上一次getFloatFrequencyData的结果）\*smoothingTimeConstant+这一次频域计算结果\*(1-smoothingTimeConstant)。
这解释了今天的实验：在音频播放完成后调用getFloatFrequencyData，频谱越来越低。且是调用一次低一次，下降趋势和调用时间间隔无关。这是因为内部有两个存储，当前fft计算结果在analysernode的Float32Array中，而上次调用getFloatFrequencyData的结果也存储了（我不知道在哪），Float32Array一直在更新，但是平滑只发生在调用getFloatFrequencyData时，将两个存储加权平均并返回。音频播放结束，analysernode内部的Float32Array都是0，所以加权结果越来越低。

这两天和web audio api battle的结果是，要实现对每个时刻的fft分析，还是找专门的fft库好一点。analysernode的设计方向非常奇怪，似乎只是为了实时分析而生。作为用户无法控制其行为。

# 2023 7 22
开梯子用不了bing的解决：换成cn.bing.com。国际版用不了了。只能国内。
<audio src="a.mp3"></audio>看不到ui，只要写成<audio src="a.mp3" controls></audio>就行了
奇怪，这竟然没有跨域问题

# 2023 7 23
css中calc(100% - 25px)没有空格解析不了
bing还是用不了，发抽

# 2023 7 24
blockly大部分都配置好了，注意点写在了代码注释里

# 2023 7 25
树莓派搭建mc服务器
用sdkman配置java环境，省去环境变量一坨
```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk version
sdk list java
```
选择identifier那一列，用sdk install java ${identifier}安装

去https://papermc.io/downloads下载paper的jar包
```bash
java -Xmx1024M -Xms1024M -jar paper-246.jar
```
限制JVM内存为1G。对于我的树莓派就没必要限制了。第一次运行会不通过，这是因为你没有同意协议的原因，打开eula.txt文件，更改eula=false为eula=true（注意不要拼写错）。此外如果没有正版账号，还需要改动server.properties中的online-mode=true为online-mode=false。
再运行一次，开服！

内网穿透用frpc。

关于stm32主频和波特率的关系：
https://blog.csdn.net/FLYMCUCN/article/details/129042583 指出了波特率受主频限制
https://blog.csdn.net/qq_15181569/article/details/115332981 指出了波特率的计算
https://blog.51cto.com/u_15127670/4095785 指出了如何修改主频

改主频可以直接修改system_stm32f10x.c的SetSysClockTo72函数。对比不同的主频配置函数，发现只有两处不同：
1. 1018行的FLASH_ACR_LATENCY_<i>。https://blog.csdn.net/xiaoqa11/article/details/119281886 指出了不同主频对应的i值
2. 1056行的RCC_CFGR_PLLMULL<i>。指倍频系数，主频=8M*这个系数。
两个参数自行在stm32f10x.h中查找可替换的值

针对usart修改可以更简单：在串口初始胡启用时钟前用RCC_PCLK2Config(RCC_HCLK_Div4);把usart1的频率改为18M，就可以用300波特率了

# 2023 7 27
在JavaScript中，&&运算符的行为可能与一些其他编程语言不同。它不总是返回true或false。
&&运算符在JavaScript中被称为逻辑与运算符。它的行为是这样的：
- 如果第一个操作数是falsy（即，它的值为false，0，""，null，undefined，或NaN），那么&&运算符将返回第一个操作数的值。
- 如果第一个操作数是truthy（即，它的值不是falsy），那么&&运算符将返回第二个操作数的值。

# 2023 8 8
思考了一下空间定位虚空钢琴。视觉定位可以用mediapipe，python的挺好用。有空要了解一下底层（如果可能的话）；惯性定位有积分漂移，不知道怎么解决，可以用MPU6050；弯曲传感器可以自制，但是似乎不方便用在手上的每个关节。想用掌心的红外摄像头，但是似乎把姿态限制得比较死。
淘宝搜“小摄像头”和“微型摄像头”都不行，搜small摄像头可以找到fpv摄像头，大概是能找到的最小的摄像头。

blockly的variable category的toolbox虽然什么都没写，但是就是有一个按钮
https://github.com/mit-cml/blockly-plugins/tree/main/block-lexical-variables
这个是appinventor变量的实现

# 2023 8 9
关于nodejs环境
您好，这是Bing。很高兴您对文件夹下的nodejs环境感兴趣。😊
文件夹下的nodejs环境是指在一个特定的项目文件夹中安装和使用nodejs，而不是在全局的系统中安装和使用nodejs。这样做的好处是可以避免不同的项目之间对nodejs版本和依赖的冲突，也可以方便地将项目打包和部署。
根据我搜索到的信息，实现文件夹下的nodejs环境有以下几种方法：
- 方法一：使用nvm（Node Version Manager）工具。nvm是一个可以在同一台机器上安装和管理多个版本的nodejs的工具¹²。您可以使用nvm来为每个项目文件夹指定一个特定的nodejs版本，并且在该文件夹中运行nvm use命令来激活该版本。这样，您就可以在该文件夹下使用该版本的nodejs和npm了。
- 方法二：使用npm（Node Package Manager）工具。npm是一个可以安装和管理nodejs模块的工具³。您可以使用npm来为每个项目文件夹安装一个本地的nodejs模块，例如`npm install node --save-dev`。这样，您就可以在该文件夹下使用`./node_modules/.bin/node`和`./node_modules/.bin/npm`来运行本地的nodejs和npm了。
- 方法三：使用pkg（Package your Node.js project into an executable）工具。pkg是一个可以将Node.js应用程序打包为一个单独的可执行文件的工具⁴⁵。您可以使用pkg来为每个项目文件夹生成一个包含了nodejs运行时和应用代码的可执行文件，例如`pkg index.js`。这样，您就可以在任何没有安装nodejs的机器上运行该可执行文件了。
以上就是我为您提供的一些关于如何实现文件夹下的nodejs环境的信息。我希望这些信息对您有所帮助。😊
如果您还有其他问题或者想要我帮助您生成一些有趣或创新的内容，请随时告诉我。😉
源: 与必应的对话， 2023/8/9
(1) 如何优雅的搭建nodejs开发环境及目录设计? - 知乎. https://zhuanlan.zhihu.com/p/111269062.
(2) 设置 Node 开发环境 - 学习 Web 开发 | MDN - MDN Web Docs. https://developer.mozilla.org/zh-CN/docs/Learn/Server-side/Express_Nodejs/development_environment.
(3) nodejs安装及环境变量配置 - 知乎. https://zhuanlan.zhihu.com/p/86241466.
(4) undefined. https://nodejs.org/zh-cn/.
(5) undefined. https://deb.nodesource.com/setup_10.x.

要让用户无需配置Node.js环境即可使用你的项目，你可以考虑使用打包工具将你的Node.js应用程序打包成可执行文件，以便用户可以直接运行而无需安装Node.js。
以下是一些常用的工具和方法，可以帮助你将Node.js应用程序打包成可执行文件：
1. **pkg**: pkg是一个流行的打包工具，它可以将Node.js应用程序打包成可执行文件，并将所有依赖项包含在内。你可以使用pkg将你的应用程序打包为适用于各种操作系统（如Windows、macOS和Linux）的可执行文件。它支持命令行界面和GUI应用程序。你可以在[https://github.com/vercel/pkg](https://github.com/vercel/pkg)上找到pkg的文档和示例。
2. **Electron**: 如果你的项目是一个桌面应用程序，你可以考虑使用Electron。Electron是一个基于Chromium和Node.js的框架，用于构建跨平台的桌面应用程序。它允许你使用Web技术（HTML、CSS和JavaScript）构建应用程序，并将其打包成可执行文件。你可以在[https://www.electronjs.org/](https://www.electronjs.org/)上找到Electron的文档和示例。
3. **Docker**: Docker是一个流行的容器化平台，它可以将应用程序和其依赖项打包成一个独立的容器。用户只需安装Docker，并运行你提供的Docker镜像即可使用你的应用程序，而无需手动配置Node.js环境。你可以将你的Node.js应用程序容器化，并在Docker Hub或其他地方分享镜像。用户可以通过运行Docker容器来使用你的应用程序。你可以在[https://www.docker.com/](https://www.docker.com/)上了解更多关于Docker的信息。
使用这些工具和方法之一，你可以将你的Node.js应用程序打包成可执行文件或容器，使用户能够无需配置Node.js环境即可使用你的项目。请注意，在打包过程中，确保包含所有必要的依赖项，并测试打包后的应用程序以确保其在目标环境中正常运行。

是的，你可以通过将Node.js环境与你的项目捆绑在一起，实现在另一台电脑上继续开发而无需安装全局的Node.js。这种方式被称为"自包含（self-contained）"或"便携式（portable）"的Node.js环境。
以下是一种常见的方法来实现自包含的Node.js环境：
1. 下载适用于目标操作系统的Node.js二进制文件（例如，Windows的`.zip`文件或macOS的`.tar.gz`文件）。
2. 创建一个目录，例如`node`，在你的项目文件夹中。
3. 将下载的Node.js二进制文件解压到`node`目录中。
4. 在你的项目中，使用相对路径引用本地的Node.js二进制文件。例如，如果你的项目文件夹中有一个名为`index.js`的入口文件，你可以使用以下命令运行它：
   ```
   ./node/node index.js
   ```
这将使用项目文件夹中的自包含Node.js环境运行`index.js`文件。
通过这种方式，你的项目文件夹中包含了一个独立的Node.js环境，你可以将整个项目文件夹复制到另一台电脑上，并在没有全局Node.js安装的情况下继续开发。请确保将Node.js的二进制文件和依赖项包含在你的项目中，并在你的命令中使用正确的相对路径引用它们。
需要注意的是，这种自包含的Node.js环境只适用于你的项目，其他全局环境中的Node.js并不会收到影响。这样你可以在不同的环境中进行开发，而无需安装全局的Node.js。

# 2023 8 11
开始学USB协议，为以后的项目（midi键盘、鼠标键盘）做准备！
首先要有宏观理解：https://blog.csdn.net/jimaofu0494/article/details/109233087
然后看细的：https://blog.csdn.net/weiaipan1314/category_10697813.html

# 2023 8 13
STM32F1系列PB3，PB4，PA13，PA14，PA15用作普通IO口的特殊配置
记得之前遇到过，今天又遇到了就记一下。
b站移动的头图，是用 图层+transform 实现的，检测鼠标移动，给不同图层不同的transform。

usb协议可以先做一个鼠标键盘，想法是手机做键盘，蓝牙连stm，stm解析之后以HID发送给电脑
CH559是51单片机的升级版
蓝牙协议分为两个角色，即服务端和客户端。服务端程序将会发出广播，等待客户端连接。客户端会搜寻可用的服务端，找到服务端后与服务端进行配对。客户端与服务端配对成功后，两者之间就可以开始传输信息。
HC05比HC06复杂一些，但硬件一样只是固件不一样。手机发送蓝牙，HC输出串口
JDY-31和HC05都是蓝牙模块，31是蓝牙3.0，只能当从机，05是蓝牙2.0，主从一体
ov2640有24个引脚，似乎驱动很麻烦，以后再说，反正近期大概是不会用视觉定位的，也许手掌定位会用到

看了npm构建blockly。学到以下内容：
- npm包寻找路径：向上一级找直到找到。所以先找本文件夹下的，最后找全局。
- package.json保存了依赖信息，用npm install可以安装里面的东西。
- npm run start运行的是package.json里的东西。
- 执行npm run start发现报错是上一级的node_modules没有这个包。发现原来是文件夹名有一个"&"，中途截断了路径。改了就好了。
- webpack打包了项目，控制台能看到打包后的代码，但是源文件index.html没有引用任何js。是因为webpack.config.js让它打包了。
- 对于安装在本地而不是全局的包，要用npx启动。比如npx webpack --mode production。npx会在当前目录下的./node_modules/.bin里去查找是否有可执行的命令，没有找到的话再从全局里查找是否有安装对应的模块，全局也没有的话就会自动下载对应的模块到一个临时目录，用完即删，不会占用本地资源。https://www.ruanyifeng.com/blog/2019/02/npx.html

html里面可以执行module，具体做法是：
1. 在html中，用module类别的script引入js文件：
```html
<script type="module" src="./js.mjs"></script>
```
2. 加了module的script和没加script引入js的方法不一样，不支持files协议，因为跨域问题无法加载js文件。所以必须开端口变成http协议。可以用liveServer插件实现。
3. 如果用普通的script加载内部有module的js，会报错：“Cannot use import statement outside a module”

# 2023 8 14
nodejs里面有两个模块化标准：CommonJS和ESM。前者是用require引入模块的，后者是用es6的module引入的，更好，浏览器中也支持。nodejs默认按CommonJS执行js文件，如果要用ESM则添加package.json，内容如下：
```json
{"type":"module"}
```
或者仅仅将js后缀改为mjs。
以下文件较为深刻地介绍了CommonJS：
https://juejin.cn/post/7108410887052427301

实测，浏览器中import是同步的，等import的顶级语句全执行完了才会下一个。GPT说是浏览器搞的鬼

## 2023 8 16
Github学生认证
没开梯子，申请了7次。学信网英文翻译要钱，果断放弃。学生证设计一坨shit，照片和校徽在一张纸两面，拍不全。最后用了英文成绩单，过了。
改了Github的昵称，强调我是学生。
没有网上说谷歌地图选地点环节，也只能拍照上传图片。

VScode顶部只有搜索框：右击搜索框，取消Quick的勾选

## 2023 8 17
试图用webpack对@mit-app-inventor/blockly-block-lexical-variables打包
相关操作记录在了项目文件夹下的README.md中

## 2023 8 18
box-shadow被遮挡。设置z-index无效。因为z-index只对定位元素有效！也就是说我们需要给菜单元素一个position:relative/absolute。
::before和::after必须要有content: '';才能显示