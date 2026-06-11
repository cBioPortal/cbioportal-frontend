import getRollupOptions from '../config/rollup.config';
import pkg from './package.json';

export default getRollupOptions('src/index.ts', pkg.main, pkg.module);
