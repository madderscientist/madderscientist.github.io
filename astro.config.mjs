// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'astro-mermaid';	// 动态渲染
import remarkGithubAlerts from './src/plugins/remark-gfm-quote/remark-gfm-quote';	// GitHub风格提示框
import remarkSingleLineNoLineNumbers from './src/plugins/remark-single-line-no-line-number/remark-single-line-no-line-number';
import remarkPBreaks from './src/plugins/remark-p-breaks/remark-p-breaks';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAnchor from './src/plugins/rehype-anchor/rehype-anchor';

import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { pluginCollapsible } from 'expressive-code-collapsible';
import { pluginLanguageBadge } from 'expressive-code-language-badge';

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
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => {
				if (theme.name === 'catppuccin-macchiato') return '.dark';
				return ':root';
			},
			plugins: [
				pluginLineNumbers(),
				pluginCollapsible({
					lineThreshold: 20,
					previewLines: 16,
				}),
				pluginLanguageBadge({
					textTransform: 'lowercase',
					excludeLanguages: ['txt', 'raw', 'ansi'],
					languageMap: {
						cpp: 'C++',
						csharp: 'C#',
						ts: 'TypeScript',
						js: 'JavaScript',
						py: 'Python',
						sh: 'Shell',
					},
				}),
			],
			defaultProps: {
				showLineNumbers: true,	// 默认显示行号
			},
			styleOverrides: {
				codeFontSize: '0.9rem',
			},
		}),
		mdx(), sitemap(), pagefind()],
	markdown: {
		remarkPlugins: [
			remarkMath,
			remarkSingleLineNoLineNumbers,
			remarkGithubAlerts,
			remarkPBreaks,
		],
		rehypePlugins: [
			rehypeKatex,
			rehypeHeadingIds,
			rehypeAnchor
		],
	},
	// 不用本地字体; global.css里用系统原生字体栈
	devToolbar: {
		enabled: false
	},
	vite: {
		esbuild: {
			// 移除生产环境下的 console 和 debugger
			drop: process.env.NODE_ENV === 'production' ? ["console", "debugger"] : [],
		},
	}
});
