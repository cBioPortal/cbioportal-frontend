// TODO update @types to fix the TS errors
//@ts-ignore
import { configure } from 'enzyme';
//@ts-ignore
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });
