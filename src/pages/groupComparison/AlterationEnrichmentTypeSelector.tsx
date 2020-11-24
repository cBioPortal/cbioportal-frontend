import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import autobind from 'autobind-decorator';
import { CanonicalMutationType } from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import _ from 'lodash';
import {
    CopyNumberEnrichmentEventType,
    MutationEnrichmentEventType,
} from 'pages/resultsView/comparison/ComparisonTabUtils';

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
    classNames?: string;
}

@observer
export default class AlterationEnrichmentTypeSelector extends React.Component<
    IAlterationEnrichmentTypeSelectorProps,
    {}
> {
    public currentSelectedCopyNumber = observable({
        HOMDEL: true,
        AMP: true,
    });
    public currentSelectedMutations = observable({
        missense_mutation: true,
        missense: true,
        missense_variant: true,
        frame_shift_ins: true,
        frame_shift_del: true,
        frameshift: true,
        frameshift_deletion: true,
        frameshift_insertion: true,
        de_novo_start_outofframe: true,
        frameshift_variant: true,
        nonsense_mutation: true,
        nonsense: true,
        stopgain_snv: true,
        stop_gained: true,
        splice_site: true,
        splice: true,
        splicing: true,
        splice_site_snp: true,
        splice_site_del: true,
        splice_site_indel: true,
        splice_region_variant: true,
        splice_region: true,
        translation_start_site: true,
        initiator_codon_variant: true,
        start_codon_snp: true,
        start_codon_del: true,
        nonstop_mutation: true,
        stop_lost: true,
        inframe_del: true,
        inframe_deletion: true,
        in_frame_del: true,
        in_frame_deletion: true,
        inframe_ins: true,
        inframe_insertion: true,
        in_frame_ins: true,
        in_frame_insertion: true,
        indel: true,
        nonframeshift_deletion: true,
        nonframeshift: true,
        nonframeshift_insertion: true,
        targeted_region: true,
        inframe: true,
        truncating: true,
        feature_truncation: true,
        fusion: true,
        silent: true,
        synonymous_variant: true,
        any: true,
        other: true,
    });

    public allCopyNumberSelected =
        this.currentSelectedCopyNumber.HOMDEL &&
        this.currentSelectedCopyNumber.AMP;

    public updateAllCopyNumberSelected(value: boolean) {
        this.allCopyNumberSelected = value;
        this.currentSelectedCopyNumber.HOMDEL = value;
        this.currentSelectedCopyNumber.AMP = value;
    }

    public allMutationsSelected =
        this.currentSelectedMutations.missense &&
        this.currentSelectedMutations.missense_mutation &&
        this.currentSelectedMutations.missense_variant &&
        this.currentSelectedMutations.frame_shift_ins &&
        this.currentSelectedMutations.frameshift_insertion &&
        this.currentSelectedMutations.frame_shift_del &&
        this.currentSelectedMutations.frameshift_deletion &&
        this.currentSelectedMutations.frameshift &&
        this.currentSelectedMutations.de_novo_start_outofframe &&
        this.currentSelectedMutations.frameshift_variant &&
        this.currentSelectedMutations.nonsense_mutation &&
        this.currentSelectedMutations.nonsense &&
        this.currentSelectedMutations.stopgain_snv &&
        this.currentSelectedMutations.stop_gained &&
        this.currentSelectedMutations.splice_site &&
        this.currentSelectedMutations.splice &&
        this.currentSelectedMutations.splicing &&
        this.currentSelectedMutations.splice_site_snp &&
        this.currentSelectedMutations.splice_site_del &&
        this.currentSelectedMutations.splice_site_indel &&
        this.currentSelectedMutations.splice_region &&
        this.currentSelectedMutations.splice_region_variant &&
        this.currentSelectedMutations.translation_start_site &&
        this.currentSelectedMutations.initiator_codon_variant &&
        this.currentSelectedMutations.start_codon_snp &&
        this.currentSelectedMutations.start_codon_del &&
        this.currentSelectedMutations.nonstop_mutation &&
        this.currentSelectedMutations.stop_lost &&
        this.currentSelectedMutations.inframe_del &&
        this.currentSelectedMutations.inframe_deletion &&
        this.currentSelectedMutations.in_frame_del &&
        this.currentSelectedMutations.in_frame_deletion &&
        this.currentSelectedMutations.indel &&
        this.currentSelectedMutations.inframe_ins &&
        this.currentSelectedMutations.inframe_insertion &&
        this.currentSelectedMutations.in_frame_ins &&
        this.currentSelectedMutations.in_frame_insertion &&
        this.currentSelectedMutations.nonframeshift_deletion &&
        this.currentSelectedMutations.nonframeshift &&
        this.currentSelectedMutations.nonframeshift_insertion &&
        this.currentSelectedMutations.inframe &&
        this.currentSelectedMutations.truncating &&
        this.currentSelectedMutations.feature_truncation &&
        this.currentSelectedMutations.fusion &&
        this.currentSelectedMutations.silent &&
        this.currentSelectedMutations.synonymous_variant &&
        this.currentSelectedMutations.targeted_region &&
        this.currentSelectedMutations.any &&
        this.currentSelectedMutations.other;

    public updateAllMutationsSelected(value: boolean) {
        this.allMutationsSelected = value;
        this.currentSelectedMutations.missense = value;
        this.currentSelectedMutations.missense_mutation = value;
        this.currentSelectedMutations.missense_variant = value;
        this.currentSelectedMutations.frame_shift_ins = value;
        this.currentSelectedMutations.frameshift_insertion = value;
        this.currentSelectedMutations.frame_shift_del = value;
        this.currentSelectedMutations.frameshift_deletion = value;
        this.currentSelectedMutations.frameshift = value;
        this.currentSelectedMutations.de_novo_start_outofframe = value;
        this.currentSelectedMutations.frameshift_variant = value;
        this.currentSelectedMutations.nonsense_mutation = value;
        this.currentSelectedMutations.nonsense = value;
        this.currentSelectedMutations.stopgain_snv = value;
        this.currentSelectedMutations.stop_gained = value;
        this.currentSelectedMutations.splice_site = value;
        this.currentSelectedMutations.splice = value;
        this.currentSelectedMutations.splicing = value;
        this.currentSelectedMutations.splice_site_snp = value;
        this.currentSelectedMutations.splice_site_del = value;
        this.currentSelectedMutations.splice_site_indel = value;
        this.currentSelectedMutations.splice_region = value;
        this.currentSelectedMutations.splice_region_variant = value;
        this.currentSelectedMutations.translation_start_site = value;
        this.currentSelectedMutations.initiator_codon_variant = value;
        this.currentSelectedMutations.start_codon_snp = value;
        this.currentSelectedMutations.start_codon_del = value;
        this.currentSelectedMutations.nonstop_mutation = value;
        this.currentSelectedMutations.stop_lost = value;
        this.currentSelectedMutations.inframe_del = value;
        this.currentSelectedMutations.inframe_deletion = value;
        this.currentSelectedMutations.in_frame_del = value;
        this.currentSelectedMutations.in_frame_deletion = value;
        this.currentSelectedMutations.indel = value;
        this.currentSelectedMutations.inframe_ins = value;
        this.currentSelectedMutations.inframe_insertion = value;
        this.currentSelectedMutations.in_frame_ins = value;
        this.currentSelectedMutations.in_frame_insertion = value;
        this.currentSelectedMutations.nonframeshift_deletion = value;
        this.currentSelectedMutations.nonframeshift = value;
        this.currentSelectedMutations.nonframeshift_insertion = value;
        this.currentSelectedMutations.inframe = value;
        this.currentSelectedMutations.truncating = value;
        this.currentSelectedMutations.feature_truncation = value;
        this.currentSelectedMutations.fusion = value;
        this.currentSelectedMutations.silent = value;
        this.currentSelectedMutations.synonymous_variant = value;
        this.currentSelectedMutations.targeted_region = value;
        this.currentSelectedMutations.any = value;
        this.currentSelectedMutations.other = value;
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case 'HOMDEL':
                this.currentSelectedCopyNumber.HOMDEL = !this
                    .currentSelectedCopyNumber.HOMDEL;
                break;
            case 'AMP':
                this.currentSelectedCopyNumber.AMP = !this
                    .currentSelectedCopyNumber.AMP;
                break;
            case 'missense':
                this.currentSelectedMutations.missense = !this
                    .currentSelectedMutations.missense;
                this.currentSelectedMutations.missense_mutation = !this
                    .currentSelectedMutations.missense_mutation;
                this.currentSelectedMutations.missense_variant = !this
                    .currentSelectedMutations.missense_variant;
                break;
            case 'frame_shift_ins':
                this.currentSelectedMutations.frame_shift_ins = !this
                    .currentSelectedMutations.frame_shift_ins;
                this.currentSelectedMutations.frameshift_insertion = !this
                    .currentSelectedMutations.frameshift_insertion;
                break;
            case 'frame_shift_del':
                this.currentSelectedMutations.frame_shift_del = !this
                    .currentSelectedMutations.frame_shift_del;
                this.currentSelectedMutations.frameshift_deletion = !this
                    .currentSelectedMutations.frameshift_deletion;
                break;
            case 'frameshift':
                this.currentSelectedMutations.frameshift = !this
                    .currentSelectedMutations.frameshift;
                this.currentSelectedMutations.de_novo_start_outofframe = !this
                    .currentSelectedMutations.de_novo_start_outofframe;
                this.currentSelectedMutations.frameshift_variant = !this
                    .currentSelectedMutations.frameshift_variant;
                break;
            case 'nonsense':
                this.currentSelectedMutations.nonsense_mutation = !this
                    .currentSelectedMutations.nonsense_mutation;
                this.currentSelectedMutations.nonsense = !this
                    .currentSelectedMutations.nonsense;
                this.currentSelectedMutations.stopgain_snv = !this
                    .currentSelectedMutations.stopgain_snv;
                this.currentSelectedMutations.stop_gained = !this
                    .currentSelectedMutations.stop_gained;
                break;
            case 'splice_site':
                this.currentSelectedMutations.splice_site = !this
                    .currentSelectedMutations.splice_site;
                this.currentSelectedMutations.splice = !this
                    .currentSelectedMutations.splice;
                this.currentSelectedMutations.splicing = !this
                    .currentSelectedMutations.splicing;
                this.currentSelectedMutations.splice_site_snp = !this
                    .currentSelectedMutations.splice_site_snp;
                this.currentSelectedMutations.splice_site_del = !this
                    .currentSelectedMutations.splice_site_del;
                this.currentSelectedMutations.splice_site_indel = !this
                    .currentSelectedMutations.splice_site_indel;
                this.currentSelectedMutations.splice_region = !this
                    .currentSelectedMutations.splice_region;
                this.currentSelectedMutations.splice_region_variant = !this
                    .currentSelectedMutations.splice_region_variant;
                break;
            case 'nonstart':
                this.currentSelectedMutations.translation_start_site = !this
                    .currentSelectedMutations.translation_start_site;
                this.currentSelectedMutations.initiator_codon_variant = !this
                    .currentSelectedMutations.initiator_codon_variant;
                this.currentSelectedMutations.start_codon_snp = !this
                    .currentSelectedMutations.start_codon_snp;
                this.currentSelectedMutations.start_codon_del = !this
                    .currentSelectedMutations.start_codon_del;
                break;
            case 'nonstop':
                this.currentSelectedMutations.nonstop_mutation = !this
                    .currentSelectedMutations.nonstop_mutation;
                this.currentSelectedMutations.stop_lost = !this
                    .currentSelectedMutations.stop_lost;
                break;
            case 'in_frame_del':
                this.currentSelectedMutations.inframe_del = !this
                    .currentSelectedMutations.inframe_del;
                this.currentSelectedMutations.inframe_deletion = !this
                    .currentSelectedMutations.inframe_deletion;
                this.currentSelectedMutations.in_frame_del = !this
                    .currentSelectedMutations.in_frame_del;
                this.currentSelectedMutations.in_frame_deletion = !this
                    .currentSelectedMutations.in_frame_deletion;
                this.currentSelectedMutations.indel = !this
                    .currentSelectedMutations.indel;
                break;
            case 'in_frame_ins':
                this.currentSelectedMutations.inframe_ins = !this
                    .currentSelectedMutations.inframe_ins;
                this.currentSelectedMutations.inframe_insertion = !this
                    .currentSelectedMutations.inframe_insertion;
                this.currentSelectedMutations.in_frame_ins = !this
                    .currentSelectedMutations.in_frame_ins;
                this.currentSelectedMutations.in_frame_insertion = !this
                    .currentSelectedMutations.in_frame_insertion;
                break;
            case 'inframe':
                this.currentSelectedMutations.nonframeshift_deletion = !this
                    .currentSelectedMutations.nonframeshift_deletion;
                this.currentSelectedMutations.nonframeshift = !this
                    .currentSelectedMutations.nonframeshift;
                this.currentSelectedMutations.nonframeshift_insertion = !this
                    .currentSelectedMutations.nonframeshift_insertion;
                this.currentSelectedMutations.inframe = !this
                    .currentSelectedMutations.inframe;
                break;
            case 'truncating':
                this.currentSelectedMutations.truncating = !this
                    .currentSelectedMutations.truncating;
                this.currentSelectedMutations.feature_truncation = !this
                    .currentSelectedMutations.feature_truncation;
                break;
            case 'fusion':
                this.currentSelectedMutations.fusion = !this
                    .currentSelectedMutations.fusion;
                break;
            case 'silent':
                this.currentSelectedMutations.silent = !this
                    .currentSelectedMutations.silent;
                this.currentSelectedMutations.synonymous_variant = !this
                    .currentSelectedMutations.synonymous_variant;
                break;
            case 'other':
                this.currentSelectedMutations.targeted_region = !this
                    .currentSelectedMutations.targeted_region;
                this.currentSelectedMutations.any = !this
                    .currentSelectedMutations.any;
                this.currentSelectedMutations.other = !this
                    .currentSelectedMutations.other;
                break;
            case 'AllCopyNumberSelected':
                this.updateAllCopyNumberSelected(!this.allCopyNumberSelected);
                break;
            case 'AllMutationsSelected':
                this.updateAllMutationsSelected(!this.allMutationsSelected);
                break;
        }
    }

    @autobind
    private updateSelectedAlterations(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        let selectedMutations = _.keys(_.pickBy(this.currentSelectedMutations));
        let selectedCopyNumber = _.keys(
            _.pickBy(this.currentSelectedCopyNumber)
        );
        this.props.handlers.updateSelectedMutations(
            selectedMutations as MutationEnrichmentEventType[]
        );
        this.props.handlers.updateSelectedCopyNumber(
            selectedCopyNumber as CopyNumberEnrichmentEventType[]
        );
    }

    render() {
        return (
            <div className={this.props.classNames}>
                <h5>Select Alteration Types</h5>
                <div className="checkbox">
                    <label>
                        <input
                            data-test="ColorByDriver"
                            type="checkbox"
                            value={'AllCopyNumberSelected'}
                            checked={
                                this.currentSelectedCopyNumber.HOMDEL &&
                                this.currentSelectedCopyNumber.AMP
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Copy Number Alterations
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
                            type="checkbox"
                            value={'AllMutationsSelected'}
                            checked={
                                this.currentSelectedMutations.missense &&
                                this.currentSelectedMutations
                                    .missense_mutation &&
                                this.currentSelectedMutations
                                    .missense_variant &&
                                this.currentSelectedMutations.frame_shift_ins &&
                                this.currentSelectedMutations
                                    .frameshift_insertion &&
                                this.currentSelectedMutations.frame_shift_del &&
                                this.currentSelectedMutations
                                    .frameshift_deletion &&
                                this.currentSelectedMutations.frameshift &&
                                this.currentSelectedMutations
                                    .de_novo_start_outofframe &&
                                this.currentSelectedMutations
                                    .frameshift_variant &&
                                this.currentSelectedMutations
                                    .nonsense_mutation &&
                                this.currentSelectedMutations.nonsense &&
                                this.currentSelectedMutations.stopgain_snv &&
                                this.currentSelectedMutations.stop_gained &&
                                this.currentSelectedMutations.splice_site &&
                                this.currentSelectedMutations.splice &&
                                this.currentSelectedMutations.splicing &&
                                this.currentSelectedMutations.splice_site_snp &&
                                this.currentSelectedMutations.splice_site_del &&
                                this.currentSelectedMutations
                                    .splice_site_indel &&
                                this.currentSelectedMutations.splice_region &&
                                this.currentSelectedMutations
                                    .splice_region_variant &&
                                this.currentSelectedMutations
                                    .translation_start_site &&
                                this.currentSelectedMutations
                                    .initiator_codon_variant &&
                                this.currentSelectedMutations.start_codon_snp &&
                                this.currentSelectedMutations.start_codon_del &&
                                this.currentSelectedMutations
                                    .nonstop_mutation &&
                                this.currentSelectedMutations.stop_lost &&
                                this.currentSelectedMutations.inframe_del &&
                                this.currentSelectedMutations
                                    .inframe_deletion &&
                                this.currentSelectedMutations.in_frame_del &&
                                this.currentSelectedMutations
                                    .in_frame_deletion &&
                                this.currentSelectedMutations.indel &&
                                this.currentSelectedMutations.inframe_ins &&
                                this.currentSelectedMutations
                                    .inframe_insertion &&
                                this.currentSelectedMutations.in_frame_ins &&
                                this.currentSelectedMutations
                                    .in_frame_insertion &&
                                this.currentSelectedMutations
                                    .nonframeshift_deletion &&
                                this.currentSelectedMutations.nonframeshift &&
                                this.currentSelectedMutations
                                    .nonframeshift_insertion &&
                                this.currentSelectedMutations.inframe &&
                                this.currentSelectedMutations.truncating &&
                                this.currentSelectedMutations
                                    .feature_truncation &&
                                this.currentSelectedMutations.fusion &&
                                this.currentSelectedMutations.silent &&
                                this.currentSelectedMutations
                                    .synonymous_variant &&
                                this.currentSelectedMutations.targeted_region &&
                                this.currentSelectedMutations.any &&
                                this.currentSelectedMutations.other
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Mutations
                    </label>
                </div>
                <div className="checkbox" style={{ marginLeft: '20px' }}>
                    <label>
                        <input
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                            data-test="ColorByDriver"
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
                        style={{ width: '100%' }}
                        data-test="changeSortOrderButton"
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
