// Resolves a downloadable filename and MIME type for a markdown code fence.
//
// A fence can name its own file (```python cohort_script.py), in which case the
// name comes from the info string; otherwise it is derived from the language.

// Fence language id (and its common aliases) -> file extension. Covers what the
// assistant actually emits in this sidebar; anything else downloads as .txt.
const LANGUAGE_EXTENSIONS: Record<string, string> = {
    bash: 'sh',
    csv: 'csv',
    java: 'java',
    javascript: 'js',
    js: 'js',
    json: 'json',
    markdown: 'md',
    md: 'md',
    python: 'py',
    py: 'py',
    r: 'r',
    sh: 'sh',
    shell: 'sh',
    sql: 'sql',
    tsv: 'tsv',
    typescript: 'ts',
    ts: 'ts',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
};

// Only types safe to hand a browser as a download. Anything absent falls back
// to text/plain — notably text/html, which must never be blobbed from
// model-authored content.
const EXTENSION_MIME_TYPES: Record<string, string> = {
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    json: 'application/json',
    md: 'text/markdown',
    xml: 'application/xml',
    yaml: 'application/yaml',
    yml: 'application/yaml',
};

const DEFAULT_EXTENSION = 'txt';
const DEFAULT_MIME_TYPE = 'text/plain';
const MAX_FILENAME_LENGTH = 80;

// Control characters, path separators, and the characters Windows forbids in a
// name. Built from char codes so the source stays free of literal control bytes.
const UNSAFE_FILENAME_CHARS = new RegExp(
    `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(
        127
    )}<>:"|?*]`,
    'g'
);

export function extensionForLanguage(language?: string): string {
    if (!language) return DEFAULT_EXTENSION;
    return LANGUAGE_EXTENSIONS[language.toLowerCase()] ?? DEFAULT_EXTENSION;
}

export function mimeTypeForExtension(extension: string): string {
    return EXTENSION_MIME_TYPES[extension.toLowerCase()] ?? DEFAULT_MIME_TYPE;
}

function filenameFromMeta(meta?: string): string | undefined {
    if (!meta) return undefined;
    const keyed = meta.match(
        /\b(?:title|filename|file)=(?:"([^"]+)"|'([^']+)'|(\S+))/i
    );
    const keyedValue = keyed?.[1] ?? keyed?.[2] ?? keyed?.[3];
    if (keyedValue) return keyedValue;
    return meta.split(/\s+/).find(token => /^[\w.-]+\.\w+$/.test(token));
}

// Every caller routes through this, including names the model supplied: a
// filename is one path segment and nothing more.
export function sanitizeFilename(
    name: string,
    fallbackExtension: string
): string {
    const base = name.split(/[/\\]/).pop() ?? '';
    let safe = base
        .replace(UNSAFE_FILENAME_CHARS, '')
        .replace(/\s+/g, '_')
        .replace(/^\.+/, '')
        .trim();

    if (!safe) safe = `snippet.${fallbackExtension}`;
    if (!/\.\w+$/.test(safe)) safe = `${safe}.${fallbackExtension}`;

    if (safe.length > MAX_FILENAME_LENGTH) {
        const dot = safe.lastIndexOf('.');
        const extension = safe.slice(dot + 1);
        const stem = safe
            .slice(0, dot)
            .slice(0, Math.max(1, MAX_FILENAME_LENGTH - extension.length - 1));
        safe = `${stem}.${extension}`;
    }
    return safe;
}

export interface CodeFile {
    filename: string;
    mimeType: string;
    // Whether the fence named the file itself. The header shows the name only
    // when it did; a generated `snippet.*` is noise next to the language.
    named: boolean;
}

export function resolveCodeFile(
    language: string | undefined,
    meta: string | undefined
): CodeFile {
    const fallbackExtension = extensionForLanguage(language);
    const fromMeta = filenameFromMeta(meta);
    const filename = sanitizeFilename(
        fromMeta ?? `snippet.${fallbackExtension}`,
        fallbackExtension
    );
    const extension = filename.slice(filename.lastIndexOf('.') + 1);
    return {
        filename,
        mimeType: mimeTypeForExtension(extension),
        named: fromMeta !== undefined,
    };
}

// The info string lives on the hast node's `data`, not its className —
// mdast-util-to-hast puts it there and leaves only `language-<id>` in the class.
export function metaFromNode(node: unknown): string | undefined {
    const data = (node as { data?: { meta?: unknown } } | undefined)?.data;
    return typeof data?.meta === 'string' ? data.meta : undefined;
}

// PEP 723 inline script metadata: the comment block a self-contained Python
// script opens with, declaring the dependencies and interpreter `uv run` should
// build an environment from.
const SCRIPT_METADATA_OPEN = '# /// script';
const SCRIPT_METADATA_CLOSE = '# ///';

// Drives the "how to run this" affordance off the block actually being present
// rather than off the language, so a Python fence that lacks one never claims to
// be runnable on its own.
export function hasInlineScriptMetadata(code: string): boolean {
    const lines = code.split('\n');
    let index = 0;

    // The block is top-level — only a shebang and blank lines may precede it.
    if (lines[index]?.startsWith('#!')) index++;
    while (lines[index]?.trim() === '') index++;

    if (lines[index]?.trimEnd() !== SCRIPT_METADATA_OPEN) return false;
    return lines
        .slice(index + 1)
        .some(line => line.trimEnd() === SCRIPT_METADATA_CLOSE);
}

// sanitizeFilename has already collapsed whitespace, so the name never needs
// quoting here.
export function runCommand(filename: string): string {
    return `uv run ${filename}`;
}
