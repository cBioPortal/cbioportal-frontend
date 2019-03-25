import * as React from 'react';
import {Else, If, Then} from 'react-if';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {LEVELS, mergeAlterations} from 'shared/lib/OncoKbUtils';
import {ICache} from "shared/lib/SimpleCache";
import {observer} from "mobx-react";
import mainStyles from '../styles/oncokb/main.module.scss';
import levelStyles from '../styles/oncokb/level.module.scss';
import classnames from 'classnames';
import OncoKbCard, {LEVEL_ICON_STYLE, OncoKbTreatment} from "./OncoKbCard";
import ReferenceList from "./ReferenceList";
import {ArticleAbstract} from "../../../api/generated/OncoKbAPI";
import LazyMobXTable from "../../lazyMobXTable/LazyMobXTable";
import SummaryWithRefs from "./SummaryWithRefs";

type OncoKbTreatmentTableProps = {
    treatments: OncoKbTreatment[];
    pmidData: ICache<any>;
};

class TreatmentTableComponent extends LazyMobXTable<OncoKbTreatment> {
}


@observer
export default class OncoKbTreatmentTable extends React.Component<OncoKbTreatmentTableProps> {
    levelTooltipContent = (level: string) => {
        return <div style={{maxWidth: "200px"}}>
            {OncoKbCard.LEVEL_DESC[level]}
        </div>
    };

    treatmentTooltipContent = (abstracts: ArticleAbstract[], pmids: number[], pmidData: ICache<any>, description?: string) => {
        return (abstracts.length > 0 || pmids.length > 0) ?
            () => (
                <div className={mainStyles["tooltip-refs"]}>
                    <If condition={description}>
                        <Then>
                            <SummaryWithRefs content={description} type={'tooltip'} pmidData={this.props.pmidData}/>
                        </Then>
                        <Else>
                            <ReferenceList pmids={pmids} pmidData={pmidData} abstracts={abstracts}/>
                        </Else>
                    </If>
                </div>
            ) : <span/>
    };

    readonly columns = [{
        name: 'Level',
        width: 70,
        headerRender: (data: string) => <span>{data}</span>,
        sortBy: (data: OncoKbTreatment) => LEVELS.all.indexOf(data.level),
        render: (data: OncoKbTreatment) => {
            return <DefaultTooltip
                overlay={this.levelTooltipContent(data.level)}
                placement="left"
                trigger={['hover', 'focus']}
                destroyTooltipOnHide={true}
            >
                <i
                    className={classnames(levelStyles['level-icon'], levelStyles[`level-${data.level}`])}
                    style={LEVEL_ICON_STYLE}
                />
            </DefaultTooltip>
        }
    }, {
        name: 'Alteration(s)',
        headerRender: (data: string) => <span>{data}</span>,
        sortBy: (data: OncoKbTreatment) => data.variant,
        render: (data: OncoKbTreatment) => (
            <span>{mergeAlterations(data.variant)}</span>
        )
    }, {
        name: 'Drug(s)',
        headerRender: (data: string) => <span>{data}</span>,
        render: (data: OncoKbTreatment) => (
            <span>{data.treatment}</span>
        ),
        sortBy: (data: OncoKbTreatment) => data.treatment
    }, {
        name: 'Level-associated cancer type(s)',
        headerRender: (data: string) => <span>Level-associated<br/>cancer type(s)</span>,
        render: (data: OncoKbTreatment) => (
            <span>{data.cancerType}</span>
        ),
        sortBy: (data: OncoKbTreatment) => data.cancerType
    }, {
        name: '',
        headerRender: (data: string) => <span>{data}</span>,
        render: (data: OncoKbTreatment) => {
            return <If condition={data.abstracts.length > 0 || data.pmids.length > 0}>
                <DefaultTooltip
                    overlay={this.treatmentTooltipContent(data.abstracts, data.pmids, this.props.pmidData, data.description)}
                    placement="right"
                    trigger={['hover', 'focus']}
                    destroyTooltipOnHide={true}
                >
                    <i className="fa fa-book"/>
                </DefaultTooltip>
            </If>
        }
    }];

    public render() {
        return <TreatmentTableComponent
            showColumnVisibility={false}
            showCopyDownload={false}
            showFilter={false}
            showPagination={false}
            initialSortColumn={'Level'}
            initialSortDirection={'desc'}
            columns={this.columns} data={this.props.treatments}
        />
    }
}
