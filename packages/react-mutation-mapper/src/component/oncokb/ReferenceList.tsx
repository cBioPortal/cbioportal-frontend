import { ICache } from 'cbioportal-frontend-commons';
import { ArticleAbstract } from 'oncokb-ts-api-client';
import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed } from 'mobx';

import ArticleAbstractItem from './ArticleAbstractItem';
import PmidItem from './PmidItem';

import styles from './listGroupItem.module.scss';

type ReferenceListProps = {
    pmids: number[];
    pmidData?: ICache<any>;
    abstracts: ArticleAbstract[];
};

@observer
export default class ReferenceList extends React.Component<ReferenceListProps> {
    @computed get isLoading() {
        if (this.props.pmidData && this.props.pmids) {
            const loadingItems = _.filter(this.props.pmids, uid => {
                const cacheData = this.props.pmidData![uid.toString()];
                // when the cacheData is undefined, the pmidData will fetch the uid info later which eventually results to an object with a status
                return !cacheData || cacheData.status === 'pending';
            });
            return loadingItems.length > 0;
        } else {
            return false;
        }
    }

    render() {
        if (this.isLoading) {
            return <i className="fa fa-spinner fa-pulse fa-2x" />;
        }
        const list: JSX.Element[] = [];

        if (this.props.pmidData) {
            this.props.pmids.forEach((uid: number) => {
                const cacheData = this.props.pmidData![uid.toString()];
                const articleContent = cacheData ? cacheData.data : null;

                if (articleContent) {
                    list.push(
                        <PmidItem
                            title={articleContent.title}
                            author={
                                _.isArray(articleContent.authors) &&
                                articleContent.authors.length > 0
                                    ? articleContent.authors[0].name + ' et al.'
                                    : 'Unknown'
                            }
                            source={articleContent.source}
                            date={new Date(articleContent.pubdate)
                                .getFullYear()
                                .toString()}
                            pmid={articleContent.uid}
                        />
                    );
                }
            });
        }
        this.props.abstracts.forEach(abstract => {
            list.push(
                <ArticleAbstractItem
                    abstract={abstract.abstract}
                    link={abstract.link}
                />
            );
        });
        return <ul className={styles['no-style-ul']}>{list}</ul>;
    }
}
