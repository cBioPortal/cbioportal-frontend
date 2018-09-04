import {IAppConfig} from "./IAppConfig";
import getBrowserWindow from "../shared/lib/getBrowserWindow";

const config:any = (window as any).frontendConfig;

export default config;

export function updateConfig(obj:Partial<IAppConfig>){

    // app config wins
    const nextConfig = Object.assign({}, obj, config);

    // now we have to overwrite AppConfig props
    // NOTE: we cannot put AppConfig as target of above assign because
    // assignment proceeds left to right and the original AppConfig that's the last param will be overwritten
    // so we have to copy

    // we have to use assign here (as opposed to replacing the reference because importers
    // already have reference and those will become detached from this
    Object.assign(config, nextConfig);

}