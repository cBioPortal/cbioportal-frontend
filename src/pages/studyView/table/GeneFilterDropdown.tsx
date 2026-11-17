import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import classnames from 'classnames';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import { ICON_FILTER_OFF, ICON_FILTER_ON } from 'shared/lib/Colors';
import { SelectionOperatorEnum } from 'pages/studyView/TableUtils';

export interface IGeneFilterDropdownOption {
    label: React.ReactNode;
    checked: boolean;
    onToggle: (checked: boolean) => void;
    dataTest?: string;
}

export interface IGeneFilterDropdownProps {
    cellMargin: number;
    options: IGeneFilterDropdownOption[];
    dataTest?: string;
    children?: React.ReactNode;
    combineOperator?: SelectionOperatorEnum;
    onToggleCombineOperator?: () => void;
}

@observer
export class GeneFilterDropdown extends React.Component<
    IGeneFilterDropdownProps,
    {}
> {
    @observable private visible = false;

    constructor(props: IGeneFilterDropdownProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private setVisible(visible: boolean) {
        this.visible = visible;
    }

    @computed get isFiltered() {
        return this.props.options.some(option => option.checked);
    }

    @computed get checkedOptionCount() {
        return this.props.options.filter(option => option.checked).length;
    }

    private get menu() {
        // Stop clicks inside the menu from bubbling (through the React portal
        // tree) to the column header, which would trigger a re-sort by gene
        // name and discard the user's current sort order.
        return (
            <div
                className={styles.geneFilterDropdownMenu}
                onClick={event => event.stopPropagation()}
            >
                <div className={styles.geneFilterDropdownTitle}>
                    Filter genes by:
                </div>
                {this.props.options.map((option, index) => (
                    <LabeledCheckbox
                        key={index}
                        checked={option.checked}
                        onChange={event =>
                            option.onToggle(
                                (event.target as HTMLInputElement).checked
                            )
                        }
                        inputProps={{ 'data-test': option.dataTest }}
                    >
                        {option.label}
                    </LabeledCheckbox>
                ))}
                {this.checkedOptionCount > 1 &&
                    this.props.onToggleCombineOperator && (
                        <div
                            className={styles.geneFilterDropdownCombineRow}
                            role="button"
                            tabIndex={0}
                            data-test="gene-filter-combine-operator"
                            onClick={this.props.onToggleCombineOperator}
                            onKeyDown={(event: React.KeyboardEvent) => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    this.props.onToggleCombineOperator!();
                                }
                            }}
                        >
                            <DefaultTooltip
                                overlay={`${this.props.combineOperator} of the checked filters`}
                            >
                                <span>
                                    {this.props.combineOperator}{' '}
                                    <i
                                        className={
                                            this.props.combineOperator ===
                                            SelectionOperatorEnum.INTERSECTION
                                                ? styles.intersection
                                                : styles.union
                                        }
                                    />
                                </span>
                            </DefaultTooltip>
                        </div>
                    )}
            </div>
        );
    }

    render() {
        return (
            <div
                style={{ marginLeft: this.props.cellMargin }}
                className={styles.displayFlex}
                data-test={this.props.dataTest}
            >
                {this.props.options.length > 0 && (
                    <DefaultTooltip
                        trigger={['click']}
                        placement="bottomLeft"
                        visible={this.visible}
                        onVisibleChange={this.setVisible}
                        destroyTooltipOnHide={true}
                        overlay={this.menu}
                    >
                        <span
                            data-test="header-filter-icon"
                            role="button"
                            tabIndex={0}
                            aria-label="Filter genes"
                            className={classnames(
                                styles.cancerGeneIcon,
                                styles.displayFlex
                            )}
                            style={{
                                color: this.isFiltered
                                    ? ICON_FILTER_ON
                                    : ICON_FILTER_OFF,
                            }}
                            onClick={event => event.stopPropagation()}
                            onKeyDown={(event: React.KeyboardEvent) => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    this.setVisible(!this.visible);
                                }
                            }}
                        >
                            <i className="fa fa-filter" />
                        </span>
                    </DefaultTooltip>
                )}
                {this.props.children}
            </div>
        );
    }
}
