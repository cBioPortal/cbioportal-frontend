import * as React from "react";
import * as _ from "lodash";
import {CNAGenesData} from "pages/studyView/StudyViewPageStore";
import {default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {action} from "mobx";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {CopyNumberCountByGene, CopyNumberGeneFilterElement} from "shared/api/generated/CBioPortalAPIInternal";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";
import MobxPromise from "mobxpromise";
import {If} from 'react-if';
import {StudyViewComponentLoader} from "../charts/StudyViewComponentLoader";
import classnames from 'classnames';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";

export interface ICNAGenesTablePros {
    promise: MobxPromise<CNAGenesData>;
    filters: CopyNumberGeneFilterElement[];
    toggleSelection: (entrezGeneId: number, alteration: number) => void;
    numOfSelectedSamples: number;
    onGeneSelect:(hugoGeneSymbol:string)=>void;
    selectedGenes: string[]
}

class CNAGenesTableComponent extends LazyMobXTable<CopyNumberCountByGene> {
}

@observer
export class CNAGenesTable extends React.Component<ICNAGenesTablePros, {}> {
    @action
    isChecked(entrezGeneId: number, alteration: number) {
        var flag = false;
        _.every(this.props.filters, (val: CopyNumberGeneFilterElement, index: number) => {
            if (val.entrezGeneId === entrezGeneId && val.alteration === alteration) {
                flag = true;
                return false;
            }
            return true;
        });
        return flag;
    }

    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                <div className={styles.studyViewTablesTitle}>CNA Genes</div>
                <div className={styles.studyViewTablesBody}>
                    <StudyViewComponentLoader promise={this.props.promise}>
                        <CNAGenesTableComponent
                            className={styles.studyViewTablesBody}
                            initialItemsPerPage={10}
                            showCopyDownload={false}
                            data={this.props.promise.result}
                            columns={
                                [
                                    {
                                        name: 'Gene',
                                        render: (data: CopyNumberCountByGene) => {
                                            const overlay = () => <span>{`Click ${data.hugoGeneSymbol} to ${_.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? 'remove' : 'add'} from your query`}</span>;
                                            return (
                                                <DefaultTooltip
                                                    placement="left"
                                                    overlay={overlay}
                                                    destroyTooltipOnHide={true}
                                                >
                                                    <span
                                                        className={classnames(styles.geneSymbol, _.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? styles.selectd : undefined)}
                                                        onClick={() => this.props.onGeneSelect(data.hugoGeneSymbol)}>
                                                        {data.hugoGeneSymbol}
                                                    </span>
                                                </DefaultTooltip>
                                            )
                                        },
                                        width: "40%"
                                    },
                                    {
                                        name: 'Cytoband',
                                        render: (data: CopyNumberCountByGene) => <span>{data.cytoband}</span>,
                                        width: "20%"
                                    },
                                    {
                                        name: 'CNA',
                                        render: (data: CopyNumberCountByGene) =>
                                            <span>{data.alteration === -2 ? 'DEL' : 'AMP'}</span>,
                                        width: "20%"
                                    },
                                    {
                                        name: '#',
                                        render: (data: CopyNumberCountByGene) =>
                                            <LabeledCheckbox
                                                checked={this.isChecked(data.entrezGeneId, data.alteration)}
                                                onChange={event => this.props.toggleSelection(data.entrezGeneId, data.alteration)}
                                            >
                                                {data.countByEntity}
                                            </LabeledCheckbox>,
                                        width: "20%"
                                    },
                                    {
                                        name: 'Freq',
                                        render: (data: CopyNumberCountByGene) => <span>{data.frequency + '%'}</span>,
                                        width: "20%"
                                    }
                                ]
                            }
                        />
                    </StudyViewComponentLoader>
                </div>
            </div>
        );
    }
}

