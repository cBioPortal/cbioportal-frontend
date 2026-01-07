import { assert } from 'chai';
import { shallow } from 'enzyme';
import * as React from 'react';
import PathologyReport from './PathologyReport';
import sinon from 'sinon';

describe('PathologyReport Component', () => {
    const mockPdf = {
        url: 'https://example.com/test-report.pdf',
        name: 'Test Report',
    };

    describe('Fallback message when no PDFs available', () => {
        it('renders fallback when pdfs prop is empty array', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[]} iframeHeight={600} />
            );

            assert.isTrue(wrapper.find('.alert').exists());
            assert.include(wrapper.text(), 'No pathology report available');
            assert.isFalse(wrapper.find('IFrameLoader').exists());
        });

        it('renders fallback when pdfs prop is undefined', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={undefined as any} iframeHeight={600} />
            );

            assert.isTrue(wrapper.find('.alert').exists());
            assert.include(wrapper.text(), 'No pathology report available');
            assert.isFalse(wrapper.find('IFrameLoader').exists());
        });
    });

    describe('Normal rendering with PDFs', () => {
        it('renders IFrameLoader when PDF is available', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[mockPdf]} iframeHeight={600} />
            );

            assert.isTrue(wrapper.find('IFrameLoader').exists());
            assert.isFalse(wrapper.find('.alert').exists());
        });

        it('uses correct iframe height', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[mockPdf]} iframeHeight={800} />
            );

            const iframeLoader = wrapper.find('IFrameLoader');
            assert.equal(iframeLoader.prop('height'), 800);
        });

        it('does not render PDF selector for single PDF', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[mockPdf]} iframeHeight={600} />
            );

            assert.isFalse(wrapper.find('select').exists());
        });

        it('renders PDF selector when multiple PDFs available', () => {
            const pdfs = [
                { url: 'https://example.com/report1.pdf', name: 'Report 1' },
                { url: 'https://example.com/report2.pdf', name: 'Report 2' },
            ];

            const wrapper = shallow(
                <PathologyReport pdfs={pdfs} iframeHeight={600} />
            );

            const select = wrapper.find('select');
            assert.isTrue(select.exists());
            const options = wrapper.find('option');
            assert.equal(options.length, 2);
            assert.equal(options.at(0).prop('value'), pdfs[0].url);
            assert.equal(options.at(1).prop('value'), pdfs[1].url);
        });
    });

    describe('URL encoding', () => {
        it('properly encodes PDF URL using encodeURIComponent', () => {
            const pdfWithSpecialChars = {
                url: 'https://example.com/report with spaces & special=chars.pdf',
                name: 'Special Report',
            };

            const wrapper = shallow(
                <PathologyReport
                    pdfs={[pdfWithSpecialChars]}
                    iframeHeight={600}
                />
            );

            const instance = wrapper.instance() as PathologyReport;
            const pdfUrl = instance.state.pdfUrl;

            assert.include(pdfUrl, 'docs.google.com/viewerng/viewer?url=');
            assert.include(pdfUrl, encodeURIComponent(pdfWithSpecialChars.url));
            assert.include(pdfUrl, '&pid=explorer');
            assert.notInclude(pdfUrl, '?pid=explorer');
        });

        it('constructs Google Docs viewer URL with correct parameter separator', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[mockPdf]} iframeHeight={600} />
            );

            const instance = wrapper.instance() as PathologyReport;
            const pdfUrl = instance.state.pdfUrl;

            const regex =
                /\?url=.*&pid=explorer&efh=false&a=v&chrome=false&embedded=true/;
            assert.match(pdfUrl, regex);
        });
    });

    describe('Async PDF data arrival', () => {
        it('updates iframe URL when pdfs change from empty to populated', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[]} iframeHeight={600} />
            );

            assert.isTrue(wrapper.find('.alert').exists());
            assert.equal(
                (wrapper.instance() as PathologyReport).state.pdfUrl,
                ''
            );

            wrapper.setProps({ pdfs: [mockPdf] });
            wrapper.update();

            assert.isFalse(wrapper.find('.alert').exists());
            assert.isTrue(wrapper.find('IFrameLoader').exists());
            assert.notEqual(
                (wrapper.instance() as PathologyReport).state.pdfUrl,
                ''
            );
            assert.include(
                (wrapper.instance() as PathologyReport).state.pdfUrl,
                encodeURIComponent(mockPdf.url)
            );
        });

        it('updates iframe URL when pdfs change from undefined to populated', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={undefined as any} iframeHeight={600} />
            );

            assert.isTrue(wrapper.find('.alert').exists());

            wrapper.setProps({ pdfs: [mockPdf] });
            wrapper.update();

            assert.isFalse(wrapper.find('.alert').exists());
            assert.isTrue(wrapper.find('IFrameLoader').exists());
        });

        it('does not update state when pdfs remain empty', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[]} iframeHeight={600} />
            );

            const setStateSpy = sinon.spy(
                wrapper.instance() as PathologyReport,
                'setState'
            );

            wrapper.setProps({ pdfs: [] });
            wrapper.update();

            assert.equal(setStateSpy.callCount, 0);

            setStateSpy.restore();
        });

        it('does not update state when pdfs were already populated', () => {
            const wrapper = shallow(
                <PathologyReport pdfs={[mockPdf]} iframeHeight={600} />
            );

            const setStateSpy = sinon.spy(
                wrapper.instance() as PathologyReport,
                'setState'
            );

            wrapper.setProps({ pdfs: [mockPdf] });
            wrapper.update();

            assert.equal(setStateSpy.callCount, 0);

            setStateSpy.restore();
        });
    });

    describe('PDF selection', () => {
        it('updates displayed PDF when selection changes', () => {
            const pdfs = [
                { url: 'https://example.com/report1.pdf', name: 'Report 1' },
                { url: 'https://example.com/report2.pdf', name: 'Report 2' },
            ];

            const wrapper = shallow(
                <PathologyReport pdfs={pdfs} iframeHeight={600} />
            );

            const instance = wrapper.instance() as PathologyReport;
            const initialUrl = instance.state.pdfUrl;

            assert.include(initialUrl, encodeURIComponent(pdfs[0].url));

            const select = wrapper.find('select');
            instance.pdfSelectList = {
                options: [{ value: pdfs[0].url }, { value: pdfs[1].url }],
                selectedIndex: 1,
            };

            instance.handleSelection();

            const updatedUrl = instance.state.pdfUrl;
            assert.include(updatedUrl, encodeURIComponent(pdfs[1].url));
            assert.notInclude(updatedUrl, encodeURIComponent(pdfs[0].url));
        });
    });
});
