/**
 * Inline CSS rules from <style> elements into the `style` attribute of
 * matching SVG descendants, then strip the <style> elements. Produces a
 * self-contained SVG string suitable for download/export.
 *
 * This is a lightweight replacement for `juice` tailored to SVG export:
 *  - zero external dependencies (no cheerio, no HTML parser)
 *  - uses the browser's own DOMParser / querySelectorAll
 *  - handles comma-separated selectors and `!important` declarations
 *  - pre-existing inline `style` attributes usually take precedence, except
 *    when a rule declaration is marked `!important`
 *
 * Rules are applied in document order. `!important` declarations override
 * non-important ones (including pre-existing inline styles that are not
 * marked important), which mirrors the relevant cascade rules for the
 * simple, class-based CSS used in the chart SVGs we export.
 */
export default function inlineCssInSvg(svgString: string): string {
    if (typeof DOMParser === 'undefined') {
        return svgString;
    }

    const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        return svgString;
    }

    const root = doc.documentElement;
    const styleElements = Array.from(root.getElementsByTagName('style'));
    if (styleElements.length === 0) {
        return svgString;
    }

    for (const styleEl of styleElements) {
        const rules = parseCssRules(styleEl.textContent || '');
        for (const { selector, declarations } of rules) {
            let matches: Element[];
            try {
                matches = Array.from(root.querySelectorAll(selector));
            } catch {
                continue;
            }
            for (const el of matches) {
                const existing = parseDeclarations(
                    el.getAttribute('style') || ''
                );
                const merged = mergeDeclarations(declarations, existing);
                el.setAttribute('style', stringifyDeclarations(merged));
            }
        }
        styleEl.parentNode?.removeChild(styleEl);
    }

    return new XMLSerializer().serializeToString(root);
}

interface Declaration {
    value: string;
    important: boolean;
}

interface ParsedRule {
    selector: string;
    declarations: Record<string, Declaration>;
}

function parseCssRules(css: string): ParsedRule[] {
    const rules: ParsedRule[] = [];
    // Strip CSS comments.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let match: RegExpExecArray | null;
    while ((match = ruleRegex.exec(stripped)) !== null) {
        const selectorList = match[1].trim();
        const body = match[2];
        if (!selectorList || selectorList.startsWith('@')) {
            continue;
        }
        const declarations = parseDeclarations(body);
        if (Object.keys(declarations).length === 0) {
            continue;
        }
        for (const selector of selectorList.split(',')) {
            const trimmed = selector.trim();
            if (trimmed) {
                rules.push({ selector: trimmed, declarations });
            }
        }
    }
    return rules;
}

function parseDeclarations(declString: string): Record<string, Declaration> {
    const out: Record<string, Declaration> = {};
    for (const raw of declString.split(';')) {
        const decl = raw.trim();
        if (!decl) continue;
        const colon = decl.indexOf(':');
        if (colon < 0) continue;
        const prop = decl.slice(0, colon).trim();
        let value = decl.slice(colon + 1).trim();
        if (!prop || !value) continue;
        let important = false;
        const importantMatch = value.match(/!\s*important\s*$/i);
        if (importantMatch) {
            important = true;
            value = value.slice(0, importantMatch.index).trim();
        }
        out[prop] = { value, important };
    }
    return out;
}

function mergeDeclarations(
    ruleDecls: Record<string, Declaration>,
    inlineDecls: Record<string, Declaration>
): Record<string, Declaration> {
    const merged: Record<string, Declaration> = { ...ruleDecls };
    for (const [prop, decl] of Object.entries(inlineDecls)) {
        const existing = merged[prop];
        // Pre-existing inline styles override rule styles unless the rule is
        // !important and the inline declaration is not.
        if (existing && existing.important && !decl.important) {
            continue;
        }
        merged[prop] = decl;
    }
    return merged;
}

function stringifyDeclarations(decls: Record<string, Declaration>): string {
    return Object.entries(decls)
        .map(
            ([prop, { value, important }]) =>
                `${prop}: ${value}${important ? ' !important' : ''}`
        )
        .join('; ');
}
