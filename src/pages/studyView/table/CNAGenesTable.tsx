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

export interface ICNAGenesTablePros {
    promise: MobxPromise<CNAGenesData>;
    filters: CopyNumberGeneFilterElement[];
    onUserSelection: (entrezGeneId: number, alteration: number) => void;
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
            return true;
        });
        return flag;
    }

    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                <CNAGenesTableComponent
                    className={styles.studyViewTablesBody}
                    initialItemsPerPage={10}
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    data={this.props.promise.result}
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
                                        onChange={event => this.props.onUserSelection(data.entrezGeneId, data.alteration)}
                                    >
                                        {data.countByEntity}
                                    </LabeledCheckbox>
                            },
                            {
                                name: 'Freq',
                                render: (data: CopyNumberCountByGene) => <span>{data.frequency + '%'}</span>
                            }
                        ]
                    }
                />
            </div>
        );
    }
}

