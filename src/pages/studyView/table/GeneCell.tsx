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
import { Else, If, Then } from 'react-if';
import GisticAnnotation from 'shared/components/annotation/Gistic';
import MutSigAnnotation from 'shared/components/annotation/MutSig';
import { OncoKbCancerGeneIcon } from 'pages/studyView/oncokb/OncoKbCancerGeneIcon';
import { OncoTree2GenesIcon } from 'pages/studyView/oncotree2genes/OncoTree2GenesIcon';
import { getOncoTree2GenesGeneOverlay } from 'pages/studyView/oncotree2genes/OncoTree2GenesUtils';

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
        const iconStyle: React.CSSProperties = {
            marginLeft: 1,
            display: 'inline-flex',
            alignItems: 'center',
        };

        return (
            <div className={styles.geneSymbol}>
                <DefaultTooltip
                    placement="left"
                    disabled={
                        !this.props.isCancerGene && !this.props.isO2glGene
                    }
                    overlay={getGeneColumnCellOverlaySimple(
                        this.props.hugoGeneSymbol,
                        geneIsSelected,
                        this.props.isCancerGene,
                        this.props.oncokbAnnotated,
                        this.props.isOncogene,
                        this.props.isTumorSuppressorGene,
                        this.props.isO2glGene
                            ? getOncoTree2GenesGeneOverlay(
                                  this.props.hugoGeneSymbol
                              )
                            : undefined
                    )}
                    destroyTooltipOnHide={true}
                >
                    <div
                        data-test="geneNameCell"
                        className={classnames(styles.displayFlex)}
                        style={{ lineHeight: 1 }}
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
                                <OncoTree2GenesIcon />
                            </span>
                        )}
                        <If condition={!_.isUndefined(this.props.qValue)}>
                            <span style={iconStyle}>
                                <If
                                    condition={
                                        this.props.tableType ===
                                        FreqColumnTypeEnum.MUTATION
                                    }
                                >
                                    <Then>
                                        <MutSigAnnotation
                                            qValue={this.props.qValue}
                                        />
                                    </Then>
                                    <Else>
                                        <GisticAnnotation
                                            qValue={this.props.qValue}
                                        />
                                    </Else>
                                </If>
                            </span>
                        </If>

                        <div
                            style={{ paddingTop: '3px' }}
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
