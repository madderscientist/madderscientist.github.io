import fs from "node:fs";
import { parse } from "@retorquere/bibtex-parser";

export type BibCreator = {
	firstName?: string;
	lastName?: string;
	name?: string;
	prefix?: string;
	suffix?: string;
};

export type BibFieldValue = string | BibCreator[] | string[] | undefined;

export type BibEntry = {
	key: string;
	type: string;
	fields: Record<string, BibFieldValue>;
};

export type BibliographyReference = {
	id: string;	// 生成的引用ID，格式为ref-{key}
	index: number;	// 引用编号，从1开始，决定最终显示内容
	entry: BibEntry;
};

type ParsedBibEntry = {
	key?: string;
	type?: string;
	fields?: Record<string, unknown>;
};

function toBibEntry(entry: ParsedBibEntry): BibEntry {
	return {
		key: entry.key || "",
		type: entry.type || "",
		fields: (entry.fields || {}) as BibEntry["fields"],
	};
}

export function loadBibEntries(bibPath: string, contextPath: string) {
	let result: { errors?: Array<{ error?: string }>; entries?: ParsedBibEntry[] };

	try {
		result = parse(fs.readFileSync(bibPath, "utf-8"), {
			sentenceCase: false,
		});
	} catch (error) {
		throw new Error(
			`Failed to parse bibliography "${bibPath}" for ${contextPath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	if (result.errors?.length) {
		const messages = result.errors
			.map((error) => error.error)
			.filter(Boolean)
			.join("; ");
		throw new Error(
			`Failed to parse bibliography "${bibPath}" for ${contextPath}: ${messages}`,
		);
	}

	const entries = new Map<string, BibEntry>();
	for (const parsedEntry of result.entries || []) {
		const entry = toBibEntry(parsedEntry);
		if (!entry.key) continue;
		if (entries.has(entry.key)) {
			throw new Error(
				`Duplicate bibliography alias "${entry.key}" in "${bibPath}" for ${contextPath}`,
			);
		}
		entries.set(entry.key, entry);
	}

	return entries;
}

export function getReferenceId(key: string) {
	return `ref-${key.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

// 修改此函数生成具体显示的引用文本，目前简单使用编号
export function formatCitationLabel(_entry: BibEntry, index: number) {
	return `[${index.toString()}]`;
}

export function escapeHtml(value: unknown) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function formatCreator(creator: BibCreator) {
	if (creator.name) return creator.name;

	const family = [creator.prefix, creator.lastName].filter(Boolean).join(" ");
	const given = creator.firstName;
	const suffix = creator.suffix;
	return [given, family, suffix].filter(Boolean).join(" ");
}

function formatCreators(value: BibFieldValue) {
	if (!Array.isArray(value)) return "";
	if (value.length === 0) return "";
	if (typeof value[0] === "string") return (value as string[]).join(", ");

	const creators = value as BibCreator[];
	if (creators.length <= 3) return creators.map(formatCreator).join(", ");
	return `${creators.slice(0, 3).map(formatCreator).join(", ")} et al.`;
}

function field(entry: BibEntry, name: string) {
	const value = entry.fields[name];
	return typeof value === "string" ? value : "";
}

export function formatReferenceHtml(entry: BibEntry, index: number) {
	const authors = formatCreators(entry.fields.author || entry.fields.editor);
	const title = field(entry, "title");
	const venue =
		field(entry, "journal") ||
		field(entry, "booktitle") ||
		field(entry, "publisher") ||
		field(entry, "institution");
	const year = field(entry, "year");
	const doi = field(entry, "doi");
	const url = field(entry, "url");

	const parts = [
		authors && `${escapeHtml(authors)}.`,
		title && `<cite>${escapeHtml(title)}</cite>.`,
		venue && `${escapeHtml(venue)}.`,
		year && `${escapeHtml(year)}.`,
		doi &&
			`DOI: <a href="https://doi.org/${escapeHtml(doi)}">${escapeHtml(doi)}</a>.`,
		!doi &&
			url &&
			`<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>.`,
	].filter(Boolean);

	return parts.length > 0 ? parts.join(" ") : escapeHtml(entry.key || index);
}
