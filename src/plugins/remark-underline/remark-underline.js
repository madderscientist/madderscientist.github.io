import { visit } from 'unist-util-visit';

export default function remarkUnderline() {
    return (tree, file) => {
        const source = String(file.value);

        // 遍历所有 emphasis 节点 (即 * 或 _)
        visit(tree, 'emphasis', (node) => {
            if (node.position && node.position.start) {
                // 根据节点的起始偏移量获取首字符
                const startOffset = node.position.start.offset;
                const startChar = source[startOffset];

                // 如果是用 _ 包裹的，将它改为 <u> 标签
                if (startChar === '_') {
                    node.data = node.data || {};
                    node.data.hName = 'u'; // 将转换为 HTML 的 <u>
                }
            }
        });

        // 双下划线变成其他样式
        visit(tree, 'strong', (node) => {
            if (node.position && node.position.start) {
                const startOffset = node.position.start.offset;
                if (source[startOffset] === '_') {
                    node.data = node.data || {};
                    node.data.hName = 'u';
                    // node.data.hProperties = { className: ['custom-underline-strong'] };
                }
            }
        });
    };
}