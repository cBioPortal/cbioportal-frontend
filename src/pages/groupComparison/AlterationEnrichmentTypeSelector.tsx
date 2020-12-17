import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, toJS } from 'mobx';
import autobind from 'autobind-decorator';
import { CanonicalMutationType } from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import _ from 'lodash';
import {
    CopyNumberEnrichmentEventType,
    MutationEnrichmentEventType,
} from 'pages/resultsView/comparison/ComparisonTabUtils';
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

    @computed get allCopyNumberSelected() {
        return _(this.currentSelectedCopyNumber)
            .values()
            .every();
    }

    @computed get allMutationsSelected() {
        return _(this.currentSelectedMutations)
            .values()
            .every();
    }

    @action
    public updateAllCopyNumberSelected(value: boolean) {
        _.keys(this.currentSelectedCopyNumber).forEach(
            type =>
                (this.currentSelectedCopyNumber[
                    type as CopyNumberEnrichmentEventType
                ] = value)
        );
    }

    @action
    public updateAllMutationsSelected(value: boolean) {
        _.keys(this.currentSelectedMutations).forEach(
            type =>
                (this.currentSelectedMutations[
                    type as MutationEnrichmentEventType
                ] = value)
        );
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case 'HOMDEL':
                this.toggleSelectedCopyNumber(
                    CopyNumberEnrichmentEventType.HOMDEL
                );
                break;
            case 'AMP':
                this.toggleSelectedCopyNumber(
                    CopyNumberEnrichmentEventType.AMP
                );
                break;
            case 'missense':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.missense
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.missense_mutation
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.missense_variant
                );
                break;
            case 'frame_shift_ins':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.frame_shift_ins
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.frameshift_insertion
                );
                break;
            case 'frame_shift_del':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.frame_shift_del
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.frameshift_deletion
                );
                break;
            case 'frameshift':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.frameshift
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.de_novo_start_outofframe
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.frameshift_variant
                );
                break;
            case 'nonsense':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.nonsense_mutation
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.nonsense
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.stopgain_snv
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.stop_gained
                );
                break;
            case 'splice_site':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splice_site
                );
                this.toggleSelectedMutation(MutationEnrichmentEventType.splice);
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splicing
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splice_site_snp
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splice_site_del
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splice_site_indel
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splice_region
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.splice_region_variant
                );
                break;
            case 'nonstart':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.translation_start_site
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.initiator_codon_variant
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.start_codon_snp
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.start_codon_del
                );
                break;
            case 'nonstop':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.nonstop_mutation
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.stop_lost
                );
                break;
            case 'in_frame_del':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.inframe_del
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.inframe_deletion
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.in_frame_del
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.in_frame_deletion
                );
                this.toggleSelectedMutation(MutationEnrichmentEventType.indel);
                break;
            case 'in_frame_ins':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.inframe_ins
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.inframe_insertion
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.in_frame_ins
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.in_frame_insertion
                );
                break;
            case 'inframe':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.nonframeshift_deletion
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.nonframeshift
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.nonframeshift_insertion
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.inframe
                );
                break;
            case 'truncating':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.truncating
                );
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.feature_truncation
                );
                break;
            case 'fusion':
                this.toggleSelectedMutation(MutationEnrichmentEventType.fusion);
                break;
            case 'silent':
                this.toggleSelectedMutation(MutationEnrichmentEventType.silent);
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.synonymous_variant
                );
                break;
            case 'other':
                this.toggleSelectedMutation(
                    MutationEnrichmentEventType.targeted_region
                );
                this.toggleSelectedMutation(MutationEnrichmentEventType.any);
                this.toggleSelectedMutation(MutationEnrichmentEventType.other);
                break;
            case 'AllCopyNumberSelected':
                this.updateAllCopyNumberSelected(!this.allCopyNumberSelected);
                break;
            case 'AllMutationsSelected':
                this.updateAllMutationsSelected(!this.allMutationsSelected);
                break;
        }
    }

    private toggleSelectedMutation(type: MutationEnrichmentEventType) {
        this.currentSelectedMutations[type] = !this.currentSelectedMutations[
            type
        ];
    }

    private toggleSelectedCopyNumber(type: CopyNumberEnrichmentEventType) {
        this.currentSelectedCopyNumber[type] = !this.currentSelectedCopyNumber[
            type
        ];
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
                            data-test="CheckCopynumberAlterations"
                            type="checkbox"
                            value={'AllCopyNumberSelected'}
                            checked={this.allCopyNumberSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Copy Number Alterations
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="DeepDeletion"
                            type="checkbox"
                            value={'HOMDEL'}
                            checked={this.currentSelectedCopyNumber.HOMDEL}
                            onClick={this.onInputClick}
                        />{' '}
                        Deep Deletion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Amplification"
                            type="checkbox"
                            value={'AMP'}
                            checked={this.currentSelectedCopyNumber.AMP}
                            onClick={this.onInputClick}
                        />{' '}
                        Amplification
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            data-test="Mutations"
                            type="checkbox"
                            value={'AllMutationsSelected'}
                            checked={this.allMutationsSelected}
                            onClick={this.onInputClick}
                        />{' '}
                        Mutations
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Missense"
                            type="checkbox"
                            value={CanonicalMutationType.MISSENSE}
                            checked={this.currentSelectedMutations.missense}
                            onClick={this.onInputClick}
                        />{' '}
                        Missense
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="FrameshiftDeletion"
                            type="checkbox"
                            value={CanonicalMutationType.FRAME_SHIFT_INS}
                            checked={
                                this.currentSelectedMutations.frame_shift_ins
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Frameshift Deletion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="FrameshiftInsertion"
                            type="checkbox"
                            value={CanonicalMutationType.FRAME_SHIFT_DEL}
                            checked={
                                this.currentSelectedMutations.frame_shift_del
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Frameshift Insertion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Frameshift"
                            type="checkbox"
                            value={CanonicalMutationType.FRAMESHIFT}
                            checked={this.currentSelectedMutations.frameshift}
                            onClick={this.onInputClick}
                        />{' '}
                        Frameshift
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Nonsense"
                            type="checkbox"
                            value={CanonicalMutationType.NONSENSE}
                            checked={this.currentSelectedMutations.nonsense}
                            onClick={this.onInputClick}
                        />{' '}
                        Nonsense
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Splice"
                            type="checkbox"
                            value={CanonicalMutationType.SPLICE_SITE}
                            checked={this.currentSelectedMutations.splice}
                            onClick={this.onInputClick}
                        />{' '}
                        Splice
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Nonstart"
                            type="checkbox"
                            value={CanonicalMutationType.NONSTART}
                            checked={
                                this.currentSelectedMutations
                                    .translation_start_site
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Nonstart
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Nonstop"
                            type="checkbox"
                            value={CanonicalMutationType.NONSTOP}
                            checked={
                                this.currentSelectedMutations.nonstop_mutation
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Nonstop
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="InframeDeletion"
                            type="checkbox"
                            value={CanonicalMutationType.IN_FRAME_DEL}
                            checked={this.currentSelectedMutations.in_frame_del}
                            onClick={this.onInputClick}
                        />{' '}
                        Inframe Deletion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="InframeInsertion"
                            type="checkbox"
                            value={CanonicalMutationType.IN_FRAME_INS}
                            checked={this.currentSelectedMutations.in_frame_ins}
                            onClick={this.onInputClick}
                        />{' '}
                        Inframe Insertion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="ColorByDriver"
                            type="checkbox"
                            value={CanonicalMutationType.INFRAME}
                            checked={this.currentSelectedMutations.inframe}
                            onClick={this.onInputClick}
                        />{' '}
                        Inframe
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Truncating"
                            type="checkbox"
                            value={CanonicalMutationType.TRUNCATING}
                            checked={this.currentSelectedMutations.truncating}
                            onClick={this.onInputClick}
                        />{' '}
                        Truncating
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Fusion"
                            type="checkbox"
                            value={CanonicalMutationType.FUSION}
                            checked={this.currentSelectedMutations.fusion}
                            onClick={this.onInputClick}
                        />{' '}
                        Fusion
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Silent"
                            type="checkbox"
                            value={CanonicalMutationType.SILENT}
                            checked={this.currentSelectedMutations.silent}
                            onClick={this.onInputClick}
                        />{' '}
                        Silent
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="Other"
                            type="checkbox"
                            value={CanonicalMutationType.OTHER}
                            checked={this.currentSelectedMutations.other}
                            onClick={this.onInputClick}
                        />{' '}
                        Other
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
