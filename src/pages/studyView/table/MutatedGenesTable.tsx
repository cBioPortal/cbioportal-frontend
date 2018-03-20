import * as React from "react";
import {MutatedGenesData} from "pages/studyView/StudyViewPage";
import {default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {MutationCountByGene} from "shared/api/generated/CBioPortalAPIInternal";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";

export interface IMutatedGenesTablePros {
    data: MutatedGenesData;
    filters: number[];
    toggleSelection: (value: number) => void;
    numOfSelectedSamples: number;
}

class MutatedGenesTableComponent extends LazyMobXTable<MutationCountByGene> {
}

@observer
export class MutatedGenesTable extends React.Component<IMutatedGenesTablePros, {}> {

    public render() {
        let data: MutatedGenesData = this.props.data;
        let numOfSelectedSamples = this.props.numOfSelectedSamples;
        return (
            <div className={styles.table}>
                <MutatedGenesTableComponent
                    initialItemsPerPage={15}
                    data={data}
                    columns={
                        [
                            {
                                name: 'Gene',
                                render: (data: MutationCountByGene) => <span>{data.hugoGeneSymbol}</span>
                            },
                            {
                                name: '# Mut',
                                render: (data: MutationCountByGene) => <span>{data.totalCount}</span>
                            },
                            {
                                name: '#',
                                render: (data: MutationCountByGene) =>
                                    <LabeledCheckbox
                                        checked={this.props.filters.indexOf(data.entrezGeneId) !== -1}
                                        onChange={event => this.props.toggleSelection(data.entrezGeneId)}
                                    >
                                        {data.countByEntity}
                                    </LabeledCheckbox>
                            },
                            {
                                name: 'Freq',
                                render: (data: MutationCountByGene) =>
                                    <span>{'...%'}</span>
                            }
                        ]
                    }
                />
            </div>
        );
    }
}

