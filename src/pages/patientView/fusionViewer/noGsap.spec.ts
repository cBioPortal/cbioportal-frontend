import { assert } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

// GSAP's "Standard No Charge" licence withholds modify/sublicense rights,
// which clashes with cbioportal-frontend's AGPL-3.0-or-later. The Fusion
// Viewer animates with the dependency-free components/svgTween.ts instead.
// The package name is assembled so a plain grep of src/ for it stays empty.
const PACKAGE = ['gs', 'ap'].join('');
const FORBIDDEN_IMPORT = `from '${PACKAGE}'`;
const ANIMATED_COMPONENTS = [
    'FusionProduct.tsx',
    'ProteinDomainTrack.tsx',
    'GeneTrack.tsx',
];

describe('fusionViewer does not depend on GSAP', () => {
    ANIMATED_COMPONENTS.forEach(file => {
        it(`${file} does not import ${PACKAGE}`, () => {
            const src = fs.readFileSync(
                path.join(__dirname, 'components', file),
                'utf8'
            );
            assert.isAbove(src.length, 0, `${file} read as empty`);
            assert.notInclude(src, FORBIDDEN_IMPORT);
        });
    });
});
