import * as React from "react";
import {observer} from "mobx-react";
import PatientViewMutationTable, {IPatientViewMutationTableProps} from "./PatientViewMutationTable";
import {
    default as MutationTable,
    MutationTableColumnType
} from "../../../shared/components/mutationTable/MutationTable";
import LazyMobXTable from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import {generateMutationIdByGeneAndProteinChangeAndEvent} from "../../../shared/lib/StoreUtils";
import autobind from "autobind-decorator";
import _ from "lodash";
import InputWithIndeterminate from "../../../shared/components/InputWithIndeterminate";

@observer
export default class PatientViewSelectableMutationTable extends PatientViewMutationTable {
    private _isMutationSelected = observable.shallowMap<boolean>();

    public static defaultProps =
        {
            ...PatientViewMutationTable.defaultProps,
            columns: [
                MutationTableColumnType.SELECTED,
                ...PatientViewMutationTable.defaultProps.columns
            ]
        };

    @autobind
    private isMutationSelected(m:Mutation[]) {
        const id = generateMutationIdByGeneAndProteinChangeAndEvent(m[0]);
        if (this._isMutationSelected.has(id)) {
            return this._isMutationSelected.get(id)!;
        } else {
            return false;
        }
    }

    @action
    private setMutationSelected(m:Mutation[], selected:boolean) {
        this._isMutationSelected.set(generateMutationIdByGeneAndProteinChangeAndEvent(m[0]), selected);
    }

    @computed public get selectedMutations() {
        if (!this.props.data) {
            return [];
        } else {
            return this.props.data.filter(this.isMutationSelected);
        }
    }

    @computed get areAllFilteredMutationsSelected() {
        return _.every(this.props.dataStore!.tableData, this.isMutationSelected);
    }

    @computed get isSomeMutationSelected() {
        return _.some(this.props.dataStore!.tableData, this.isMutationSelected);
    }

    @autobind
    @action
    private selectFilteredRows(e:React.MouseEvent<any, any>) {
        const allSelected = this.areAllFilteredMutationsSelected;
        for (const mutation of this.props.dataStore!.tableData) {
            this.setMutationSelected(mutation, !allSelected); // if all selected, deselect. otherwise, select.
        }

        e.stopPropagation();
    }

    @autobind
    @action
    private clearSelectedMutations(e:React.MouseEvent<any, any>) {
        this._isMutationSelected.clear();

        e.stopPropagation();
    }

    constructor(props:IPatientViewMutationTableProps) {
        super(props);

        this._columns[MutationTableColumnType.SELECTED] = Object.assign({
                name:"Selected",
                render: (d:Mutation[])=>(
                    <span>
                        <input
                            type="checkbox"
                            checked={this.isMutationSelected(d)}
                            onClick={()=>this.setMutationSelected(d, !this.isMutationSelected(d))}
                        />
                    </span>
                ),
                sortBy:(d:Mutation[])=>+this.isMutationSelected(d),
                filter:(d:Mutation[], filterString:string, filterStringUpper:string)=>{
                    return this.isMutationSelected(d) && filterStringUpper.trim() === "SELECTED";
                },
                headerRender:()=>{
                    return (
                        <span>
                            <InputWithIndeterminate
                                type="checkbox"
                                indeterminate={!this.areAllFilteredMutationsSelected && this.isSomeMutationSelected}
                                checked={this.areAllFilteredMutationsSelected}
                                onClick={this.selectFilteredRows}
                            />
                        </span>
                    );
                }
            }
        );
    }
}