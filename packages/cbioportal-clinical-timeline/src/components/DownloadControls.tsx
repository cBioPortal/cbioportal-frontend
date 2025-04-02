import React from 'react';
import { saveAsSvg, saveAsPng, saveAsPdf } from '../lib/downloadUtils';

interface IDownloadControlsProps {
    buttons: Array<'PDF' | 'PNG' | 'SVG'>;
    filename?: string;
    getSvg: () => SVGElement | null;
    additionalRightButtons?: Array<{
        key: string;
        content: React.ReactNode;
        onClick: () => void;
    }>;
    dontFade?: boolean;
    type?: string;
    style?: React.CSSProperties;
}

export const DownloadControls: React.FC<IDownloadControlsProps> = ({
    buttons,
    filename = 'timeline',
    getSvg,
    additionalRightButtons = [],
    dontFade = false,
    type = 'button',
    style = {},
}) => {
    // Implementation to handle download in various formats
    const handleDownload = (format: 'SVG' | 'PNG' | 'PDF') => {
        const svg = getSvg();

        if (!svg) {
            console.error('SVG element not found');
            return;
        }

        switch (format) {
            case 'SVG':
                saveAsSvg(svg, filename);
                break;
            case 'PNG':
                saveAsPng(svg, filename);
                break;
            case 'PDF':
                saveAsPdf(svg, filename);
                break;
        }
    };

    return (
        <div
            className={`download-controls ${dontFade ? 'no-fade' : ''}`}
            style={style}
        >
            <div className="btn-group">
                {buttons.map(format => (
                    <button
                        key={format}
                        className="btn btn-default btn-xs"
                        onClick={() => handleDownload(format)}
                        type={type as any}
                    >
                        {format}
                    </button>
                ))}
                {additionalRightButtons.map(button => (
                    <button
                        key={button.key}
                        className="btn btn-default btn-xs"
                        onClick={button.onClick}
                        type={type as any}
                    >
                        {button.content}
                    </button>
                ))}
            </div>
        </div>
    );
};
