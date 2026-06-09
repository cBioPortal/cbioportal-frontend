import { customTabParamValidator } from './routes';

describe('customTabParamValidator', () => {
    it('accepts study resource table tab routes', () => {
        expect(
            customTabParamValidator({
                pathname: '/study/resourceTable_pathology',
            } as Location)
        ).toBe(true);
    });

    it('accepts legacy study resource tab routes', () => {
        expect(
            customTabParamValidator({
                pathname: '/study/openResource_pathology',
            } as Location)
        ).toBe(true);
    });
});
