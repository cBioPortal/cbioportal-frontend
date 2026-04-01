import * as React from 'react';
import { observer } from 'mobx-react';
import { FusionViewerStore } from './FusionViewerStore';
import { FusionEvent } from './data/types';

interface IFusionListSidebarProps {
    store: FusionViewerStore;
}

const SIDEBAR_WIDTH = 280;

const styles = {
    container: {
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        maxWidth: SIDEBAR_WIDTH,
        borderRight: '1px solid #ddd',
        backgroundColor: '#f8f8f8',
        overflowY: 'auto' as const,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    header: {
        padding: '10px 12px',
        fontSize: 13,
        fontWeight: 600 as const,
        color: '#555',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#fff',
    },
    list: {
        listStyle: 'none' as const,
        margin: 0,
        padding: 0,
    },
    item: {
        padding: '8px 12px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
        fontSize: 12,
        lineHeight: 1.45,
        borderLeft: '3px solid transparent',
        backgroundColor: '#fff',
        transition: 'background-color 0.1s',
    },
    itemSelected: {
        backgroundColor: '#e8eef7',
        borderLeftColor: '#5A73B3',
    },
    fusionName: {
        fontWeight: 600 as const,
        fontSize: 13,
        marginBottom: 2,
    },
    coordinates: {
        color: '#777',
        fontSize: 11,
    },
    metaRow: {
        marginTop: 3,
        display: 'flex',
        alignItems: 'center' as const,
        gap: 6,
        flexWrap: 'wrap' as const,
    },
    badge: {
        display: 'inline-block',
        fontSize: 10,
        padding: '1px 5px',
        borderRadius: 3,
        fontWeight: 600 as const,
    },
    significanceBadge: {
        backgroundColor: '#dff0d8',
        color: '#3c763d',
        border: '1px solid #d6e9c6',
    },
    readsBadge: {
        backgroundColor: '#eee',
        color: '#555',
    },
    callerBadge: {
        backgroundColor: '#eee',
        color: '#555',
    },
    intergenicName: {
        fontStyle: 'italic' as const,
        color: '#999',
    },
};

function formatFusionName(fusion: FusionEvent): string {
    const gene1 = fusion.gene1.symbol;
    const gene2 = fusion.gene2 ? fusion.gene2.symbol : 'IGR';
    return `${gene1}::${gene2}`;
}

function formatBreakpoint(fusion: FusionEvent): string {
    const bp1 = `chr${
        fusion.gene1.chromosome
    }:${fusion.gene1.position.toLocaleString()}`;
    if (!fusion.gene2) {
        return bp1;
    }
    const bp2 = `chr${
        fusion.gene2.chromosome
    }:${fusion.gene2.position.toLocaleString()}`;
    return `${bp1} \u2192 ${bp2}`;
}

@observer
export class FusionListSidebar extends React.Component<
    IFusionListSidebarProps
> {
    private handleClick = (fusionId: string) => {
        this.props.store.selectFusion(fusionId);
    };

    public render() {
        const { store } = this.props;
        const isIntergenic = (f: FusionEvent) => f.gene2 === null;

        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    Fusions ({store.fusions.length})
                </div>
                <ul style={styles.list}>
                    {store.fusions.map(fusion => {
                        const selected = fusion.id === store.selectedFusionId;
                        const intergenic = isIntergenic(fusion);

                        const itemStyle = {
                            ...styles.item,
                            ...(selected ? styles.itemSelected : {}),
                        };

                        const nameStyle = {
                            ...styles.fusionName,
                            ...(intergenic ? styles.intergenicName : {}),
                        };

                        return (
                            <li
                                key={fusion.id}
                                style={itemStyle}
                                onClick={() => this.handleClick(fusion.id)}
                                onMouseEnter={e => {
                                    if (!selected) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor =
                                            '#f0f0f0';
                                    }
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = selected
                                        ? '#e8eef7'
                                        : '#fff';
                                }}
                            >
                                <div style={nameStyle}>
                                    {formatFusionName(fusion)}
                                </div>
                                <div style={styles.coordinates}>
                                    {formatBreakpoint(fusion)}
                                </div>
                                <div style={styles.metaRow}>
                                    {fusion.significance !== 'NA' && (
                                        <span
                                            style={{
                                                ...styles.badge,
                                                ...styles.significanceBadge,
                                            }}
                                        >
                                            {fusion.significance}
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            ...styles.badge,
                                            ...styles.readsBadge,
                                        }}
                                    >
                                        {fusion.totalReadSupport} reads
                                    </span>
                                    <span
                                        style={{
                                            ...styles.badge,
                                            ...styles.callerBadge,
                                        }}
                                    >
                                        {fusion.callMethod}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}
