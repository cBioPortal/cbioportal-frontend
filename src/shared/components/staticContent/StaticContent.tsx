import * as React from 'react';
import $ from 'jquery';
import {observer} from 'mobx-react';
import ReactMarkdown from 'react-markdown';
import AppConfig from "appConfig";
import {remoteData} from "../../api/remoteData";
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {getDocsUrl} from "../../api/urls";
import './gfm.css';

function isMarkDown(url:string){
    return (!AppConfig.serverConfig.skin_documentation_markdown === false) && /\.md$/.test(url);
}

function setImageRoot(path:string){
    return `${AppConfig.serverConfig.skin_documentation_baseurl}/${path}`
}

@observer
export default class StaticContent extends React.Component<{ sourceUrl:string, title?:string, renderers?:{ [k:string]:any } }, {}> {

    private get url(){
        return getDocsUrl(this.props.sourceUrl!, AppConfig.serverConfig.skin_documentation_baseurl!);
    }

    readonly source = remoteData<string>(async ()=>{
        return await $.get(this.url);
    });

    private content(content:string, url:string){
        if (isMarkDown(url)) {
            return <ReactMarkdown renderers={this.props.renderers || {}} className={'markdown-body'} escapeHtml={false} source={this.source.result!} />;
        } else {
            return <div dangerouslySetInnerHTML={{__html: content}} />
        }
    }

    public render() {

        return <div>
            {
                (this.props.title) && (<h1>{this.props.title}</h1>)
            }

            <LoadingIndicator isLoading={this.source.isPending} size={"big"} center={true} />

            {
                (this.source.isComplete) && this.content(this.source.result!,this.url)
            }
        </div>
    }

}



