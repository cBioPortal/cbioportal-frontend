import SimpleTable from '../simpleTable/SimpleTable';
import * as React from 'react';
import {
    action,
    computed,
    IReactionDisposer,
    observable,
    reaction,
    makeObservable,
} from 'mobx';
import { observer, Observer } from 'mobx-react';
import './styles.scss';
import {
    IPaginationControlsProps,
    PaginationControls,
    SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL,
} from '../paginationControls/PaginationControls';
import {
    ColumnVisibilityControls,
    IColumnVisibilityControlsProps,
    IColumnVisibilityDef,
} from '../columnVisibilityControls/ColumnVisibilityControls';
import {
    CopyDownloadControls,
    ICopyDownloadData,
} from '../copyDownloadControls/CopyDownloadControls';
import {
    DefaultTooltip,
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition,
} from 'cbioportal-frontend-commons';
import { ICopyDownloadControlsProps } from '../copyDownloadControls/ICopyDownloadControls';
import { SimpleCopyDownloadControls } from '../copyDownloadControls/SimpleCopyDownloadControls';
import { serializeData } from 'shared/lib/Serializer';
import { ButtonToolbar } from 'react-bootstrap';
import ColumnResizer from 'react-column-resizer';
import { SortMetric } from '../../lib/ISortMetric';
import {
    ILazyMobXTableApplicationDataStore,
    SimpleLazyMobXTableApplicationDataStore,
} from '../../lib/ILazyMobXTableApplicationDataStore';
import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from '../../lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import { maxPage } from './utils';
import { inputBoxChangeTimeoutEvent } from '../../lib/EventUtils';
import { LazyMobXTableStore } from 'shared/components/lazyMobXTable/LazyMobXTableStore';
import _ from 'lodash';

export type SortDirection = 'asc' | 'desc';

export type Column<T> = {
    id?: string;
    name: string;
    headerRender?: (name: string) => JSX.Element;
    headerDownload?: (name: string) => string;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
    filter?: (
        data: T,
        filterString: string,
        filterStringUpper?: string,
        filterStringLower?: string
    ) => boolean;
    visible?: boolean;
    sortBy?:
        | ((data: T) => number | null)
        | ((data: T) => string | null)
        | ((data: T) => string | number | null)
        | ((data: T) => (number | null)[])
        | ((data: T) => (string | null)[])
        | ((data: T) => (string | number | null)[]);
    sortParam?: string;
    render: (data: T, rowIndex?: number) => JSX.Element;
    download?: (data: T) => string | string[];
    tooltip?: JSX.Element;
    defaultSortDirection?: SortDirection;
    togglable?: boolean;
    resizable?: boolean;
    truncateOnResize?: boolean;
};

export type LazyMobXTableProps<T> = {
    className?: string;
    columns: Column<T>[];
    data?: T[];
    dataStore?: ILazyMobXTableApplicationDataStore<T>;
    downloadDataFetcher?: ILazyMobXTableApplicationLazyDownloadDataFetcher;
    initialSortColumn?: string;
    initialSortDirection?: SortDirection;
    initialItemsPerPage?: number;
    itemsLabel?: string;
    itemsLabelPlural?: string;
    initialFilterString?: string;
    showFilter?: boolean;
    showFilterClearButton?: boolean;
    filterBoxWidth?: number;
    showCopyDownload?: boolean;
    copyDownloadProps?: ICopyDownloadControlsProps;
    headerComponent?: JSX.Element;
    showPagination?: boolean;
    // used only when showPagination === true (show pagination at bottom otherwise)
    showPaginationAtTop?: boolean;
    paginationProps?: IPaginationControlsProps;
    enableHorizontalScroll?: boolean;
    showColumnVisibility?: boolean;
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    columnVisibility?: { [columnId: string]: boolean };
    storeColumnVisibility?: (
        columnVisibility:
            | {
                  [columnId: string]: boolean;
              }
            | undefined
    ) => void;
    pageToHighlight?: boolean;
    showCountHeader?: boolean;
    onRowClick?: (d: T) => void;
    onRowMouseEnter?: (d: T) => void;
    onRowMouseLeave?: (d: T) => void;
    filterPlaceholder?: string;
    columnToHeaderFilterIconModal?: (
        column: Column<T>
    ) => JSX.Element | undefined;
    deactivateColumnFilter?: (columnId: string) => void;
    customControls?: JSX.Element;
};

function compareValues<U extends number | string>(
    a: U | null,
    b: U | null,
    asc: boolean
): number {
    let ret: number = 0;
    if (a !== b) {
        if (a === null) {
            // a sorted to end
            ret = 1;
        } else if (b === null) {
            // b sorted to end
            ret = -1;
        } else {
            // neither are null
            if (typeof a === 'number') {
                // sort numbers
                if (a < b) {
                    ret = asc ? -1 : 1;
                } else {
                    // we know a !== b here so this case is a > b
                    ret = asc ? 1 : -1;
                }
            } else if (typeof a === 'string') {
                // sort strings
                ret = (asc ? 1 : -1) * (a as string).localeCompare(b as string);
            }
        }
    }
    return ret;
}
function compareLists<U extends number | string>(
    a: (U | null)[],
    b: (U | null)[],
    asc: boolean
): number {
    let ret = 0;
    const loopLength = Math.min(a.length, b.length);
    for (let i = 0; i < loopLength; i++) {
        ret = compareValues(a[i], b[i], asc);
        if (ret !== 0) {
            break;
        }
    }
    if (ret === 0) {
        if (a.length < b.length) {
            ret = asc ? -1 : 1;
        } else if (a.length > b.length) {
            ret = asc ? 1 : -1;
        }
    }
    return ret;
}

export function lazyMobXTableSort<T>(
    data: T[],
    metric: SortMetric<T>,
    ascending: boolean = true
): T[] {
    // Separating this for testing, so that classes can test their comparators
    //  against how the table will sort.
    const dataAndValue: {
        data: T;
        initialPosition: number;
        sortBy: any[];
    }[] = [];

    for (let i = 0; i < data.length; i++) {
        // Have to do this loop instead of using data.map because we need dataAndValue to be mutable,
        //  and Immutable.js makes .map return another immutable structure;
        const d = data[i];
        dataAndValue.push({
            data: d,
            initialPosition: i, // for stable sorting
            sortBy: ([] as any[]).concat(metric(d)), // ensure it's wrapped in an array, even if metric is number or string
        });
    }
    let cmp: number, initialPositionA: number, initialPositionB: number;
    dataAndValue.sort((a, b) => {
        cmp = compareLists(a.sortBy, b.sortBy, ascending);
        if (cmp === 0) {
            // stable sort
            initialPositionA = a.initialPosition;
            initialPositionB = b.initialPosition;
            if (initialPositionA < initialPositionB) {
                cmp = -1;
            } else {
                cmp = 1;
            }
        }
        return cmp;
    });
    return dataAndValue.map(x => x.data);
}

function getListOfEmptyStrings<T>(maxColLength: number): string[] {
    return Array(maxColLength)
        .join('.')
        .split('.');
}
export function getAsList<T>(
    data: Array<string | string[]>,
    maxColLength: number
): string[][] {
    let returnList: string[][] = [];
    data.forEach((datum: string | string[]) => {
        if (datum instanceof Array) {
            if (maxColLength != datum.length) {
                throw new Error(
                    'Not all the arrays returned from the download functions are from the same length.'
                );
            }
            returnList.push(datum);
        } else {
            let arr: string[] = [];
            for (var i = 0; i < maxColLength; i++) {
                arr = arr.concat(datum);
            }
            returnList.push(arr);
        }
    });
    return returnList;
}

export function getDownloadObject<T>(columns: Column<T>[], rowData: T) {
    let downloadObject: {
        data: Array<string[] | string>;
        maxColLength: number;
    } = { data: [], maxColLength: 1 };
    columns.forEach((column: Column<T>) => {
        if (column.download) {
            let downloadData = column.download(rowData);
            if (downloadData instanceof Array) {
                downloadObject.data.push(downloadData);
                if (downloadData.length > downloadObject.maxColLength) {
                    downloadObject.maxColLength = downloadData.length;
                }
            } else {
                downloadObject.data.push(downloadData);
            }
        }
    });
    return downloadObject;
}

@observer
export default class LazyMobXTable<T> extends React.Component<
    LazyMobXTableProps<T>,
    {}
> {
    private store: LazyMobXTableStore<T>;
    private handlers: { [fnName: string]: (...args: any[]) => void };
    private filterInput: HTMLInputElement;
    private filterInputReaction: IReactionDisposer;
    private pageToHighlightReaction: IReactionDisposer;
    private isChildTable: boolean;

    public static defaultProps = {
        showFilter: true,
        showFilterClearButton: false,
        filterBoxWidth: 200,
        showCopyDownload: true,
        showPagination: true,
        showColumnVisibility: true,
        showPaginationAtTop: false,
        showCountHeader: false,
        initialFilterString: '',
    };

    public get dataStore() {
        return this.store.dataStore;
    }

    public getDownloadData(): string {
        return serializeData(this.store.downloadData);
    }

    public getDownloadDataPromise(): Promise<ICopyDownloadData> {
        // returning a promise instead of a string allows us to prevent triggering fetchAndCacheAllLazyData
        // until the copy/download button is clicked.
        return new Promise<ICopyDownloadData>(resolve => {
            // we need to download all the lazy data before initiating the download process.
            if (this.store.downloadDataFetcher) {
                // populate the cache instances with all available data for the lazy loaded columns
                this.store.downloadDataFetcher
                    .fetchAndCacheAllLazyData()
                    .then(() => {
                        // we don't use allData directly,
                        // we rely on the data cached by the download data fetcher
                        resolve({
                            status: 'complete',
                            text: this.getDownloadData(),
                        });
                    })
                    .catch(() => {
                        // even if loading of all lazy data fails, resolve with partial data
                        resolve({
                            status: 'incomplete',
                            text: this.getDownloadData(),
                        });
                    });
            }
            // no lazy data to preload, just return the current download data
            else {
                resolve({
                    status: 'complete',
                    text: this.getDownloadData(),
                });
            }
        });
    }

    protected updateColumnVisibility(id: string, visible: boolean) {
        this.store.updateColumnVisibility(id, visible);
    }

    constructor(props: LazyMobXTableProps<T>) {
        super(props);
        makeObservable(this);
        this.store = new LazyMobXTableStore<T>(props);

        this.handlers = {
            onFilterTextChange: (() => {
                return inputBoxChangeTimeoutEvent(filterValue => {
                    this.store.setFilterString(filterValue);
                }, 400);
            })(),
            clearFilterText: () => {
                this.store.setFilterString('');
            },
            visibilityToggle: (columnId: string): void => {
                // deactivate column filter (if it exists)
                if (this.props.deactivateColumnFilter) {
                    this.props.deactivateColumnFilter(columnId);
                }

                // toggle visibility
                this.updateColumnVisibility(
                    columnId,
                    !this.store.columnVisibility[columnId]
                );
            },
            changeItemsPerPage: (ipp: number) => {
                this.store.itemsPerPage = ipp;
            },
            showMore: (ipp: number) => {
                this.store.showMore(ipp);
            },
            incPage: () => {
                this.store.page += 1;
            },
            decPage: () => {
                this.store.page -= 1;
            },
            filterInputRef: (input: HTMLInputElement) => {
                this.filterInput = input;
                if (!input) {
                    return;
                }
                if (this.props.dataStore?.filterString) {
                    this.setInputValue(
                        input,
                        this.props.dataStore?.filterString
                    );
                } else if (!this.store.initialFilterTextSet) {
                    this.setInputValue(input, this.props.initialFilterString!);
                }
            },
        };
        this.getDownloadData = this.getDownloadData.bind(this);
        this.getDownloadDataPromise = this.getDownloadDataPromise.bind(this);
        this.getTopToolbar = this.getTopToolbar.bind(this);
        this.getBottomToolbar = this.getBottomToolbar.bind(this);
        this.getTable = this.getTable.bind(this);
        this.getPaginationControls = this.getPaginationControls.bind(this);
        this.filterInputReaction = reaction(
            () => this.store.dataStore.filterString,
            str => {
                this.filterInput && (this.filterInput.value = str);
            }
        );
        this.pageToHighlightReaction = reaction(
            () => this.store.firstHighlightedRowIndex,
            () => {
                if (this.props.pageToHighlight) {
                    this.store.pageToRowIndex(
                        this.store.firstHighlightedRowIndex
                    );
                }
            }
        );
    }

    private setInputValue(input: HTMLInputElement, inputValue: string) {
        input.value = inputValue;
        this.store.setFilterString(inputValue);
        this.store.initialFilterTextSet = true;
    }

    componentDidMount() {
        if (document.onmousemove === null) {
            document.onmousemove = (mouse: any) => {
                const headerInfo: {
                    left: number;
                    filterIcon?: any;
                    filterMenu?: any;
                }[] = [];
                for (let i = 0; i < this.store.headerRefs.length; i++) {
                    const elem = this.store.headerRefs[i].current;
                    if (!!elem) {
                        headerInfo[i] = {
                            left: elem.getBoundingClientRect().left,
                            filterIcon: (elem.firstChild as Element)
                                ?.children[1]?.children[0],
                            filterMenu: (elem.firstChild as Element)
                                ?.children[1]?.children[1],
                        };
                    }
                }

                let i = -1;
                // determine column under current mouse position
                while (
                    i + 1 < headerInfo.length &&
                    mouse.clientX >= headerInfo[i + 1].left
                ) {
                    i += 1;
                }
                // show filter icon for current column (if exists)
                if (i !== -1) {
                    const filterIcon = headerInfo[i].filterIcon;
                    if (
                        filterIcon &&
                        filterIcon.style &&
                        filterIcon.innerHTML &&
                        filterIcon.innerHTML.includes('fa-filter')
                    ) {
                        filterIcon.style.visibility = 'visible';
                    }
                }
                // hide all other filter icons (if not active)
                for (let j = 0; j < headerInfo.length; j++) {
                    if (j !== i) {
                        const filterIcon = headerInfo[j].filterIcon;
                        const filterMenu = headerInfo[j].filterMenu;
                        if (
                            filterIcon?.innerHTML?.includes('fa-filter') &&
                            filterIcon?.style?.color !== 'rgb(0, 0, 255)' &&
                            filterMenu?.style?.visibility === 'hidden'
                        ) {
                            filterIcon.style.visibility = 'hidden';
                        }
                    }
                }
            };
        } else {
            this.isChildTable = true;
        }
    }

    componentWillUnmount() {
        if (!this.isChildTable) {
            document.onmousemove = null;
        }
        this.filterInputReaction();
        this.pageToHighlightReaction();
        if (this.props.storeColumnVisibility) {
            this.props.storeColumnVisibility(this.store.columnVisibility);
        }
    }

    @action componentWillReceiveProps(nextProps: LazyMobXTableProps<T>) {
        this.store.setProps(nextProps);
    }

    private getPaginationControls() {
        //if (this.props.showPagination) {
        // default paginationProps
        let paginationProps: IPaginationControlsProps = {
            className: 'text-center topPagination',
            itemsPerPage: this.store.itemsPerPage,
            moreItemsPerPage: this.store.moreItemsPerPage,
            totalItems: this.store.dataStore.totalItems,
            currentPage: this.store.page,
            onChangeItemsPerPage: this.handlers.changeItemsPerPage,
            onShowMoreClick: this.handlers.showMore,
            showItemsPerPageSelector: false,
            onPreviousPageClick: this.handlers.decPage,
            onNextPageClick: this.handlers.incPage,
            previousPageDisabled: this.store.dataStore.isFirstPage,
            nextPageDisabled: this.store.dataStore.isLastPage,
            textBeforeButtons: this.store.paginationStatusText,
            groupButtons: false,
            bsStyle: 'primary',
        };
        // override with given paginationProps if they exist
        if (this.props.paginationProps) {
            // put status text between button if no show more button
            if (this.props.paginationProps.showMoreButton === false) {
                delete paginationProps['textBeforeButtons'];
                paginationProps[
                    'textBetweenButtons'
                ] = this.store.paginationStatusText;
            }
            paginationProps = Object.assign(
                paginationProps,
                this.props.paginationProps
            );
        }
        return <PaginationControls {...paginationProps} />;
        // } else {
        //     return null;
        // }
    }

    private get countHeader() {
        return this.props.customControls ? (
            <h3
                data-test="LazyMobXTable_CountHeader"
                style={{
                    color: 'black',
                    fontSize: '16px',
                    fontWeight: 'bold',
                }}
            >
                {this.store.displayData.length} {this.store.itemsLabel} (page{' '}
                {this.store.page + 1} of {this.store.maxPage + 1})
            </h3>
        ) : (
            <span
                data-test="LazyMobXTable_CountHeader"
                style={{
                    float: 'left',
                    color: 'black',
                    fontSize: '16px',
                    fontWeight: 'bold',
                }}
            >
                {this.store.displayData.length} {this.store.itemsLabel} (page{' '}
                {this.store.page + 1} of {this.store.maxPage + 1})
            </span>
        );
    }

    private getTopToolbar() {
        return (
            <div>
                {this.props.headerComponent}
                {this.props.showCountHeader && this.countHeader}
                <ButtonToolbar
                    style={{ marginLeft: 0 }}
                    className="tableMainToolbar"
                >
                    {this.props.showFilter ? (
                        <div
                            className={`pull-right form-group has-feedback input-group-sm tableFilter`}
                            style={{
                                display: 'inline-block',
                                marginLeft: 5,
                                position: 'relative',
                            }}
                        >
                            <input
                                ref={this.handlers.filterInputRef}
                                placeholder={this.props.filterPlaceholder || ''}
                                type="text"
                                onInput={this.handlers.onFilterTextChange}
                                className="form-control tableSearchInput"
                                style={{ width: this.props.filterBoxWidth }}
                                data-test="table-search-input"
                            />
                            {this.props.showFilterClearButton &&
                            this.store.filterString ? (
                                <span
                                    style={{
                                        fontSize: 18,
                                        cursor: 'pointer',
                                        color: 'rgb(153, 153, 153)',
                                        position: 'absolute',
                                        right: 9,
                                        top: 2,
                                        zIndex: 10,
                                    }}
                                    onClick={this.handlers.clearFilterText}
                                >
                                    x
                                </span>
                            ) : (
                                <span
                                    className="fa fa-search form-control-feedback"
                                    aria-hidden="true"
                                    style={{
                                        zIndex: 0,
                                        width: 30,
                                        height: 30,
                                        lineHeight: '30px',
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        ''
                    )}
                    {this.props.showColumnVisibility ? (
                        <ColumnVisibilityControls
                            className="pull-right"
                            columnVisibility={this.store.colVisProp}
                            onColumnToggled={this.handlers.visibilityToggle}
                            resetColumnVisibility={
                                this.store.resetColumnVisibility
                            }
                            showResetColumnsButton={
                                this.store.showResetColumnsButton
                            }
                            {...this.props.columnVisibilityProps}
                        />
                    ) : (
                        ''
                    )}
                    {this.props.showCopyDownload ? (
                        this.props.downloadDataFetcher ? (
                            <CopyDownloadControls
                                className="pull-right"
                                downloadData={this.getDownloadDataPromise}
                                downloadFilename="table.tsv"
                                {...this.props.copyDownloadProps}
                            />
                        ) : (
                            <SimpleCopyDownloadControls
                                className="pull-right"
                                downloadData={this.getDownloadData}
                                downloadFilename="table.tsv"
                                controlsStyle="BUTTON"
                                {...this.props.copyDownloadProps}
                            />
                        )
                    ) : (
                        ''
                    )}
                    {this.props.customControls}
                    {this.props.showPagination &&
                    this.props.showPaginationAtTop ? (
                        <Observer>{this.getPaginationControls}</Observer>
                    ) : null}
                </ButtonToolbar>
            </div>
        );
    }

    private getBottomToolbar() {
        return (
            <ButtonToolbar
                style={{ marginLeft: 0, float: 'none' }}
                className="tableMainToolbar center"
            >
                {this.props.showPagination && (
                    <Observer>{this.getPaginationControls}</Observer>
                )}
            </ButtonToolbar>
        );
    }

    private getTable() {
        return (
            <div
                style={{
                    overflowX: this.props.enableHorizontalScroll
                        ? 'auto'
                        : 'visible',
                }}
            >
                <SimpleTable
                    headers={this.store.headers}
                    rows={this.store.rows}
                    className={this.props.className}
                />
            </div>
        );
    }

    render() {
        return (
            <div className="lazy-mobx-table" data-test="LazyMobXTable">
                <Observer>{this.getTopToolbar}</Observer>
                <Observer>{this.getTable}</Observer>
                {!this.props.showPaginationAtTop && (
                    <Observer>{this.getBottomToolbar}</Observer>
                )}
            </div>
        );
    }
}
