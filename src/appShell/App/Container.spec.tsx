// import * as React from 'react';
// import { assert, expect } from 'chai';
// import { shallow, mount } from 'enzyme';
// import Container from './Container';
// import HomePage from 'pages/home/HomePage';
// import BrowserErrorModal from "UnsupportedBrowserModal.t";
//
// describe('Container', () => {
//
//     let wrapper: any;
//     let onHide: any;
//
//     const locationProps = {
//         action: 'PUSH',
//         hash: '',
//         key: '',
//         pathname: '',
//         state: '',
//         search: '',
//         host: '',
//         hostname: '',
//         href: '',
//         origin: '',
//         port: '',
//         protocol: '',
//         query: {
//             caseId: '',
//             studyId: '',
//             tab: ''
//         },
//         toString: () => {return 'test';},
//         reload: () => {},
//         replace: function(url:string){
//             url = url + 'test';
//         },
//         assign: function(url:string){
//             url = url + 'test';
//         }
//     };
//
//     const ie11:string = `Mozilla/5.0 (Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729;
//                          .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; Tablet PC 2.0; rv:11.0) like Gecko`;
//
//     const ie10:string = `Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727;
//                         .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; Tablet PC 2.0)`;
//
//     const chrome: string = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko)
//                             Chrome/58.0.3029.81 Safari/537.36`;
//
//     const safari: string = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/603.1.30 (KHTML, like Gecko)
//                             Version/10.1 Safari/603.1.30"`;
//
//     before(()=> {
//
//         wrapper = shallow(<Container location={locationProps} children={<HomePage/>}/>);
//         onHide = wrapper.instance().handleCloseClick;
//
//     });
//
//     it('does not show modal when Chrome is being used', () => {
//         wrapper.instance().findIEVersion(chrome, chrome.indexOf("MSIE"));
//         expect(wrapper.contains(<BrowserErrorModal show={false} ieVersion='' onHide={onHide}/> )).to.equal(true);
//     });
//
//     it('does not show modal when Safari is being used', () => {
//         wrapper.instance().findIEVersion(safari, safari.indexOf("MSIE"));
//         expect(wrapper.contains(<BrowserErrorModal show={false} ieVersion='' onHide={onHide}/> )).to.equal(true);
//     });
//
//     it('does not show modal when IE11 is being used', () => {
//         wrapper.instance().findIEVersion(ie11, ie11.indexOf("MSIE"));
//         expect(wrapper.contains(<BrowserErrorModal show={false} ieVersion='' onHide={onHide}/>)).to.equal(true);
//     });
//
//
//     it('shows modal when IE10 is being used and site is accessed for first time', () => {
//         wrapper.instance().findIEVersion(ie10, ie10.indexOf("MSIE"));
//         expect(wrapper.contains(<BrowserErrorModal show={true} ieVersion='10' onHide={onHide}/> )).to.equal(true);
//     });
//
//
//     it.only('does not show modal when site is accessed after the first time, regardless of browser and/or version', () => {
//         wrapper.instance().findIEVersion(ie10, ie10.indexOf("MSIE"), true);
//         expect(wrapper.contains(<BrowserErrorModal show={false} ieVersion='' onHide={onHide}/> )).to.equal(true);
//     });
//
// });
