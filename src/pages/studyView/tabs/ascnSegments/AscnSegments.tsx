import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';

import {
    assignCnCall,
    computeFrequencyData,
    AscnFrequencyMode,
    getBadHomdelSamples,
    loadAscnPrototypeData,
} from './AscnDataUtils';
import AscnGenomeFrequencyChart from './AscnGenomeFrequencyChart';
import AscnCallHeatmap from './AscnCallHeatmap';
import { StudyViewPageStore } from '../../StudyViewPageStore';

/**
 * Prototype "ASCN" study view tab.
 *
 * Reproduces, in-browser, the genome-wide visualizations from the ASCN
 * hackathon repro script (`ascn_hackathon_genomewide_viz_repro.R`): a
 * per-sample CN call track and a cohort-wide gain/loss (or LOH) frequency
 * track, both laid out on a concatenated genome-wide x-axis.
 *
 * Kept separate from the existing `CNSegments` tab: the heatmap/frequency
 * charts always render a fixed, bundled ASCN hackathon cohort snapshot
 * (`ascnHackathonPrototypeData.json`), not the currently queried/filtered
 * study samples. The top "Segmented copy-number data..." line is the one
 * exception -- it mirrors `CNSegments` and reports the real current study
 * selection count, for layout parity with the existing CN Segments tab.
 */
@observer
export default class AscnSegments extends React.Component<
    { store: StudyViewPageStore },
    {}
> {
    @observable private mode: AscnFrequencyMode = 'gain';
    @observable private cfThreshold: number = 0;
    @observable private showSegments: boolean = true;

    constructor(props: { store: StudyViewPageStore }) {
        super(props);
        makeObservable(this);
    }

    @computed get prototypeData() {
        return loadAscnPrototypeData();
    }

    @computed get segmentsWithCall() {
        return assignCnCall(this.prototypeData.segments);
    }

    @computed get badHomdelSamples() {
        return getBadHomdelSamples(this.prototypeData.segments);
    }

    @computed get sampleLabels() {
        return this.prototypeData.samples
            .map(s => s.tumorSampleId)
            .sort((a, b) => a.localeCompare(b));
    }

    @computed get frequencyData() {
        return computeFrequencyData(
            this.segmentsWithCall,
            this.prototypeData.layout,
            this.mode,
            this.cfThreshold,
            this.badHomdelSamples
        );
    }

    @computed get cfThresholdLabel() {
        return this.cfThreshold === 0
            ? 'all segs'
            : `≥ ${this.cfThreshold.toFixed(2)}`;
    }

    @computed get cfFilterLabel() {
        return this.cfThreshold === 0
            ? 'none'
            : `≥ ${this.cfThreshold.toFixed(1)}`;
    }

    @computed get nFreqSamples() {
        return this.frequencyData.nSamples;
    }

    @computed get nExcludedSamples() {
        return this.badHomdelSamples.size;
    }

    @computed get selectedSamplesText() {
        const result = this.props.store.selectedSamples.result;
        const count = result ? result.length : 0;
        const unit = count === 1 ? 'sample' : 'samples';
        return `Segmented copy-number data for the selected ${count} ${unit}.`;
    }

    @action.bound
    private setMode(mode: AscnFrequencyMode) {
        this.mode = mode;
    }

    @action.bound
    private toggleShowSegments() {
        this.showSegments = !this.showSegments;
    }

    @action.bound
    private onCfThresholdChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.cfThreshold = Number(e.target.value);
    }

    private modeButtonClass(mode: AscnFrequencyMode) {
        return `btn btn-sm ${
            this.mode === mode ? 'btn-primary' : 'btn-default'
        }`;
    }

    public render() {
        const nSamples = this.prototypeData.samples.length;

        if (nSamples === 0) {
            return (
                <div
                    style={{
                        marginLeft: 15,
                        marginBottom: 30,
                        maxWidth: 1550,
                    }}
                >
                    <strong>ASCN Cohort — CN Calls &amp; Frequency</strong>
                    <div
                        className="alert alert-info"
                        style={{ marginTop: 10, maxWidth: 700 }}
                    >
                        No local ASCN hackathon data found. This prototype tab
                        reads a generated data asset that is not part of this
                        repository (for data privacy reasons). Run{' '}
                        <code>
                            scripts/generate_ascn_hackathon_prototype_data.py
                        </code>{' '}
                        locally against your own copy of the ASCN hackathon
                        bundle to populate it.
                    </div>
                </div>
            );
        }

        const excludedSuffix =
            this.nExcludedSamples > 0
                ? `, ${this.nExcludedSamples} exclu.`
                : '';

        return (
            <div style={{ marginLeft: 15, marginBottom: 30, maxWidth: 1550 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <span>{this.selectedSamplesText}</span>

                    <button
                        type="button"
                        className="btn btn-sm btn-default"
                        onClick={this.toggleShowSegments}
                    >
                        {this.showSegments
                            ? 'Hide ASCN Segments'
                            : 'Show ASCN Segments'}
                    </button>

                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={this.modeButtonClass('gain')}
                            onClick={() => this.setMode('gain')}
                        >
                            Gain-focused
                        </button>
                        <button
                            type="button"
                            className={this.modeButtonClass('loh')}
                            onClick={() => this.setMode('loh')}
                        >
                            LOH-focused
                        </button>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <label
                            style={{
                                margin: 0,
                                fontWeight: 'normal',
                                fontSize: 12,
                            }}
                        >
                            CF/purity:
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={this.cfThreshold}
                            onChange={this.onCfThresholdChange}
                            style={{ verticalAlign: 'middle' }}
                        />
                        <span
                            style={{
                                fontSize: 12,
                                color: '#337ab7',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {this.cfThresholdLabel}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        padding: 15,
                        background: '#fff',
                    }}
                >
                    <strong>ASCN Cohort — CN Calls &amp; Frequency</strong>
                    <div
                        style={{
                            color: '#666',
                            fontSize: 12,
                            marginTop: 4,
                            marginBottom: 10,
                        }}
                    >
                        {nSamples} samples (heatmap) | {this.nFreqSamples}{' '}
                        samples (frequency{excludedSuffix}) | CF/purity filter:{' '}
                        {this.cfFilterLabel} | autosomes 1-22
                    </div>

                    {this.showSegments && (
                        <div style={{ marginBottom: 15, overflowX: 'auto' }}>
                            <AscnCallHeatmap
                                segments={this.segmentsWithCall}
                                layout={this.prototypeData.layout}
                                sampleLabels={this.sampleLabels}
                                mode={this.mode}
                                cfThreshold={this.cfThreshold}
                            />
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <AscnGenomeFrequencyChart
                            data={this.frequencyData}
                            layout={this.prototypeData.layout}
                            mode={this.mode}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
