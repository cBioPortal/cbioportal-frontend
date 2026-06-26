import * as React from 'react';
import { observer } from 'mobx-react';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { SvGenePairRow } from './svGenePairData';

interface TopSvGenePairsTableProps {
    promise: MobxPromise<SvGenePairRow[]>;
    onSelectPair: (row: SvGenePairRow) => void;
}

const TopSvGenePairsTable: React.FC<TopSvGenePairsTableProps> = observer(
    ({ promise, onSelectPair }) => {
        if (promise.isPending) {
            return <div style={{ padding: 4, color: '#999' }}>Loading…</div>;
        }

        const rows = (promise.result || []).slice(0, 15);

        if (rows.length === 0) {
            return (
                <div style={{ padding: 4, color: '#999' }}>
                    No structural variants.
                </div>
            );
        }

        return (
            <div style={{ fontSize: 11, padding: 4 }}>
                <table>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Gene pair</th>
                            <th style={{ paddingLeft: 12 }}># samples</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row: SvGenePairRow) => (
                            <tr
                                key={row.uniqueKey}
                                data-testid="sv-pair-row"
                                style={{ cursor: 'pointer' }}
                                onClick={() => onSelectPair(row)}
                            >
                                <td>{row.uniqueKey}</td>
                                <td style={{ paddingLeft: 12 }}>
                                    {row.sampleCount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
);

export default TopSvGenePairsTable;
