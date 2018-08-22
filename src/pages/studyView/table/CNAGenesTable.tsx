import * as React from "react";
import * as _ from "lodash";
import {CNAGenesData} from "pages/studyView/StudyViewPageStore";
import {action} from "mobx";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {CopyNumberCountByGene, CopyNumberGeneFilterElement} from "shared/api/generated/CBioPortalAPIInternal";
import MobxPromise from "mobxpromise";
import {If} from 'react-if';
import classnames from 'classnames';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import FixedHeaderTable from "./FixedHeaderTable";

export interface ICNAGenesTablePros {
    promise: MobxPromise<CNAGenesData>;
    filters: CopyNumberGeneFilterElement[];
    onUserSelection: (entrezGeneId: number, alteration: number) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[]
}

class CNAGenesTableComponent extends FixedHeaderTable<CopyNumberCountByGene> {
}

@observer
export class CNAGenesTable extends React.Component<ICNAGenesTablePros, {}> {
    private columns = [
        {
            name: 'Gene',
            render: (data: CopyNumberCountByGene) => {
                const overlay = () =>
                    <span>{`Click ${data.hugoGeneSymbol} to ${_.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? 'remove' : 'add'} from your query`}</span>;
                return (
                    <DefaultTooltip
                        placement="left"
                        overlay={overlay}
                        destroyTooltipOnHide={true}
                    >
                                                    <span
                                                        className={classnames(styles.geneSymbol, _.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? styles.selected : undefined)}
                                                        onClick={() => this.props.onGeneSelect(data.hugoGeneSymbol)}>
                                                        {data.hugoGeneSymbol}
                                                    </span>
                    </DefaultTooltip>
                )
            },
            sortBy: (data: CopyNumberCountByGene) => data.hugoGeneSymbol,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return data.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            width: 85
        },
        {
            name: 'Cytoband',
            render: (data: CopyNumberCountByGene) => <span>{data.cytoband}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.cytoband,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return data.cytoband.indexOf(filterStringUpper) > -1;
            },
            width: 100
        },
        {
            name: 'CNA',
            render: (data: CopyNumberCountByGene) =>
                <span>{data.alteration === -2 ? 'DEL' : 'AMP'}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.alteration,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return (data.alteration === -2 ? 'DEL' : 'AMP').indexOf(filterStringUpper) > -1;
            },
            width: 65
        },
        {
            name: '#',
            render: (data: CopyNumberCountByGene) =>
                <LabeledCheckbox
                    checked={this.isChecked(data.entrezGeneId, data.alteration)}
                    onChange={event => this.props.onUserSelection(data.entrezGeneId, data.alteration)}
                >
                    {data.countByEntity}
                </LabeledCheckbox>,
            sortBy: (data: CopyNumberCountByGene) => data.countByEntity,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.countByEntity).indexOf(filterStringUpper) > -1;
            },
            width: 75
        },
        {
            name: 'Freq',
            render: (data: CopyNumberCountByGene) => <span>{data.frequency + '%'}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.frequency,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.frequency).indexOf(filterStringUpper) > -1;
            },
            width: 75
        }
    ];

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
            <CNAGenesTableComponent
                data={this.props.promise.result || []}
                columns={this.columns}
            />
        );
    }
}

