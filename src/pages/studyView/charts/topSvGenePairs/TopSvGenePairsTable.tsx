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
            return <div>Loading…</div>;
        }

        const rows = (promise.result || []).slice(0, 15);

        return (
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Gene pair</th>
                            <th># samples</th>
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
                                <td>{row.sampleCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
);

export default TopSvGenePairsTable;
