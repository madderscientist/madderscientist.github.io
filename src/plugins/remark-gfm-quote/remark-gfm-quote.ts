import { visit } from 'unist-util-visit'

type ClassNames = string | string[]
type ClassNameMap = ClassNames | ((title: string) => ClassNames)

export interface Config {
    /**
     * 控制 blockquote 外层和标题的 className，决定最终生成的 class
     * - block: 可以是字符串、字符串数组或(title) => string/string[]，决定外层 <blockquote> 的 class
     * - title: 同理，应用于标题段落/元素
     */
    classNameMaps: {
        block: ClassNameMap;
        title: ClassNameMap;
    }

    /**
     * 允许的/admonition 标题过滤器（用于识别 blockquote 是否为 admonition）
     * - 可以是 string[]（如 ['[!NOTE]', '[!TIP]']），大小写不敏感
     * - 也可以是 (title: string) => string | null 这种自定义过滤函数，返回值为过滤后的标题，若为null则表示不匹配
     */
    titleExtractor: ((title: string) => string | null) | string[];

    /**
     * 决定如何将原始 title（比如 "[!NOTE]"）转换为显示用文本和用于 className 的类型标识
     * - 返回的 displayTitle 会显示在页面中
     * - checkedTitle 用于生成 class
     */
    titleTextMap: (title: string) => { displayTitle: string; checkedTitle: string };
}

// Match GitHub-style marker: [!NOTE]
const normalizeAlertName = (title: string): string | null => {
    const match = title.trim().match(/^\[!([^[\]\s]+)\]$/)
    return match ? match[1].toLowerCase() : null
}

const defaultConfig: Config = {
    classNameMaps: {
        block: title => title ? ['markdown-alert', `markdown-alert-${title}`] : 'markdown-alert',
        title: 'markdown-alert-title',
    },
    titleExtractor: normalizeAlertName,
    titleTextMap: (title) => {
        title = title.toLowerCase();
        return {
            displayTitle: title[0].toUpperCase() + title.slice(1), // 将 "[!NOTE]" 转为 "Note"
            checkedTitle: title,
        };
    },
}

function classNameMap(gen: ClassNameMap) {
    return (title: string) => {
        const classNames = typeof gen === 'function' ? gen(title) : gen;
        return Array.isArray(classNames) ? classNames.join(' ') : classNames;
    }
}

function nameFilter(filter: Config['titleExtractor']) {
    if (typeof filter === 'function') return filter;
    return (title: string) => {
        const normalized = title.trim().toLowerCase();
        const matched = filter.find(f => f.trim().toLowerCase() === normalized);
        return matched || null;
    }
}

// 给 node 添加 className
function addClass(node: any, className: string) {
    node.data ??= {};
    node.data.hProperties ??= {};
    const prev = node.data.hProperties.className;
    const list = Array.isArray(prev)
        ? prev.slice()
        : typeof prev === 'string' && prev.trim()
            ? prev.trim().split(/\s+/)
            : [];

    for (const c of className.split(/\s+/)) {
        if (c && !list.includes(c)) list.push(c);
    }

    node.data.hProperties.className = list.join(' ');
}

function handleNode(config: Config) {
    const FilterTitle = nameFilter(config.titleExtractor);

    return (node: any) => {
        if (node.type !== 'blockquote') return;

        const blockquote = node;
        const paragraph = blockquote.children?.[0];
        if (!paragraph || paragraph.type !== 'paragraph') return;

        const text = paragraph.children?.[0];
        if (!text || text.type !== 'text') return;

        let title: string;
        const titleEnd = text.value.indexOf('\n');

        if (titleEnd < 0) {
            // 后面跟着一个<br>，说明标题独占一个<p>
            if (paragraph.children.length > 1) {
                if (paragraph.children[1]?.type === 'break') {
                    paragraph.children.splice(1, 1);
                } else return;
            }
            title = text.value;
            paragraph.children.shift();
        } else {
            // 标题只取第一行，后续内容保留在段落中
            title = text.value.substring(0, titleEnd);
            text.value = text.value.substring(titleEnd + 1);
        }

        const extractedTitle = FilterTitle(title.trimEnd());
        if (!extractedTitle) return;
        const { displayTitle, checkedTitle } = config.titleTextMap(extractedTitle);

        blockquote.children.unshift({
            type: 'paragraph',
            children: [{ type: 'text', value: displayTitle }],
            data: {
                hProperties: {
                    className: classNameMap(config.classNameMaps.title)(checkedTitle),
                },
            },
        })

        blockquote.data ??= {};
        blockquote.data.hName = 'blockquote';
        addClass(blockquote, classNameMap(config.classNameMaps.block)(checkedTitle))
    }
}

export default function remarkGithubAlerts(
    options: Partial<Config> = {},
) {
    const config = { ...defaultConfig, ...options } as Config

    return (tree: any) => {
        visit(tree, handleNode(config))
    }
}