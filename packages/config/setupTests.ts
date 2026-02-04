import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

// Polyfill TextEncoder/TextDecoder for Node 15 compatibility with @noble/hashes
// These are available in Node 16+ but need to be polyfilled for Node 15 and Jest/jsdom environment
if (typeof (global as any).TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    (global as any).TextEncoder = TextEncoder;
    (global as any).TextDecoder = TextDecoder;
}
