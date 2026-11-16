import { formatSlideId, slideKeyFromSlideId } from './wsiSlideId';

describe('formatSlideId', () => {
    it('prefixes a slide key with WSI- and groups it in fours', () => {
        expect(formatSlideId('1234094d6bc6')).toBe('WSI-1234-094d-6bc6');
    });

    it.each([
        '',
        'slide-1',
        '1234094d6bc',
        '1234094D6BC6',
        'WSI-1234-094d-6bc6',
    ])('leaves %p unchanged', value => {
        expect(formatSlideId(value)).toBe(value);
    });
});

describe('slideKeyFromSlideId', () => {
    it.each([
        ['WSI-1234-094d-6bc6', '1234094d6bc6'],
        [' wsi-1234-094D-6BC6 ', '1234094d6bc6'],
        ['1234-094d-6bc6', '1234094d6bc6'],
        ['WSI-1234094d6bc6', '1234094d6bc6'],
    ])('reads %p as %p', (text, key) => {
        expect(slideKeyFromSlideId(text)).toBe(key);
    });

    it.each([
        '1234094d6bc6',
        'P-0000012-T06-IM7',
        'WSI-1234-094d-6bc',
        'abcd-efgh-1234',
        'WSI_SAMPLE',
    ])('is null for %p', text => {
        expect(slideKeyFromSlideId(text)).toBeNull();
    });

    it('round-trips a formatted key', () => {
        expect(slideKeyFromSlideId(formatSlideId('0a1b2c3d4e5f'))).toBe(
            '0a1b2c3d4e5f'
        );
    });
});
