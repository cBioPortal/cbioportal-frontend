import * as React from "react";
import {observer} from "mobx-react";
import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import StudyColumnFormatter from "../../../shared/components/mutationTable/column/StudyColumnFormatter";
import {MutationTableColumnType} from "../../../shared/components/mutationTable/MutationTable";
import {ComparisonGroup} from "../GroupComparisonUtils";
import WorkspaceGroupCheckbox from "./WorkspaceGroupCheckbox";
import LazyMobXTable from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import ComplexKeyMap from "../../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import WindowStore from "../../../shared/components/window/WindowStore";

export interface IWorkspaceGroupTableProps {
    groups:ComparisonGroup[];
    isChecked:(uid:string)=>boolean;
    onClick:(uid:string)=>void;
    sampleSet:ComplexKeyMap<Sample>;
    deselectAll:()=>void;
}

@observer
export default class WorkspaceGroupTable extends React.Component<IWorkspaceGroupTableProps, {}> {
    private columns = [{
        name:"Group",
        render: (g:ComparisonGroup)=>(
            <WorkspaceGroupCheckbox
                group={g}
                checked={this.props.isChecked(g.uid)}
                onClick={this.props.onClick}
                sampleSet={this.props.sampleSet}
            />
        ),
        sortBy: (g:ComparisonGroup)=>g.name.toLowerCase(),
        filter: (g:ComparisonGroup, filterString:string, filterStringUpper:string)=>{
            return g.name.toUpperCase().indexOf(filterStringUpper) > -1;
        }
    }];
    render() {
        return (
            <div style={{
                overflow:"auto",
                position:"relative",
                maxHeight:430
            }}>
                <button className="btn btn-default btn-xs" onClick={this.props.deselectAll}
                        style={{position:"absolute" /* align with search box */}}
                >
                    Deselect all
                </button>
                <LazyMobXTable
                    columns={this.columns}
                    data={this.props.groups}
                    initialSortColumn="Group"
                    initialSortDirection="asc"
                    itemsLabel="Group"
                    itemsLabelPlural="Groups"
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    showPagination={false}
                    initialItemsPerPage={this.props.groups.length}
                />
            </div>
        );
    }
}