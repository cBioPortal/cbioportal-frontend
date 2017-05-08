import * as React from 'react';
import {assert} from "chai";
import TableHeaderControls from "./TableHeaderControls";
import sinon from 'sinon';
import {mount, shallow, ReactWrapper} from 'enzyme';
import {ColumnVisibilityControls} from "../columnVisibilityControls/ColumnVisibilityControls";
import {PaginationControls} from "../paginationControls/PaginationControls";
import {ITableHeaderControlsProps} from "./TableHeaderControls";


describe('TableHeaderControls', () => {

    let wrapper: ReactWrapper<ITableHeaderControlsProps,{}>;
    let inputStub: sinon.SinonStub;

    before(()=> {
        inputStub = sinon.stub(TableHeaderControls.prototype, "handleInput");

        wrapper = mount(<TableHeaderControls searchClassName={searchClassName} copyDownloadClassName={copyClassName}  />);
    });

    after(()=>{
        inputStub.restore();
    });

    it('bindCopyButton is called only when there is a copy button and props flag is true', ()=>{

        let mockInstance = {
            bindCopyButton: sinon.stub(),
            props: { showCopyAndDownload: true },
            _copyButton: {}
        };

        TableHeaderControls.prototype.componentDidMount.apply(mockInstance);

        assert.isTrue(mockInstance.bindCopyButton.calledOnce);

        mockInstance = {
            bindCopyButton: sinon.stub(),
            props: { showCopyAndDownload: false },
            _copyButton: {}
        };

        TableHeaderControls.prototype.componentDidMount.apply(mockInstance);

        assert.isFalse(mockInstance.bindCopyButton.called);
    });

    const copyClassName = "copyClassName";
    const searchClassName = "searchClassName";


    it('Renders child controls according to prop flags', ()=>{


        wrapper.setProps({
            showHideShowColumnButton:false,
            showPagination: false,
            showCopyAndDownload: false,
            showSearch:false
        });
        assert.equal( wrapper.find(ColumnVisibilityControls).length,  0 );
        assert.equal( wrapper.find(PaginationControls).length, 0 );
        assert.equal( wrapper.find(`.${copyClassName}`).length, 0 );
        assert.equal( wrapper.find(`.${searchClassName}`).length, 0 );

        wrapper.setProps({
            showHideShowColumnButton:true,
            showPagination: true,
            showCopyAndDownload: true,
            showSearch:true
        }).update();

        assert.equal( wrapper.find(ColumnVisibilityControls).length,  1 );
        assert.equal( wrapper.find(PaginationControls).length, 1 );
        assert.equal( wrapper.find(`.${copyClassName}`).length, 1 );
        assert.equal( wrapper.find(`.${searchClassName}`).length, 1 );



    });

    it('input to search box causes handleInput to be called', ()=>{


        var input = wrapper.find('input.tableSearchInput');

        input.simulate('input', {key: 'Enter'})

        assert.isTrue(inputStub.called);


    });

});