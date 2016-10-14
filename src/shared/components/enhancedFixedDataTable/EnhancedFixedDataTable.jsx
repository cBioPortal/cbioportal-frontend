import React from 'react';
import FixedDataTable from 'fixed-data-table';
import { Button, ButtonGroup } from 'react-bootstrap';
import renderIf from 'render-if';
import _ from 'underscore';
import 'fixed-data-table/dist/fixed-data-table.min.css';

import styles from './styles.module.scss';
import './styles.css';

const Cell = FixedDataTable.Cell;

import ReactZeroClipboard from 'react-zeroclipboard';

const EnhancedFixedDataTable = (function () {
// Data button component
    const FileGrabber = React.createClass({
        displayName: 'FileGrabber',
        // Saves table content to a text file
        saveFile() {
            const formatData = this.state.formatData || this.props.content();
            this.state.formatData = formatData;

            const blob = new Blob([formatData], { type: 'text/plain' });
            const fileName = this.props.downloadFileName ? this.props.downloadFileName : 'data.txt';

            const downloadLink = document.createElement('a');
            downloadLink.download = fileName;
            downloadLink.innerHTML = 'Download File';
            if (window.webkitURL) {
                // Chrome allows the link to be clicked
                // without actually adding it to the DOM.
                downloadLink.href = window.webkitURL.createObjectURL(blob);
            }
            else {
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.href = window.URL.createObjectURL(blob);
                downloadLink.onclick = function (event) {
                    document.body.removeChild(event.target);
                };
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
            }

            downloadLink.click();
        },

        getInitialState() {
            return {
                formatData: ''
            };
        },

        render() {
            return (
                React.createElement('button', { className: 'btn btn-default', onClick: this.saveFile },
                    this.props.buttonText || 'Download CSV')
            );
        }
    });


// Container of FileGrabber and ClipboardGrabber
    const DataGrabber = React.createClass({
        displayName: 'DataGrabber',
        // Prepares table content data for download or copy button
        prepareContent() {
            let content = [], cols = this.props.cols, rows = this.props.rows;

            _.each(cols, (e) => {
                content.push((e.displayName || 'Unknown'), '\t');
            });
            content.pop();

            _.each(rows, (row) => {
                content.push('\r\n');
                _.each(cols, (col) => {
                    content.push(row[col.name], '\t');
                });
                content.pop();
            });
            return content.join('');
        },

        render() {
            const getData = this.props.getData;
            if (getData === 'NONE') {
                return React.createElement('div', null);
            }

            const content = this.prepareContent;

            return (

                <ButtonGroup>
                    <FileGrabber content={this.prepareContent} donwloadFileName={this.props.downloadFileName} />

                    <ReactZeroClipboard
                      swfPath={require('react-zeroclipboard/assets/ZeroClipboard.swf')}
                      getText={this.prepareContent}
                    >
                        <button className="btn btn-default">Copy</button>
                    </ReactZeroClipboard>

                </ButtonGroup>


            );

        }
    });

// Wrapper of qTip for string
// Generates qTip when string length is larger than 20
    const QtipWrapper = React.createClass({
        displayName: 'QtipWrapper',
        render() {
            let label = this.props.label, qtipFlag = false, attr = this.props.attr;
            let shortLabel = this.props.shortLabel;

            if (label && shortLabel && label.toString().length > shortLabel.toString().length) {
                qtipFlag = true;
            }

            if (window.hasOwnProperty('cbio') && cbio.hasOwnProperty('util')) {
                if (attr === 'CASE_ID') {
                    shortLabel = React.createElement('a', {
                        target: '_blank',
                        href: cbio.util.getLinkToSampleView(cancerStudyId, label)
                    }, shortLabel);
                } else if (attr === 'PATIENT_ID') {
                    shortLabel = React.createElement('a', {
                        target: '_blank',
                        href: cbio.util.getLinkToPatientView(cancerStudyId, label)
                    }, shortLabel);
                }
            }

            if (attr === 'COPY_NUMBER_ALTERATIONS' && !isNaN(label)) {
                if (Number(label) < 0.01) {
                    shortLabel = '< 0.01';
                } else {
                    shortLabel = Number(shortLabel).toFixed(2);
                }
            }

            return (
                React.createElement('span', { className: qtipFlag ? 'hasQtip' : '', 'data-qtip': label },
                    shortLabel
                )
            );
        }
    });

// Column show/hide component
    const ColumnHider = React.createClass({
        displayName: 'ColumnHider',
        tableCols: [], // For the checklist

        // Updates column show/hide settings
        hideColumns(list) {
            let cols = this.props.cols, filters = this.props.filters;
            for (let i = 0; i < list.length; i++) {
                cols[i].show = list[i].isChecked;
                if (this.props.hideFilter) {
                    filters[cols[i].name].hide = !cols[i].show;
                }
            }
            this.props.updateCols(cols, filters);
        },

        // Prepares tableCols
        componentWillMount() {
            const cols = this.props.cols;
            const colsL = cols.length;
            for (let i = 0; i < colsL; i++) {
                this.tableCols.push({
                    id: cols[i].name,
                    label: cols[i].displayName,
                    isChecked: cols[i].show
                });
            }
        },

        componentDidMount() {
            const hideColumns = this.hideColumns;

            // Dropdown checklist
            $('#hide_column_checklist')
                .dropdownCheckbox({
                    data: this.tableCols,
                    autosearch: true,
                    title: 'Show / Hide Columns',
                    hideHeader: false,
                    showNbSelected: true
                })
                // Handles dropdown checklist event
                .on('change', () => {
                    const list = ($('#hide_column_checklist').dropdownCheckbox('items'));
                    hideColumns(list);
                });
            // add title attributes to unlabeled inputs generated by
            // .dropdownCheckbox() for accessibility, until
            // https://github.com/Nelrohd/bootstrap-dropdown-checkbox/issues/33 is
            // fixed upstream
            $('#hide_column_checklist input[type="checkbox"].checkbox-all')
                .attr('title', 'Select all');
            $('#hide_column_checklist input[type="text"].search')
                .attr('title', 'Search');
        },

        render() {
            return (
                React.createElement('div', { id: 'hide_column_checklist', className: 'EFDT-top-btn' })
            );
        }
    });

// Choose fixed columns component
    const PinColumns = React.createClass({
        displayName: 'PinColumns',
        tableCols: [], // For the checklist

        // Updates fixed column settings
        pinColumns(list) {
            const cols = this.props.cols;
            for (let i = 0; i < list.length; i++) {
                cols[i].fixed = list[i].isChecked;
            }
            this.props.updateCols(cols, this.props.filters);
        },

        // Prepares tableCols
        componentWillMount() {
            const cols = this.props.cols;
            const colsL = cols.length;
            for (let i = 0; i < colsL; i++) {
                this.tableCols.push({
                    id: cols[i].name,
                    label: cols[i].displayName,
                    isChecked: cols[i].fixed
                });
            }
        },

        componentDidMount() {
            const pinColumns = this.pinColumns;

            // Dropdown checklist
            $('#pin_column_checklist')
                .dropdownCheckbox({
                    data: this.tableCols,
                    autosearch: true,
                    title: 'Choose Fixed Columns',
                    hideHeader: false,
                    showNbSelected: true
                })
                // Handles dropdown checklist event
                .on('change', () => {
                    const list = ($('#pin_column_checklist').dropdownCheckbox('items'));
                    pinColumns(list);
                });
            // add title attributes to unlabeled inputs generated by
            // .dropdownCheckbox() for accessibility, until
            // https://github.com/Nelrohd/bootstrap-dropdown-checkbox/issues/33 is
            // fixed upstream
            $('#pin_column_checklist input[type="checkbox"].checkbox-all')
                .attr('title', 'Select all');
            $('#pin_column_checklist input[type="text"].search')
                .attr('title', 'Search');
        },

        render() {
            return (
                React.createElement('div', { id: 'pin_column_checklist', className: 'EFDT-top-btn' })
            );
        }
    });

// Column scroller component
    const ColumnScroller = React.createClass({
        displayName: 'ColumnScroller',
        // Scrolls to user selected column
        scrollToColumn(e) {
            let name = e.target.value, cols = this.props.cols, index, colsL = cols.length;
            for (let i = 0; i < colsL; i++) {
                if (name === cols[i].name) {
                    index = i;
                    break;
                }
            }
            this.props.updateGoToColumn(index);
        },

        render() {
            return (
                React.createElement(Chosen, {
                    'data-placeholder': 'Column Scroller',
                    onChange: this.scrollToColumn
                },

                    this.props.cols.map((col) => {
                        return (
                            React.createElement('option', { title: col.displayName, value: col.name },
                                React.createElement(QtipWrapper, { label: col.displayName })
                            )
                        );
                    })
                )
            );
        }
    });

// Filter component
    const Filter = React.createClass({
        displayName: 'Filter',
        getInitialState() {
            return { key: '' };
        },
        handleChange(event) {
            this.setState({ key: event.target.value });
            this.props.onFilterKeywordChange(event);
        },
        componentWillUpdate() {
            if (this.props.type === 'STRING') {
                if (!_.isUndefined(this.props.filter) && this.props.filter.key !== this.state.key && this.props.filter.key === '' && this.props.filter.reset) {
                    this.state.key = '';
                    this.props.filter.reset = false;
                }
            }
        },
        render() {
            if (this.props.type === 'NUMBER' || this.props.type === 'PERCENTAGE') {
                // explicitly set anchors without href for the handles, as
                // jQuery UI 1.10 otherwise adds href="#" which may confuse
                // assistive technologies
                return (
                    React.createElement('div', { className: `${styles.header - filters} pull-right` },
                        React.createElement('span', { id: `range-${this.props.name}` }),

                        React.createElement('div', {
                            className: 'rangeSlider', 'data-max': this.props.max,
                            'data-min': this.props.min, 'data-column': this.props.name,
                            'data-type': this.props.type
                        },
                            React.createElement('a', { className: 'ui-slider-handle', tabIndex: '0' }),
                            React.createElement('a', { className: 'ui-slider-handle', tabIndex: '0' })
                        )
                    )
                );
            } else {
                return (

                    <div className={`${styles.headerFilters} pull-right`}>

                        <div className={styles.searchWrapper}>
                            <i className="fa fa-search" aria-hidden="true" />
                            <input className="form-control"
                              value={this.state.key}
                              onChange={this.handleChange}
                              data-column={this.props.name}
                              placeholder={(this.props.hasOwnProperty('placeholder')) ? this.props.placeholder : 'Filter'}
                            />
                        </div>

                    </div>
                );
            }
        }
    });

// Table prefix component
// Contains components above the main part of table
    const TablePrefix = React.createClass({
        displayName: 'TablePrefix',
        render() {
            return (

                // React.createElement("div", null,
                //
                //     this.props.hider ?
                //         React.createElement("div", {className: "EFDT-show-hide"},
                //             React.createElement(ColumnHider, {cols: this.props.cols,
                //                 filters: this.props.filters,
                //                 hideFilter: this.props.hideFilter,
                //                 updateCols: this.props.updateCols})
                //         ) :
                //         "",
                //
                //
                //     this.props.fixedChoose ?
                //         React.createElement("div", {className: "EFDT-fixed-choose"},
                //             React.createElement(PinColumns, {cols: this.props.cols,
                //                 filters: this.props.filters,
                //                 updateCols: this.props.updateCols})
                //         ) :
                //         "",
                //
                //     React.createElement("div", {className: "EFDT-download"},
                //         React.createElement(DataGrabber, {cols: this.props.cols, rows: this.props.rows,
                //             downloadFileName: this.props.downloadFileName,
                //             getData: this.props.getData})
                //     ),
                //
                //     this.props.resultInfo ?
                //         React.createElement("div", {className: "EFDT-result-info"},
                //             React.createElement("span", {className: "EFDT-result-info-content"},
                //                 "Showing ", this.props.filteredRowsSize, " samples",
                //
                //                 this.props.filteredRowsSize !== this.props.rowsSize ?
                //                     React.createElement("span", null, ' (filtered from ' + this.props.rowsSize + ') ',
                //                         React.createElement("span", {className: "EFDT-header-filters-reset",
                //                             onClick: this.props.onResetFilters}, "Reset")
                //                     )
                //                     : ''
                //
                //             )
                //         ) :
                //         ""
                //
                // ),
                <div className={`${styles.tableControls} clearfix`}>


                    <div className="EFDT-download pull-left">
                        <DataGrabber cols={this.props.cols} rows={this.props.rows}
                          downloadFileName={this.props.downloadFileName}
                        />
                    </div>


                    {renderIf(this.props.filter === 'ALL' || this.props.filter === 'GLOBAL')(
                        <Filter type="STRING" name="all" className="EFDT-filter pull-right"
                          onFilterKeywordChange={this.props.onFilterKeywordChange}
                        />
                    )}

                    {renderIf(this.props.resultInfo)(
                        <div className={`${styles.resultInfo}`}>Showing {this.props.filteredRowsSize} results</div>
                    )}


                </div>

            );

        }
    });

// Wrapper for the header rendering
    const HeaderWrapper = React.createClass({
        displayName: 'HeaderWrapper',
        render() {
            const columnData = this.props.columnData;
            const shortLabel = this.props.shortLabel;

            const sortIcon = (columnData.sortFlag) ? <i className="fa fa-unsorted" /> : null;

            return (
                <Cell><a className={styles.sortHeaderButton}
                  onClick={this.props.sortNSet.bind(null, this.props.cellDataKey)}
                >{ shortLabel } {sortIcon}</a></Cell>
                // React.createElement("div", {className: "EFDT-header"},
                //     React.createElement("a", {className: "EFDT-header-sort", href: "#",
                //             onClick: this.props.sortNSet.bind(null, this.props.cellDataKey)},
                //         React.createElement(QtipWrapper, {label: columnData.displayName,
                //             shortLabel: shortLabel,
                //             className: 'EFDT-header-sort-content'}),
                //         columnData.sortFlag ?
                //             React.createElement("div", {
                //                 className: columnData.sortDirArrow + ' EFDT-header-sort-icon'})
                //             : ""
                //     )
                // )
            );
        }
    });

    const CustomizeCell = React.createClass({
        displayName: 'CustomizeCell',
        render() {

            let rowIndex = this.props.rowIndex, data = this.props.data, field = this.props.field, filterAll = this.props.filterAll;
            const flag = (data[rowIndex][field] && filterAll.length > 0) ?
                (data[rowIndex][field].toLowerCase().indexOf(filterAll.toLowerCase()) >= 0) : false;
            const shortLabels = this.props.shortLabels;
            return (
                React.createElement(FixedDataTable.Cell, { columnKey: field },
                    React.createElement('span', { style: flag ? { backgroundColor: 'yellow' } : {} },
                        React.createElement(QtipWrapper, {
                            label: data[rowIndex].row[field],
                            shortLabel: shortLabels[data[rowIndex].index][field],
                            attr: field
                        })
                    )
                )
            );
        }
    });

// Main part table component
// Uses FixedDataTable library
    const TableMainPart = React.createClass({
        displayName: 'TableMainPart',
        // Creates Qtip
        createQtip() {
            console.log('RESTORE qtip !!!!!!!');
            return;
            /*
            $('.EFDT-table .hasQtip').one('mouseenter', function () {
                $(this).qtip({
                    content: {text: $(this).attr('data-qtip')},
                    hide: {fixed: true, delay: 100},
                    show: {ready: true},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow', tip: true},
                    position: {my: 'center left', at: 'center right', viewport: $(window)}
                });
            });
            */
        },

        // Creates Qtip after first rendering
        componentDidMount() {
            this.createQtip();
        },

        // Creates Qtip after update rendering
        componentDidUpdate() {
            this.createQtip();
        },

        // Creates Qtip after page scrolling
        onScrollEnd() {
            $('.qtip').remove();
            this.createQtip();
        },

        // Destroys Qtip before update rendering
        componentWillUpdate() {
            // console.log('number of elments which has "hasQtip" as class name: ', $('.hasQtip').size());
            // console.log('number of elments which has "hasQtip" as class name under class EFDT: ', $('.EFDT-table .hasQtip').size());

            // $('.EFDT-table .hasQtip')
            //     .each(function() {
            //         $(this).qtip('destroy', true);
            //     });
        },

        // FixedDataTable render function
        render() {
            let Table = FixedDataTable.Table, Column = FixedDataTable.Column,
                ColumnGroup = FixedDataTable.ColumnGroup, props = this.props,
                rows = this.props.filteredRows, columnWidths = this.props.columnWidths,
                cellShortLabels = this.props.shortLabels.cell,
                headerShortLabels = this.props.shortLabels.header;

            return (
                React.createElement('div', null,
                    React.createElement(Table, {
                        rowHeight: props.rowHeight ? props.rowHeight : 37,
                        rowGetter: this.rowGetter,
                        onScrollEnd: this.onScrollEnd,
                        rowsCount: props.filteredRows.length,
                        width: props.tableWidth ? props.tableWidth : 1230,
                        maxHeight: props.maxHeight ? props.maxHeight : 500,
                        headerHeight: props.headerHeight ? props.headerHeight : 37,
                        groupHeaderHeight: props.groupHeaderHeight ? props.groupHeaderHeight : 50,
                        scrollToColumn: props.goToColumn,
                        isColumnResizing: false,
                        onColumnResizeEndCallback: props.onColumnResizeEndCallback
                    },

                        props.cols.map((col, index) => {
                            let column;
                            const width = col.show ? (col.width ? col.width :
                                (columnWidths[col.name] ? columnWidths[col.name] : 200)) : 0;

                            if (props.groupHeader) {
                                column = React.createElement(ColumnGroup, {
                                    header: React.createElement(Filter, {
                                        type: props.filters[col.name].type, name: col.name,
                                        max: col.max, min: col.min, filter: props.filters[col.name],
                                        placeholder: 'Filter column',
                                        onFilterKeywordChange: props.onFilterKeywordChange,
                                        title: 'Filter column'
                                    }
                                        ),

                                    key: col.name,
                                    fixed: col.fixed,
                                    align: 'center'
                                },
                                    React.createElement(Column, {
                                        header: React.createElement(HeaderWrapper, {
                                            cellDataKey: col.name, columnData: {
                                                displayName: col.displayName,
                                                sortFlag: props.sortBy === col.name,
                                                sortDirArrow: props.sortDirArrow,
                                                filterAll: props.filterAll,
                                                type: props.filters[col.name].type
                                            },
                                            sortNSet: props.sortNSet, filter: props.filters[col.name],
                                            shortLabel: headerShortLabels[col.name]
                                        }
                                            ),

                                        cell: React.createElement(CustomizeCell, {
                                            data: rows, field: col.name,
                                            filterAll: props.filterAll, shortLabels: cellShortLabels
                                        }
                                            ),
                                        width,
                                        fixed: col.fixed,
                                        allowCellsRecycling: true,
                                        isResizable: props.isResizable,
                                        columnKey: col.name,
                                        key: col.name
                                    }
                                    )
                                );
                            } else {
                                column = React.createElement(Column, {
                                    header: React.createElement(HeaderWrapper, {
                                        cellDataKey: col.name, columnData: {
                                            displayName: col.displayName,
                                            sortFlag: props.sortBy === col.name,
                                            sortDirArrow: props.sortDirArrow,
                                            filterAll: props.filterAll,
                                            type: props.filters[col.name].type
                                        },
                                        sortNSet: props.sortNSet, filter: props.filters[col.name],
                                        shortLabel: headerShortLabels[col.name]
                                    }
                                        ),

                                    cell: React.createElement(CustomizeCell, {
                                        data: rows, field: col.name,
                                        filterAll: props.filterAll,
                                        shortLabels: cellShortLabels
                                    }
                                        ),
                                    width,
                                    fixed: col.fixed,
                                    allowCellsRecycling: true,
                                    columnKey: col.name,
                                    key: col.name,
                                    isResizable: props.isResizable
                                }
                                );
                            }
                            return (
                                column
                            );
                        })
                    )
                )
            );
        }
    });

// Root component
    const Main = React.createClass({
        displayName: 'Main',
        SortTypes: {
            ASC: 'ASC',
            DESC: 'DESC'
        },

        rows: null,

        getColumnWidth(cols, rows, measureMethod, columnMinWidth) {
            let columnWidth = {};
            const self = this;

            const $ruler = $('<span style="font-size:14px"/>').appendTo('body');

            if (self.props.autoColumnWidth) {
                let rulerWidth = 0;
                _.each(rows, (row) => {
                    _.each(row, (data, attr) => {
                        if (data) {
                            data = data.toString();
                            if (!columnWidth.hasOwnProperty(attr)) {
                                columnWidth[attr] = 0;
                            }
                            switch (measureMethod) {
                                case 'jquery':
                                    $ruler.css('font-size', '14px');
                                    $ruler.text(data);
                                    rulerWidth = $ruler.outerWidth();
                                    break;
                                default:
                                    var upperCaseLength = data.replace(/[^A-Z]/g, '').length;
                                    var dataLength = data.length;
                                    rulerWidth = upperCaseLength * 10 + (dataLength - upperCaseLength) * 8 + 15;
                                    break;
                            }

                            columnWidth[attr] = columnWidth[attr] < rulerWidth ? rulerWidth : columnWidth[attr];
                        }
                    });
                });

                // 20px is the padding.
                columnWidth = _.object(_.map(columnWidth, (length, attr) => {
                    return [attr, length > self.props.columnMaxWidth ?
                        self.props.columnMaxWidth :
                        ((length + 20) < columnMinWidth ?
                            columnMinWidth : (length + 20))];
                }));
            } else {
                _.each(cols, (col, attr) => {
                    columnWidth[col.name] = col.width ? col.width : 200;
                });
            }

            $ruler.remove();

            return columnWidth;
        },

        getShortLabels(rows, cols, columnWidth, measureMethod) {
            const cellShortLabels = [];
            const headerShortLabels = {};

            _.each(rows, (row) => {
                const rowWidthObj = {};
                _.each(row, (content, attr) => {
                    let _label = content;
                    let _labelShort = _label;
                    let _labelWidth;
                    if (_label) {
                        _label = _label.toString();
                        switch (measureMethod) {
                            case 'jquery':
                                var ruler = $('#ruler');
                                ruler.text(_label);
                                ruler.css('font-size', '14px');
                                _labelWidth = ruler.outerWidth();
                                break;
                            default:
                                var upperCaseLength = _label.replace(/[^A-Z]/g, '').length;
                                var dataLength = _label.length;
                                _labelWidth = upperCaseLength * 10 + (dataLength - upperCaseLength) * 8 + 15;
                                break;
                        }
                        if (_labelWidth > columnWidth[attr]) {
                            const end = Math.floor(_label.length * columnWidth[attr] / _labelWidth) - 3;
                            _labelShort = `${_label.substring(0, end)}...`;
                        } else {
                            _labelShort = _label;
                        }
                    }
                    rowWidthObj[attr] = _labelShort;
                });
                cellShortLabels.push(rowWidthObj);
            });

            _.each(cols, (col) => {
                let _label = col.displayName;
                let _shortLabel = '';
                let _labelWidth;

                if (_label) {
                    _label = _label.toString();
                    switch (measureMethod) {
                        case 'jquery':
                            var ruler = $('#ruler');
                            ruler.text(_label);
                            ruler.css('font-size', '14px');
                            ruler.css('font-weight', 'bold');
                            _labelWidth = ruler.outerWidth();
                            break;
                        default:
                            var upperCaseLength = _label.replace(/[^A-Z]/g, '').length;
                            var dataLength = _label.length;
                            _labelWidth = upperCaseLength * 10 + (dataLength - upperCaseLength) * 8 + 40;
                            break;
                    }
                    if (_labelWidth > columnWidth[col.name]) {
                        const end = Math.floor(_label.length * columnWidth[col.name] / _labelWidth) - 3;
                        _shortLabel = `${_label.substring(0, end)}...`;
                    } else {
                        _shortLabel = _label;
                    }
                }
                headerShortLabels[col.name] = _shortLabel;
            });

            return {
                cell: cellShortLabels,
                header: headerShortLabels
            };
        },
        // Filters rows by selected column
        filterRowsBy(filterAll, filters) {
            const rows = this.rows.slice();
            const hasGroupHeader = this.props.groupHeader;
            const filterRowsStartIndex = [];
            let filteredRows = _.filter(rows, (row, index) => {
                let allFlag = false; // Current row contains the global keyword
                for (const col in filters) {
                    if (!filters[col].hide) {
                        if (filters[col].type == 'STRING') {
                            if (!row[col] && hasGroupHeader) {
                                if (filters[col].key.length > 0) {
                                    return false;
                                }
                            } else {
                                if (hasGroupHeader && row[col].toLowerCase().indexOf(filters[col].key.toLowerCase()) < 0) {
                                    return false;
                                }
                                if (row[col] && row[col].toLowerCase().indexOf(filterAll.toLowerCase()) >= 0) {
                                    allFlag = true;
                                }
                            }
                        } else if (filters[col].type === 'NUMBER' || filters[col].type == 'PERCENTAGE') {
                            const cell = _.isUndefined(row[col]) ? row[col] : Number(row[col].toString().replace('%', ''));
                            if (!isNaN(cell)) {
                                if (hasGroupHeader) {
                                    if (filters[col].min !== filters[col]._min && Number(cell) < filters[col].min) {
                                        return false;
                                    }
                                    if (filters[col].max !== filters[col]._max && Number(cell) > filters[col].max) {
                                        return false;
                                    }
                                }
                                if (row[col] && row[col].toString().toLowerCase().indexOf(filterAll.toLowerCase()) >= 0) {
                                    allFlag = true;
                                }
                            }
                        }
                    }
                }
                if (allFlag) {
                    filterRowsStartIndex.push(index);
                }
                return allFlag;
            });

            filteredRows = filteredRows.map((item, index) => {
                return {
                    row: item,
                    index: filterRowsStartIndex[index]
                };
            });
            return filteredRows;
        },

        // Sorts rows by selected column
        sortRowsBy(filteredRows, sortBy, switchDir) {
            let type = this.state.filters[sortBy].type, sortDir = this.state.sortDir,
                SortTypes = this.SortTypes;
            if (switchDir) {
                if (sortBy === this.state.sortBy) {
                    sortDir = this.state.sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
                } else {
                    sortDir = SortTypes.DESC;
                }
            }

            filteredRows.sort((a, b) => {
                let sortVal = 0, aVal = a.row[sortBy], bVal = b.row[sortBy];
                if (type == 'NUMBER') {
                    aVal = (aVal && !isNaN(aVal)) ? Number(aVal) : aVal;
                    bVal = (bVal && !isNaN(bVal)) ? Number(bVal) : bVal;
                }
                if (type == 'PERCENTAGE') {
                    aVal = aVal ? Number(aVal.replace('%', '')) : aVal;
                    bVal = bVal ? Number(bVal.replace('%', '')) : bVal;
                }
                if (typeof aVal != 'undefined' && !isNaN(aVal) && typeof bVal != 'undefined' && !isNaN(bVal)) {
                    if (aVal > bVal) {
                        sortVal = 1;
                    }
                    if (aVal < bVal) {
                        sortVal = -1;
                    }

                    if (sortDir === SortTypes.ASC) {
                        sortVal = sortVal * -1;
                    }
                } else if (typeof aVal != 'undefined' && typeof bVal != 'undefined') {
                    if (!isNaN(aVal)) {
                        sortVal = -1;
                    } else if (!isNaN(bVal)) {
                        sortVal = 1;
                    }
                    else {
                        if (aVal > bVal) {
                            sortVal = 1;
                        }
                        if (aVal < bVal) {
                            sortVal = -1;
                        }

                        if (sortDir === SortTypes.ASC) {
                            sortVal = sortVal * -1;
                        }
                    }
                } else if (aVal) {
                    sortVal = -1;
                }
                else {
                    sortVal = 1;
                }

                return sortVal;
            });

            return { filteredRows, sortDir };
        },

        // Sorts and sets state
        sortNSet(sortBy) {
            const result = this.sortRowsBy(this.state.filteredRows, sortBy, true);
            this.setState({
                filteredRows: result.filteredRows,
                sortBy,
                sortDir: result.sortDir
            });
        },

        // Filters, sorts and sets state
        filterSortNSet(filterAll, filters, sortBy) {
            const filteredRows = this.filterRowsBy(filterAll, filters);
            const result = this.sortRowsBy(filteredRows, sortBy, false);
            this.setState({
                filteredRows: result.filteredRows,
                sortBy,
                sortDir: result.sortDir,
                filterAll,
                filters
            });
        },

        // Operations when filter keyword changes
        onFilterKeywordChange(e) {
            ++this.state.filterTimer;

            // Disable event pooling in react, see https://goo.gl/1mq6qI
            e.persist();

            const self = this;
            const id = setTimeout(() => {
                let filterAll = self.state.filterAll, filters = self.state.filters;
                if (e.target.getAttribute('data-column') == 'all') {
                    filterAll = e.target.value;
                } else {
                    filters[e.target.getAttribute('data-column')].key = e.target.value;
                }
                self.filterSortNSet(filterAll, filters, self.state.sortBy);
                --self.state.filterTimer;
            }, 500);

            if (this.state.filterTimer > 1) {
                clearTimeout(id);
                --self.state.filterTimer;
            }
        },

        // Operations when filter range changes
        onFilterRangeChange(column, min, max) {
            ++this.state.filterTimer;

            const self = this;
            const id = setTimeout(() => {
                const filters = self.state.filters;
                filters[column].min = min;
                filters[column].max = max;
                self.filterSortNSet(self.state.filterAll, filters, self.state.sortBy);
                --self.state.filterTimer;
            }, 500);

            if (this.state.filterTimer > 1) {
                clearTimeout(id);
                --self.state.filterTimer;
            }
        },

        // Operations when reset all filters
        onResetFilters() {
            const filters = this.state.filters;
            _.each(filters, (filter) => {
                if (!_.isUndefined(filter._key)) {
                    filter.key = filter._key;
                }
                if (!_.isUndefined(filter._min)) {
                    filter.min = filter._min;
                }
                if (!_.isUndefined(filter._max)) {
                    filter.max = filter._max;
                }
                filter.reset = true;
            });
            if (this.props.groupHeader) {
                this.registerSliders();
            }
            this.filterSortNSet('', filters, this.state.sortBy);
        },

        updateCols(cols, filters) {
            const filteredRows = this.filterRowsBy(this.state.filterAll, filters);
            const result = this.sortRowsBy(filteredRows, this.state.sortBy, false);
            this.setState({
                cols,
                filteredRows: result.filteredRows,
                filters
            });
            if (this.props.groupHeader) {
                this.registerSliders();
            }
        },

        updateGoToColumn(val) {
            this.setState({
                goToColumn: val
            });
        },

        registerSliders() {

            console.log('RESTORE registerSliders !!!!!!');
            return;
            /*
            var onFilterRangeChange = this.onFilterRangeChange;
            $('.rangeSlider')
                .each(function () {
                    var min = Math.floor(Number($(this).attr('data-min')) * 100) / 100, max = (Math.ceil(Number($(this).attr('data-max')) * 100)) / 100,
                        column = $(this).attr('data-column'), diff = max - min, step = 1;
                    var type = $(this).attr('data-type');

                    if (diff < 0.01) {
                        step = 0.001;
                    } else if (diff < 0.1) {
                        step = 0.01;
                    } else if (diff < 2) {
                        step = 0.1;
                    }

                    $(this).slider({
                        range: true,
                        min: min,
                        max: max,
                        step: step,
                        values: [min, max],
                        change: function (event, ui) {
                            $("#range-" + column).text(ui.values[0] + " to " + ui.values[1]);
                            onFilterRangeChange(column, ui.values[0], ui.values[1]);
                        }
                    });
                    if (type === 'PERCENTAGE') {
                        $("#range-" + column).text(min + "% to " + max + '%');
                    } else {
                        $("#range-" + column).text(min + " to " + max);
                    }
                });
            */
        },
        // Processes input data, and initializes table states
        getInitialState() {
            let cols = [], rows = [], rowsDict = {}, attributes = this.props.input.attributes,
                data = this.props.input.data, dataLength = data.length, col, cell, i, filters = {},
                uniqueId = this.props.uniqueId || 'id', newCol,
                measureMethod = (dataLength > 100000 || !this.props.autoColumnWidth) ? 'charNum' : 'jquery',
                columnMinWidth = this.props.groupHeader ? 130 : 50; // The minimum width to at least fit in number slider.


            // Gets column info from input
            const colsDict = {};
            for (i = 0; i < attributes.length; i++) {
                col = attributes[i];
                newCol = {
                    displayName: col.display_name,
                    name: col.attr_id,
                    type: col.datatype,
                    fixed: false,
                    show: true
                };

                if (col.hasOwnProperty('column_width')) {
                    newCol.width = col.column_width;
                }

                if (_.isBoolean(col.show)) {
                    newCol.show = col.show;
                }

                if (_.isBoolean(col.fixed)) {
                    newCol.fixed = col.fixed;
                }

                cols.push(newCol);
                colsDict[col.attr_id] = i;
            }

            // Gets data rows from input
            for (i = 0; i < dataLength; i++) {
                cell = data[i];
                if (!rowsDict[cell[uniqueId]]) {
                    rowsDict[cell[uniqueId]] = {};
                }
                rowsDict[cell[uniqueId]][cell.attr_id] = cell.attr_val;
            }

            _.each(rowsDict, (item, i) => {
                rowsDict[i][uniqueId] = i;
                rows.push(rowsDict[i]);
            });

            // Gets the range of number type features
            for (i = 0; i < cols.length; i++) {
                col = cols[i];
                const _filter = {
                    type: col.type,
                    hide: !col.show
                };

                if (col.type == 'NUMBER' || col.type == 'PERCENTAGE') {
                    let min = Number.MAX_VALUE, max = -Number.MAX_VALUE;
                    for (let j = 0; j < rows.length; j++) {
                        cell = _.isUndefined(rows[j][col.name]) ? rows[j][col.name] : rows[j][col.name].toString().replace('%');
                        if (typeof cell != 'undefined' && !isNaN(cell)) {
                            cell = Number(cell);
                            max = cell > max ? cell : max;
                            min = cell < min ? cell : min;
                        }
                    }
                    if (max === -Number.MAX_VALUE || min === Number.MIN_VALUE) {
                        _filter.key = '';
                        _filter._key = '';
                    } else {
                        col.max = max;
                        col.min = min;
                        _filter.min = min;
                        _filter.max = max;
                        _filter._min = min;
                        _filter._max = max;
                    }
                } else {
                    _filter.key = '';
                    _filter._key = '';
                }
                filters[col.name] = _filter;
            }

            if (this.props.columnSorting) {
                cols = _.sortBy(cols, (obj) => {
                    if (!_.isUndefined(obj.displayName)) {
                        return obj.displayName;
                    } else {
                        return obj.name;
                    }
                });
            }

            this.rows = rows;

            const columnWidths = this.getColumnWidth(cols, rows, measureMethod, columnMinWidth);
            const shortLabels = this.getShortLabels(rows, cols, columnWidths, measureMethod);

            return {
                cols,
                rowsSize: rows.length,
                filteredRows: null,
                filterAll: '',
                filters,
                sortBy: uniqueId,
                sortDir: this.SortTypes.DESC,
                goToColumn: null,
                filterTimer: 0,
                shortLabels,
                columnWidths,
                columnMinWidth,
                measureMethod
            };
        },

        // Initializes filteredRows before first rendering
        componentWillMount() {
            this.filterSortNSet(this.state.filterAll, this.state.filters, this.state.sortBy);
        },

        // Will be triggered if the column width has been changed
        onColumnResizeEndCallback(width, key) {
            let foundMatch = false;
            const cols = this.state.cols;

            _.each(cols, (col, attr) => {
                if (col.name === key) {
                    col.width = width;
                    foundMatch = true;
                }
            });
            if (foundMatch) {
                const columnWidths = this.state.columnWidths;
                columnWidths[key] = width;
                const shortLabels = this.getShortLabels(this.rows, cols, columnWidths, this.state.measureMethod);
                this.setState({
                    columnWidths,
                    shortLabels,
                    cols
                });
            }
        },

        // Activates range sliders after first rendering
        componentDidMount() {
            if (this.props.groupHeader) {
                this.registerSliders();
            }
        },

        // Sets default properties
        getDefaultProps() {
            return {
                filter: 'NONE',
                download: 'NONE',
                showHide: false,
                hideFilter: true,
                scroller: false,
                resultInfo: true,
                groupHeader: true,
                downloadFileName: 'data.txt',
                autoColumnWidth: true,
                columnMaxWidth: 300,
                columnSorting: true,
                isResizable: false
            };
        },

        render() {
            const sortDirArrow = this.state.sortDir === this.SortTypes.DESC ? 'fa fa-sort-desc' : 'fa fa-sort-asc';

            return (
                React.createElement('div', { className: styles.table },

                    React.createElement(TablePrefix, {
                        cols: this.state.cols, rows: this.rows,
                        onFilterKeywordChange: this.onFilterKeywordChange,
                        onResetFilters: this.onResetFilters,
                        filters: this.state.filters,
                        updateCols: this.updateCols,
                        updateGoToColumn: this.updateGoToColumn,
                        scroller: this.props.scroller,
                        filter: this.props.filter,
                        hideFilter: this.props.hideFilter,
                        getData: this.props.download,
                        downloadFileName: this.props.downloadFileName,
                        hider: this.props.showHide,
                        fixedChoose: this.props.fixedChoose,
                        resultInfo: this.props.resultInfo,
                        rowsSize: this.state.rowsSize,
                        filteredRowsSize: this.state.filteredRows.length
                    }
                    )
                    ,
                    React.createElement('div', { className: 'EFDT-tableMain' },
                        React.createElement(TableMainPart, {
                            cols: this.state.cols,
                            filteredRows: this.state.filteredRows,
                            filters: this.state.filters,
                            sortNSet: this.sortNSet,
                            onFilterKeywordChange: this.onFilterKeywordChange,
                            goToColumn: this.state.goToColumn,
                            sortBy: this.state.sortBy,
                            sortDirArrow,
                            filterAll: this.state.filterAll,
                            filter: this.props.filter,
                            rowHeight: this.props.rowHeight,
                            tableWidth: this.props.tableWidth,
                            maxHeight: this.props.maxHeight,
                            headerHeight: this.props.headerHeight,
                            groupHeaderHeight: this.props.groupHeaderHeight,
                            groupHeader: this.props.groupHeader,
                            shortLabels: this.state.shortLabels,
                            columnWidths: this.state.columnWidths,
                            isResizable: this.props.isResizable,
                            onColumnResizeEndCallback: this.onColumnResizeEndCallback
                        }
                        )
                    )
                )
            );
        }
    });

    return Main;
}());

export default EnhancedFixedDataTable;
