import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExternalTool } from './ExternalTool';
import {
    IExternalToolProps,
    IExternalToolUrlParameters,
} from './IExternalTool';

jest.mock('cbioportal-frontend-commons', () => ({
    DefaultTooltip: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

describe('ExternalTool Component', () => {
    const testData = 'test data';
    const testDataLengthString = testData.length.toString();
    const testUrlFormat =
        'http://example.com?study=${studyName}&-DataLength=${dataLength}';
    const testStudyName = 'Test Study';
    const navigatorClipboardOriginal = navigator.clipboard;
    const windowLocationOriginal = window.location;
    const mockProps: IExternalToolProps = {
        toolConfig: {
            name: 'Test',
            id: 'test-tool',
            url_format: testUrlFormat,
            tooltip: 'Test Tooltip',
            iconImageSrc: 'test-icon.png',
        },
        baseTooltipProps: {},
        overlayClassName: '',
        downloadData: jest.fn(() => testData),
        urlFormatOverrides: {},
    };

    beforeEach(() => {
        (window as any).groupComparisonPage = {
            store: {
                displayedStudies: {
                    result: [{ name: testStudyName }],
                },
            },
        };

        // mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockResolvedValueOnce(''),
            },
        });

        // Mock window.location.href
        delete (window as any).location;
        (window as any).location = {
            href: '',
            assign: jest.fn().mockImplementation(url => {
                (window as any).location.href = url;
            }),
        };
    });

    afterEach(() => {
        delete (window as any).groupComparisonPage;
        Object.assign(navigator, navigatorClipboardOriginal);
        window.location = windowLocationOriginal;
    });

    it('renders correctly', () => {
        render(<ExternalTool {...mockProps} />);
        expect(screen.getByRole('button')).toBeTruthy();
    });

    it('returns the correct study name from getSingleStudyName', () => {
        const component = new ExternalTool(mockProps);
        expect(component.getSingleStudyName()).toBe('Test Study');
    });

    it('calls handleLaunchStart on button click', () => {
        const handleLaunchStartSpy = jest.spyOn(
            ExternalTool.prototype,
            'handleLaunchStart'
        );
        const { getByRole } = render(<ExternalTool {...mockProps} />);
        const button = getByRole('button');
        fireEvent.click(button);
        expect(handleLaunchStartSpy).toHaveBeenCalled();
    });

    it('copies data to clipboard and calls handleLaunchReady', async () => {
        const handleLaunchReadySpy = jest.spyOn(
            ExternalTool.prototype,
            'handleLaunchReady'
        );
        const { getByRole } = render(<ExternalTool {...mockProps} />);
        const button = getByRole('button');

        fireEvent.click(button);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testData);

        await waitFor(() => expect(handleLaunchReadySpy).toHaveBeenCalled());

        expect(handleLaunchReadySpy).toHaveBeenCalledWith({
            dataLength: testDataLengthString,
        });
    });

    it('formats URL correctly and redirects', () => {
        const component = new ExternalTool(mockProps);
        const urlParametersLaunch: IExternalToolUrlParameters = {
            studyName: testStudyName,
            dataLength: testDataLengthString,
        };

        // LOW: should manually assemble using actual test property values
        const expectedUrl =
            'http://example.com?study=Test%20Study&-DataLength=9';

        component.handleLaunchReady(urlParametersLaunch);

        expect(window.location.href).toBe(expectedUrl);
    });
});
