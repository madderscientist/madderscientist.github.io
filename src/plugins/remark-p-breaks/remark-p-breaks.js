/**
 * @description 将段落中的换行符转换为 <br> 标签，以支持在段落内换行
 */
import { visit } from 'unist-util-visit';

export default function remarkPBreaks() {
	const REPLACE_REGEX = /\r\n|\r/g;	// 很重要!
	return (tree, file) => {
		// 可选：是否启用该功能
		// if (!file.path.includes("snippets")) return;
		visit(tree, 'paragraph', (node) => {
			let newChildren = [];
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				// 只处理文本节点
				if (child.type !== 'text') {
					newChildren.push(child);
					continue;
				}
				const lines = child.value.replace(REPLACE_REGEX, '\n').split('\n');
				// 没有换行则直接添加原节点
				if (lines.length <= 1) {
					newChildren.push(child);
					continue;
				}
				// 将换行分割成多个部分，中间插入 br 节点
				for (let j = 0; j < lines.length; j++) {
					if (lines[j]) {
						newChildren.push({
							type: 'text',
							value: lines[j]
						});
					}
					// 如果不是最后一行，插入 br 节点
					if (j < lines.length - 1) {
						// 避免与下一个原本就是 <br> 的 HTML 节点重复
						const isEndingNewline = (j === lines.length - 2 && !lines[lines.length - 1]);
						const nextNode = node.children[i + 1];
						if (isEndingNewline && nextNode && nextNode.type === 'html' && nextNode.value === '<br>') continue;
						
						newChildren.push({
							type: 'html',
							value: '<br>'
						});
					}
				}
			}

			node.children = newChildren;
		});
	};
}