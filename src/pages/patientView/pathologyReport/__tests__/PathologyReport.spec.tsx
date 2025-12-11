import * as React from 'react';
import { mount } from 'enzyme';
import PathologyReport from '../PathologyReport';
import { PathologyReportWithViewerURL } from '../../clinicalInformation/PatientViewPageStore';

describe('PathologyReport component', () => {
    it('renders iframe with viewerUrl from props when pdfs present', () => {
        const viewerUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
            'https://example.org/abc.pdf'
        )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
        const pdf: PathologyReportWithViewerURL = {
            url: 'https://example.org/abc.pdf',
            name: 'abc',
            viewerUrl: viewerUrl,
        };
        const wrapper = mount(
            <PathologyReport pdfs={[pdf]} iframeHeight={400} />
        );
        const iframe = wrapper.find('iframe');
        expect(iframe.length).toBe(1);
        expect(iframe.prop('src')).toBe(viewerUrl);
    });

    it('shows fallback text when no pdf is present', () => {
        const wrapper = mount(<PathologyReport pdfs={[]} iframeHeight={400} />);
        expect(wrapper.text()).toContain('No pathology report available');
    });

    it('renders iframe when pdfs prop is provided with viewerUrl', () => {
        const viewerUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
            'https://example.org/abc.pdf'
        )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
        const pdf1: PathologyReportWithViewerURL = {
            url: 'https://example.org/abc.pdf',
            name: 'abc',
            viewerUrl: viewerUrl,
        };
        const wrapper = mount(<PathologyReport pdfs={[]} iframeHeight={400} />);
        expect(wrapper.find('iframe').length).toBe(0);

        wrapper.setProps({ pdfs: [pdf1] });
        wrapper.update();
        const iframe = wrapper.find('iframe');
        expect(iframe.length).toBe(1);
        expect(iframe.prop('src')).toBe(viewerUrl);
    });

    it('allows selecting different reports from dropdown', () => {
        const pdf1: PathologyReportWithViewerURL = {
            url: 'https://example.org/report1.pdf',
            name: 'Report 1',
            viewerUrl: `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
                'https://example.org/report1.pdf'
            )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`,
        };
        const pdf2: PathologyReportWithViewerURL = {
            url: 'https://example.org/report2.pdf',
            name: 'Report 2',
            viewerUrl: `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
                'https://example.org/report2.pdf'
            )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`,
        };
        const wrapper = mount(
            <PathologyReport pdfs={[pdf1, pdf2]} iframeHeight={400} />
        );

        // Initially shows first report
        expect(wrapper.find('iframe').prop('src')).toBe(pdf1.viewerUrl);

        // Select second report
        const select = wrapper.find('select');
        select.simulate('change', { target: { value: '1' } });
        wrapper.update();

        expect(wrapper.find('iframe').prop('src')).toBe(pdf2.viewerUrl);
    });
});
