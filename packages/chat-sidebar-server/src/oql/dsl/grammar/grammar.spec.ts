import { readFileSync } from 'fs';
import { join } from 'path';
import peggy from 'peggy';

const read = (path: string) => readFileSync(join(__dirname, path), 'utf-8');

const VENDORED = 'oql-parser.pegjs';
const FRONTEND = '../../../../../../src/shared/lib/oql/oql-parser.pegjs';
const GENERATED = 'oql-parser.js';

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
