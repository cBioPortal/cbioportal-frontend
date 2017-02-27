import {observable} from "mobx";

class DevMode
{
	@observable enabled = !!localStorage.getItem('dev');
}
const devMode = new DevMode();
export default devMode;
