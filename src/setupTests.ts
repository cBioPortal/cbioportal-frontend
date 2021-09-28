import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

// mock global modules to prevent remote calls
jest.mock('cbioportal-ts-api-client');
