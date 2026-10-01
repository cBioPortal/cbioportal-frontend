import * as React from 'react';
import { observer } from 'mobx-react';
import { ButtonGroup } from 'react-bootstrap';
import classNames from 'classnames';
import { FusionCohortStore } from '../FusionCohortStore';

const segStyle = (active: boolean): React.CSSProperties => ({
    lineHeight: 1,
    cursor: active ? 'default' : 'pointer',
    fontWeight: active ? 'bolder' : 'normal',
    color: active ? '#fff' : '#6c757d',
    backgroundColor: active ? '#6c757d' : '#fff',
});

const Seg: React.FC<{
    active: boolean;
    testId: string;
    onClick: () => void;
    children?: React.ReactNode;
}> = ({ active, testId, onClick, children }) => (
    <button
        data-testid={testId}
        className={classNames(
            { 'btn-secondary': active, 'btn-default': !active },
            'btn',
            'btn-xs'
        )}
        style={segStyle(active)}
        onClick={onClick}
    >
        {children}
    </button>
);

const label = (text: string) => (
    <span style={{ fontSize: 11, color: '#6c757d', marginLeft: 12 }}>
        {text}
    </span>
);

/** Pair | Gene anchor toggle with gene + side selectors (spec 3.3). */
const AnchorModeBar: React.FC<{ store: FusionCohortStore }> = observer(
    ({ store }) => {
        const a = store.anchor;
        const gene = a && a.mode === 'gene' ? a : undefined;
        const opposite = store.sideRows.oppositeCount;
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '4px 0 8px',
                }}
            >
                <span style={{ fontSize: 11, color: '#6c757d' }}>Anchor</span>
                <ButtonGroup>
                    <Seg
                        active={!gene}
                        testId="anchor-mode-pair"
                        onClick={() => store.setAnchorMode('pair')}
                    >
                        Pair
                    </Seg>
                    <Seg
                        active={!!gene}
                        testId="anchor-mode-gene"
                        onClick={() => store.setAnchorMode('gene')}
                    >
                        Gene
                    </Seg>
                </ButtonGroup>
                {gene && (
                    <>
                        {label('Gene')}
                        <select
                            data-testid="anchor-gene-select"
                            aria-label="Anchor gene"
                            value={gene.gene}
                            onChange={e => store.setAnchorGene(e.target.value)}
                            style={{ fontSize: 11 }}
                        >
                            {store.geneSummaries.map(g => (
                                <option key={g.gene} value={g.gene}>
                                    {g.gene} ({g.sampleCount} samples)
                                </option>
                            ))}
                        </select>
                        {label('Side')}
                        <ButtonGroup>
                            <Seg
                                active={gene.side === '5p'}
                                testId="anchor-side-5p"
                                onClick={() => store.setAnchorSide('5p')}
                            >
                                5′
                            </Seg>
                            <Seg
                                active={gene.side === '3p'}
                                testId="anchor-side-3p"
                                onClick={() => store.setAnchorSide('3p')}
                            >
                                3′
                            </Seg>
                        </ButtonGroup>
                        {opposite > 0 && (
                            <a
                                data-testid="anchor-opposite-note"
                                style={{ fontSize: 11, cursor: 'pointer' }}
                                onClick={() =>
                                    store.setAnchorSide(
                                        gene.side === '5p' ? '3p' : '5p'
                                    )
                                }
                            >
                                {opposite} event{opposite === 1 ? '' : 's'} with{' '}
                                {gene.gene} as{' '}
                                {gene.side === '5p' ? '3′' : '5′'} — switch side
                            </a>
                        )}
                    </>
                )}
            </div>
        );
    }
);

export default AnchorModeBar;
