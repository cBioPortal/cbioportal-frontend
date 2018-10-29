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

class Heading extends React.Component<{ level:number },{}>{
    render(){
        const CustomTag = `h${this.props.level}`;
        const firstChild: string = (this.props.children as any[])[0] as string;
        const text:string = (firstChild && typeof firstChild === 'string') ? firstChild : "";

        // this transformation is to match headers to internal anchors (#) produced by markdown renderer
        // unfortunately, we rely on the text of the headers matching the text of urls in the markdown
        const id = text.toLowerCase().replace(/\s/g,'-').replace(/\?/g,"");
        const topLink = this.props.level > 1 ? <a href="#pageTop" title={"Return to top"}><i className={"fa fa-arrow-circle-up"}></i></a> : "";

        return <CustomTag id={id}>{text} {topLink}</CustomTag>
    }
}

@observer
export default class StaticContent extends React.Component<{ sourceUrl:string, title?:string }, {}> {

    private get url(){
        return getDocsUrl(this.props.sourceUrl!,AppConfig.serverConfig.skin_documentation_baseurl!);
    }

    readonly source = remoteData<string>(async ()=>{
        return await $.get(this.url);
    });

    private get renderers(){
        return{
            heading:Heading
        }
    }

    private content(content:string, url:string){
        if (isMarkDown(url)) {
            return <ReactMarkdown renderers={this.renderers} className={'markdown-body'} escapeHtml={false} source={this.source.result!} />;
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



