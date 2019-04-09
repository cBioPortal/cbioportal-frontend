import * as React from 'react';
import * as _ from 'lodash';
import {ICache} from "../../../lib/SimpleCache";
import PmidItem from "./PmidItem";
import styles from "../styles/oncokb/listGroupItem.module.scss";
import ArticleAbstractItem from "./ArticleAbstractItem";
import {ArticleAbstract} from "../../../api/generated/OncoKbAPI";

type ReferenceListProps = {
    pmids: number[],
    pmidData?: ICache<any>,
    abstracts: ArticleAbstract[]
}

export default class ReferenceList extends React.Component<ReferenceListProps> {
    render() {
        const list: JSX.Element[] = [];

        if (this.props.pmidData) {
            this.props.pmids.forEach((uid: number) => {
                const cacheData = this.props.pmidData![uid.toString()];
                const articleContent = cacheData ? cacheData.data : null;

                if (articleContent) {
                    list.push(
                        <PmidItem title={articleContent.title}
                                  author={(_.isArray(articleContent.authors) && articleContent.authors.length > 0) ?
                                      (articleContent.authors[0].name + ' et al.') : 'Unknown'}
                                  source={articleContent.source}
                                  date={(new Date(articleContent.pubdate)).getFullYear().toString()}
                                  pmid={articleContent.uid}
                        />
                    );
                }
            });
        }
        this.props.abstracts.forEach(abstract => {
            list.push(
                <ArticleAbstractItem abstract={abstract.abstract} link={abstract.link}/>
            )
        });
        return <ul className={styles["no-style-ul"]}>{list}</ul>
    }
}