import React from 'react';
import {assert} from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import {lazyMobXTableSort, default as LazyMobXTable, Column} from "./LazyMobXTable";
import SimpleTable from "../simpleTable/SimpleTable";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import expect from 'expect';
import expectJSX from 'expect-jsx';
import lolex from "lolex";
import {Clock} from "lolex";
import {PaginationControls} from "../paginationControls/PaginationControls";
import {Button, FormControl, Checkbox} from 'react-bootstrap';
import {ColumnVisibilityControls} from "../columnVisibilityControls/ColumnVisibilityControls";
import {SimpleMobXApplicationDataStore} from "../../lib/IMobXApplicationDataStore";
import cloneJSXWithoutKeyAndRef from "shared/lib/cloneJSXWithoutKeyAndRef";

expect.extend(expectJSX);

class Table extends LazyMobXTable<any> {
}

class HighlightingDataStore extends SimpleMobXApplicationDataStore<any> {
    constructor(data:any[]) {
        super(data);
        this.dataHighlighter = (d:any)=>(d.numList[1] === null);
    }
}

function getVisibleColumnHeaders(tableWrapper:ReactWrapper<any, any>):string[] {
    return tableWrapper.find('th span').map(span=>span.text());
}

function simulateTableSearchInput(table:ReactWrapper<any, any>, str:string) {
    let input = table.find('input.tableSearchInput');
    (input as any).getNode().value = str;
    input.simulate('input');
}

function clickPrevPage(table:ReactWrapper<any, any>):boolean {
    let btn = table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).find(Button).filterWhere(x=>x.hasClass("prevPageBtn"));
    if (btn.length === 0 || btn.props().disabled) {
        return false;
    } else {
        btn.simulate('click');
        return true;
    }
}

function clickNextPage(table:ReactWrapper<any, any>):boolean {
    let btn = table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).find(Button).filterWhere(x=>x.hasClass("nextPageBtn"));
    if (btn.length === 0 || btn.props().disabled) {
        return false;
    } else {
        btn.simulate('click');
        return true;
    }
}

function selectItemsPerPage(table:ReactWrapper<any, any>, opt:number):boolean {
    let selector = table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).find(FormControl).filterWhere(x=>x.hasClass("itemsPerPageSelector")).find('select');
    if (selector.length === 0) {
        return false;
    } else {
        selector.simulate('change', {target: {value:opt+""}});
        return true;
    }
}

function getItemsPerPage(table:ReactWrapper<any,any>):number|undefined {
    return table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).props().itemsPerPage;
}

function getCurrentPage(table:ReactWrapper<any, any>):number|undefined {
    return table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).props().currentPage;
}

function getVisibleRows(table:ReactWrapper<any, any>) {
    return table.find(SimpleTable).props().rows.map(cloneJSXWithoutKeyAndRef);
}

function getSimpleTableRows(table:ReactWrapper<any, any>) {
    return table.find(SimpleTable).find("tbody").find("tr");
}

function getNumVisibleRows(table:ReactWrapper<any, any>):number {
    return getVisibleRows(table).length;
}

function getTextBetweenButtons(table:ReactWrapper<any, any>):string | undefined {
    return table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).props().textBetweenButtons;
}

function getTextBeforeButtons(table:ReactWrapper<any, any>):string | undefined {
    return table.find(PaginationControls).filterWhere(x=>x.hasClass("topPagination")).props().textBeforeButtons;
}

function clickColumnVisibilityCheckbox(table:ReactWrapper<any, any>, columnName:string):boolean {
    let checkbox = table.find(ColumnVisibilityControls).find(Checkbox)
                    .find('input[type="checkbox"]')
                    .filterWhere(x=>(((x.props() as any)['data-id'] as string) === columnName))
    checkbox.simulate('change', {target: {checked:true}});
    return !!checkbox.props().checked;
}

describe('LazyMobXTable', ()=>{
    let simpleColumns:Column<{id:string}>[];
    let simpleData:{id:string}[];
    let datum0 = {
        name:"0",
        num:0,
        str:"asdfj",
        numList:[0,1,null],
        strList:["a",null,"b"],
        invisibleString:"FILTER0"
    };
    let datum1 = {
        name:"1",
        num:6,
        str:"kdfjpo",
        numList:[77,null,null],
        strList:["asdijf","ckjzp","b"],
        invisibleString:"FILTER1"
    };
    let datum2 = {
        name:"2",
        num:null,
        str:null,
        numList:[-1,0,3],
        strList:[null,null,null],
        invisibleString:"FILTER2"
    };
    let datum3 = {
        name:"3",
        num:-1,
        str:"zijxcpo",
        numList:[null,null,78],
        strList:["a","b","b"],
        invisibleString:"FILTER3"
    };
    let datum4 = {
        name:"4",
        num:90,
        str:"zkzxc",
        numList:[null,null,-1],
        strList:["asdijf","ca","zzxf"],
        invisibleString:"FILTER4"
    };
    let data = [datum0, datum1, datum2, datum3, datum4];
    let sortedList:any[];
    let columns:any[] = [{
        name: "Name",
        filter: (d:any,s:string)=>(d.name.indexOf(s) > -1),
        sortBy: (d:any)=>d.name,
        render:(d:any)=>(<span>{d.name}</span>),
        download:(d:any)=>d.name,
        tooltip:(<span>Name of the data.</span>)
    },{
        name: "Number",
        sortBy: (d:any)=>d.num,
        render:(d:any)=>(<span>{d.num}</span>),
        download:(d:any)=>d.num+'',
        tooltip:(<span>Number of the data.</span>),
        defaultSortDirection: "desc"
    },{
        name: "String",
        filter: (d:any,s:string)=>(d.str && d.str.indexOf(s) > -1),
        sortBy: (d:any)=>d.str,
        render:(d:any)=>(<span>{d.str}</span>),
        download:(d:any)=>d.str+'',
        tooltip:(<span>String of the data</span>),
        defaultSortDirection: "desc"
    },{
        name: "Number List",
        render:(d:any)=>(<span>BLAH</span>),
    },{
        name: "Initially invisible column",
        filter: (d:any,s:string)=>(d.invisibleString.indexOf(s) > -1),
        visible: false,
        sortBy: (d:any)=>d.name,
        render:(d:any)=>(<span>{d.name}</span>),
        download:(d:any)=>d.name+"HELLO123456",
    },{
        name: "Initially invisible column with no download",
        render:()=>(<span></span>),
        visible: false,
    },{
        name: "String without filter function",
        render:(d:any)=>(<span>{d.str}</span>),
    }];

    let clock:Clock;
    before(()=>{
        clock = lolex.install();
        simpleColumns = [
            {
                name: "ID",
                render: (d:any)=>(<span>{d.id}</span>),
                sortBy: (d:any)=>parseInt(d.id, 10)
            }
        ];
        simpleData = [];
        for (let i=0; i<120; i++) {
            simpleData.push({id:i+""});
        }
    });

    after(()=>{
        clock.uninstall();
    });

    describe('lazyMobXTableSort', ()=>{
        it("does not sort in place", ()=>{
            sortedList = lazyMobXTableSort(data, d=>d.num, true);
            assert.deepEqual(data.map(d=>d.name), ["0","1","2","3","4"], "original list is unchanged..");
            assert.notDeepEqual(sortedList.map(d=>d.name), ["0","1","2","3","4"], "..even though sorted list is diff order");
            sortedList = lazyMobXTableSort(data, d=>d.num, false);
            assert.deepEqual(data.map(d=>d.name), ["0","1","2","3","4"], "original list is unchanged..");
            assert.notDeepEqual(sortedList.map(d=>d.name), ["0","1","2","3","4"], "..even though sorted list is diff order");
        });
        it("sorts number|null values properly", ()=>{
            sortedList = lazyMobXTableSort(data, d=>d.num, true);
            assert.deepEqual(sortedList.map(d=>d.name), ["3","0","1","4","2"], "sorts ascending properly");
            sortedList = lazyMobXTableSort(data, d=>d.num, false);
            assert.deepEqual(sortedList.map(d=>d.name), ["4","1","0","3","2"], "sorts descending properly");
        });
        it("sorts (number|null)[] values properly", ()=>{
            sortedList = lazyMobXTableSort(data, d=>d.numList, true);
            assert.deepEqual(sortedList.map(d=>d.name), ["2","0","1","4","3"], "sorts ascending properly");
            sortedList = lazyMobXTableSort(data, d=>d.numList, false);
            assert.deepEqual(sortedList.map(d=>d.name), ["1","0","2","3","4"], "sorts descending properly");
        });
        it("sorts string|null values properly", ()=>{
            sortedList = lazyMobXTableSort(data, d=>d.str, true);
            assert.deepEqual(sortedList.map(d=>d.name), ["0","1","3","4","2"], "sorts ascending properly");
            sortedList = lazyMobXTableSort(data, d=>d.str, false);
            assert.deepEqual(sortedList.map(d=>d.name), ["4","3","1","0","2"], "sorts descending properly");
        });
        it("sorts (string|null)[] values properly", ()=>{
            sortedList = lazyMobXTableSort(data, d=>d.strList, true);
            assert.deepEqual(sortedList.map(d=>d.name), ["3","0","4","1","2"], "sorts ascending properly");
            sortedList = lazyMobXTableSort(data, d=>d.strList, false);
            assert.deepEqual(sortedList.map(d=>d.name), ["1","4","3","0","2"], "sorts descending properly");
        });
        it("sorts empty list properly", ()=>{
            assert.deepEqual(lazyMobXTableSort([], d=>(d as any).name, true), [], "empty sort is empty");
            assert.deepEqual(lazyMobXTableSort([], d=>(d as any).name, false), [], "empty sort is empty");
        });
        it("sorts singleton list properly", ()=>{
            assert.deepEqual(lazyMobXTableSort([datum0], d=>(d as any).name, true), [datum0], "singleton sort is singleton");
            assert.deepEqual(lazyMobXTableSort([datum1], d=>(d as any).name, false), [datum1], "singleton sort is singleton");
        });
        it("is a stable sort", ()=>{
            let d0 = {
                stringVal: "A",
                numVal: 0,
                stringListVal: ["A"],
                numListVal: [0]
            };
            let d1 = {
                stringVal: "B",
                numVal: 1,
                stringListVal: ["B"],
                numListVal: [1]
            };
            let d2 = {
                stringVal: "B",
                numVal: 1,
                stringListVal: ["B"],
                numListVal: [1]
            };
            let d3 = {
                stringVal: "C",
                numVal: 2,
                stringListVal: ["C"],
                numListVal: [2]
            };
            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.stringVal, true), [d0, d1, d2, d3], "string: same order, ascending");
            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.stringVal, false), [d3, d1, d2, d0], "string: same order, descending");
            assert.deepEqual(lazyMobXTableSort([d0, d2, d1, d3], d=>d.stringVal, true), [d0, d2, d1, d3], "string: reversed order, ascending");

            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.numVal, true), [d0, d1, d2, d3], "number: same order, ascending");
            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.numVal, false), [d3, d1, d2, d0], "number: same order, descending");
            assert.deepEqual(lazyMobXTableSort([d0, d2, d1, d3], d=>d.numVal, true), [d0, d2, d1, d3], "number: reversed order, ascending");

            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.stringListVal, true), [d0, d1, d2, d3], "string list: same order, ascending");
            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.stringListVal, false), [d3, d1, d2, d0], "string list: same order, descending");
            assert.deepEqual(lazyMobXTableSort([d0, d2, d1, d3], d=>d.stringListVal, true), [d0, d2, d1, d3], "string list: reversed order, ascending");

            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.numListVal, true), [d0, d1, d2, d3], "number list: same order, ascending");
            assert.deepEqual(lazyMobXTableSort([d0, d1, d2, d3], d=>d.numListVal, false), [d3, d1, d2, d0], "number list: same order, descending");
            assert.deepEqual(lazyMobXTableSort([d0, d2, d1, d3], d=>d.numListVal, true), [d0, d2, d1, d3], "number list: reversed order, ascending");
        });
    });
    describe('headers', ()=>{
        it("shows headers for all the given visible columns, including the cases of one and zero columns", ()=>{
            let table = mount(<Table columns={columns} data={data}/>);
            assert.deepEqual(table.find(SimpleTable).find("th").map(x=>x.text()), ["Name", "Number", "String", "Number List", "String without filter function"],
                "5 visible columns showing the given header labels, in the given order, case: with data");

            table = mount(<Table columns={[columns[0]]} data={data}/>);
            assert.deepEqual(table.find(SimpleTable).find("th").map(x=>x.text()), ["Name"],
                "case of only one column, shows the name correctly, case: with data");

            table = mount(<Table columns={columns} data={[]}/>);
            assert.deepEqual(table.find(SimpleTable).find("th").map(x=>x.text()), ["Name", "Number", "String", "Number List", "String without filter function"],
                "5 visible columns showing the given header labels, in the given order, case: no data");

            table = mount(<Table columns={[columns[0]]} data={[]}/>);
            assert.deepEqual(table.find(SimpleTable).find("th").map(x=>x.text()), ["Name"],
                "case of only one column, shows the name correctly, case: no data");

            table = mount(<Table columns={[]} data={data}/>);
            assert.deepEqual(table.find(SimpleTable).find("th").length, 0, "no columns given => no column headers rendered, case: with data");

            table = mount(<Table columns={[]} data={[]}/>);
            assert.deepEqual(table.find(SimpleTable).find("th").length, 0, "no columns given => no column headers rendered, case: no data");
        });

        it("has a tooltip element for columns with tooltips, and no tooltips for columns without tooltips", ()=>{
            let table = mount(<Table columns={columns} data={[]}/>);
            let tooltips = table.find(SimpleTable).find("th").find(DefaultTooltip);
            assert(tooltips.length === 3, "should be three tooltips, for the columns where it is defined");
            expect(tooltips.at(0).props().overlay).toEqualJSX(<span>Name of the data.</span>, "Name tooltip should look as specified");
            expect(tooltips.at(1).props().overlay).toEqualJSX(<span>Number of the data.</span>, "Number tooltip should look as specified");
            expect(tooltips.at(2).props().overlay).toEqualJSX(<span>String of the data</span>, "String tooltip should look as specified");
        });

        it("initially has no header with sort classes if no initial sort column specified", ()=>{
            let table = mount(<Table columns={columns} data={[]}/>);
            let headersHaveClasses = table.find(SimpleTable).find('th').map(x=>(x.hasClass("sort-asc") || x.hasClass("sort-des")));
            assert.isFalse(headersHaveClasses.reduce((x,y)=>x||y, false), "none of them have any sort classes");
        });
        it("sets initial sort class correctly, and sets and toggles class correctly when clicking on columns", ()=>{
            let table = mount(<Table initialSortColumn="Name" initialSortDirection="desc" columns={columns} data={[]}/>);
            let nameHeader = table.find(SimpleTable).find('th').at(0);
            assert.equal(nameHeader.text(), "Name", "we're dealing with the name header");
            assert.isTrue(nameHeader.hasClass("sort-des"), "table starts with the initial sort specs given in the props");
            nameHeader.simulate('click');
            assert.isTrue(nameHeader.hasClass("sort-asc") && !nameHeader.hasClass("sort-des"), "toggles to ascending sort");
            nameHeader.simulate('click');
            assert.isTrue(nameHeader.hasClass("sort-des") && !nameHeader.hasClass("sort-asc"), "toggles to descending sort");
            nameHeader.simulate('click');
            assert.isTrue(nameHeader.hasClass("sort-asc") && !nameHeader.hasClass("sort-des"), "goes back to ascending sort");
            nameHeader.simulate('click');
            assert.isTrue(nameHeader.hasClass("sort-des") && !nameHeader.hasClass("sort-asc"), "goes back to descending sort");

            let stringHeader = table.find(SimpleTable).find('th').at(2);
            assert.equal(stringHeader.text(), "String", "we're dealing with the string header");
            assert.isFalse(stringHeader.hasClass("sort-asc") || stringHeader.hasClass("sort-des"), "string header doesnt have any sort classes to start");
            stringHeader.simulate('click');
            assert.isTrue(stringHeader.hasClass("sort-des") && !stringHeader.hasClass("sort-asc"), "string header starts with descending sort, its defaultSortDirection");
            assert.isFalse(nameHeader.hasClass("sort-asc") || nameHeader.hasClass("sort-des"), "name header no longer has any sort classes");
            stringHeader.simulate('click');
            assert.isTrue(stringHeader.hasClass("sort-asc") && !stringHeader.hasClass("sort-des"), "string header toggles to ascending sort");
            assert.isFalse(nameHeader.hasClass("sort-asc") || nameHeader.hasClass("sort-des"), "name header no longer has any sort classes");
            stringHeader.simulate('click');
            assert.isTrue(stringHeader.hasClass("sort-des") && !stringHeader.hasClass("sort-asc"), "string header toggles to descending sort");
            assert.isFalse(nameHeader.hasClass("sort-asc") || nameHeader.hasClass("sort-des"), "name header still has no sort classes");
            stringHeader.simulate('click');
            assert.isTrue(stringHeader.hasClass("sort-asc") && !stringHeader.hasClass("sort-des"), "string header toggles back to ascending sort");
        });

        it("does nothing on click of a header of an unsortable column", ()=>{
            let table = mount(<Table columns={columns} data={[]}/>);
            let numberListHeader = table.find(SimpleTable).find('th').at(3);
            assert.equal(numberListHeader.text(), "Number List", "we're dealing with the number list header");
            assert.isFalse(numberListHeader.hasClass("sort-asc") || numberListHeader.hasClass("sort-des"), "doesnt have any sort classes to start");
            numberListHeader.simulate('click');
            assert.isFalse(numberListHeader.hasClass("sort-asc") || numberListHeader.hasClass("sort-des"), "doesnt have any sort classes after a click");
            numberListHeader.simulate('click');
            assert.isFalse(numberListHeader.hasClass("sort-asc") || numberListHeader.hasClass("sort-des"), "doesnt have any sort classes after two clicks");
        });

        it("goes back to page 0 when clicking a sortable column, does nothing when clicking on unsortable column", ()=>{
            let dupData = data.concat(data).concat(data).concat(data).concat(data).concat(data).concat(data)
                            .concat(data).concat(data).concat(data).concat(data).concat(data);
            assert.isTrue(dupData.length > 50, "we have at least two pages");
            let table = mount(<Table columns={columns} data={dupData}/>);
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 1, "now on page 1")

            let numberListHeader = table.find(SimpleTable).find('th').at(3);
            assert.equal(numberListHeader.text(), "Number List", "we're dealing with the number list header");
            let nameHeader = table.find(SimpleTable).find('th').at(0);
            assert.equal(nameHeader.text(), "Name", "we're dealing with the name header");

            numberListHeader.simulate('click');
            assert.equal(getCurrentPage(table), 1, "still on page 1");
            nameHeader.simulate('click');
            assert.equal(getCurrentPage(table), 0, "back to page 0");
        });
    });
    describe('sorting', ()=>{
        it("sorts rows according to initially selected sort column and direction", ()=>{
            let table = mount(<Table columns={columns} data={data} initialSortColumn="Number" initialSortDirection="asc"/>);
            let rows = getVisibleRows(table);

            // starting initially sorting ascending by number
            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>
            );
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>
            );
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>
            );
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>
            );
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>
            );

            // now try initially sorting descending by str
            table = mount(<Table columns={columns} data={data} initialSortColumn="String" initialSortDirection="desc"/>);
            rows = getVisibleRows(table);

            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>
            );
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>
            );
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>
            );
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>

            );
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>
            );
        });

        it("sorts rows according to the selected sort column and direction", ()=>{
            let table = mount(<Table columns={columns} data={data}/>);
            let rows = getVisibleRows(table);
            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>);
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>);
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>);
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>);
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>);

            let header = table.find(SimpleTable).find('th').at(1);
            assert.equal(header.text(), "Number", "we're dealing with the number header");
            header.simulate('click');
            assert.isTrue(header.hasClass("sort-des"), "Number column starts with descending, its defaultSortDirection");
            header.simulate('click');
            assert.isTrue(header.hasClass("sort-asc"), "we're dealing with ascending sort");
            rows = getVisibleRows(table);

            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>
                );
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>
                );
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>
                );
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>
                );
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>
                );

            let numberListHeader = table.find(SimpleTable).find('th').at(3);
            assert.equal(numberListHeader.text(), "Number List", "we're dealing with the number list header");
            numberListHeader.simulate('click');
            // nothing should happen because its not sortable, so same order as immediately above
            rows = getVisibleRows(table);

            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>
            );
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>
            );
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>
            );
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>
            );
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>
            );

            header.simulate('click');
            assert.isTrue(header.hasClass("sort-des"), "we're dealing with descending sort");
            rows = getVisibleRows(table);

            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>);
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>);
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>);
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>);
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>);

            header = table.find(SimpleTable).find('th').at(0);
            assert.equal(header.text(), "Name", "we're dealing with the name header");
            header.simulate('click');
            assert.isTrue(header.hasClass("sort-asc"), "we're dealing with ascending sort");
            rows = getVisibleRows(table);
            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>0</span></td>
                    <td><span>0</span></td>
                    <td><span>asdfj</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>asdfj</span></td>
                </tr>);
            expect(rows[1]).toEqualJSX(
                <tr>
                    <td><span>1</span></td>
                    <td><span>6</span></td>
                    <td><span>kdfjpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>kdfjpo</span></td>
                </tr>);
            expect(rows[2]).toEqualJSX(
                <tr>
                    <td><span>2</span></td>
                    <td><span></span></td>
                    <td><span></span></td>
                    <td><span>BLAH</span></td>
                    <td><span></span></td>
                </tr>);
            expect(rows[3]).toEqualJSX(
                <tr>
                    <td><span>3</span></td>
                    <td><span>-1</span></td>
                    <td><span>zijxcpo</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zijxcpo</span></td>
                </tr>);
            expect(rows[4]).toEqualJSX(
                <tr>
                    <td><span>4</span></td>
                    <td><span>90</span></td>
                    <td><span>zkzxc</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>zkzxc</span></td>
                </tr>);
        });
        it("paginates the data correctly according to the sorted order", ()=>{
            let table = mount(<Table columns={simpleColumns} data={simpleData}/>);
            let header = table.find(SimpleTable).find('th').at(0);
            assert.equal(getItemsPerPage(table), 50, "for this test we're assuming 50 items per page");
            assert.equal(simpleData.length, 120, "for this test we're assuming 120 rows total");
            header.simulate('click');
            assert.isTrue(header.hasClass("sort-asc"), "ascending sort");
            let rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{i}</span></td></tr>);
            }
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 1, "now on page 1");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{i+50}</span></td></tr>);
            }
            header.simulate('click');
            assert.isTrue(header.hasClass("sort-des"), "descending sort");
            assert.equal(getCurrentPage(table), 0, "back to page 0");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{119-i}</span></td></tr>);
            }
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 1, "now on page 1");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{119-50-i}</span></td></tr>);
            }
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 2, "now on page 2");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{119-100-i}</span></td></tr>);
            }
        });
    });
    describe('rows',()=>{
        it("renders rows properly, according to specification", ()=>{
            let table = mount(<Table columns={columns} data={data}/>);
            let rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(
                    <tr>
                        <td><span>{data[i].name}</span></td>
                        <td><span>{data[i].num}</span></td>
                        <td><span>{data[i].str}</span></td>
                        <td><span>BLAH</span></td>
                        <td><span>{data[i].str}</span></td>
                    </tr>
                );
            }
            table.setProps({data:[data[0]]});
            rows = getVisibleRows(table);
            assert.equal(rows.length, 1);
            expect(rows[0]).toEqualJSX(
                <tr>
                    <td><span>{data[0].name}</span></td>
                    <td><span>{data[0].num}</span></td>
                    <td><span>{data[0].str}</span></td>
                    <td><span>BLAH</span></td>
                    <td><span>{data[0].str}</span></td>
                </tr>
            );
            table.setProps({data:[]});
            rows = getVisibleRows(table);
            assert.equal(rows.length, 0);
        });
        it("highlights rows properly, according to highlight function in data store", ()=>{
            const store:HighlightingDataStore = new HighlightingDataStore(data);
            let table = mount(<Table columns={columns} dataStore={store}/>);
            let rows = getSimpleTableRows(table);
            assert.isFalse(rows.at(0).hasClass("highlight"), "row 0 not highlighted");
            assert.isTrue(rows.at(1).hasClass("highlight"), "row 1 highlighted");
            assert.isFalse(rows.at(2).hasClass("highlight"), "row 2 not highlighted");
            assert.isTrue(rows.at(3).hasClass("highlight"), "row 3 highlighted");
            assert.isTrue(rows.at(4).hasClass("highlight"), "row 4 highlighted");
        });
    });
    describe('column visibility', ()=>{
        // test visibility of headers and correponding data cells in the rows
        let table:ReactWrapper<any, any>;
        before(()=>{
            table = mount(<Table columns={columns} data={data}/>);
        });
        it("shows initially visible columns at first, and does not show invisible ones", ()=>{
            assert.deepEqual(getVisibleColumnHeaders(table), ["Name", "Number", "String", "Number List", "String without filter function"],
                "initially visible columns are the ones specified without 'visible:false'");
        });
        it("allows changing column visibility", ()=>{
            let rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(
                    <tr>
                        <td><span>{data[i].name}</span></td>
                        <td><span>{data[i].num}</span></td>
                        <td><span>{data[i].str}</span></td>
                        <td><span>BLAH</span></td>
                        <td><span>{data[i].str}</span></td>
                    </tr>
                );
            }
            assert.isFalse(clickColumnVisibilityCheckbox(table, 'Name'), "Name checkbox is now unchecked");
            assert.deepEqual(getVisibleColumnHeaders(table), ["Number", "String", "Number List", "String without filter function"],
                "Name column no longer visible");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(
                    <tr>
                        <td><span>{data[i].num}</span></td>
                        <td><span>{data[i].str}</span></td>
                        <td><span>BLAH</span></td>
                        <td><span>{data[i].str}</span></td>
                    </tr>
                );
            }
            assert.isTrue(clickColumnVisibilityCheckbox(table, "Initially invisible column"), "Iic column is now checked")
            assert.deepEqual(getVisibleColumnHeaders(table), ["Number", "String", "Number List", "Initially invisible column", "String without filter function"],
                "Initially invisible column is now visible, and in the specified order");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(
                    <tr>
                        <td><span>{data[i].num}</span></td>
                        <td><span>{data[i].str}</span></td>
                        <td><span>BLAH</span></td>
                        <td><span>{data[i].name}</span></td>
                        <td><span>{data[i].str}</span></td>
                    </tr>
                );
            }
            // resetting
            assert.isTrue(clickColumnVisibilityCheckbox(table, 'Name'), "Name checkbox is now checked");
            assert.isFalse(clickColumnVisibilityCheckbox(table, "Initially invisible column"), "Iic column is now unchecked")
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(
                    <tr>
                        <td><span>{data[i].name}</span></td>
                        <td><span>{data[i].num}</span></td>
                        <td><span>{data[i].str}</span></td>
                        <td><span>BLAH</span></td>
                        <td><span>{data[i].str}</span></td>
                    </tr>
                );
            }
        });
        it("does not break if no columns are visible", ()=>{
            assert.isFalse(clickColumnVisibilityCheckbox(table, "Name"), "unchecking Name");
            assert.isFalse(clickColumnVisibilityCheckbox(table, "Number"), "unchecking Number");
            assert.isFalse(clickColumnVisibilityCheckbox(table, "String"), "unchecking String");
            assert.isFalse(clickColumnVisibilityCheckbox(table, "Number List"), "unchecking Number List");
            assert.isFalse(clickColumnVisibilityCheckbox(table, "String without filter function"), "unchecking String without filter function");
            assert.deepEqual(getVisibleColumnHeaders(table), [], "no headers visible");
            // Rows should be empty
            let rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr></tr>);
            }
            assert.isTrue(clickColumnVisibilityCheckbox(table, "Name"), "checking Name");
            assert.isTrue(clickColumnVisibilityCheckbox(table, "Number"), "checking Number");
            assert.isTrue(clickColumnVisibilityCheckbox(table, "String"), "checking String");
            assert.isTrue(clickColumnVisibilityCheckbox(table, "Number List"), "checking Number List");
            assert.isTrue(clickColumnVisibilityCheckbox(table, "String without filter function"), "checking String without filter function");
            // rows should be back to normal
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(
                    <tr>
                        <td><span>{data[i].name}</span></td>
                        <td><span>{data[i].num}</span></td>
                        <td><span>{data[i].str}</span></td>
                        <td><span>BLAH</span></td>
                        <td><span>{data[i].str}</span></td>
                    </tr>
                );
            }
        });
    });
    describe('filtering (IMPORTANT: assuming delay of 400ms)', ()=>{
        it("does not filter through invisible columns", ()=>{
            let filterString = "FILTER0";
            let table = mount(<Table columns={columns} data={data}/>);
            simulateTableSearchInput(table, filterString);
            clock.tick(1000);
            assert.equal(table.find(SimpleTable).props().rows.length, 0);
        });
        it("shows no rows if filtering is attempted when no columns have defined filter functions", ()=>{
            let column = columns[6];
            let filterString = "f"; // this string is contained in the 'str' field of two data, which is the field thats rendere by this column
            assert.isFalse(!!column.filter, "this column has no filter function");
            let table = mount(<Table columns={[column]} data={data}/>);
            simulateTableSearchInput(table, filterString);
            clock.tick(1000);
            assert.equal(table.find(SimpleTable).props().rows.length, 0);
        });
        it("filters columns with a defined filter function, and shows all rows when filtered with empty string", ()=>{
            let filterString = "asdfj";
            let table = mount(<Table columns={columns} data={data}/>);
            simulateTableSearchInput(table, filterString);
            clock.tick(1000);
            assert.equal(table.find(SimpleTable).props().rows.length, 1);

            filterString = "f";
            simulateTableSearchInput(table, filterString);
            clock.tick(1000);
            assert.equal(table.find(SimpleTable).props().rows.length, 2);

            filterString = "0";
            simulateTableSearchInput(table, filterString);
            clock.tick(1000);
            assert.equal(table.find(SimpleTable).props().rows.length, 1);

            filterString = "";
            simulateTableSearchInput(table, filterString);
            clock.tick(1000);
            assert.equal(table.find(SimpleTable).props().rows.length, data.length);
        });
    });
    describe('downloading data', ()=>{
        it("gives just the column names when theres no data in the table", ()=>{
            let table = mount(<Table columns={columns} data={[]}/>);
            assert.deepEqual((table.instance() as LazyMobXTable<any>).getDownloadData(),
                "Name,Number,String,Number List,Initially invisible column,Initially invisible column with no download,String without filter function\r\n");
        });
        it("gives one row of data when theres one row. data given for every column, including hidden, and without download def'n. if no data, gives empty string for that cell.", ()=>{
            let table = mount(<Table columns={columns} data={[data[0]]}/>);
            assert.deepEqual((table.instance() as LazyMobXTable<any>).getDownloadData(),
                "Name,Number,String,Number List,Initially invisible column,Initially invisible column with no download,String without filter function\r\n"+
                "0,0,asdfj,,0HELLO123456,,\r\n");
        });
        it("gives data for all rows. data given for every column, including hidden, and without download def'n. if no data, gives empty string for that cell", ()=>{
            let table = mount(<Table columns={columns} data={data}/>)
            assert.deepEqual((table.instance() as LazyMobXTable<any>).getDownloadData(),
                "Name,Number,String,Number List,Initially invisible column,Initially invisible column with no download,String without filter function\r\n"+
                "0,0,asdfj,,0HELLO123456,,\r\n"+
                "1,6,kdfjpo,,1HELLO123456,,\r\n"+
                "2,null,null,,2HELLO123456,,\r\n"+
                "3,-1,zijxcpo,,3HELLO123456,,\r\n"+
                "4,90,zkzxc,,4HELLO123456,,\r\n");
        });

        it("gives data back in sorted order according to initially selected sort column and direction", ()=>{
            let table = mount(<Table columns={columns} data={data} initialSortColumn="Number" initialSortDirection="asc"/>);

            assert.deepEqual((table.instance() as LazyMobXTable<any>).getDownloadData(),
                "Name,Number,String,Number List,Initially invisible column,Initially invisible column with no download,String without filter function\r\n"+
                "3,-1,zijxcpo,,3HELLO123456,,\r\n"+
                "0,0,asdfj,,0HELLO123456,,\r\n"+
                "1,6,kdfjpo,,1HELLO123456,,\r\n"+
                "4,90,zkzxc,,4HELLO123456,,\r\n" +
                "2,null,null,,2HELLO123456,,\r\n");
        });
    });
    describe('pagination', ()=>{
        it("starts with 50 items per page", ()=>{
            let table = mount(<Table columns={simpleColumns} data={[]}/>);
            assert.equal(getItemsPerPage(table), 50, "with no data");
            table.setProps({columns:simpleColumns, data:data.slice(0,100)});
            assert.equal(getItemsPerPage(table), 50, "with data");
        });
        it("limits page accessing appropriately, depending on how many items total and how many per page, and changes page numbers correctly", ()=>{
            let table = mount(<Table columns={simpleColumns} data={[]}/>);
            assert.equal(getCurrentPage(table), 0, "starts on page 0");
            assert.isFalse(clickPrevPage(table), "prev page button is disabled with no data");
            assert.equal(getCurrentPage(table), 0, "still on page 0");
            assert.isFalse(clickNextPage(table), "next page button is disabled with no data");
            assert.equal(getCurrentPage(table), 0, "havent changed pages");

            table.setProps({columns: simpleColumns, data:[simpleData[0]]});
            assert.equal(getCurrentPage(table), 0, "starts on page 0");
            assert.isFalse(clickPrevPage(table), "prev page button is disabled with 1 row");
            assert.equal(getCurrentPage(table), 0, "still on page 0");
            assert.isFalse(clickNextPage(table), "next page button is disabled with 1 row");
            assert.equal(getCurrentPage(table), 0, "havent changed pages");

            assert.equal(getItemsPerPage(table), 50, "make sure setting is 50 items per page for these tests");
            table.setProps({columns:simpleColumns, data:simpleData.slice(0,20)});
            assert.equal(getCurrentPage(table), 0, "starts on page 0");
            assert.isFalse(clickPrevPage(table), "prev page disabled on page 0");
            assert.equal(getCurrentPage(table), 0, "still on page 0");
            assert.isFalse(clickNextPage(table), "next page disabled when all data fits on page");
            assert.equal(getCurrentPage(table), 0, "havent changed pages");

            table.setProps({columns:simpleColumns, data:simpleData.slice(0,60)});
            assert.equal(getCurrentPage(table), 0, "starts on page 0");
            assert.isFalse(clickPrevPage(table), "prev page disabled on page 0");
            assert.equal(getCurrentPage(table), 0, "still on page 0");
            assert.isTrue(clickNextPage(table), "next page works to go to page 1");
            assert.equal(getCurrentPage(table), 1, "now on page 1");
            assert.isFalse(clickNextPage(table), "when on page 1, no more pages");
            assert.equal(getCurrentPage(table), 1, "still on page 1");
            assert.isTrue(clickPrevPage(table), "when on page 1, we can go prev page");
            assert.equal(getCurrentPage(table), 0, "now on page 0");
            assert.isFalse(clickPrevPage(table), "can't go back more than page 0");
            assert.equal(getCurrentPage(table), 0, "still on page 0");
            assert.isTrue(clickNextPage(table), "but we can go to the next page again");
            assert.equal(getCurrentPage(table), 1, "back to page 1");

            selectItemsPerPage(table, -1);
            assert.equal(getItemsPerPage(table), -1, "make sure setting is on show all");
            assert.equal(getCurrentPage(table), 0, "goes back to page 0");
            assert.isFalse(clickPrevPage(table), "prev page button is disabled when all data on one page");
            assert.equal(getCurrentPage(table), 0, "still on page 0");
            assert.isFalse(clickNextPage(table), "next page button is disabled when all data on one page");
            assert.equal(getCurrentPage(table), 0, "havent changed pages");
        });

        it("properly handles changing items per page", ()=>{
            let table = mount(<Table columns={simpleColumns} data={[]}/>);
            selectItemsPerPage(table, 25);
            assert.equal(getItemsPerPage(table), 25, "case: no data; it successfully changes the items per page to 25");
            assert.equal(getCurrentPage(table), 0, "case: no data; still on page 0");
            assert.equal(getNumVisibleRows(table), 0, "case: no data; no rows visible with 25/page, because no data");
            selectItemsPerPage(table, -1);
            assert.equal(getItemsPerPage(table), -1, "case: no data; it successfully changes the items per page to show all");
            assert.equal(getCurrentPage(table), 0, "case: no data; still on page 0");
            assert.equal(getNumVisibleRows(table), 0, "case: no data; no rows visible with show all, because no data");

            table.setProps({columns:columns, data:[simpleData[0]]});
            selectItemsPerPage(table, 25);
            assert.equal(getItemsPerPage(table), 25, "case: 1 data; it successfully changes the items per page to 25");
            assert.equal(getCurrentPage(table), 0, "case: 1 data; still on page 0");
            assert.equal(getNumVisibleRows(table), 1, "case: 1 data; 1 row visible with 25/page");
            selectItemsPerPage(table, -1);
            assert.equal(getItemsPerPage(table), -1, "case: 1 data; it successfully changes the items per page to show all");
            assert.equal(getCurrentPage(table), 0, "case: 1 data; still on page 0");
            assert.equal(getNumVisibleRows(table), 1, "case: 1 data; 1 row visible with show all");

            table.setProps({columns:columns, data:simpleData});
            assert.equal(simpleData.length, 120, "for this test we're assuming 120 data");
            selectItemsPerPage(table, 25);
            assert.equal(getItemsPerPage(table), 25, "case: 120 data; it successfully changes the items per page to 25");
            assert.equal(getCurrentPage(table), 0, "case: 120 data; still on page 0");
            assert.equal(getNumVisibleRows(table), 25, "case: 120 data; 25 rows visible with 25/page");
            clickNextPage(table);
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 2, "case: 120 data; moved to page 2");
            assert.equal(getNumVisibleRows(table), 25, "case: 120 data; 25 rows visible with 25/page on page 2");
            selectItemsPerPage(table, 10);
            assert.equal(getItemsPerPage(table), 10, "case: 120 data; it successfully changes the items per page to 10");
            assert.equal(getCurrentPage(table), 2, "case: 120 data; still on page 2");
            assert.equal(getNumVisibleRows(table), 10, "case: 120 data; 10 rows visible with 10/page on page 2");
            selectItemsPerPage(table, 50);
            assert.equal(getItemsPerPage(table), 50, "case: 120 data; it successfully changes the items per page to 50");
            assert.equal(getCurrentPage(table), 2, "case: 120 data; still on page 2");
            assert.equal(getNumVisibleRows(table), 20, "case: 120 data; 20 rows visible with 50/page on page 2");
            selectItemsPerPage(table, 100);
            assert.equal(getItemsPerPage(table), 100, "case: 120 data; it successfully changes the items per page to 100");
            assert.equal(getCurrentPage(table), 1, "case: 120 data; now on page 1");
            assert.equal(getNumVisibleRows(table), 20, "case: 120 data; 20 rows visible with 100/page on page 2");
            selectItemsPerPage(table, -1);
            assert.equal(getItemsPerPage(table), -1, "case: 120 data; it successfully changes the items per page to show all");
            assert.equal(getCurrentPage(table), 0, "case: 120 data; now we're on page 0");
            assert.equal(getNumVisibleRows(table), 120, "case: 120 data; all 120 rows visible with show all");
        });
        it("shows the correct data for given page", ()=>{
            let table = mount(<Table columns={simpleColumns} data={simpleData.slice(0,40)}/>);
            assert.equal(getItemsPerPage(table), 50, "case: 40 data; for this test we're assuming 50/page");
            assert.equal(getCurrentPage(table), 0, "case: 40 data; on page 0");
            let rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{i}</span></td></tr>);
            }

            table.setProps({columns:simpleColumns, data:simpleData});
            assert.equal(getItemsPerPage(table), 50, "case: 120 data; for this test we're assuming 50/page");
            assert.equal(getCurrentPage(table), 0, "case: 120 data; on page 0");
            assert.equal(simpleData.length, 120, "confirm we're working with 120 data");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{i}</span></td></tr>);
            }
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 1, "case:120 data; on page 1");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{i+50}</span></td></tr>);
            }
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 2, "case:120 data; on page 2");
            rows = getVisibleRows(table);
            for (let i=0; i<rows.length; i++) {
                expect(rows[i]).toEqualJSX(<tr><td><span>{i+100}</span></td></tr>);
            }
        });
        it("shows the right text before the paging buttons", ()=>{
            let table = mount(<Table columns={simpleColumns} data={[]}/>);
            assert.equal(getItemsPerPage(table), 50, "confirm 50 items per page");
            assert.equal(getTextBeforeButtons(table), "0-0 of 0");

            table.setProps({columns:simpleColumns, data:[simpleData[0]]});
            assert.equal(getTextBeforeButtons(table), "1-1 of 1");

            table.setProps({columns:simpleColumns, data:simpleData.slice(0, 40)});
            assert.equal(getTextBeforeButtons(table), "1-40 of 40");

            table.setProps({columns:simpleColumns, data:simpleData});
            assert.equal(simpleData.length, 120, "confirm we're working with 120 data");
            assert.equal(getTextBeforeButtons(table), "1-50 of 120");
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 1);
            assert.equal(getTextBeforeButtons(table), "51-100 of 120");
            clickNextPage(table);
            assert.equal(getCurrentPage(table), 2);
            assert.equal(getTextBeforeButtons(table), "101-120 of 120");

            selectItemsPerPage(table, -1);
            assert.equal(getTextBeforeButtons(table), "1-120 of 120");
        });
    });
});
