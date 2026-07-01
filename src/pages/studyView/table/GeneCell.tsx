import * as React from 'react';
import _ from 'lodash';
import styles from './tables.module.scss';
import classnames from 'classnames';
import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import {
    FreqColumnTypeEnum,
    getGeneColumnCellOverlaySimple,
} from '../TableUtils';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import LetterIcon from 'shared/components/cohort/LetterIcon';
import { OncoKbCancerGeneIcon } from 'pages/studyView/oncokb/OncoKbCancerGeneIcon';
import { OncoTree2GenesIcon } from 'pages/studyView/oncotree2genes/OncoTree2GenesIcon';
import { getOncoTree2GenesGeneOverlay } from 'pages/studyView/oncotree2genes/OncoTree2GenesUtils';

// Single-line tooltip entry describing the MutSig/GISTIC driver-gene call,
// matching the OncoKB/O2GL rows so it can live in the shared gene-cell tooltip.
function getDriverGeneOverlay(
    hugoGeneSymbol: string,
    isMutation: boolean,
    qValue: number
) {
    return (
        <span style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
                style={{
                    marginRight: 5,
                    marginTop: 1,
                    flexShrink: 0,
                    lineHeight: 0,
                }}
            >
                <LetterIcon text={isMutation ? 'M' : 'G'} />
            </span>
            <span>
                {hugoGeneSymbol} is a candidate driver gene by{' '}
                {isMutation ? 'MutSig' : 'GISTIC'} (q-value:{' '}
                {(qValue || 0).toExponential(3)}).{' '}
                {isMutation
                    ? 'MutSig flags genes mutated more often than expected by chance across the study.'
                    : 'GISTIC flags genes in regions with recurrent copy-number gains or losses across the study.'}
            </span>
        </span>
    );
}

export type IGeneCellProps = {
    tableType: FreqColumnTypeEnum;
    selectedGenes: string[];
    hugoGeneSymbol: string;
    qValue: number;
    isCancerGene: boolean;
    oncokbAnnotated: boolean;
    isOncogene: boolean;
    isTumorSuppressorGene: boolean;
    isO2glGene?: boolean;
    o2glOncotreeCodes?: string[];
    oncotreeCodeColorMap?: { [code: string]: string };
    oncotreeCodeNameMap?: { [code: string]: string };
    onGeneSelect: (hugoGeneSymbol: string) => void;
};

@observer
export class GeneCell extends React.Component<IGeneCellProps, {}> {
    constructor(props: IGeneCellProps) {
        super(props);
    }

    render() {
        const geneIsSelected = _.includes(
            this.props.selectedGenes,
            this.props.hugoGeneSymbol
        );
        const isMutation = this.props.tableType === FreqColumnTypeEnum.MUTATION;
        const hasQValue = !_.isUndefined(this.props.qValue);
        // color the O2GL icon by the gene's cancer type when it maps to a
        // single oncotree code; otherwise keep the default OncoTree blue
        const singleO2glCode =
            this.props.o2glOncotreeCodes &&
            this.props.o2glOncotreeCodes.length === 1
                ? this.props.o2glOncotreeCodes[0]
                : undefined;
        const o2glColor =
            singleO2glCode && this.props.oncotreeCodeColorMap
                ? this.props.oncotreeCodeColorMap[singleO2glCode]
                : undefined;
        const o2glCancerTypeName =
            singleO2glCode && this.props.oncotreeCodeNameMap
                ? this.props.oncotreeCodeNameMap[singleO2glCode]
                : undefined;
        const extraOverlay =
            this.props.isO2glGene || hasQValue ? (
                <>
                    {this.props.isO2glGene &&
                        getOncoTree2GenesGeneOverlay(
                            this.props.hugoGeneSymbol,
                            this.props.o2glOncotreeCodes,
                            o2glColor,
                            o2glCancerTypeName
                        )}
                    {hasQValue &&
                        getDriverGeneOverlay(
                            this.props.hugoGeneSymbol,
                            isMutation,
                            this.props.qValue
                        )}
                </>
            ) : (
                undefined
            );
        const iconStyle: React.CSSProperties = {
            marginLeft: 1,
            display: 'inline-flex',
            alignItems: 'center',
            // collapse the inline baseline gap so nested icons (e.g. MutSig,
            // which wraps its svg in a tooltip span) center like the others
            lineHeight: 0,
            // optically center with the all-caps gene symbol, whose letters
            // sit slightly above the text line-box center
            position: 'relative',
            top: -1,
        };

        return (
            <div className={styles.geneSymbol}>
                <DefaultTooltip
                    placement="left"
                    disabled={
                        !this.props.isCancerGene &&
                        !this.props.isO2glGene &&
                        !hasQValue
                    }
                    overlay={getGeneColumnCellOverlaySimple(
                        this.props.hugoGeneSymbol,
                        geneIsSelected,
                        this.props.isCancerGene,
                        this.props.oncokbAnnotated,
                        this.props.isOncogene,
                        this.props.isTumorSuppressorGene,
                        extraOverlay
                    )}
                    destroyTooltipOnHide={true}
                >
                    <div
                        data-test="geneNameCell"
                        className={classnames(styles.displayFlex)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select gene ${this.props.hugoGeneSymbol}`}
                        onClick={() => {
                            this.props.onGeneSelect(this.props.hugoGeneSymbol);
                        }}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                this.props.onGeneSelect(
                                    this.props.hugoGeneSymbol
                                );
                            }
                        }}
                    >
                        <EllipsisTextTooltip
                            text={this.props.hugoGeneSymbol}
                            hideTooltip={
                                this.props.isCancerGene || this.props.isO2glGene
                            }
                        />
                        {this.props.isCancerGene && (
                            <span style={iconStyle}>
                                <OncoKbCancerGeneIcon
                                    hugoGeneSymbol={this.props.hugoGeneSymbol}
                                />
                            </span>
                        )}
                        {this.props.isO2glGene && (
                            <span style={iconStyle}>
                                <OncoTree2GenesIcon color={o2glColor} />
                            </span>
                        )}
                        {hasQValue && (
                            <span style={iconStyle}>
                                <LetterIcon text={isMutation ? 'M' : 'G'} />
                            </span>
                        )}

                        <div
                            style={{
                                position: 'relative',
                                top: -1,
                                fontSize: 11,
                            }}
                            className={classnames({
                                [styles.addGeneUI]: true,
                                [styles.selected]: geneIsSelected,
                            })}
                        >
                            <i className="fa fa-search"></i>
                        </div>
                    </div>
                </DefaultTooltip>
            </div>
        );
    }
}
