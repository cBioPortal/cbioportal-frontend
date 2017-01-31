import {observable} from "../../../node_modules/mobx/lib/mobx";

class DevMode
{
	@observable enabled = !!localStorage.getItem('dev');
}
const devMode = new DevMode();
export default devMode;
