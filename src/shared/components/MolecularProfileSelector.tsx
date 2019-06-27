import {observer} from "mobx-react";
import * as React from "react";
import {MolecularProfile} from "../api/generated/CBioPortalAPI";
import {MobxPromise} from "mobxpromise";
import {remoteData} from "public-lib/api/remoteData";
import Select from "react-select";
import LoadingIndicator from "./loadingIndicator/LoadingIndicator";


export interface IMolecularProfileSelector {
    name?:string;
    className?:string;
    value:string;
    onChange:(option:{label:string, value:string})=>void;
    molecularProfiles:MobxPromise<MolecularProfile[]>;
    molecularProfileIdToProfiledSampleCount?:MobxPromise<{[molecularProfileId:string]:number}>;
}

@observer
export default class MolecularProfileSelector extends React.Component<IMolecularProfileSelector, {}> {
    readonly options = remoteData({
        await:()=>{
            const ret:MobxPromise<any>[] = [
                this.props.molecularProfiles
            ];
            if (this.props.molecularProfileIdToProfiledSampleCount) {
                ret.push(this.props.molecularProfileIdToProfiledSampleCount);
            }
            return ret;
        },
        invoke: ()=>{
            const molecularProfiles = this.props.molecularProfiles.result!;
            let molecularProfileIdToProfiledSampleCount:{[molecularProfileId:string]:number} | undefined = undefined;
            if (this.props.molecularProfileIdToProfiledSampleCount) {
                molecularProfileIdToProfiledSampleCount = this.props.molecularProfileIdToProfiledSampleCount.result!;
            }
            if (molecularProfileIdToProfiledSampleCount) {
                return Promise.resolve(molecularProfiles.map(profile=>{
                    const profiledSampleCount = molecularProfileIdToProfiledSampleCount![profile.molecularProfileId];
                    return {
                        label: `${profile.name} (${profiledSampleCount} sample${profiledSampleCount !== 1 ? "s" : ""})`,
                        value: profile.molecularProfileId
                    };
                }));
            } else {
                return Promise.resolve(molecularProfiles.map(profile=>{
                    return {
                        label: profile.name,
                        value: profile.molecularProfileId
                    };
                }));
            }
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