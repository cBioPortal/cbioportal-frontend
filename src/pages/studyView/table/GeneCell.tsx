import * as React from 'react';
import * as _ from 'lodash';
import styles from './tables.module.scss';
import classnames from 'classnames';
import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import {
    getGeneColumnCellOverlaySimple,
    FreqColumnTypeEnum,
} from '../TableUtils';
import { getQValue } from '../StudyViewUtils';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { If, Then, Else } from 'react-if';
import GisticAnnotation from 'shared/components/annotation/Gistic';
import MutSigAnnotation from 'shared/components/annotation/MutSig';

export type IGeneCellProps = {
    tableType: FreqColumnTypeEnum;
    selectedGenes: string[];
    hugoGeneSymbol: string;
    qValue: number;
    isCancerGene: boolean;
    oncokbAnnotated: boolean;
    isOncogene: boolean;
    isTumorSuppressorGene: boolean;
    onGeneSelect: (hugoGeneSymbol: string) => void;
};

@observer
export class GeneCell extends React.Component<IGeneCellProps, {}> {
    @observable isVisible: boolean = false;

    @autobind
    @action
    onVisibleChange(isVisible: boolean) {
        this.isVisible = isVisible;
    }

    render() {
        const geneIsSelected = _.includes(
            this.props.selectedGenes,
            this.props.hugoGeneSymbol
        );
        let iconStyle = {
            marginLeft: 2,
            marginTop: 2,
        };

        return (
            <DefaultTooltip
                placement="left"
                disabled={!this.props.isCancerGene}
                overlay={getGeneColumnCellOverlaySimple(
                    this.props.hugoGeneSymbol,
                    geneIsSelected,
                    this.props.isCancerGene,
                    this.props.oncokbAnnotated,
                    this.props.isOncogene,
                    this.props.isTumorSuppressorGene
                )}
                destroyTooltipOnHide={true}
            >
                <div
                    className={classnames(
                        styles.geneSymbol,
                        styles.displayFlex
                    )}
                    onMouseEnter={() => this.onVisibleChange(true)}
                    onMouseLeave={() => this.onVisibleChange(false)}
                    onClick={() =>
                        this.props.onGeneSelect(this.props.hugoGeneSymbol)
                    }
                >
                    <EllipsisTextTooltip
                        text={this.props.hugoGeneSymbol}
                        hideTooltip={this.props.isCancerGene}
                    />
                    <span style={{ marginLeft: 5 }}>
                        <If condition={geneIsSelected}>
                            <Then>
                                <i className="fa fa-check-square-o"></i>
                            </Then>
                            <Else>
                                <If condition={this.isVisible}>
                                    <i className="fa fa-square-o"></i>
                                </If>
                            </Else>
                        </If>
                    </span>
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
                </div>
            </DefaultTooltip>
        );
    }
}
