import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, toJS } from 'mobx';
import autobind from 'autobind-decorator';
import 'rc-tooltip/assets/bootstrap_white.css';
import _ from 'lodash';
import {
    amplificationGroup,
    cnaGroup,
    CopyNumberEnrichmentEventType,
    deletionGroup,
    frameshiftDeletionGroup,
    frameshiftGroup,
    frameshiftInsertionGroup,
    fusionGroup,
    inframeDeletionGroup,
    inframeGroup,
    inframeInsertionGroup,
    missenseGroup,
    MutationEnrichmentEventType,
    mutationGroup,
    nonsenseGroup,
    nonstartGroup,
    nonstopGroup,
    otherGroup,
    spliceGroup,
    truncationGroup,
} from 'shared/lib/comparison/ComparisonTabUtils';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';

export interface IAlterationEnrichmentTypeSelectorHandlers {
    updateSelectedMutations: (
        selectedMutations: MutationEnrichmentEventType[]
    ) => void;
    updateSelectedCopyNumber: (
        selectedCopyNumber: CopyNumberEnrichmentEventType[]
    ) => void;
}

export interface IAlterationEnrichmentTypeSelectorProps {
    handlers: IAlterationEnrichmentTypeSelectorHandlers;
    store: ComparisonStore;
    classNames?: string;
}

enum checkbox {
    mutations = 'mutations',
    missense = 'missense',
    inframe = 'inframe',
    inframedeletion = 'inframedeletion',
    inframeinsertion = 'inframeinsertion',
    truncating = 'truncating',
    nonsense = 'nonsense',
    frameshift = 'frameshift',
    frameshiftinsertion = 'frameshiftinsertion',
    frameshiftdeletion = 'frameshiftdeletion',
    nonstart = 'nonstart',
    nonstop = 'nonstop',
    splice = 'splice',
    other = 'other',
    structvar = 'structvar',
    cna = 'cna',
    amplification = 'amplification',
    deletion = 'deletion',
}

@observer
export default class AlterationEnrichmentTypeSelector extends React.Component<
    IAlterationEnrichmentTypeSelectorProps,
    {}
> {
    private currentSelectedMutations: {
        [key in MutationEnrichmentEventType]?: boolean;
    };
    private currentSelectedCopyNumber: {
        [key in CopyNumberEnrichmentEventType]?: boolean;
    };

    componentWillMount() {
        this.currentSelectedMutations = observable(
            toJS(this.props.store.selectedMutationEnrichmentEventTypes)
        );
        this.currentSelectedCopyNumber = observable(
            toJS(this.props.store.selectedCopyNumberEnrichmentEventTypes)
        );
    }

    @computed get allMutationsSelected() {
        return this.allSelectedMut(mutationGroup);
    }

    @computed get allMissenseSelected() {
        return this.allSelectedMut(missenseGroup);
    }

    @computed get allInframeSelected() {
        return this.allSelectedMut(inframeGroup);
    }

    @computed get allInframeDeletionsSelected() {
        return this.allSelectedMut(inframeDeletionGroup);
    }

    @computed get allInframeInsertionsSelected() {
        return this.allSelectedMut(inframeInsertionGroup);
    }

    @computed get allTruncationsSelected() {
        return this.allSelectedMut(truncationGroup);
    }

    @computed get allNonsenseSelected() {
        return this.allSelectedMut(nonsenseGroup);
    }

    @computed get allFrameshiftSelected() {
        return this.allSelectedMut(frameshiftGroup);
    }

    @computed get allFrameshiftInsertionsSelected() {
        return this.allSelectedMut(frameshiftInsertionGroup);
    }

    @computed get allFrameshiftDeletionsSelected() {
        return this.allSelectedMut(frameshiftDeletionGroup);
    }

    @computed get allNonStartSelected() {
        return this.allSelectedMut(nonstartGroup);
    }

    @computed get allNonStopSelected() {
        return this.allSelectedMut(nonstopGroup);
    }

    @computed get allSpliceSelected() {
        return this.allSelectedMut(spliceGroup);
    }

    @computed get allOtherSelected() {
        return this.allSelectedMut(otherGroup);
    }

    @computed get allFusionsSelected() {
        return this.allSelectedMut(fusionGroup);
    }

    @computed get allCopyNumberSelected() {
        return this.allSelectedCna(cnaGroup);
    }

    @computed get allAmplificationsSelected() {
        return this.allSelectedCna(amplificationGroup);
    }

    @computed get allDeletionsSelected() {
        return this.allSelectedCna(deletionGroup);
    }

    private allSelectedMut(group: MutationEnrichmentEventType[]): boolean {
        return _.every(group, type => this.currentSelectedMutations[type]);
    }

    private allSelectedCna(group: CopyNumberEnrichmentEventType[]): boolean {
        return _.every(group, type => this.currentSelectedCopyNumber[type]);
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case checkbox.mutations:
                this.toggleMutGroup(mutationGroup, !this.allMutationsSelected);
                break;
            case checkbox.missense:
                this.toggleMutGroup(missenseGroup, !this.allMissenseSelected);
                break;
            case checkbox.inframe:
                this.toggleMutGroup(inframeGroup, !this.allInframeSelected);
                break;
            case checkbox.inframedeletion:
                this.toggleMutGroup(
                    inframeDeletionGroup,
                    !this.allInframeDeletionsSelected
                );
                break;
            case checkbox.inframeinsertion:
                this.toggleMutGroup(
                    inframeInsertionGroup,
                    !this.allInframeInsertionsSelected
                );
                break;
            case checkbox.truncating:
                this.toggleMutGroup(
                    truncationGroup,
                    !this.allTruncationsSelected
                );
                break;
            case checkbox.nonsense:
                this.toggleMutGroup(nonsenseGroup, !this.allNonsenseSelected);
                break;
            case checkbox.frameshift:
                this.toggleMutGroup(
                    frameshiftGroup,
                    !this.allFrameshiftSelected
                );
                break;
            case checkbox.frameshiftinsertion:
                this.toggleMutGroup(
                    frameshiftInsertionGroup,
                    !this.allFrameshiftInsertionsSelected
                );
                break;
            case checkbox.frameshiftdeletion:
                this.toggleMutGroup(
                    frameshiftDeletionGroup,
                    !this.allFrameshiftDeletionsSelected
                );
                break;
            case checkbox.nonstart:
                this.toggleMutGroup(nonstartGroup, !this.allNonStartSelected);
                break;
            case checkbox.nonstop:
                this.toggleMutGroup(nonstopGroup, !this.allNonStopSelected);
                break;
            case checkbox.splice:
                this.toggleMutGroup(spliceGroup, !this.allSpliceSelected);
                break;
            case checkbox.other:
                this.toggleMutGroup(otherGroup, !this.allOtherSelected);
                break;
            case checkbox.structvar:
                this.toggleMutGroup(fusionGroup, !this.allFusionsSelected);
                break;
            case checkbox.cna:
                this.toggleCnaGroup(cnaGroup, !this.allCopyNumberSelected);
                break;
            case checkbox.amplification:
                this.toggleCnaGroup(
                    amplificationGroup,
                    !this.allAmplificationsSelected
                );
                break;
            case checkbox.deletion:
                this.toggleCnaGroup(deletionGroup, !this.allDeletionsSelected);
                break;
        }
    }

    @action
    private toggleCnaGroup(
        group: CopyNumberEnrichmentEventType[],
        value: boolean
    ) {
        _.forEach(group, type => {
            this.currentSelectedCopyNumber[type] = value;
        });
    }

    @action
    private toggleMutGroup(
        group: MutationEnrichmentEventType[],
        value: boolean
    ) {
        _.forEach(group, type => {
            this.currentSelectedMutations[type] = value;
        });
    }

    @autobind
    private updateSelectedAlterations(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        const selectedMutations = _(this.currentSelectedMutations)
            .pickBy()
            .keys()
            .value();
        const selectedCopyNumber = _(this.currentSelectedCopyNumber)
            .pickBy()
            .keys()
            .value();
        this.props.handlers.updateSelectedMutations(
            selectedMutations as MutationEnrichmentEventType[]
        );
        this.props.handlers.updateSelectedCopyNumber(
            selectedCopyNumber as CopyNumberEnrichmentEventType[]
        );
    }

    render() {
        return (
            <div
                style={{
                    position: 'absolute',
                    zIndex: 2,
                    background: '#eee',
                    borderRadius: '4px',
                    padding: '10px',
                }}
            >
                <h5>Select Alteration Types</h5>
                <div className="checkbox">
                    <label>
                        <input
                            data-test="Mutations"
                            type="checkbox"
                            value={checkbox.mutations}
                            checked={this.allMutationsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        <b>Mutations</b>
                    </label>
                </div>

                {/*-+=+ MISSENSE +-+-*/}
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Missense"
                            type="checkbox"
                            value={checkbox.missense}
                            checked={this.allMissenseSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Missense
                    </label>
                </div>

                {/*-+=+ INFRAME +-+-*/}
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="InFrame"
                            type="checkbox"
                            value={checkbox.inframe}
                            checked={this.allInframeSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Inframe
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="InframeInsertion"
                            type="checkbox"
                            value={checkbox.inframeinsertion}
                            checked={this.allInframeInsertionsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Inframe Insertion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="InframeDeletion"
                            type="checkbox"
                            value={checkbox.inframedeletion}
                            checked={this.allInframeDeletionsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Inframe Deletion
                    </label>
                </div>

                {/*-+=+ TRUNCATING +-+-*/}
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Truncating"
                            type="checkbox"
                            value={checkbox.truncating}
                            checked={this.allTruncationsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Truncating
                    </label>
                </div>

                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="Nonsense"
                            type="checkbox"
                            value={checkbox.nonsense}
                            checked={this.allNonsenseSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Nonsense
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="Frameshift"
                            type="checkbox"
                            value={checkbox.frameshift}
                            checked={this.allFrameshiftSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Frameshift
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '60px' }}>
                    <label>
                        <input
                            data-test="FrameshiftInsertion"
                            type="checkbox"
                            value={checkbox.frameshiftinsertion}
                            checked={this.allFrameshiftInsertionsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Frameshift Insertion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '60px' }}>
                    <label>
                        <input
                            data-test="FrameshiftDeletion"
                            type="checkbox"
                            value={checkbox.frameshiftdeletion}
                            checked={this.allFrameshiftDeletionsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Frameshift Deletion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="Nonstart"
                            type="checkbox"
                            value={checkbox.nonstart}
                            checked={this.allNonStartSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Nonstart
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="Nonstop"
                            type="checkbox"
                            value={checkbox.nonstop}
                            checked={this.allNonStopSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Nonstop
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '40px' }}>
                    <label>
                        <input
                            data-test="Splice"
                            type="checkbox"
                            value={checkbox.splice}
                            checked={this.allSpliceSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Splice
                    </label>
                </div>

                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Other"
                            type="checkbox"
                            value={checkbox.other}
                            checked={this.allOtherSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Other
                    </label>
                </div>

                <div className="checkbox">
                    <label>
                        <input
                            data-test="Fusion"
                            type="checkbox"
                            value={checkbox.structvar}
                            checked={this.allFusionsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        <b>Structural variants / Fusions</b>
                    </label>
                </div>

                <div className="checkbox">
                    <label>
                        <input
                            data-test="CheckCopynumberAlterations"
                            type="checkbox"
                            value={checkbox.cna}
                            checked={this.allCopyNumberSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        <b>Copy Number Alterations</b>
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Amplification"
                            type="checkbox"
                            value={checkbox.amplification}
                            checked={this.allAmplificationsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Amplification
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="DeepDeletion"
                            type="checkbox"
                            value={checkbox.deletion}
                            checked={this.allDeletionsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Deletion
                    </label>
                </div>

                <div>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', pointerEvents: 'all' }}
                        data-test="buttonSelectAlterations"
                        type="button"
                        onClick={this.updateSelectedAlterations}
                    >
                        Select Alterations
                    </button>
                </div>
            </div>
        );
    }
}
