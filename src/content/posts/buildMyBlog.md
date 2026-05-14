---
title: 建站！!
description: 我是如何构建我的博客的
pubDate: 2026-05-11
heroImage: ../../assets/blog-placeholder-2.jpg
tags: [技术]
---

学了前端后，一直想建一个自己的网站。奈何一没文章二没设计，一直停留在幻想阶段。今年终于发了自己的第一篇论文，于是提上日程。

- 梦中情站：https://blog.bsgun.cn/
- 这个简约的也不错：https://qmmms.github.io/

## 浅尝辄止的HEXO
> Hexo的中文文档一坨狗屎，非常过时（还是得看英文或繁中的）<br>最后放弃了该技术路径

不想污染全局，选择局部安装：
```sh title="/madderscientist.github.io" frame="terminal"
pnpm install hexo
npx hexo init
```
但是报错：``\madderscientist.github.io\ not empty, please run `hexo init` on an empty folder and then copy your files into it``。而非空的文件夹里面是什么呢？是 `hexo` 本体啊！(乐)

于是用 `npx hexo init --help` 查看参数，最终使用：
```sh title="/madderscientist.github.io" frame="terminal"
mkdir tmp
npx hexo init ./tmp/ --no-install
```
之所以不install，是因为稍后要将内容移出tmp文件夹，且我要用pnpm。还有一个参数是 `--no-clone`，但是非clone得到的hexo版本不是最新的。

把文件移出tmp文件夹前，先把`package.json` `pnpm-lock.yaml` 和 `node_modules` 都删了；这些依赖在 `tmp/packages.json` 中都有，而用了 `pnpm` 也会尽可能复用。移出来后再次 `pnpm install` 即可完成局部安装。

这样就得到了最小依赖安装！

### 自定义主题
> 参考:
> - https://butterfly.zhheo.com/loading.html
> - https://www.cnblogs.com/yyhh/p/11058985.html

默认的主题可以卸了: `pnpm uninstall hexo-theme-landscape`

学了一些基本知识:
[Hexo默认使用layout布局](https://hexo.io/zh-cn/docs/templates.html)，具体来说，是将内容渲染为 `body` 这个量，然后交给 `layout.xxx`，而 `layout.xxx` 中往往有一个接收 `body` 的区域。
也可以完全绕开。有以下实现方法：
1. 在 `index.xxx` 开头用 `front-matter` 的格式写 `layout: false`。这样就不会套模板
2. 不要存在 `layout/layout.xxx` 文件。比如butterfly主题就是这么做的，此时需要手动继承
3. 以下划线开头的文件夹会被忽略，适合放公用成分。

除了 `body` 还有许多内置的变量。比如下面可以生成所有文章标题：
```njk
{% for post in site.posts.toArray() %}
  <li><a href="{{ post.path }}">{{ post.title }}</a></li>
{% else %}
  <li>暂无文章</li>
{% endfor %}
```

但是以字符串模板的形式写网页……都2026年了，这也太落后了；连官方文档都一股年代味。对着空荡荡的Hexo项目，我没有一点做下去的动力。

## 决定使用Astro
Astro在安装的时候好感度就拉满了。没有全局安装，自动新建文件夹，避开了hexo的全部雷点。

编写html的方式也非常舒服。Astro使用 `import` 来复用组件——简直太优雅、太可读了。相比于用 `njk` 编写模板逻辑，果然还是直接写 `js` 更舒服；而相比于 `ejs`，还是把逻辑全部放在一起、并且用 `ts` 更清楚！

## 基础的修改

### 字体
创建项目后，默认使用了本地的字体。然而依托ghPage建站，往往面临响应速度的问题。于是换成了系统原生字体栈。

然后又找到了一款非常耐看的字体——霞鹜文楷！于是用了[cdn的链接](https://github.com/CMBill/lxgw-wenkai-web)，并设置其为首选。

### 公式和 mermaid 的支持
使用 `remark-math` 和 `rehype-katex` 以支持公式渲染。但仅仅加入这两个插件会导致：虽然公式成功渲染，但后面紧跟原始公式字符串。这需要引入一个css:
```html
<link rel="stylesheet" crossorigin="anonymous"
  href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
  integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
/>
```

看了许多文章都是直接在 `BaseHead` 里面引入的，这违反了Astro的“按需加载”理念。解决方法是判断选然后字符串内是否有 `class="katex"`，有则加入（不过会误伤，比如这篇文章）。

Mermaid的支持：`rehype-mermaid` 是静态渲染，需要装 `playwright` 和一个浏览器（竟然不能用已有的Edge），而且渲染结果会以文件的形式存储。出于洁癖我放弃了这个做法。于是使用了运行时渲染的 `astro-mermaid`，虽然 `mermaid.js` 比较大，但是这个库也是按需加载的，渲染结果也不会在目录里拉屎，非常好！

### 基本信息的替换（实现CSS继承）
将默认的链接替换掉。知乎的SVG是官网上直接下载、然后删掉了一些路径得到的；B站的是修改的阿里图标库的SVG。

页头和页尾都有 social links，完全可以封装成组件。但这带来一个问题：页头和页尾对link的样式不一样。由于Astro默认是样式隔离的：即：虽然写的是 `div {...}` 但编译后会变成 `div[xxx] {...}`，导致无法作用到子组件。解决方法是用 `:global()` 包裹CSS选择器，这样就不会加作用域属性哈希。但是要注意，在非 shadow dom 时，无论 `<style>` 写哪都是全局作用域，所以一定要加上父选择器的限定，比如：
```css
.parent-class :global(.child-class) {}
```
编译后会变成
```css
.parent-class[data-astro-cid-xx1xxxxx] .child-class {}
```
此时 `parent-class` 是局部作用域，而 `child-class` 虽然是全局的选择器，但是被父选择器限定为只能作用于子组件，这样就实现了样式的继承。

### 404页面
直接写一个 `/pages/404.astro` 即可。曾经尝试用 `[...404].astro`，但是在静态部署的时候，需要提供 `getStaticPaths` 方法；而404处理的是不存在的路由，无法穷举，用不了这个方法。所以只能依赖部署方的自动识别。

### 代码块高亮
使用 `astro-expressive-code` 替代了内置的代码块，好处是：可以轻松实现行号、复制，这是纯 Shiki 难以实现的。


## 进阶的修改【持续中】

### 页面过渡
即切换页面的时候一些不变的组件不要闪烁，就像SPA一样。

一个方案是使用 `swup`，就像主题FireFly一样；第二个方案是使用官方自带的 [`<ClientRouter />`](https://docs.astro.build/zh-cn/guides/view-transitions/)，但是官方也在文档里说，由于浏览器API越来越强大，可以考虑直接用第三种方案—— [`View Transitions API`](https://developer.mozilla.org/zh-CN/docs/Web/API/View_Transition_API/Using)。

目前采用的是最后一种纯CSS的方式，改动最小。

### 文章搜索
使用 [`astro-pagefind`](https://github.com/shishkin/astro-pagefind)。具体做法是：
1. `pnpm add astro-pagefind`，根据 REAMDE 配置。
2. 根据最新的README，使用pagefind自带的UI（写法见下）
3. 运行 `pnpm build`，插件会自动进行索引
4. 运行 `pnpm preview` 就可以看到效果了！

为了在 `pnpm dev` 中看到效果，观察了一下源码。`astro-pagefind` 只是做了一个集成，源码很少。发现会用 debug 级别输出了目录，暂时调整为 info 级别，可以看到对路径做了一层代理：将 `/pagefind/` 的路由指向了 `/dist/`：
```ansi frame="none"
[pagefind] Serving pagefind from xxx\madderscientist.github.io\dist
```
所以要 `pnpm dev`，需要先 `pnpm build`。如果失败的话可以建立一个链接：
```powershell title="管理员权限 /madderscientist.github.io" frame="terminal"
New-Item -ItemType SymbolicLink -Path .\public\pagefind -Target .\dist\pagefind
```

`astro-prefind` 的文档几乎等于没有。去查了 `pagefind` 文档才找到一些有用的——比如[高亮](https://pagefind.app/docs/highlighting/)。此时UI为：
```astro
<PagefindConfig instance="search" preload="false" highlight-param="highlight" />
<!-- <pagefind-searchbox instance="search" show-sub-results="true"></pagefind-searchbox> -->
<pagefind-modal-trigger instance="search" shortcut="/" ></pagefind-modal-trigger>
<pagefind-modal instance="search"></pagefind-modal>
```

观察到 `dist/pagefind/pagefind-highlight.js` 已经存在，直接用：
```html
<script type="module">
	await import('/pagefind/pagefind-highlight.js');
	new PagefindHighlight({ highlightParam: "highlight" });
	// 【自己加的】跳转到高亮的搜索结果
	document.querySelector('.pagefind-highlight')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
</script>
```
还可以在html标签上写 `data-pagefind-body` 设置要索引哪里。只设置在了posts的内容上。

### 文章目录
`remark-sectionize`

### 评论
使用 `Giscus`，[参考](https://blog.moewah.com/posts/astro-blog-comment-system-integration-guide/)

主题切换还没做

### 语法拓展
主要是 GitHub 风格的 admonition。自己手写了一个，效果如下：

> [!NOTE]
> 语法为 `[!NOTE]`

> [!IMPORTANT]
> 语法为 `[!IMPORTANT]`

> [!WARNING]
> 语法为 `[!WARNING]`

> [!CAUTION]
> 语法为 `[!CAUTION]`

> [!TIP]
> 语法为 `[!TIP]`

> 原始 `blockquote` 长这样，换行最好用`<br>`<br>
> 编写过程中的技巧：`remark` 插件中要用 `process.stdout.write` 写输出（而不是 `console.log`）

其余的语法拓展不如直接在 MDX 里写，拓展 md 语法还是太鸡肋了。

## 细节的修改
### 标题链接
鼠标放在文章标题上，浮现一个link的图标，点击后改变链接（加上“#xxx”）。观察到本来就产生了id，但是时机为 `rehype` 之后：
```txt
By default, Astro injects id attributes after your rehype plugins have run.
```

不过也提供了[解决方法](https://docs.astro.build/en/guides/markdown-content/#heading-ids)：只要先使用
```js  showLineNumbers
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
```

后面的 `rehype` 插件就可以拿到 `node.properties.id` 了。后面的代码写在了 [plugins/rehype-anchor](../../plugins/rehype-anchor) 中。