import * as React from 'react';
import * as _ from 'lodash';
import MutualExclusivityTable from "./MutualExclusivityTable";
import { observer } from "mobx-react";
import { Checkbox } from 'react-bootstrap';
import styles from "./styles.module.scss";
import { computed, observable } from "mobx";
import { MutualExclusivity } from "../../../shared/model/MutualExclusivity";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import DiscreteCNACache from "../../../shared/cache/DiscreteCNACache";
import { If, Then, Else } from 'react-if';
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import { getCountsText, getData, getFilteredData } from "./MutualExclusivityUtil";

export interface IMutualExclusivityTabProps {
    store: ResultsViewPageStore
}

@observer
export default class MutualExclusivityTab extends React.Component<IMutualExclusivityTabProps, {}> {

    @observable mutualExclusivityFilter: boolean = true;
    @observable coOccurenceFilter: boolean = true;
    @observable significantPairsFilter: boolean = false;

    constructor(props: IMutualExclusivityTabProps) {
        super(props);
        this.mutualExclusivityFilterChange = this.mutualExclusivityFilterChange.bind(this);
        this.coOccurenceFilterChange = this.coOccurenceFilterChange.bind(this);
        this.significantPairsFilterChange = this.significantPairsFilterChange.bind(this);
    }

    @computed get data(): MutualExclusivity[] {
        return getData(this.props.store.isSampleAlteredMap.result!);
    }

    @computed get filteredData(): MutualExclusivity[] {
        return getFilteredData(this.data, this.mutualExclusivityFilter, this.coOccurenceFilter,
            this.significantPairsFilter);
    }

    private mutualExclusivityFilterChange() {
        this.mutualExclusivityFilter = !this.mutualExclusivityFilter;
    }

    private coOccurenceFilterChange() {
        this.coOccurenceFilter = !this.coOccurenceFilter;
    }

    private significantPairsFilterChange() {
        this.significantPairsFilter = !this.significantPairsFilter;
    }

    public render() {

        if (this.props.store.isSampleAlteredMap.isPending) {
            return <Loader isLoading={true} />
        } else if (this.props.store.isSampleAlteredMap.isComplete) {
            if (_.size(this.props.store.isSampleAlteredMap.result) > 1) {
                return (
                    <div>
                        {getCountsText(this.data)}
                        <div className={styles.Checkboxes}>
                            <Checkbox checked={this.mutualExclusivityFilter}
                                      onChange={this.mutualExclusivityFilterChange}>
                                Mutual exclusivity
                            </Checkbox>
                            <Checkbox checked={this.coOccurenceFilter}
                                      onChange={this.coOccurenceFilterChange}>
                                Co-occurrence
                            </Checkbox>
                            <Checkbox checked={this.significantPairsFilter}
                                      onChange={this.significantPairsFilterChange}>
                                Significant only
                            </Checkbox>
                        </div>
                        <MutualExclusivityTable data={this.filteredData} />
                    </div>
                );
            } else {
                return <div>Mutual exclusivity analysis cannot be provided when only a single gene is selected.</div>
            }
        } else {
            return null;
        }
    }
}