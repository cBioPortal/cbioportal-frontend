import * as _ from "lodash";
import * as React from "react";
import Dictionary = _.Dictionary;
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/generated/CBioPortalAPI";
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import * as styles_any from './styles/styles.module.scss';
import classNames from 'classnames';
import ReactSelect from 'react-select';
import StudyList from "./studyList/StudyList";
import {observer, Observer} from "mobx-react";
import {action, expr} from 'mobx';
import memoize from "memoize-weak-decorator";
import {If, Then, Else} from 'react-if';
import {QueryStoreComponent} from "./QueryStore";
import SectionHeader from "../sectionHeader/SectionHeader";
import {Modal, Button} from 'react-bootstrap';
import Autosuggest from 'react-bootstrap-autosuggest'
import ReactElement = React.ReactElement;
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import FontAwesome from "react-fontawesome";

const styles = styles_any as {
    SelectedStudiesWindow: string,
    CancerStudySelector: string,
    CancerStudySelectorHeader: string,
    selectable: string,
    selected: string,
    selectedCount: string,
    selectAll: string,
    noData: string,
    selectionsExist: string,
    cancerStudyName: string,
    cancerStudySamples: string,
    matchingNodeText: string,
    nonMatchingNodeText: string,
    containsSelectedStudies: string,
    selectCancerStudyHeader: string,
    selectCancerStudyRow: string,
    searchTextInput: string,

    cancerStudySelectorBody: string,
    cancerTypeListContainer: string,
    cancerTypeList: string,
    cancerTypeListItem: string,
    cancerTypeListItemLabel: string,
    cancerTypeListItemCount: string,
    cancerStudyListContainer: string,
    submit: string,

    summaryButtonClass: string,
    summaryButtonIconClass: string,
    summaryButtonTextClass: string,
};

export interface ICancerStudySelectorProps {
    style?: React.CSSProperties;
}

@observer
export default class CancerStudySelector extends QueryStoreComponent<ICancerStudySelectorProps, {}> {
    private handlers = {
        onSummaryClick: () => {
            this.store.openSummary();
        },
        onCheckAllFiltered: () => {
            this.logic.mainView.toggleAllFiltered();
        },
        onClearFilter: () => {
            this.store.setSearchText('');
        }
    };

    constructor(props: ICancerStudySelectorProps) {
        super(props);
    }

    get logic() {
        return this.store.studyListLogic;
    }

    @memoize
    getCancerTypeListClickHandler<T>(node: CancerType) {
        return (event: React.MouseEvent<T>) => this.store.selectCancerType(node as CancerType, event.ctrlKey);
    }

    handleStudiesCheckbox<T>(event: React.FormEvent<T>, clickedStudyIds: string[]) {
        if ((event.target as HTMLInputElement).checked)
            this.store.selectableSelectedStudyIds = _.union(this.store.selectableSelectedStudyIds, clickedStudyIds);
        else
            this.store.selectableSelectedStudyIds = _.difference(this.store.selectableSelectedStudyIds, clickedStudyIds);
    }

    CancerTypeList = observer(() => {
        let cancerTypes = this.logic.cancerTypeListView.getChildCancerTypes(this.store.treeData.rootCancerType);
        return (
            <ul className={styles.cancerTypeList}>
                {cancerTypes.map((cancerType, arrayIndex) => (
                    <this.CancerTypeListItem key={arrayIndex} cancerType={cancerType}/>
                ))}
            </ul>
        );
    });

    CancerTypeListItem = observer(({cancerType}: { cancerType: CancerType }) => {
        let numStudies = expr(() => this.logic.cancerTypeListView.getDescendantCancerStudies(cancerType).length);
        let selected = _.includes(this.store.selectedCancerTypeIds, cancerType.cancerTypeId);
        let highlighted = this.logic.isHighlighted(cancerType);
        let liClassName = classNames({
            [styles.cancerTypeListItem]: true,
            [styles.selectable]: true,
            [styles.selected]: selected,
            [styles.matchingNodeText]: !!this.store.searchText && highlighted,
            [styles.nonMatchingNodeText]: !!this.store.searchText && !highlighted,
            [styles.containsSelectedStudies]: expr(() => this.logic.cancerTypeContainsSelectedStudies(cancerType)),
        });

        return (
            <li
                className={liClassName}
                onMouseDown={this.getCancerTypeListClickHandler(cancerType)}
            >
				<span className={styles.cancerTypeListItemLabel}>
					{cancerType.name}
				</span>
                <span className={styles.cancerTypeListItemCount}>
					{numStudies}
				</span>
            </li>
        );
    });

    private autosuggest: React.Component<any, any>;

    render() {

        const {selectableSelectedStudyIds, selectableSelectedStudies, shownStudies, shownAndSelectedStudies} =
            this.logic.mainView.getSelectionReport();

        return (
            <FlexCol overflow data-test="studyList" className={styles.CancerStudySelector}>
                <FlexRow overflow className={styles.CancerStudySelectorHeader}>

                    <SectionHeader promises={[this.store.cancerTypes, this.store.cancerStudies]}>
                        Select Studies:
                    </SectionHeader>

                    <div>
                        {!!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending) && (
                            <Observer>
                                {() => {
                                    let numSelectedStudies = expr(() => this.store.selectableSelectedStudyIds.length);
                                    let selectedCountClass = classNames({
                                        [styles.selectedCount]: true,
                                        [styles.selectionsExist]: numSelectedStudies > 0
                                    });
                                    return (
                                        <a
                                            onClick={() => {
                                                if (numSelectedStudies)
                                                    this.store.showSelectedStudiesOnly = !this.store.showSelectedStudiesOnly;
                                            }}
                                        >
                                            <b>{numSelectedStudies}</b> studies selected
                                            (<b>{this.store.selectableSelectedStudies_totalSampleCount}</b> samples)
                                        </a>
                                    );
                                }}
                            </Observer>
                        )}


                        {(!!(!this.store.forDownloadTab) && !!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending)) && (
                            <Observer>
                                {() => {
                                    let hasSelection = this.store.selectableSelectedStudyIds.length > 0;

                                    if (hasSelection) {
                                        return (
                                            <a data-test='globalDeselectAllStudiesButton' style={{marginLeft: 10}}
                                               onClick={() => {
                                                   (hasSelection) ? this.logic.mainView.clearAllSelection() :
                                                       this.logic.mainView.onCheck(this.store.treeData.rootCancerType, !hasSelection)
                                               }}>
                                                Deselect all
                                            </a>
                                        );
                                    } else {
                                        return <span/>;
                                    }
                                }}
                            </Observer>
                        )}


                        {!!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending) && (
                            <Observer>
                                {() => {

                                    const studyLimitReached = (this.store.selectableSelectedStudyIds.length > 50);
                                    const tooltipMessage = studyLimitReached ?
                                        <span>Too many studies selected for study summary (limit: 50)</span> :
                                        <span>Open summary of selected studies in a new window.</span>

                                    return (
                                        <DefaultTooltip
                                            placement="top"
                                            overlay={tooltipMessage}
                                            disabled={!this.store.summaryEnabled}
                                            mouseEnterDelay={0}
                                        >

                                            <Button bsSize="xs" disabled={studyLimitReached} bsStyle="primary"
                                                    className={classNames('btn-primary')}
                                                    onClick={this.handlers.onSummaryClick}
                                                    style={{
                                                        marginLeft: 10,
                                                        display: this.store.summaryEnabled ? 'inline-block' : 'none',
                                                        cursor: 'pointer',
                                                        bgColor: '#3786C2'
                                                    }}
                                            >
                                                <i className='ci ci-pie-chart'></i> View summary
                                            </Button>
                                        </DefaultTooltip>
                                    );
                                }}
                            </Observer>
                        )}

                    </div>

                    <Observer>
                        {() => {
                            let searchTextOptions = this.store.searchTextPresets;
                            if (this.store.searchText && searchTextOptions.indexOf(this.store.searchText) < 0)
                                searchTextOptions = [this.store.searchText].concat(searchTextOptions as string[]);
                            let searchTimeout: number | null = null;

                            return (
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    {
                                        (this.store.searchText) && (
                                            <span data-test="clearStudyFilter"
                                                  onClick={(e) => { this.handlers.onClearFilter() }}
                                                  style={{
                                                      fontSize: 18,
                                                      cursor: 'pointer',
                                                      color: '#999999',
                                                      position: 'relative',
                                                      left: 164,
                                                      zIndex: 10
                                                  }}>x</span>
                                        )
                                    }
                                    <Autosuggest
                                        datalist={searchTextOptions}
                                        ref={(el: React.Component<any, any>) => this.autosuggest = el}
                                        placeholder="Search..."
                                        bsSize="small"
                                        value={this.store.searchText}
                                        onChange={(currentVal: string) => {
                                            if (searchTimeout !== null) {
                                                window.clearTimeout(searchTimeout);
                                                searchTimeout = null;
                                            }

                                            searchTimeout = window.setTimeout(() => {
                                                this.store.setSearchText(currentVal);
                                            }, 400);
                                        }}
                                        onFocus={(value: string) => {
                                            if (value.length === 0) {
                                                setTimeout(() => {
                                                    this.autosuggest.setState({open: true});
                                                }, 400)
                                            }
                                        }}
                                    />

                                </div>
                            );

                        }}
                    </Observer>


                </FlexRow>

                <SectionHeader style={{display: 'none'}} promises={[this.store.cancerTypes, this.store.cancerStudies]}>
                    Select Studies:
                    {!!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending) && (
                        <Observer>
                            {() => {
                                let numSelectedStudies = expr(() => this.store.selectableSelectedStudyIds.length);
                                let selectedCountClass = classNames({
                                    [styles.selectedCount]: true,
                                    [styles.selectionsExist]: numSelectedStudies > 0
                                });
                                return (
                                    <span
                                        className={selectedCountClass}
                                        onClick={() => {
                                            if (numSelectedStudies)
                                                this.store.showSelectedStudiesOnly = !this.store.showSelectedStudiesOnly;
                                        }}
                                    >
										<b>{numSelectedStudies}</b> studies selected
										(<b>{this.store.selectableSelectedStudies_totalSampleCount}</b> samples)
									</span>
                                );
                            }}
                        </Observer>
                    )}
                </SectionHeader>

                <FlexRow className={styles.cancerStudySelectorBody}>
                    <If condition={this.store.maxTreeDepth > 0}>
                        <Then>
                            <div className={styles.cancerTypeListContainer}>
                                <this.CancerTypeList/>
                            </div>
                        </Then>
                    </If>
                    <div className={styles.cancerStudyListContainer} data-test='cancerTypeListContainer'>

                        <div className="checkbox" style={{marginLeft: 19}}>
                            <If condition={shownStudies.length > 0}>
                                <label>
                                    <input type="checkbox"
                                           data-test="selectAllStudies"
                                           style={{top: -2}}
                                           onClick={this.handlers.onCheckAllFiltered}
                                           checked={shownAndSelectedStudies.length === shownStudies.length}
                                    />
                                    <strong>{(shownAndSelectedStudies.length === shownStudies.length) ?
                                        `Deselect all listed studies ${(shownStudies.length < this.store.cancerStudies.result.length) ? "matching filter" : ""} (${shownStudies.length})` :
                                        `Select all listed studies ${(shownStudies.length < this.store.cancerStudies.result.length) ? "matching filter" : ""}  (${shownStudies.length})`}
                                    </strong>
                                </label>
                            </If>
                            <If condition={this.store.cancerStudies.isComplete && this.store.cancerTypes.isComplete && shownStudies.length === 0}>
                                <p>There are no studies matching your filter.</p>
                            </If>
                        </div>

                        <StudyList/>
                    </div>
                </FlexRow>

                <Modal
                    className={classNames(styles.SelectedStudiesWindow, 'cbioportal-frontend')}
                    show={this.store.showSelectedStudiesOnly}
                    onHide={() => this.store.showSelectedStudiesOnly = false}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Selected Studies</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <StudyList showSelectedStudiesOnly/>
                    </Modal.Body>
                </Modal>
            </FlexCol>
        );
    }
}
