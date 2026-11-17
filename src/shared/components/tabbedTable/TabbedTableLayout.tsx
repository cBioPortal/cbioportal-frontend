import * as React from 'react';

export interface ITabbedTableLayoutTab {
    id: string;
    label: string;
    count?: number;
}

export interface ITabbedTableLayoutProps {
    tabs?: ITabbedTableLayoutTab[];
    activeTabId?: string;
    onTabClick?: (tabId: string) => void;
    header?: React.ReactNode;
    chips?: React.ReactNode;
    builders?: React.ReactNode;
    children: React.ReactNode;
    testId?: string;
}

export default function TabbedTableLayout({
    tabs = [],
    activeTabId,
    onTabClick,
    header,
    chips,
    builders,
    children,
    testId,
}: ITabbedTableLayoutProps) {
    const hasHeaderContent =
        tabs.length > 0 || !!header || !!chips || !!builders;

    return (
        <div data-test={testId}>
            {hasHeaderContent && (
                <div
                    style={{
                        border: '1px solid #e6e6e6',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 16,
                        background: '#fcfcfc',
                    }}
                >
                    {tabs.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginBottom: 16,
                            }}
                            role="tablist"
                            aria-label="Table sections"
                        >
                            {tabs.map(tab => {
                                const isActive = tab.id === activeTabId;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => onTabClick?.(tab.id)}
                                        className={`btn btn-sm ${
                                            isActive
                                                ? 'btn-primary'
                                                : 'btn-default'
                                        }`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && (
                                            <span
                                                className="badge"
                                                style={{
                                                    background: isActive
                                                        ? 'rgba(255,255,255,0.2)'
                                                        : '#e1ecff',
                                                    color: isActive
                                                        ? '#fff'
                                                        : '#2056b3',
                                                }}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {header}
                    {chips}
                    {builders}
                </div>
            )}

            {children}
        </div>
    );
}
