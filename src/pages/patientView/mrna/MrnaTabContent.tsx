import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, IReactionDisposer, makeObservable, reaction } from 'mobx';
import {
    VictoryAxis,
    VictoryBoxPlot,
    VictoryChart,
    VictoryLabel,
} from 'victory';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    MRNA_TAB_GENES,
    PatientViewPageStore,
} from 'pages/patientView/clinicalInformation/PatientViewPageStore';

interface IMrnaTabContentProps {
    store: PatientViewPageStore;
}

interface IBoxDatum {
    x: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    n: number;
}

// Linear-interpolation quantile over an already-sorted ascending array.
function quantileSorted(sorted: number[], q: number): number {
    if (sorted.length === 0) {
        return 0;
    }
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = sorted[base + 1];
    return next !== undefined
        ? sorted[base] + rest * (next - sorted[base])
        : sorted[base];
}

@observer
export default class MrnaTabContent extends React.Component<
    IMrnaTabContentProps,
    {}
> {
    private logDisposer: IReactionDisposer | undefined;

    constructor(props: IMrnaTabContentProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        const { store } = this.props;
        this.logDisposer = reaction(
            () => store.mrnaExpressionDataForGenes.isComplete,
            isComplete => {
                if (isComplete) {
                    console.log(store.mrnaExpressionDataForGenes.result);
                }
            },
            { fireImmediately: true }
        );
    }

    componentWillUnmount() {
        this.logDisposer?.();
    }

    @computed get boxData(): IBoxDatum[] {
        const { store } = this.props;
        const dataByEntrez = _.groupBy(
            store.mrnaExpressionDataForGenes.result,
            d => d.entrezGeneId
        );
        // One box per gene, preserving MRNA_TAB_GENES order.
        return MRNA_TAB_GENES.map(symbol => {
            const gene = store.mrnaTabGenes.result.find(
                g => g.hugoGeneSymbol.toUpperCase() === symbol.toUpperCase()
            );
            const values = gene
                ? (dataByEntrez[gene.entrezGeneId] || [])
                      .map(d => d.value)
                      .filter(v => v !== null && !isNaN(v))
                : [];
            const sorted = _.sortBy(values);
            return {
                x: symbol,
                min: sorted.length ? sorted[0] : 0,
                q1: quantileSorted(sorted, 0.25),
                median: quantileSorted(sorted, 0.5),
                q3: quantileSorted(sorted, 0.75),
                max: sorted.length ? sorted[sorted.length - 1] : 0,
                n: sorted.length,
            };
        }).filter(box => box.n > 0);
    }

    render() {
        const { store } = this.props;

        if (store.mrnaExpressionDataForGenes.isPending) {
            return <LoadingIndicator isLoading={true} size="big" center />;
        }

        const profile = store.mrnaExpressionMolecularProfile.result;
        if (!profile || this.boxData.length === 0) {
            return (
                <div style={{ padding: 20 }}>
                    No mRNA expression data is available for this study.
                </div>
            );
        }

        return (
            <div style={{ padding: 20 }}>
                <h4>mRNA expression — {profile.name}</h4>
                <VictoryChart
                    height={400}
                    width={600}
                    domainPadding={{ x: 60, y: 20 }}
                    padding={{ top: 20, bottom: 50, left: 70, right: 20 }}
                >
                    <VictoryAxis
                        label="Gene"
                        axisLabelComponent={<VictoryLabel dy={10} />}
                    />
                    <VictoryAxis
                        dependentAxis
                        label={profile.name}
                        axisLabelComponent={<VictoryLabel dy={-45} />}
                    />
                    <VictoryBoxPlot
                        boxWidth={40}
                        data={this.boxData}
                        style={{
                            min: { stroke: '#2986e2' },
                            max: { stroke: '#2986e2' },
                            q1: { fill: '#2986e2', fillOpacity: 0.6 },
                            q3: { fill: '#2986e2', fillOpacity: 0.6 },
                            median: { stroke: '#ffffff', strokeWidth: 2 },
                        }}
                    />
                </VictoryChart>
            </div>
        );
    }
}
