import * as React from 'react';
import { observer } from 'mobx-react';
import { ButtonGroup } from 'react-bootstrap';
import classNames from 'classnames';
import ReactSelect from 'react-select';
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

/** Type-ahead rule: case-insensitive startsWith on the gene symbol only. */
export const geneOptionFilter = (
    option: { value: string },
    input: string
): boolean => option.value.toLowerCase().startsWith(input.toLowerCase());

const pickerStyles = {
    control: (s: any) => ({ ...s, minHeight: 24, fontSize: 11 }),
    valueContainer: (s: any) => ({ ...s, padding: '0 6px' }),
    input: (s: any) => ({ ...s, margin: 0, padding: 0 }),
    dropdownIndicator: (s: any) => ({ ...s, padding: 2 }),
    option: (s: any) => ({ ...s, fontSize: 11, padding: '4px 8px' }),
    menu: (s: any) => ({ ...s, zIndex: 10 }),
};

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
        const options = store.geneSummaries.map(g => ({
            value: g.gene,
            label: `${g.gene} (${g.sampleCount} samples)`,
        }));
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
                        <div
                            data-testid="anchor-gene-select"
                            style={{ display: 'inline-block', width: 220 }}
                        >
                            <ReactSelect
                                name="anchor-gene-select"
                                aria-label="Anchor gene"
                                options={options}
                                value={options.find(o => o.value === gene.gene)}
                                isSearchable
                                isClearable={false}
                                filterOption={geneOptionFilter}
                                onChange={(o: any) =>
                                    o && store.setAnchorGene(o.value)
                                }
                                styles={pickerStyles}
                            />
                        </div>
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
