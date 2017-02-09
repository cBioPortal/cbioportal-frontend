import {assert} from "chai";
import TableHeaderControls from "./TableHeaderControls";
import sinon from 'sinon';


/**
 * @author Selcuk Onur Sumer
 */
describe('TableHeaderControls', () => {

    it('bindCopyButton is called only when there is a copy button and props flag is true', ()=>{

        const mockInstance = {
            bindCopyButton: sinon.stub(),
            props: { showCopyAndDownload: true },
            _copyButton: {}
        };

        TableHeaderControls.prototype.componentDidMount.apply(mockInstance);

        assert.isTrue(mockInstance.bindCopyButton.calledOnce);
    });

    it('bindCopyButton is called only when there is a copy button and props flag is true', ()=>{

        const mockInstance = {
            bindCopyButton: sinon.stub(),
            props: { showCopyAndDownload: false },
            _copyButton: {}
        };

        TableHeaderControls.prototype.componentDidMount.apply(mockInstance);

        assert.isFalse(mockInstance.bindCopyButton.called);
    });

});