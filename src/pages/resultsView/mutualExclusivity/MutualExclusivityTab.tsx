import * as React from 'react';
import * as _ from 'lodash';
import MutualExclusivityTable from "./MutualExclusivityTable";
import {observer} from "mobx-react";
import {Checkbox} from 'react-bootstrap';
import styles from "./styles.module.scss";
import {computed, observable} from "mobx";
import {MutualExclusivity} from "../../../shared/model/MutualExclusivity";
import Combinatorics from 'js-combinatorics';
import {getCumulativePValue} from "../../../shared/lib/FisherExactTestCalculator";
import Dictionary = _.Dictionary;
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import DiscreteCNACache from "../../../shared/cache/DiscreteCNACache";
import { If, Then, Else } from 'react-if';
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";

export interface IMutualExclusivityTabProps {
    // a mapping from Hugo Gene Symbol to list of booleans,
    // each element of the list representing the altered status of a sample
    store:ResultsViewPageStore
}

export function calculateAssociation(logOddsRatio: number): string {
    return logOddsRatio > 0 ? "Tendency towards co-occurrence" : "Tendency towards mutual exclusivity";
}

export function countOccurences(valuesA: boolean[], valuesB: boolean[]): [number, number, number, number] {

    let neither = 0;
    let bNotA = 0;
    let aNotB = 0;
    let both = 0;

    valuesA.forEach((valueA, index) => {

        const valueB = valuesB[index];
        if (!valueA && !valueB) {
            neither++;
        } else if (!valueA && valueB) {
            bNotA++;
        } else if (valueA && !valueB) {
            aNotB++;
        } else {
            both++;
        }
    });
    return [neither, bNotA, aNotB, both];
}

export function calculatePValue(a: number, b: number, c: number, d: number): number {
    return getCumulativePValue(a, b, c, d);
}

export function calculateLogOddsRatio(a: number, b: number, c: number, d: number): number {

    if ((a * d) === 0 && (b * c) === 0) {
        return Infinity;
    }
    return Math.log((a * d) / (b * c));
}

export function getMutuallyExclusiveCounts(data: MutualExclusivity[],
    exclusive: (n: number) => boolean): [JSX.Element | null, JSX.Element | null] {

    let exclusiveCount = null;
    let significantCount = null;

    const exclusiveData = data.filter(mutualExclusivity => exclusive(mutualExclusivity.logOddsRatio));
    const significantData = exclusiveData.filter(mutualExclusivity => mutualExclusivity.pValue < 0.05);

    const exclusiveLength = exclusiveData.length;
    const significantLength = significantData.length;
    if (exclusiveLength === 0) {
        exclusiveCount = <span><b>no</b> gene pair</span>;
    } else if (exclusiveLength === 1) {
        exclusiveCount = <span><b>1</b> gene pair</span>;
    } else {
        exclusiveCount = <span><b>{exclusiveLength}</b> gene pairs</span>;
    }

    if (exclusiveLength > 0) {
        if (significantLength === 0) {
            significantCount = <span> (none significant)</span>;
        } else {
            significantCount = <span> (<b>{significantLength}</b> significant)</span>;
        }
    }

    return [exclusiveCount, significantCount];
}

export function getCountsText(data: MutualExclusivity[]): JSX.Element {

    const mutuallyExclusiveCounts = getMutuallyExclusiveCounts(data, n => n <= 0);
    const coOccurentCounts = getMutuallyExclusiveCounts(data, n => n > 0);

    return <p>The query contains {mutuallyExclusiveCounts[0]} with mutually exclusive alterations{
        mutuallyExclusiveCounts[1]}, and {coOccurentCounts[0]} with co-occurrent alterations{
        coOccurentCounts[1]}.</p>;
}

export function getData(isSampleAlteredMap: Dictionary<boolean[]>): MutualExclusivity[] {

    let data: MutualExclusivity[] = [];
    const combinations: string[][] = (Combinatorics as any).bigCombination(Object.keys(isSampleAlteredMap), 2).toArray();

    combinations.forEach(combination => {

        const geneA = combination[0];
        const geneB = combination[1];
        const counts = countOccurences(isSampleAlteredMap[geneA], isSampleAlteredMap[geneB]);
        const pValue = calculatePValue(counts[0], counts[1], counts[2], counts[3]);
        const logOddsRatio = calculateLogOddsRatio(counts[0], counts[1], counts[2], counts[3]);
        const association = calculateAssociation(logOddsRatio);
        data.push({geneA, geneB, pValue, logOddsRatio, association});
    });
    return data;
}

export function getFilteredData(data: MutualExclusivity[], mutualExclusivityFilter: boolean, coOccurenceFilter: boolean,
                                significantPairsFilter: boolean): MutualExclusivity[] {

    return data.filter(mutualExclusivity => {
        let result = false;
        if (mutualExclusivityFilter) {
            result = result || mutualExclusivity.logOddsRatio <= 0;
        }
        if (coOccurenceFilter) {
            result = result || mutualExclusivity.logOddsRatio > 0;
        }
        if (significantPairsFilter) {
            result = result && mutualExclusivity.pValue < 0.05;
        }
        return result;
    });
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
                        <MutualExclusivityTable data={this.filteredData}/>
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
