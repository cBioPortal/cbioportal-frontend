/// <reference types="jest" />
import { assert } from 'chai';
import {
    downsampleBoxScatterPointsByCategory,
    sampleEvenly,
} from './BoxScatterPlot';

describe('BoxScatterPlot large-dataset downsampling', () => {
    describe('sampleEvenly', () => {
        it('returns evenly spaced points with deterministic ordering', () => {
            const points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            assert.deepEqual(sampleEvenly(points, 4), [0, 2, 5, 7]);
        });

        it('returns all points when sample size exceeds input size', () => {
            const points = [1, 2, 3];
            assert.deepEqual(sampleEvenly(points, 10), [1, 2, 3]);
        });
    });

    it('does not downsample when dataset is below threshold', () => {
        const points = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            categoryIndex: i % 10,
        }));

        const sampled = downsampleBoxScatterPointsByCategory(
            points,
            500,
            2000
        );
        assert.equal(sampled.length, points.length);
        assert.deepEqual(sampled, points);
    });

    it('caps total rendered points for large datasets and remains deterministic', () => {
        const categoryCount = 120;
        const samplesPerCategory = 250;
        const points = Array.from(
            { length: categoryCount * samplesPerCategory },
            (_, i) => ({
                id: i,
                categoryIndex: Math.floor(i / samplesPerCategory),
            })
        );

        const first = downsampleBoxScatterPointsByCategory(points, 5000, 20000);
        const second = downsampleBoxScatterPointsByCategory(
            points,
            5000,
            20000
        );

        assert.equal(first.length, 5000);
        assert.deepEqual(first, second);

        const categoriesPresent = new Set(first.map(point => point.categoryIndex));
        assert.equal(categoriesPresent.size, categoryCount);
    });

    it('allocates more rendered points to larger categories', () => {
        const points: Array<{ id: number; categoryIndex: number }> = [];
        let id = 0;
        const sizes = [10000, 2000, 1000];
        sizes.forEach((size, categoryIndex) => {
            for (let i = 0; i < size; i++) {
                points.push({ id: id++, categoryIndex });
            }
        });

        const sampled = downsampleBoxScatterPointsByCategory(points, 1000, 2000);
        const counts = sampled.reduce(
            (acc, point) => {
                acc[point.categoryIndex] = (acc[point.categoryIndex] || 0) + 1;
                return acc;
            },
            {} as Record<number, number>
        );

        assert.isAbove(counts[0], counts[1]);
        assert.isAbove(counts[1], counts[2]);
        assert.equal(sampled.length, 1000);
    });

    it('preserves visibility for small-but-nonempty categories in skewed datasets', () => {
        const points: Array<{ id: number; categoryIndex: number }> = [];
        let id = 0;
        const largeCategorySize = 10000;
        const singletonCategoryCount = 25;

        // Create one large category and 25 singleton categories
        for (let i = 0; i < largeCategorySize; i++) {
            points.push({ id: id++, categoryIndex: 0 });
        }
        for (let categoryIndex = 1; categoryIndex <= singletonCategoryCount; categoryIndex++) {
            points.push({ id: id++, categoryIndex });
        }

        // Downsample with 100-point budget (plenty for all 26 categories)
        const sampled = downsampleBoxScatterPointsByCategory(
            points,
            100, // maxPoints
            2000 // threshold
        );

        // Verify all categories are represented
        const categoriesPresent = new Set(sampled.map(point => point.categoryIndex));
        assert.equal(sampled.length, 100);
        assert.equal(categoriesPresent.size, singletonCategoryCount + 1);

        // Verify every category has at least 1 point
        for (let categoryIndex = 0; categoryIndex <= singletonCategoryCount; categoryIndex++) {
            assert.isTrue(categoriesPresent.has(categoryIndex));
        }
    });
});
