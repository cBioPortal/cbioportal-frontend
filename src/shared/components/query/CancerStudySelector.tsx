import * as _ from 'lodash';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { TypeOfCancer as CancerType } from 'cbioportal-ts-api-client';
import { FlexCol, FlexRow } from '../flexbox/FlexBox';
import styles from './styles/styles.module.scss';
import classNames from 'classnames';
import StudyList from './studyList/StudyList';
import { observer, Observer } from 'mobx-react';
import {
    action,
    computed,
    IReactionDisposer,
    reaction,
    makeObservable,
} from 'mobx';
import { expr } from 'mobx-utils';
import memoize from 'memoize-weak-decorator';
import { If, Then, Else } from 'react-if';
import { QueryStore } from './QueryStore';
import SectionHeader from '../sectionHeader/SectionHeader';
import { Modal } from 'react-bootstrap';
import Autosuggest from 'react-bootstrap-autosuggest';
import AppConfig from 'appConfig';
import { ServerConfigHelpers } from '../../../config/config';
import autobind from 'autobind-decorator';
import { PAN_CAN_SIGNATURE } from './StudyListLogic';
import QuickSelectButtons from './QuickSelectButtons';
import { StudySelectorStats } from 'shared/components/query/StudySelectorStats';
import WindowStore from 'shared/components/window/WindowStore';
import Timeout = NodeJS.Timeout;
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';

const MIN_LIST_HEIGHT = 200;

export interface ICancerStudySelectorProps {
    style?: React.CSSProperties;
    queryStore: QueryStore;
    forkedMode: boolean;
}

@observer
export default class CancerStudySelector extends React.Component<
    ICancerStudySelectorProps,
    {}
> {
    @computed get studiesDataComplete(): boolean {
        return (
            this.store.cancerTypes.isComplete &&
            this.store.cancerStudies.isComplete &&
            this.store.userVirtualStudies.isComplete
        );
    }

    private handlers = {
        onSummaryClick: () => {
            this.store.openSummary();
        },
        onCheckAllFiltered: () => {
            this.logic.mainView.toggleAllFiltered();
        },
        onClearFilter: () => {
            this.store.setSearchText('');
        },
    };

    public store: QueryStore;

    constructor(props: ICancerStudySelectorProps) {
        super(props);
        makeObservable(this);
        this.store = this.props.queryStore;
    }

    get logic() {
        return this.store.studyListLogic;
    }

    @memoize
    getCancerTypeListClickHandler<T>(node: CancerType) {
        return (event: React.MouseEvent<T>) =>
            this.store.selectCancerType(node as CancerType, event.ctrlKey);
    }

    CancerTypeList = observer(() => {
        let cancerTypes = this.logic.cancerTypeListView.getChildCancerTypes(
            this.store.treeData.rootCancerType
        );
        return (
            <ul className={styles.cancerTypeList}>
                {cancerTypes.map((cancerType, arrayIndex) => (
                    <this.CancerTypeListItem
                        key={arrayIndex}
                        cancerType={cancerType}
                    />
                ))}
            </ul>
        );
    });

    CancerTypeListItem = observer(
        ({ cancerType }: { cancerType: CancerType }) => {
            let numStudies = expr(
                () =>
                    this.logic.cancerTypeListView.getDescendantCancerStudies(
                        cancerType
                    ).length
            );
            let selected = _.includes(
                this.store.selectedCancerTypeIds,
                cancerType.cancerTypeId
            );
            let highlighted = this.logic.isHighlighted(cancerType);
            let liClassName = classNames({
                [styles.selectable]: true,
                [styles.selected]: selected,
                [styles.matchingNodeText]:
                    !!this.store.searchText && highlighted,
                [styles.nonMatchingNodeText]:
                    !!this.store.searchText && !highlighted,
                [styles.containsSelectedStudies]: expr(() =>
                    this.logic.cancerTypeContainsSelectedStudies(cancerType)
                ),
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
        }
    );

    private autosuggest: React.Component<any, any>;

    @action.bound
    selectTCGAPanAtlas() {
        this.logic.mainView.selectAllMatchingStudies(PAN_CAN_SIGNATURE);
    }

    @action.bound
    selectMatchingStudies(matches: string[]) {
        if (matches) {
            // if there is only one item and it has wildcard markers (*) then pass single string
            // otherwise pass array of exactly matching studyIds
            if (matches.length === 1 && /^\*.*\*$/.test(matches[0])) {
                // match wildcard of one
                this.logic.mainView.selectAllMatchingStudies(
                    matches[0].replace(/\*/g, '')
                );
            } else {
                this.logic.mainView.selectAllMatchingStudies(matches);
            }
        }
    }

    private windowSizeDisposer: IReactionDisposer;

    componentDidMount(): void {
        let resizeTimeout: Timeout;
        this.windowSizeDisposer = reaction(
            () => {
                return WindowStore.size;
            },
            () => {
                if (this.props.forkedMode) {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => this.setListHeight(), 200);
                }
            },
            { fireImmediately: true }
        );
    }

    componentWillUnmount(): void {
        this.windowSizeDisposer();
    }

    setListHeight() {
        const $el = $(ReactDOM.findDOMNode(this) as HTMLDivElement);
        var h = WindowStore.size.height - $el.offset()!.top;
        h = h < MIN_LIST_HEIGHT ? MIN_LIST_HEIGHT : h; // impose limit
        $el.css('height', h - 75);
    }

    render() {
        const {
            shownStudies,
            shownAndSelectedStudies,
        } = this.logic.mainView.getSelectionReport();

        const quickSetButtons = this.logic.mainView.quickSelectButtons(
            AppConfig.serverConfig.skin_quick_select_buttons
        );

        return (
            <FlexCol
                overflow
                data-test="studyList"
                className={styles.CancerStudySelector}
            >
                <FlexRow overflow className={styles.CancerStudySelectorHeader}>
                    <SectionHeader
                        promises={[
                            this.store.cancerTypes,
                            this.store.cancerStudies,
                        ]}
                    >
                        Select Studies for Visualization & Analysis:
                    </SectionHeader>

                    {this.store.selectableStudiesSet.isComplete && (
                        <div>
                            <StudySelectorStats store={this.store} />
                        </div>
                    )}

                    <Observer>
                        {() => {
                            let searchTextOptions = ServerConfigHelpers.skin_example_study_queries(
                                AppConfig.serverConfig!
                                    .skin_example_study_queries || ''
                            );
                            if (
                                this.store.searchText &&
                                searchTextOptions.indexOf(
                                    this.store.searchText
                                ) < 0
                            )
                                searchTextOptions = [
                                    this.store.searchText,
                                ].concat(searchTextOptions as string[]);
                            let searchTimeout: number | null = null;

                            const optionsWithSortKeys = searchTextOptions.map(
                                (name, i) => {
                                    return { value: name, sortKey: i };
                                }
                            );

                            return (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {this.store.searchText && (
                                        <span
                                            data-test="clearStudyFilter"
                                            onClick={e => {
                                                this.autosuggest.setState({
                                                    inputValue: '',
                                                });
                                                this.handlers.onClearFilter();
                                            }}
                                            style={{
                                                fontSize: 18,
                                                cursor: 'pointer',
                                                color: '#999999',
                                                position: 'relative',
                                                left: 164,
                                                zIndex: 10,
                                            }}
                                        >
                                            x
                                        </span>
                                    )}
                                    <Autosuggest
                                        datalist={optionsWithSortKeys}
                                        ref={(el: React.Component<any, any>) =>
                                            (this.autosuggest = el)
                                        }
                                        placeholder="Search..."
                                        bsSize="small"
                                        onChange={(currentVal: string) => {
                                            if (searchTimeout !== null) {
                                                window.clearTimeout(
                                                    searchTimeout
                                                );
                                                searchTimeout = null;
                                            }

                                            searchTimeout = window.setTimeout(
                                                () => {
                                                    this.store.setSearchText(
                                                        currentVal
                                                    );
                                                },
                                                400
                                            );
                                        }}
                                        onFocus={(value: string) => {
                                            if (value.length === 0) {
                                                setTimeout(() => {
                                                    this.autosuggest.setState({
                                                        open: true,
                                                    });
                                                }, 400);
                                            }
                                        }}
                                    />
                                </div>
                            );
                        }}
                    </Observer>
                </FlexRow>

                <If condition={this.studiesDataComplete}>
                    <FlexRow className={styles.cancerStudySelectorBody}>
                        <If condition={this.store.maxTreeDepth > 0}>
                            <Then>
                                <div className={styles.cancerTypeListContainer}>
                                    <this.CancerTypeList />
                                </div>
                            </Then>
                        </If>
                        <div
                            className={styles.cancerStudyListContainer}
                            data-test="cancerTypeListContainer"
                        >
                            <div
                                className="checkbox"
                                style={{ marginLeft: 19 }}
                            >
                                <If condition={shownStudies.length > 0}>
                                    <If
                                        condition={
                                            !this.logic.mainView.isFiltered &&
                                            !_.isEmpty(quickSetButtons)
                                        }
                                    >
                                        <Then>
                                            <div className={styles.quickSelect}>
                                                <QuickSelectButtons
                                                    onSelect={
                                                        this
                                                            .selectMatchingStudies
                                                    }
                                                    buttonsConfig={
                                                        quickSetButtons
                                                    }
                                                />
                                            </div>
                                        </Then>
                                        <Else>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    data-test="selectAllStudies"
                                                    style={{ top: -2 }}
                                                    onClick={
                                                        this.handlers
                                                            .onCheckAllFiltered
                                                    }
                                                    checked={
                                                        shownAndSelectedStudies.length ===
                                                        shownStudies.length
                                                    }
                                                />
                                                <strong>
                                                    {shownAndSelectedStudies.length ===
                                                    shownStudies.length
                                                        ? `Deselect all listed studies ${
                                                              shownStudies.length <
                                                              this.store
                                                                  .cancerStudies
                                                                  .result.length
                                                                  ? 'matching filter'
                                                                  : ''
                                                          } (${
                                                              shownStudies.length
                                                          })`
                                                        : `Select all listed studies ${
                                                              shownStudies.length <
                                                              this.store
                                                                  .cancerStudies
                                                                  .result.length
                                                                  ? 'matching filter'
                                                                  : ''
                                                          }  (${
                                                              shownStudies.length
                                                          })`}
                                                </strong>
                                            </label>
                                        </Else>
                                    </If>
                                </If>
                                <If
                                    condition={
                                        this.store.cancerStudies.isComplete &&
                                        this.store.cancerTypes.isComplete &&
                                        shownStudies.length === 0
                                    }
                                >
                                    <p>
                                        There are no studies matching your
                                        filter.
                                    </p>
                                </If>
                            </div>

                            <StudyList />
                        </div>
                    </FlexRow>
                </If>

                <Modal
                    className={classNames(
                        styles.SelectedStudiesWindow,
                        'cbioportal-frontend'
                    )}
                    show={this.store.showSelectedStudiesOnly}
                    onHide={() => (this.store.showSelectedStudiesOnly = false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Selected Studies</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <StudyList showSelectedStudiesOnly />
                    </Modal.Body>
                </Modal>
            </FlexCol>
        );
    }
}
