declare module "@retorquere/bibtex-parser" {
	export function parse(
		input: string,
		options?: Record<string, unknown>,
	): {
		errors: Array<{ error?: string; input?: string }>;
		entries: Array<{
			key?: string;
			type?: string;
			fields?: Record<string, unknown>;
		}>;
	};
}
