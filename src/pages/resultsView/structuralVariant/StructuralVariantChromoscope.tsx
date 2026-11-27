import * as React from 'react';
import { observer } from 'mobx-react';
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
} from 'mobx';
import _ from 'lodash';
import classnames from 'classnames';
import { CancerStudy, StructuralVariant } from 'cbioportal-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { FilterResetPanel } from 'react-mutation-mapper';
import ChromoscopeView, {
    SV_COLORS,
} from 'shared/components/chromoscope/ChromoscopeView';
import {
    ChromoscopeAssembly,
    ChromoscopeSVGroup,
    ChromoscopeXDomain,
    GenomeVisualizationSV,
    getChromoscopeAssembly,
    getChromoscopeXDomain,
    groupStructuralVariantsByAssembly,
    SV_CLASS,
    SvClass,
} from 'shared/lib/goslingTransforms/goslingStructuralVariantTransform';
import ResultsViewStructuralVariantMapperDataStore from './ResultsViewStructuralVariantMapperDataStore';

export interface IStructuralVariantChromoscopeProps {
    dataStore: ResultsViewStructuralVariantMapperDataStore;
    studyIdToStudy: { [studyId: string]: CancerStudy };
    /** The queried gene, used to choose the initial chromosome */
    entrezGeneId: number;
}

const ASSEMBLY_LABEL: { [assembly in ChromoscopeAssembly]: string } = {
    hg19: 'GRCh37/hg19',
    hg38: 'GRCh38/hg38',
};

function groupSize(group: ChromoscopeSVGroup) {
    return group.plotted.length + group.missingCoordinatesCount;
}

function pluralize(count: number, noun: string) {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Why a record got its displayed class, phrased for the info tooltip */
function classReason(d: GenomeVisualizationSV): string {
    switch (d.svclassSource) {
        case 'class':
            return d.svclass === SV_CLASS.OTHER
                ? 'inversion without Connection_Type'
                : 'Class column';
        case 'chromosomes':
            return 'breakpoints on different chromosomes';
        case 'connectionType':
            return 'Connection_Type';
        default:
            return d.originalClass && d.originalClass.toUpperCase() !== 'NA'
                ? `Class "${d.originalClass}" not recognized, no Connection_Type`
                : 'no Class or Connection_Type';
    }
}

interface ITypeSummary {
    svclass: SvClass;
    color: string;
    count: number;
    reasons: { reason: string; count: number }[];
}

function summarizeTypes(plotted: GenomeVisualizationSV[]): ITypeSummary[] {
    const byClass = _.groupBy(plotted, d => d.svclass);
    return SV_COLORS.domain
        .map((svclass, i) => {
            const records = byClass[svclass] || [];
            const reasons = _.sortBy(
                _.map(_.countBy(records, classReason), (count, reason) => ({
                    reason,
                    count,
                })),
                r => -r.count
            );
            return {
                svclass,
                color: SV_COLORS.range[i],
                count: records.length,
                reasons,
            };
        })
        .filter(t => t.count > 0);
}

@observer
export default class StructuralVariantChromoscope extends React.Component<
    IStructuralVariantChromoscopeProps
> {
    @observable private selectedAssembly: ChromoscopeAssembly | undefined;
    private disposers: IReactionDisposer[] = [];

    constructor(props: IStructuralVariantChromoscopeProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.disposers = [
            // show the reference genome of a structural variant picked in the table
            reaction(
                () => this.focusedStructuralVariant,
                sv => {
                    const assembly =
                        sv &&
                        getChromoscopeAssembly(
                            this.props.studyIdToStudy[sv.studyId]
                                ?.referenceGenome
                        );
                    if (assembly) {
                        this.selectAssembly(assembly);
                    }
                }
            ),
            // otherwise the table would show every row under the selection notice
            reaction(
                () => {
                    const selected = this.props.dataStore
                        .selectedStructuralVariant;
                    return !!selected && !this.visibleSet.has(selected);
                },
                hidden => {
                    if (hidden) {
                        this.resetSelection();
                    }
                }
            ),
        ];
    }

    componentWillUnmount() {
        this.disposers.forEach(dispose => dispose());
    }

    @computed private get visibleSet(): Set<StructuralVariant> {
        return new Set(_.flatten(this.props.dataStore.sortedFilteredData));
    }

    /** Rows matching the table search, in data order so sorting keeps the chart */
    @computed private get visibleStructuralVariants(): StructuralVariant[] {
        return _.flatten(this.props.dataStore.allData).filter(sv =>
            this.visibleSet.has(sv)
        );
    }

    @computed private get totalCount(): number {
        return this.props.dataStore.allData.length;
    }

    @computed private get focusedStructuralVariant() {
        return (
            this.props.dataStore.selectedStructuralVariant ||
            this.props.dataStore.highlightedStructuralVariant
        );
    }

    @computed private get focusedRecord(): GenomeVisualizationSV | undefined {
        const focused = this.focusedStructuralVariant;
        return focused
            ? this.activeGroup?.plotted.find(
                  d => this.visibleStructuralVariants[+d.sv_id] === focused
              )
            : undefined;
    }

    @computed private get xDomain(): ChromoscopeXDomain {
        return getChromoscopeXDomain(
            this.activeGroup?.plotted || [],
            undefined,
            this.props.entrezGeneId
        );
    }

    @computed private get focusXDomain(): ChromoscopeXDomain | undefined {
        return this.focusedRecord
            ? getChromoscopeXDomain(
                  [],
                  this.focusedRecord,
                  this.props.entrezGeneId
              )
            : undefined;
    }

    @action.bound
    private onChartClick(svId: string) {
        const sv = this.visibleStructuralVariants[+svId];
        if (sv) {
            this.props.dataStore.setHighlightedStructuralVariant(undefined);
            this.props.dataStore.setSelectedStructuralVariant(sv);
        }
    }

    @action.bound
    private resetSelection() {
        this.props.dataStore.setSelectedStructuralVariant(undefined);
    }

    @action.bound
    private selectAssembly(assembly: ChromoscopeAssembly) {
        this.selectedAssembly = assembly;
    }

    @computed private get grouped() {
        return groupStructuralVariantsByAssembly(
            this.visibleStructuralVariants,
            this.props.studyIdToStudy
        );
    }

    @computed private get groups(): ChromoscopeSVGroup[] {
        return _.sortBy(this.grouped.groups, g => -groupSize(g));
    }

    @computed private get activeGroup(): ChromoscopeSVGroup | undefined {
        return (
            this.groups.find(g => g.assembly === this.selectedAssembly) ||
            this.groups[0]
        );
    }

    private renderAssemblySwitch() {
        if (this.groups.length < 2) {
            return null;
        }
        return (
            <div className="btn-group btn-group-xs">
                {this.groups.map(group => (
                    <button
                        key={group.assembly}
                        type="button"
                        className={classnames('btn', 'btn-default', {
                            active: group === this.activeGroup,
                        })}
                        onClick={() => this.selectAssembly(group.assembly)}
                    >
                        {ASSEMBLY_LABEL[group.assembly]} ({groupSize(group)})
                    </button>
                ))}
            </div>
        );
    }

    private renderInfo(active: ChromoscopeSVGroup | undefined) {
        const otherAssemblies = this.groups.filter(g => g !== active);
        const unsupported = this.grouped.unsupportedGenomeCount;
        const filteredOut =
            this.totalCount - this.visibleStructuralVariants.length;
        const notShown = [
            filteredOut > 0
                ? `${pluralize(
                      filteredOut,
                      'structural variant'
                  )} not matching the table search`
                : undefined,
            active && active.missingCoordinatesCount > 0
                ? `${pluralize(
                      active.missingCoordinatesCount,
                      'structural variant'
                  )} without chromosome and position for both breakpoints`
                : undefined,
            ...otherAssemblies.map(
                g =>
                    `${groupSize(g)} from ${
                        ASSEMBLY_LABEL[g.assembly]
                    } studies (use the switch to view them)`
            ),
            unsupported > 0
                ? `${unsupported} from studies with a reference genome the visualization does not support`
                : undefined,
        ].filter(Boolean);

        const types = active ? summarizeTypes(active.plotted) : [];
        const withOrientation = active
            ? active.plotted.filter(d => d.strand1 !== '').length
            : 0;
        const cellStyle: React.CSSProperties = {
            padding: '2px 8px 2px 0',
            verticalAlign: 'top',
        };

        const overlay = (
            <div style={{ maxWidth: 480 }} data-test="chromoscope-info-overlay">
                {active && (
                    <p>
                        <b>Reference genome:</b>{' '}
                        {ASSEMBLY_LABEL[active.assembly]}, from{' '}
                        {active.studyIds.length === 1
                            ? `study ${active.studyIds[0]}`
                            : `studies ${active.studyIds.join(', ')}`}
                        .
                    </p>
                )}
                {notShown.length > 0 && (
                    <>
                        <b>Not shown:</b>
                        <ul style={{ paddingLeft: 18, marginBottom: 10 }}>
                            {notShown.map(text => (
                                <li key={text}>{text}</li>
                            ))}
                        </ul>
                    </>
                )}
                {types.length > 0 && (
                    <>
                        <b>SV types shown, and how each was determined:</b>
                        <table style={{ margin: '4px 0 10px' }}>
                            <tbody>
                                {types.map(t => (
                                    <tr key={t.svclass}>
                                        <td style={cellStyle}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 10,
                                                    height: 10,
                                                    marginRight: 4,
                                                    background: t.color,
                                                    border: '1px solid #ccc',
                                                }}
                                            />
                                            {t.svclass}
                                        </td>
                                        <td
                                            style={{
                                                ...cellStyle,
                                                textAlign: 'right',
                                            }}
                                        >
                                            {t.count}
                                        </td>
                                        <td style={cellStyle}>
                                            {t.reasons
                                                .map(r =>
                                                    t.reasons.length > 1
                                                        ? `${r.reason} (${r.count})`
                                                        : r.reason
                                                )
                                                .join('; ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                {active && active.plotted.length > 0 && (
                    <div>
                        <b>Breakpoint orientation arrows:</b>{' '}
                        {withOrientation === active.plotted.length
                            ? 'shown for all, from Connection_Type.'
                            : withOrientation === 0
                            ? 'not shown; these structural variants have no Connection_Type.'
                            : `shown for ${withOrientation} of ${active.plotted.length}; the others have no Connection_Type.`}
                    </div>
                )}
            </div>
        );

        return (
            <DefaultTooltip
                placement="right"
                overlay={overlay}
                destroyTooltipOnHide={true}
            >
                <i
                    className="fa fa-info-circle"
                    style={{ color: '#3786c2', cursor: 'pointer' }}
                    data-test="chromoscope-info"
                />
            </DefaultTooltip>
        );
    }

    private renderBody(active: ChromoscopeSVGroup | undefined) {
        const messageStyle: React.CSSProperties = {
            padding: '30px 0',
            textAlign: 'center',
            color: '#6c757d',
        };
        if (this.visibleStructuralVariants.length === 0) {
            return (
                <div style={messageStyle}>
                    No structural variants match the table search.
                </div>
            );
        }
        if (!active) {
            return (
                <div style={messageStyle}>
                    The reference genome of these studies is not supported by
                    the visualization.
                </div>
            );
        }
        if (active.plotted.length === 0) {
            return (
                <div style={messageStyle}>
                    None of these structural variants have chromosome and
                    position for both breakpoints, so they cannot be drawn.
                </div>
            );
        }
        return (
            <ChromoscopeView
                data={active.plotted}
                assembly={active.assembly}
                xDomain={this.xDomain}
                focusXDomain={this.focusXDomain}
                selectedId={this.focusedRecord?.sv_id}
                onClick={this.onChartClick}
            />
        );
    }

    render() {
        if (this.totalCount === 0) {
            return null;
        }
        const active = this.activeGroup;
        return (
            <div data-test="chromoscope" style={{ marginBottom: 20 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 5,
                    }}
                >
                    {this.renderAssemblySwitch()}
                    <span>
                        Showing {active ? active.plotted.length : 0} of{' '}
                        {pluralize(this.totalCount, 'structural variant')}
                        {active && ` (${ASSEMBLY_LABEL[active.assembly]})`}
                    </span>
                    {this.renderInfo(active)}
                </div>
                {this.renderBody(active)}
                {this.props.dataStore.selectedStructuralVariant && (
                    <FilterResetPanel
                        resetFilters={this.resetSelection}
                        filterInfo={`Showing ${pluralize(
                            this.props.dataStore.tableData.length,
                            'structural variant'
                        )} selected in the chart.`}
                        className="alert alert-success small"
                        buttonClass="btn btn-default btn-xs"
                    />
                )}
            </div>
        );
    }
}
