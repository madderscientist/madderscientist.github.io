// @ts-check
import { defineConfig, logHandlers } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'astro-mermaid';	// 动态渲染

import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { pluginCollapsible } from 'expressive-code-collapsible';

// https://astro.build/config
export default defineConfig({
	site: 'https://madderscientist.netlify.app/',
	build: {
		format: 'directory',	// 去掉html后缀
	},
	integrations: [
		mermaid({
			theme: 'forest',
			autoTheme: true
		}),
		expressiveCode({
			themes: ['catppuccin-latte', 'catppuccin-macchiato'],
			plugins: [
				pluginLineNumbers(),
				pluginCollapsible({
					lineThreshold: 20,
					previewLines: 16,
				}),
			],
			defaultProps: {
				showLineNumbers: true,	// 默认显示行号
			},
			styleOverrides: {
				codeFontSize: '0.9rem'
			},
		}),
		mdx(), sitemap(), pagefind()],
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	// 不用本地字体; global.css里用系统原生字体栈
	devToolbar: {
		enabled: false
	}
});
