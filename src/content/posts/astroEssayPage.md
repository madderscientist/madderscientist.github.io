---
title: Astro 即刻短文
description: 即刻短文是短小的文字片段，记录琐碎的内容，单独难以撑起一个页面。本文介绍了如何在Astro中实现这个功能
pubDate: 2026-05-17
tags: [技术, Astro, 前端]
---

# 前言
在搭建本博客网站之前，代码仓库只有一个 `EveryLearn.md`，里面按照时间顺序记录了我每天学到的东西（类似技术日记？）。每段文字都很短，单独无法撑起一个页面；但内容积少成多，作为一个大文章既笨重、又没有“更新”的感觉。我想要的是 “朋友圈” 那样的效果：所有内容按照时间倒序，每天的内容是一个卡片。这就是本文要实现功能。

最终效果请看左侧导航栏的“日记”。

# 格式约定
每天的内容用一级标题划分，一级标题前三个数字代表了“年”“月”“日”，后面的保留作为 meta，用于目录的显示（类似于摘要？）。例如：
```md
# 2025 5 1 # 学习了一天
## 关于XXX
XXX是...
## 关于YYY
YYY是...

# 2026 5 1
出去吃了一顿好的
```

为了进一步方便书写，设置年份和月份可以省略（继承上一个）

# 方案选择
首先要理解Astro的渲染流程。首先要 `defineCollection`，然后具体页面中，通过 `const { Content } = await render(post);` 获取到 `<Content />` 组件，这个组件就是具体 html 内容。

最先考虑的是直接写一个 remark 插件，然后写一个js进行运行时拆分。但是运行时还是太不优雅了。因此得在 `defineCollection` 进行拆分。

有两个方案：
1. 用 [`file()` 加载器](https://docs.astro.build/en/reference/content-loader-reference/#file-loader) 将条目表示为 list 或 record。
2. 自定义加载器，结果等效于多个独立的 `.md`。

前者 Gemini 说行不通：

## 为什么不能在页面中伪造对象或分割属性来渲染单文件多条目？

### 想做什么
我们有一份巨大的 Markdown 记录文件，内部通过 `# 年 月 日` 划分了多个小日记。为了在网页上能用 `<details>` 分别折叠渲染每一天，我们曾设想：
1. **存放为属性值**：读取这个大文件后，将每个日期的文本切片存放到一个大 Post 的 `data` 属性里（例如 `Record<日期, MD字符串>`）。
2. **伪造 Entry 对象**：在 .astro 页面遍历这些切片时，手工拼装出具有 `body` 字段的伪造对象（如 `{ id: 'fake', body: '切片的MD文本' }`）。
3. **强行调用引擎**：把这些子属性或伪造对象丢给 Astro 自带的 `await render(fakePost)`，期望它能在**页面运行时**当场解析 Markdown，并带着我们配置的所有 remark/rehype 插件、代码高亮渲染出专属的 `<Content />` 组件。

### ❌ 为什么行不通

- **`render()` 不是解析器，是“提取员”**：Astro 追求极致性能，耗时的 Markdown 解析流水线（包含所有插件）**只在构建时（Build-time）执行一次**。页面里的 `render()` 根本无法解析 Markdown 字符串，它只是拿着注册过的 ID 去提取早以编译好的 HTML 缓存。
- **伪造对象没有“户口”**：你在页面时才拼装出的伪造 Entry，没有在构建阶段经历过 Astro 的编译流水线。引擎里找不到它们的编译产物，传入 `render()` 必定直接报错。
- **纯文本痛失插件生态**：那些藏在 `post.data` 里的文本切片只会被 Astro 视为普通字符串（它严格遵循一个 Entry 只生成一个主 `<Content />`）。若想在页面里硬把这些字符串渲染出来，只能引入第三方库（如 `marked`），这将导致你的 Astro 专有特性和所有样式插件全部报废。

> **💡 唯一正解**：只能在**构建收集期**解决。通过手写 **Custom Loader** 读取并切片该文件，调用底层 `renderMarkdown` 编译后，用 `store.set()` 把每一块当成独立的合法 Entry 提前注册进 Astro 数据库。

# 自定义加载器
官方文档：
- [加载器](https://docs.astro.build/zh-cn/reference/content-loader-reference/#file-loader)
- [`defineCollection` 需要的 `loader`](https://docs.astro.build/en/reference/modules/astro-content/#loader)
- [实现loader](https://docs.astro.build/en/reference/content-loader-reference/#the-loader-object)

大部分代码让 Gemini 帮我写了，[具体代码](https://github.com/madderscientist/madderscientist.github.io/blob/main/src/content.config.ts)👈。
有几个注意点：
1. 根据[官方文档](https://docs.astro.build/zh-cn/reference/content-loader-reference/#loadercontextwatcher)配置 `watcher`，可以实现热重载
2. `store.set` 传递的会交给 `defineCollection` 中的 `schema` 检查，有错误要自己捕获；默认的输出提供不了具体哪里有问题
3. 输出用 `logger`

展示一些框架代码：
```ts
const everyLearnLoader = {
	name: 'everylearn-loader',
	load: async ({ store, parseData, renderMarkdown, logger, watcher }) => {
		const filePath = './src/content/snippets/EveryLearn.md';
		const absoluteFilePath = path.resolve(process.cwd(), filePath);

		// 将解析逻辑封装，以支持初次加载和热更新
		const syncData = async () => {
            store.clear();
            // 完成划分 略

            for (const chunk of chunks) {
                // 处理得到schema

                // 存入 Astro 的 DataStore，传入 meta
                try {
                    const data = await parseData({ id, data: { pubDate, meta } });
                    const rendered = await renderMarkdown(bodyContent);
                    store.set({ id, data, body: bodyContent, rendered });
                } catch(e) {
                    logger.error(`Error occurred while processing chunk ${chunkIndex}: ${e} @${bodyContent}`);
                }
            }
        };

		// 初始化时调用一次
		await syncData();

		// 将此文件加入 Astro 的热更新监视器中
		watcher?.on('change', async (changedPath) => {
			// 将 Windows 路径里的 \ 替换为 / 以便容错比较 
			if (changedPath.replace(/\\/g, '/') === absoluteFilePath.replace(/\\/g, '/')) {
				logger.info(`Reloading EveryLearn.md due to changes`);
				await syncData();
			}
		});
	}
} satisfies Loader;

const everyLearn = defineCollection({
	loader: everyLearnLoader,
	schema: z.object({
		pubDate: z.coerce.date(),
		meta: z.string().optional(),
	}),
});
```

# 评论
要给每一个日记加上评论区。暂时不打算做。

# 时间线（目录）
本来想写一个日期组件，展示哪些天有内容产出。但是记录其实很稀疏，用这种方式索引内容效率太低了；于是打算复用已经写好的TOC（感觉专门写一个时间线没有必要？）

首先要准备toc的内容。目录要求简短，比如年份可以只保留后两位；且我希望年份为一级标题，具体日期为二级。所以只能自己构建：
```ts
const posts = (await getCollection("everyLearn")).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);

const anchors: Array<MarkdownHeading & { index: number }> = [];
let lastYear = "";
for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const date = post.data.pubDate;
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    if (year !== lastYear) {
        anchors.push({
            depth: 1,
            slug: String(year),
            text: String(year),
            index: -1,
        });
        lastYear = year;
    }
    anchors.push({
        depth: 2,
        slug: post.id,
        text: `${year.slice(2)}/${month}/${day}${post.data.meta ? `: ${post.data.meta}` : ""}`,
        index: i,
    });
}
```

由于插入了年份，因此增加了 `index` 属性，用来从 `posts` 中索引具体内容。具体创建html时，只需要遍历 `anchors` 即可。

而CSS这里处理就比较随意了，简单用圆角矩形划分了一下范围。