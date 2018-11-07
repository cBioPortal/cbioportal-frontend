import * as React from 'react';
import * as _ from 'lodash';
import { If, Then, Else } from 'react-if';
import IFrameLoader from "../../../shared/components/iframeLoader/IFrameLoader";
import {observer } from "mobx-react";
import {observable, computed} from "mobx";
import AppConfig from "appConfig";
import {Gene, MolecularProfile} from "../../../shared/api/generated/CBioPortalAPI";
import {trimTrailingSlash} from "../../../shared/api/urls";

interface NetworkParams {
    genes:Gene
}

interface INetworkTabParams {
    genes:Gene[];
    profileIds:string[];
    cancerStudyId:string;
    zScoreThreshold:number;
    caseIdsKey:string;
    caseSetId:string;
    sampleIds:string[];
}

@observer
export default class Network extends React.Component<INetworkTabParams, {}> {

    @observable baseUrl = AppConfig.frontendUrl;

    @computed get url(){

        var networkParams = {
            "gene_list": this.props.genes.map((gene)=>gene.hugoGeneSymbol).join(" "),
            "genetic_profile_ids": this.props.profileIds.join(" "),
            "cancer_study_id": this.props.cancerStudyId,
            "Z_SCORE_THRESHOLD": this.props.zScoreThreshold,
            "xdebug": "0",
            "netsrc": "cgds",
            "linkers": "50",
            "netsize": "large",
            "diffusion": "0",
            "case_ids": this.props.sampleIds.join(" ")

        };




        let path = (/\/\/localhost|127\.0\.0\.1/.test(AppConfig.frontendUrl!)) ?
            AppConfig.frontendUrl! :
            `//${AppConfig.baseUrl!}`;


        // cloodge to get around broken network tab on public portal due to strange MSK IT filtering
        if (AppConfig.apiRoot!.includes("www.cbioportal.org") && (window as any).location.hostname.includes("www.cbioportal.org")) {
            path = "//cbioportal-network-tab.herokuapp.com";
        }

        const strParams = encodeURIComponent(JSON.stringify(networkParams));
        return `${trimTrailingSlash(path)}/reactapp/network/network.htm?${AppConfig.serverConfig.app_version}&apiHost=${encodeURIComponent(AppConfig.apiRoot!.replace(/^http[s]?:\/\//,''))}#${strParams}`;
    }

    render(){

        return <IFrameLoader iframeId={"networkFrame"} url={this.url} height={800} />;

    }

};
