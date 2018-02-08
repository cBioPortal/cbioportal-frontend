// Override frontendConfig with localStorage frontendConfig if available
let localStorageFrontendConfig:any = {};
if (localStorage.frontendConfig) {
    try {
        localStorageFrontendConfig = JSON.parse(localStorage.frontendConfig);
        console.log("Using localStorage.frontendConfig (overriding window.frontendConfig): " + localStorage.frontendConfig);
    } catch (err) {
        // ignore
        console.log("Error parsing localStorage.frontendConfig")
    }
}
const config:any = Object.assign((window as any).frontendConfig, localStorageFrontendConfig);
export default config;
