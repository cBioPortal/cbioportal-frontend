import * as React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import { getFileExtension } from './ResourcesTableUtils';
import autobind from 'autobind-decorator';
import { ResourceData } from 'cbioportal-ts-api-client';

export interface IResourceLinkProps {
    resource: ResourceData;
    isTabOpen: (resourceId: string) => boolean;
    openResource: (resource: ResourceData) => void;
}

@observer
export default class ResourceLink extends React.Component<
    IResourceLinkProps,
    {}
> {
    @computed get icon() {
        let className = '';
        const fileExtension = getFileExtension(this.props.resource.url);
        switch (fileExtension) {
            case 'pdf':
                className = 'fa fa-file-pdf-o';
                break;
            case 'png':
            case 'jpeg':
            case 'jpg':
            case 'gif':
                className = 'fa fa-file-image-o';
                break;
            case 'm4a':
            case 'flac':
            case 'mp3':
            case 'mp4':
            case 'wav':
                className = 'fa fa-file-audio-o';
                break;
            case undefined:
                className = 'fa fa-external-link';
                break;
            default:
                className = 'fa fa-file-o';
                break;
        }
        return (
            <i
                className={`${className} fa-sm`}
                style={{ marginRight: 5, color: 'black' }}
            />
        );
    }

    @autobind
    private openResource() {
        this.props.openResource(this.props.resource);
    }

    render() {
        return (
            <div>
                <a href={this.props.resource.url} target={'_blank'}>
                    {this.icon}
                    {this.props.resource.resourceDefinition.displayName ||
                        this.props.resource.url}
                </a>
                <button
                    className="btn btn-link"
                    style={{ marginLeft: 10, fontSize: 10 }}
                    onClick={this.openResource}
                >
                    <i
                        className={`fa fa-folder-open-o fa-sm`}
                        style={{ marginRight: 5, color: 'black' }}
                    />
                    {this.props.isTabOpen(this.props.resource.resourceId)
                        ? 'Go to tab'
                        : 'Open in tab'}
                </button>
            </div>
        );
    }
}
