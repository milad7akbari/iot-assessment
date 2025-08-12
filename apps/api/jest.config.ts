import type { Config } from 'jest';

const level = (process.env.COV_LEVEL || '').toLowerCase();
const thresholds = (() => {
    if (level === 'final') return { lines: 70, statements: 70, branches: 60, functions: 70 };
    if (level === 'phase4') return { lines: 60, statements: 60, branches: 50, functions: 60 };
    if (level === 'phase3') return { lines: 40, statements: 40, branches: 35, functions: 40 };
    return null;
})();

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    collectCoverage: !!process.env.COVERAGE,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/main.ts',
        '!src/**/**.module.ts'
    ],
    ...(thresholds
        ? { coverageThreshold: { global: thresholds } }
        : {}),
};

export default config;
