// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'astro-mermaid';	// 动态渲染

// https://astro.build/config
export default defineConfig({
	site: 'https://madderscientist.github.io',
	build: {
		format: 'directory',	// 去掉html后缀
	},
	integrations: [
		mermaid({
			theme: 'forest',
			autoTheme: true
		}),
		mdx(),
		sitemap()
	],
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	// 不用本地字体; global.css里用系统原生字体栈
	devToolbar: {
		enabled: false
	}
});
