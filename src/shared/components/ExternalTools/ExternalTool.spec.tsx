import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExternalTool } from './ExternalTool';
import { IExternalToolProps } from './IExternalTool';
//fnord
//import { CancerStudy } from 'cbioportal-ts-api-client';
//import { DefaultTooltip } from 'cbioportal-frontend-commons';

jest.mock('cbioportal-frontend-commons', () => ({
    DefaultTooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('ExternalTool Component', () => {
    const testData: string = 'test data';
    const mockProps: IExternalToolProps = {
        toolConfig: {
            name: 'Test',
            id: 'test-tool',
            url_format: 'http://example.com?study=${studyName}',
            tooltip: 'Test Tooltip',
            iconImageSrc: 'test-icon.png'
        },
        baseTooltipProps: {},
        overlayClassName: '',
        downloadData: jest.fn(() => testData),
        urlFormatOverrides: {}
    };

    beforeEach(() => {
        (window as any).groupComparisonPage = {
            store: {
                displayedStudies: {
                    result: [{ name: 'Test Study' }]
                }
            }
        };
    });

    afterEach(() => {
        delete (window as any).groupComparisonPage;
    });

    it('renders correctly', () => {
        render(<ExternalTool {...mockProps} />);
        expect(screen.getByRole('button')).toBeTruthy();
    });

    it('calls handleLaunchStart on button click', () => {
        const { getByRole } = render(<ExternalTool {...mockProps} />);
        const button = getByRole('button');
        const handleLaunchStartSpy = jest.spyOn(ExternalTool.prototype, 'handleLaunchStart');
        fireEvent.click(button);
        expect(handleLaunchStartSpy).toHaveBeenCalled();
    });

    it('returns the correct study name from getSingleStudyName', () => {
        const component = new ExternalTool(mockProps);
        expect(component.getSingleStudyName()).toBe('Test Study');
    });

    it('formats URL correctly and redirects', () => {
        const component = new ExternalTool(mockProps);
        const urlParametersLaunch = { extraParam: 'extraValue' };
        const expectedUrl = 'http://example.com?study=Test%20Study&extraParam=extraValue';

        const originalLocation = window.location.href;
        window.location = { href: '' } as any;

        component.handleLaunchReady(urlParametersLaunch);

        expect(window.location.href).toBe(expectedUrl);

        window.location.href = originalLocation;
    });

    it('calls handleLaunchReady', async () => {
        const { getByRole } = render(<ExternalTool {...mockProps} />);
        const button = getByRole('button');
        const handleLaunchReadySpy = jest.spyOn(ExternalTool.prototype, 'handleLaunchReady');

        fireEvent.click(button);

        expect(handleLaunchReadySpy).toHaveBeenCalledWith({ dataLength: testData.length });
    });
});
