import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import peggy from 'peggy';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
    readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf-8');

const VENDORED = './oql-parser.pegjs';
const FRONTEND = '../../../../../../src/shared/lib/oql/oql-parser.pegjs';
const GENERATED = './oql-parser.js';

describe('vendored OQL grammar', () => {
    it("matches the frontend's grammar", () => {
        expect(read(VENDORED)).toBe(read(FRONTEND));
    });

    it('is what the generated parser was built from', () => {
        const source = peggy.generate(read(VENDORED), {
            output: 'source',
            format: 'es',
        });
        expect(read(GENERATED)).toBe(source);
    });
});
