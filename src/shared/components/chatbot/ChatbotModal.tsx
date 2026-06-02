import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { useHistory } from 'react-router-dom';

interface IChatbotSidebarProps {
    show: boolean;
    onHide: () => void;
}

// Helper to determine if a chart uses categorical or interval filters
function inferFilterType(chart: any): 'categorical' | 'interval' {
    if (chart.clinicalAttribute?.datatype === 'NUMBER') {
        return 'interval';
    }
    return 'categorical';
}

// Convert string array to DataFilterValue format
function toCategoricalFilterValues(values: string[]): any[] {
    return values.map(value => ({ value }));
}

// Convert interval objects to DataFilterValue format
function toIntervalFilterValues(
    values: Array<{ start?: number; end?: number }>
): any[] {
    return values.map(v => ({
        start: v.start,
        end: v.end,
    }));
}

const ChatbotEmbedded: React.FC<{ navigate: (path: string) => void }> = ({
    navigate,
}) => {
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Accept messages from localhost:3001 (development)
            if (!event.origin.startsWith('http://localhost:3001')) {
                console.log('Rejected message from:', event.origin, event.data);
                return;
            }

            console.log('Received message:', event.data);

            // Access the globally exposed store
            const store = (window as any).studyViewPageStore;

            switch (event.data.type) {
                case 'navigate': {
                    console.log('Navigating to:', event.data.path);
                    navigate(event.data.path);
                    break;
                }

                case 'apply_filter': {
                    const {
                        chartUniqueKey,
                        filterType,
                        values,
                    } = event.data.payload;

                    if (!store) {
                        console.error('StudyViewPageStore not found on window');
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'apply_filter',
                                    error: 'StudyViewPageStore not found',
                                },
                                event.origin
                            );
                        }
                        return;
                    }

                    // Validate chart exists
                    if (!store.chartMetaSet[chartUniqueKey]) {
                        console.error('Invalid chart key:', chartUniqueKey);
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'apply_filter',
                                    error: `Invalid chart key: ${chartUniqueKey}`,
                                    details: { chartUniqueKey },
                                },
                                event.origin
                            );
                        }
                        return;
                    }

                    // Convert and apply filter
                    try {
                        const filterValues =
                            filterType === 'categorical'
                                ? toCategoricalFilterValues(values)
                                : toIntervalFilterValues(values);

                        store.updateClinicalDataFilterByValues(
                            chartUniqueKey,
                            filterValues
                        );
                        console.log(
                            'Applied filter:',
                            chartUniqueKey,
                            filterValues
                        );
                    } catch (error) {
                        console.error('Error applying filter:', error);
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'apply_filter',
                                    error: 'Failed to apply filter',
                                    details: {
                                        error: String(error),
                                        chartUniqueKey,
                                    },
                                },
                                event.origin
                            );
                        }
                    }
                    break;
                }

                case 'clear_filter': {
                    const { chartUniqueKey } = event.data;

                    if (!store) {
                        console.error('StudyViewPageStore not found on window');
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'clear_filter',
                                    error: 'StudyViewPageStore not found',
                                },
                                event.origin
                            );
                        }
                        return;
                    }

                    try {
                        store.updateClinicalDataFilterByValues(
                            chartUniqueKey,
                            []
                        );
                        console.log('Cleared filter:', chartUniqueKey);
                    } catch (error) {
                        console.error('Error clearing filter:', error);
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'clear_filter',
                                    error: 'Failed to clear filter',
                                    details: {
                                        error: String(error),
                                        chartUniqueKey,
                                    },
                                },
                                event.origin
                            );
                        }
                    }
                    break;
                }

                case 'query_charts': {
                    const { responseId } = event.data;

                    console.log('[Chatbot] Query charts request received');
                    console.log('[Chatbot] Store available:', !!store);
                    console.log(
                        '[Chatbot] ChartMetaSet available:',
                        !!store?.chartMetaSet
                    );

                    if (!store) {
                        console.error(
                            '[Chatbot] StudyViewPageStore not found - are you on a study view page?'
                        );
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'query_charts',
                                    error:
                                        'StudyViewPageStore not found - please navigate to a study view page first',
                                },
                                event.origin
                            );
                        }
                        return;
                    }

                    if (!store.chartMetaSet) {
                        console.error('[Chatbot] ChartMetaSet not available');
                        if (event.source) {
                            (event.source as Window).postMessage(
                                {
                                    type: 'error_response',
                                    operation: 'query_charts',
                                    error: 'ChartMetaSet not available',
                                },
                                event.origin
                            );
                        }
                        return;
                    }

                    // Debug: log all charts
                    const allCharts = Object.values(store.chartMetaSet);
                    console.log(
                        '[Chatbot] Total charts in chartMetaSet:',
                        allCharts.length
                    );
                    console.log('[Chatbot] Sample chart:', allCharts[0]);

                    // Extract clinical charts only (as per user decision)
                    const charts = allCharts
                        .filter((chart: any) => {
                            // Filter to clinical attributes only (dataType enum value is 'Clinical')
                            const isClinical = chart.dataType === 'Clinical';
                            if (!isClinical) {
                                console.log(
                                    '[Chatbot] Filtered out chart:',
                                    chart.uniqueKey,
                                    'dataType:',
                                    chart.dataType
                                );
                            }
                            return isClinical;
                        })
                        .map((chart: any) => {
                            const chartInfo: any = {
                                uniqueKey: chart.uniqueKey,
                                displayName: chart.displayName,
                                description: chart.description || '',
                                dataType: 'clinical',
                                filterType: inferFilterType(chart),
                            };

                            // For categorical charts, include available values to help LLM with fuzzy matching
                            // Only if the chart has a clinicalAttribute
                            if (
                                chartInfo.filterType === 'categorical' &&
                                chart.clinicalAttribute
                            ) {
                                try {
                                    // Get available values from store data if available
                                    const dataCount = store.getClinicalDataCount(
                                        chart
                                    );
                                    if (dataCount && dataCount.result) {
                                        chartInfo.availableValues = dataCount.result.map(
                                            (item: any) => item.value
                                        );
                                    }
                                } catch (error) {
                                    console.log(
                                        '[Chatbot] Could not get data count for chart:',
                                        chart.uniqueKey,
                                        error
                                    );
                                }
                            }

                            return chartInfo;
                        });

                    console.log(
                        '[Chatbot] Found',
                        charts.length,
                        'clinical charts'
                    );
                    console.log(
                        '[Chatbot] Chart keys:',
                        charts.map((c: any) => c.uniqueKey)
                    );

                    // Send response back to iframe
                    if (event.source) {
                        (event.source as Window).postMessage(
                            {
                                type: 'charts_response',
                                responseId,
                                charts,
                            },
                            event.origin
                        );
                    }
                    break;
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate]);

    return (
        <iframe
            ref={iframeRef}
            src="http://localhost:3001"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="cBioPortal AI Assistant"
        />
    );
};

const ChatbotWrapper: React.FC = () => {
    const history = useHistory();
    const navigate = React.useCallback((path: string) => history.push(path), [
        history,
    ]);
    return <ChatbotEmbedded navigate={navigate} />;
};

@observer
export default class ChatbotModal extends React.Component<
    IChatbotSidebarProps,
    {}
> {
    @autobind
    handleClose() {
        this.props.onHide();
    }

    render() {
        const { show } = this.props;
        const width = 420;

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: `${width}px`,
                    height: '100vh',
                    backgroundColor: '#fff',
                    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
                    zIndex: 1050,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: show
                        ? 'translateX(0)'
                        : `translateX(${width}px)`,
                    transition: 'transform 0.3s ease',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: '1px solid #e5e5e5',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>
                        cBioPortal AI Assistant
                    </span>
                    <button
                        onClick={this.handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            fontSize: '20px',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '0 4px',
                        }}
                        title="Close"
                        aria-label="Close AI Assistant"
                    >
                        &times;
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {show && <ChatbotWrapper />}
                </div>
            </div>
        );
    }
}
