// The shared package config (../config/jest.config.ts) for a Node server: no
// DOM setup, and the `.js` suffixes of ES-module imports mapped back to the
// TypeScript sources.
export default {
    preset: 'ts-jest/presets/js-with-ts',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.test.json',
            isolatedModules: true,
        },
    },
    testMatch: ['<rootDir>/src/**/*.spec.ts'],
};
