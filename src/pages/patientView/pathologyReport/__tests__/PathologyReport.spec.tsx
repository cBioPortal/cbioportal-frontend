import * as React from 'react';
import { mount } from 'enzyme';
import PathologyReport from '../PathologyReport';

describe('PathologyReport component', () => {
    it('renders iframe with correct encoded URL when pdfs present', () => {
        const pdf = { url: 'https://example.org/abc.pdf', name: 'abc' };
        const wrapper = mount(<PathologyReport pdfs={[pdf as any]} iframeHeight={400} />);
        const iframe = wrapper.find('iframe');
        expect(iframe.length).toBe(1);
        const expected = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
            pdf.url
        )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
        expect(iframe.prop('src')).toBe(expected);
    });

    it('shows fallback text when no pdf is present', () => {
        const wrapper = mount(<PathologyReport pdfs={[]} iframeHeight={400} />);
        expect(wrapper.text()).toContain('No pathology report available');
    });

    it('updates iframe src when pdfs prop changes', () => {
        const pdf1 = { url: 'https://example.org/abc.pdf', name: 'abc' };
        const wrapper = mount(<PathologyReport pdfs={[]} iframeHeight={400} />);
        expect(wrapper.find('iframe').length).toBe(0);

        wrapper.setProps({ pdfs: [pdf1 as any] });
        wrapper.update();
        const iframe = wrapper.find('iframe');
        expect(iframe.length).toBe(1);
        const expected = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
            pdf1.url
        )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
        expect(iframe.prop('src')).toBe(expected);
    });
});
