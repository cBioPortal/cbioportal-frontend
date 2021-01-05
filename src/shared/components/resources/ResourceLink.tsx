import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
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
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
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
        }
        if (className) {
            return (
                <i
                    className={`${className} fa-sm`}
                    style={{ marginRight: 5, color: 'black' }}
                />
            );
        } else {
            return null;
        }
    }

    @autobind
    private openResource() {
        this.props.openResource(this.props.resource);
    }

    render() {
        return (
            <div>
                <a onClick={this.openResource}>
                    {this.icon}
                    {this.props.resource.resourceDefinition.displayName ||
                        this.props.resource.url}
                </a>
                <a
                    href={this.props.resource.url}
                    style={{ marginLeft: 16, fontSize: 10 }}
                    target={'_blank'}
                >
                    <i
                        className={`fa fa-external-link fa-sm`}
                        style={{ marginRight: 5, color: 'black' }}
                    />
                    Open in new window
                </a>
            </div>
        );
    }
}
