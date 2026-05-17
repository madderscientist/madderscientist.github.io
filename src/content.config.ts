import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import fs from 'node:fs/promises';

// 文章
const posts = defineCollection({
	// Load Markdown and MDX files in the `src/content/posts/` directory.
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			tags: z.array(z.string()).optional(),
			pinned: z.boolean().optional(),
		}),
});

import path from 'node:path';

// 读取单个 MD 文件并将其分块为多个独立的 Entry
const everyLearnLoader = {
	name: 'everylearn-loader',
	load: async ({ store, parseData, renderMarkdown, logger, watcher }) => {
		const filePath = './src/content/snippets/EveryLearn.md';
		const absoluteFilePath = path.resolve(process.cwd(), filePath);

		// 将解析逻辑封装，以支持初次加载和热更新
		const syncData = async () => {
			// 1. 读取大文件内容
			const content = await fs.readFile(filePath, 'utf-8');
			
			// 2. 按照正则 `\n# 数字` 切割文件
			const chunks = content.split(/(?=(?:^|\r?\n)#\s*[0-9])/);

			// 用于在省略时继承上下文的记录状态
			let currentYear = new Date().getFullYear();
			let currentMonth = new Date().getMonth() + 1;
			let chunkIndex = 0;
			
			// 标题格式: \n# 2024 05 20 # 可选的 meta 信息
			const H1_REG = /(?:^|\r?\n)#\s*([0-9][0-9\s]*)(?:#(.*))?/;

			store.clear(); // 刷新时清除旧数据，防止重复叠加

			for (const chunk of chunks) {
				chunkIndex++;
				
				// 3. 提取包含日期的部分和可选的 meta 信息
				const match = chunk.match(H1_REG);
				if (!match) continue;

				// 取出所有数字
				const nums = match[1].trim().split(/\s+/).map(Number);
				let meta = undefined;
				if (match[2]) {
					meta = match[2].trim();
					if (meta.length === 0) meta = undefined;
				}

				let y, m, d;	// 日期不可省略
				if (nums.length >= 3) {
					y = nums[0]; m = nums[1]; d = nums[2];
				} else if (nums.length === 2) {
					if (nums[0] > 12) {
						y = nums[0]; m = currentMonth; d = nums[1]; // 继承上一次的月份
					} else {
						y = currentYear; m = nums[0]; d = nums[1]; // 继承上一次的年份
					}
				} else if (nums.length === 1) {
					y = currentYear; m = currentMonth; d = nums[0];
				} else continue;

				// 处理年份缩写：使用上一次继承的年份作为参照
				const yStr = String(y);
				const prevYearStr = String(currentYear);
				// 取继承年份的前 (4 - yStr.length) 位，再加上传进来的缩写
				const fullYearStr = prevYearStr.slice(0, 4 - yStr.length) + yStr;

				// 更新当前遍历的年月状态供下一次迭代继承
				currentYear = parseInt(fullYearStr, 10);
				currentMonth = m;

				const year = String(currentYear);
				const month = String(currentMonth).padStart(2, '0');
				const day = String(d).padStart(2, '0');

				// 防止同一天记录导致覆盖，拼一个索引保证唯一性
				const id = `${year}-${month}-${day}-everylearn:${chunkIndex}`;
				const pubDate = new Date(`${year}-${month}-${day}`);
				
				// 4. 从内容中剥离该级标题（直接去掉 match[0] 匹配到的完整标题文本）
				const bodyContent = chunk.replace(match[0], '').trim();

				// 5. 存入 Astro 的 DataStore，传入 meta
				try {
					const data = await parseData({ id, data: { pubDate, meta } });
					const rendered = await renderMarkdown(bodyContent);
					store.set({ id, data, body: bodyContent, rendered });
				} catch(e) {
					logger.error(`Error occurred while processing chunk ${chunkIndex}: ${e} @${bodyContent}`);
				}
			}
		};

		// 1. 初始化时调用一次
		await syncData();

		// 2. 将此文件加入 Astro 的热更新监视器中 (确保我们在 pnpm dev 环境下)
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

export const collections = { posts, everyLearn };
