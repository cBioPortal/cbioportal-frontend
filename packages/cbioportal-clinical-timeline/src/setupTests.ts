// TODO update @types to fix the TS errors
//@ts-ignore
import { configure } from 'enzyme';
//@ts-ignore
import Adapter from '@cfaester/enzyme-adapter-react-18';

configure({ adapter: new Adapter() });
