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
    return (!AppConfig.skinIsMarkdownDocumentation === false) && /\.md$/.test(url);
}

@observer
export default class StaticContent extends React.Component<{ sourceUrl:string, title?:string }, {}> {

    private get url(){
        return getDocsUrl(this.props.sourceUrl!,AppConfig.skinDocumentationBaseUrl);
    }

    readonly source = remoteData<string>(async ()=>{
        return await $.get(this.url);
    });

    private content(content:string, url:string){
        if (isMarkDown(url)) {
            return <ReactMarkdown className={'markdown-body'} skipHtml={true} source={this.source.result!} />;
        } else {
            return <div dangerouslySetInnerHTML={{__html: content}} />
        }
    }

    componentDidUpdate(){
        // yucky hack to add ids to h2 for deeplink purpose
        $(".markdown-body h2").each((i, h2)=>{
            console.log(h2);
            $(h2).attr("id",$(h2).text().toLowerCase().replace(/\s/g,'-').replace(/\?/g,''));
        })
    }

    public render() {

        return <div>
            <LoadingIndicator isLoading={this.source.isPending} isGlobal={true} />
            {
                (this.props.title) && (<h1>{this.props.title}</h1>)
            }
            {
                (this.source.isComplete) && this.content(this.source.result!,this.url)
            }
        </div>
    }

}



