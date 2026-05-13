import { visit } from 'unist-util-visit';

export default function rehypeAnchor() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (/^h[1-6]$/.test(node.tagName)) {
				node.children.push({
					type: 'element',
					tagName: 'a',
					properties: { href: `#${node.properties.id}`, class: 'anchor-link' },
					children: [{ type: 'text', value: '#' }]
				});
			}
		});
	};
}