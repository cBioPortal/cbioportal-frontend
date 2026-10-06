import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import { action, computed, observable, makeObservable } from 'mobx';
import { Checkbox } from 'react-bootstrap';
import { TruncatedText } from 'cbioportal-frontend-commons';
import { inputBoxChangeTimeoutEvent } from 'shared/lib/EventUtils';
import { FilterMenuOpenContext } from 'shared/components/filterIconModal/FilterMenuOpenContext';
import ComparisonVsIcon from 'shared/components/ComparisonVsIcon';
import styles from './categoricalFilterMenu.module.scss';

export interface ICategoricalFilterMenuProps {
    id: string;
    emptyFilterString?: boolean;
    currSelections: Set<string>;
    allSelections: Set<string>;
    updateFilterCondition: (newFilterCondition: string) => void;
    updateFilterString: (newFilterString: string) => void;
    toggleSelections: (toggledSelections: Set<string>) => void;
    // number of mutations per value, among the mutations that pass the other
    // filters of the table; only called while the menu is open
    getValueCounts?: () => Map<string, number>;
    // opens a comparison of the given (selected) values
    onCompare?: (values: string[]) => void;
}

@observer
export default class CategoricalFilterMenu extends React.Component<
    ICategoricalFilterMenuProps,
    {}
> {
    static contextType = FilterMenuOpenContext;
    declare context: React.ContextType<typeof FilterMenuOpenContext>;

    @observable private filterString: string = '';
    // Values the user checked that together cover all values. That filter
    // doesn't restrict the table, so it isn't kept, but the values should
    // still show as checked.
    @observable.ref private checkedAllValues: Set<string> | undefined;

    constructor(props: ICategoricalFilterMenuProps) {
        super(props);
        makeObservable(this);
    }

    componentDidUpdate() {
        if (this.props.emptyFilterString) {
            this.filterString = '';
        }
    }

    @action.bound
    private onChangeFilterCondition(e: any) {
        const newFilterCondition = e.target.value;
        this.props.updateFilterCondition(newFilterCondition);
    }

    @computed get filterConditionDropdown() {
        return (
            <select
                onChange={this.onChangeFilterCondition}
                className={classNames(
                    'form-control input-sm',
                    styles.condition
                )}
            >
                <option value="contains">Contains</option>
                <option value="doesNotContain">Does Not Contain</option>
                <option value="equals">Equals</option>
                <option value="doesNotEqual">Does Not Equal</option>
                <option value="beginsWith">Begins With</option>
                <option value="doesNotBeginWith">Does Not Begin With</option>
                <option value="endsWith">Ends With</option>
                <option value="doesNotEndWith">Does Not End With</option>
                <option value="regex">Regular Expression</option>
            </select>
        );
    }

    @action.bound
    private onChangeFilterString(e: any) {
        const input = e.target.value;
        this.filterString = input;
        window.setTimeout(() => {
            this.props.updateFilterString(input);
        }, 400);
    }

    @computed get filterStringInputBox() {
        return (
            <input
                value={this.filterString}
                onChange={this.onChangeFilterString}
                className={classNames('form-control input-sm', styles.search)}
                placeholder="Filter values"
                data-test="categorical-filter-menu-search-input"
            />
        );
    }

    // Nothing checked means no filter, checking values restricts the table to
    // them. The filter itself keeps the included values, where all values
    // means no filter.
    private get isRestricting() {
        return (
            this.props.currSelections.size > 0 &&
            this.props.currSelections.size < this.props.allSelections.size
        );
    }

    private isChecked(selection: string) {
        if (this.isRestricting) {
            return this.props.currSelections.has(selection);
        }
        // only while they still cover all values, which can change with the
        // filters of the other columns
        const checkedAll = this.checkedAllValues;
        return (
            !!checkedAll &&
            checkedAll.has(selection) &&
            Array.from(this.props.allSelections).every(s => checkedAll.has(s))
        );
    }

    private get checkedCount() {
        return Array.from(this.props.allSelections).filter(s =>
            this.isChecked(s)
        ).length;
    }

    // toggles to the given included values
    private setIncluded(included: Set<string>) {
        const toggled = new Set<string>();
        this.props.allSelections.forEach(s => {
            if (included.has(s) !== this.props.currSelections.has(s)) {
                toggled.add(s);
            }
        });
        this.props.toggleSelections(toggled);
        this.forceUpdate();
    }

    @action.bound
    private clearSelection() {
        this.checkedAllValues = undefined;
        this.setIncluded(new Set(this.props.allSelections));
    }

    @action.bound
    private onChangeSelection(e: any) {
        const id = e.currentTarget.getAttribute('data-id');
        if (id === undefined || id === null) {
            return;
        }
        const checked = new Set(
            Array.from(this.props.allSelections).filter(s => this.isChecked(s))
        );
        if (checked.has(id)) {
            checked.delete(id);
        } else {
            checked.add(id);
        }
        const coversAllValues = Array.from(this.props.allSelections).every(s =>
            checked.has(s)
        );
        this.checkedAllValues =
            checked.size > 0 && coversAllValues ? checked : undefined;
        // unchecking the last value removes the restriction
        this.setIncluded(
            checked.size > 0 ? checked : new Set(this.props.allSelections)
        );
    }

    @computed get selectionControls() {
        const checkedCount = this.checkedCount;
        return (
            <div className={styles.selectionControls}>
                <span className={styles.selectedCount}>
                    {checkedCount > 0
                        ? `${checkedCount} of ${this.props.allSelections.size} selected`
                        : `All ${this.props.allSelections.size} values`}
                </span>
                {checkedCount > 0 && (
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.clearSelection}
                    >
                        Clear selection
                    </button>
                )}
            </div>
        );
    }

    private sortedSelections(counts?: Map<string, number>) {
        const selections = Array.from(this.props.allSelections).sort();
        return counts
            ? _.sortBy(selections, s => -(counts.get(s) || 0))
            : selections;
    }

    private selectionCheckboxes(counts?: Map<string, number>) {
        const maxCount = counts ? _.max(Array.from(counts.values())) || 1 : 1;
        return this.sortedSelections(counts).map(selection => {
            const count = counts ? counts.get(selection) || 0 : undefined;
            return (
                <div
                    key={selection}
                    className={classNames(styles.option, {
                        [styles.emptyOption]: count === 0,
                    })}
                    data-test={`categorical-filter-menu-option-${selection}`}
                >
                    <Checkbox
                        data-id={selection}
                        onChange={this.onChangeSelection}
                        checked={this.isChecked(selection)}
                        className={styles.checkbox}
                    >
                        <TruncatedText
                            maxLength={30}
                            text={selection}
                            tooltip={
                                <div style={{ maxWidth: 300 }}>{selection}</div>
                            }
                        />
                    </Checkbox>
                    {count !== undefined && (
                        <>
                            <span className={styles.count}>
                                {count.toLocaleString()}
                            </span>
                            <span className={styles.barCell}>
                                <span
                                    className={styles.bar}
                                    style={{
                                        width: `${(100 * count) / maxCount}%`,
                                    }}
                                />
                            </span>
                        </>
                    )}
                </div>
            );
        });
    }

    // compares the checked values (all values if none is checked) that have
    // mutations, most frequent first
    private compareButton(counts?: Map<string, number>) {
        const values = this.sortedSelections(counts).filter(
            value =>
                (!this.isRestricting || this.isChecked(value)) &&
                (!counts || (counts.get(value) || 0) > 0)
        );
        return (
            <button
                className={classNames('btn btn-default btn-xs', styles.compare)}
                disabled={values.length < 2}
                title={
                    values.length < 2
                        ? 'Select at least two values to compare'
                        : `Compare the samples with mutations of each of the ${
                              values.length
                          } ${
                              this.isRestricting ? 'selected ' : ''
                          }values in group comparison`
                }
                onClick={() => this.props.onCompare!(values)}
                data-test="categorical-filter-menu-compare"
            >
                <ComparisonVsIcon
                    className="fa fa-fw"
                    style={{ marginRight: 4 }}
                />
                Compare
            </button>
        );
    }

    render() {
        const isOpen = this.context;
        const counts =
            isOpen && this.props.getValueCounts
                ? this.props.getValueCounts()
                : undefined;
        return (
            <div className={styles.menu}>
                <div className={styles.searchRow}>
                    {this.filterConditionDropdown}
                    {this.filterStringInputBox}
                </div>

                {this.selectionControls}

                {counts && (
                    <div className={styles.countsHeader}>
                        <span>Value</span>
                        <span title="Number of mutations with this value, among the mutations that pass the filters of the other columns">
                            Mutations
                        </span>
                    </div>
                )}
                <div className={styles.options}>
                    {this.selectionCheckboxes(counts)}
                </div>
                {this.props.onCompare && this.compareButton(counts)}
            </div>
        );
    }
}
