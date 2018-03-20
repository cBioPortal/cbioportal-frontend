import * as React from "react";
import * as _ from "lodash";
import {CNAGenesData} from "pages/studyView/StudyViewPage";
import {default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {action} from "mobx";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {CopyNumberCountByGene, CopyNumberGeneFilterElement} from "shared/api/generated/CBioPortalAPIInternal";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";

export interface ICNAGenesTablePros {
    data: CNAGenesData;
    filters: CopyNumberGeneFilterElement[];
    toggleSelection: (entrezGeneId: number, alteration: number) => void;
    numOfSelectedSamples: number;
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
        });
        return flag;
    }

    public render() {
        let data: CNAGenesData = this.props.data;
        let numOfSelectedSamples = this.props.numOfSelectedSamples;
        return (
            <div className={styles.table}>
                <CNAGenesTableComponent
                    initialItemsPerPage={15}
                    data={data}
                    columns={
                        [
                            {
                                name: 'Gene',
                                render: (data: CopyNumberCountByGene) => <span>{data.hugoGeneSymbol}</span>
                            },
                            {
                                name: 'Cytoband',
                                render: (data: CopyNumberCountByGene) => <span>{data.cytoband}</span>
                            },
                            {
                                name: 'CNA',
                                render: (data: CopyNumberCountByGene) =>
                                    <span>{data.alteration === -2 ? 'DEL' : 'AMP'}</span>
                            },
                            {
                                name: '#',
                                render: (data: CopyNumberCountByGene) =>
                                    <LabeledCheckbox
                                        checked={this.isChecked(data.entrezGeneId, data.alteration)}
                                        onChange={event => this.props.toggleSelection(data.entrezGeneId, data.alteration)}
                                    >
                                        {data.countByEntity}
                                    </LabeledCheckbox>
                            },
                            {
                                name: 'Freq',
                                render: (data: CopyNumberCountByGene) =>
                                    <span>{'...%'}</span>
                            }
                        ]
                    }
                />
            </div>
        );
    }
}

