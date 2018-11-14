import {observer} from "mobx-react";
import * as React from "react";
import {MolecularProfile} from "../api/generated/CBioPortalAPI";
import {MobxPromise} from "mobxpromise";
import {remoteData} from "../api/remoteData";
import Select from "react-select";
import LoadingIndicator from "./loadingIndicator/LoadingIndicator";


export interface IMolecularProfileSelector {
    name?:string;
    className?:string;
    value:string;
    onChange:(option:{label:string, value:string})=>void;
    molecularProfiles:MolecularProfile[] | MobxPromise<MolecularProfile[]>;
    molecularProfileIdToProfiledSampleCount:{[molecularProfileId:string]:number} | MobxPromise<{[molecularProfileId:string]:number}>;
}

@observer
export default class MolecularProfileSelector extends React.Component<IMolecularProfileSelector, {}> {
    readonly resolvedPromise = remoteData(()=>Promise.resolve());

    readonly options = remoteData({
        await:()=>{
            const ret = [];
            if (this.props.molecularProfiles instanceof MobxPromise) {
                ret.push(this.props.molecularProfiles);
            }
            if (this.props.molecularProfileIdToProfiledSampleCount instanceof MobxPromise) {
                ret.push(this.props.molecularProfileIdToProfiledSampleCount);
            }
            // always have resolved one just in case other two arent promises, so await isnt empty
            ret.push(this.resolvedPromise);
            return ret;
        },
        invoke: ()=>{
            let molecularProfiles:MolecularProfile[], molecularProfileIdToProfiledSampleCount:{[molecularProfileId:string]:number};
            if (this.props.molecularProfiles instanceof MobxPromise) {
                molecularProfiles = this.props.molecularProfiles.result!;
            } else {
                molecularProfiles = this.props.molecularProfiles as MolecularProfile[];
            }
            if (this.props.molecularProfileIdToProfiledSampleCount instanceof MobxPromise) {
                molecularProfileIdToProfiledSampleCount = this.props.molecularProfileIdToProfiledSampleCount.result!;
            } else {
                molecularProfileIdToProfiledSampleCount = this.props.molecularProfileIdToProfiledSampleCount as {[molecularProfileId:string]:number};
            }
            return Promise.resolve(molecularProfiles.map(profile=>{
                const profiledSampleCount = molecularProfileIdToProfiledSampleCount[profile.molecularProfileId];
                return {
                    label: `${profile.name} (${profiledSampleCount} sample${profiledSampleCount !== 1 ? "s" : ""})`,
                    value: profile.molecularProfileId
                };
            }));
        }
    });

    render() {
        if (this.options.isComplete) {
            return (
                <Select
                    name={this.props.name}
                    value={this.props.value}
                    onChange={this.props.onChange}
                    options={this.options.result}
                    searchable={false}
                    clearable={false}
                    className={this.props.className}
                />
            );
        } else {
            return <LoadingIndicator isLoading={true}/>
        }
    }
}