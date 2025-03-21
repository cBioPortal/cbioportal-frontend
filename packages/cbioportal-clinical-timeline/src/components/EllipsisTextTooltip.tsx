import React, { useState, useRef, useEffect } from 'react';

interface IEllipsisTextTooltipProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';
}

export const EllipsisTextTooltip: React.FC<IEllipsisTextTooltipProps> = ({
    text,
    className = '',
    style = {},
    tooltipPlacement = 'top',
}) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    // Check if text is overflowing
    useEffect(() => {
        if (textRef.current) {
            const element = textRef.current;
            setIsOverflowing(element.scrollWidth > element.clientWidth);
        }
    }, [text]);

    return (
        <div
            className={`ellipsis-text-tooltip ${className}`}
            style={{ position: 'relative', ...style }}
        >
            <div
                ref={textRef}
                style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
                onMouseEnter={() => setShowTooltip(isOverflowing)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {text}
            </div>

            {showTooltip && (
                <div
                    className="ellipsis-tooltip"
                    style={{
                        position: 'absolute',
                        top:
                            tooltipPlacement === 'bottom'
                                ? '100%'
                                : tooltipPlacement === 'top'
                                ? '-30px'
                                : '0',
                        left:
                            tooltipPlacement === 'right'
                                ? '100%'
                                : tooltipPlacement === 'left'
                                ? '-100%'
                                : '0',
                        zIndex: 9999,
                        padding: '4px 8px',
                        backgroundColor: '#333',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '12px',
                        maxWidth: '300px',
                        wordWrap: 'break-word',
                    }}
                >
                    {text}
                </div>
            )}
        </div>
    );
};
