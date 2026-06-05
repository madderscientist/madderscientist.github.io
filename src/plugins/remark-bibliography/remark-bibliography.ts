import path from "node:path";
import { visit } from "unist-util-visit";
import {
	formatCitationLabel,
	getReferenceId,
	loadBibEntries,
	type BibEntry,
	type BibliographyReference,
} from "../../utils/bibliography";

type LinkNode = {
	type: "link";
	url: string;
	children?: Array<Record<string, unknown>>;
	data?: Record<string, unknown>;
};

type VFileLike = {
	path?: string;
	history?: string[];
	data: {
		astro?: {
			frontmatter?: Record<string, unknown>;
		};
	};
};

function frontmatter(file: VFileLike) {
	file.data.astro ??= {};
	file.data.astro.frontmatter ??= {};
	return file.data.astro.frontmatter;
}

function sourcePath(file: VFileLike) {
	return file.path || file.history?.[0] || "";
}

function fail(message: string): never {
	process.exitCode = 1;
	throw new Error(message);
}

function bibliographyPath(file: VFileLike, bibliography: string) {
	const source = sourcePath(file);
	const baseDir = source ? path.dirname(source) : process.cwd();
	return path.resolve(baseDir, bibliography);
}

function loadBibliography(file: VFileLike, bibliography: string) {
	const bibPath = bibliographyPath(file, bibliography);
	try {
		return loadBibEntries(bibPath, sourcePath(file));
	} catch (error) {
		fail(
			`${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

export default function remarkBibliography() {
	return (tree: any, file: VFileLike) => {
		const fm = frontmatter(file);	// 由于解析md发生在构建具体页面时，此时已经可以获取fontmatter了
		const bibliography = fm.bibliography;
		let entries: Map<string, BibEntry> | undefined;
		const references: BibliographyReference[] = [];
		const indices = new Map<string, number>();

		visit(tree, "link", (node: LinkNode) => {
			// 语法规则: [](@{alias}) 其中`@`是识别的关键
			if (!node.url.startsWith("@")) return;

			const alias = node.url.slice(1).trim();
			if (!alias || alias.includes(",")) {	// 不支持多引用
				fail(`Invalid bibliography citation "${node.url}" in ${sourcePath(file)}. Use [](@alias).`);
			}
			if (typeof bibliography !== "string" || bibliography.trim() === "") {
				fail(`Citation [](@${alias}) in ${sourcePath(file)} requires frontmatter "bibliography".`);
			}

			entries ??= loadBibliography(file, bibliography);

			const entry = entries.get(alias);
			if (!entry) {
				fail(`Missing bibliography alias "${alias}" in "${bibliography}" for ${sourcePath(file)}`);
			}

			let index = indices.get(alias);
			if (!index) {	// 首次引用，分配编号
				index = references.length + 1;
				indices.set(alias, index);
				references.push({
					id: getReferenceId(alias),
					index,
					entry,
				});
			}
			node.url = `#${references[index - 1].id}`;
			node.children = [
				{
					type: "text",
					value: formatCitationLabel(entry, index),
				},
			];
			node.data ??= {};
			node.data.hProperties = {
				className: "citation",
				"aria-label": `Reference ${index}`,
			};
		});

		// 会修改原始的 frontmatter.bibliography
		fm.bibliography = {
			source: typeof bibliography === "string" ? bibliography : undefined,
			references,
		};
	};
}
