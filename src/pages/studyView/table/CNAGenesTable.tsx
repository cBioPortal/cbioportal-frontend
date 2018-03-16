import * as React from "react";
import {CNAGenesData} from "pages/studyView/StudyViewPage";
import {default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {CopyNumberCountByGene} from "shared/api/generated/CBioPortalAPIInternal";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";

export interface ICNAGenesTablePros {
    data: CNAGenesData;
    filters: string[];
    toggleSelection: (entrezGeneId: number, alteration: number) => void;
    numOfSelectedSamples: number;
}

class CNAGenesTableComponent extends LazyMobXTable<CopyNumberCountByGene> {
}

@observer
export class CNAGenesTable extends React.Component<ICNAGenesTablePros, {}> {

    public render() {
        let data: CNAGenesData = this.props.data;
        let numOfSelectedSamples = this.props.numOfSelectedSamples;
        return (
            <div className={styles.table}>
                <CNAGenesTableComponent
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
                                        checked={this.props.filters.indexOf([data.entrezGeneId, data.alteration].join('_')) !== -1}
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

