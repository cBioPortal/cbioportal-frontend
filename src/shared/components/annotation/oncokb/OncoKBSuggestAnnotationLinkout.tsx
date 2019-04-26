import * as React from 'react';
import styles from '../styles/oncokb/oncokb.scss';

export default class OncoKBSuggestAnnotationLinkout extends React.Component<{ gene: string }> {
    render() {
        return <div className={styles.oncokbSuggestAnnotationLinkout}>The gene is listed under <a
            href='https://www.oncokb.org/cancerGenes' target='_blank'>OncoKB Cancer Gene List</a> but
            hasn't been curated yet. Please feel free to <a
                target='_blank'
                href={`mailto:contact@oncokb.org?subject=Annotation suggestion for ${this.props.gene}&&body=Thank you for using OncoKB.%0APlease provide the following information for ${this.props.gene} curation:%0A%0AEvidence:%0APMIDs:%0AAbstracts:`}
                title="suggest to annotate this gene">suggest the team annotate the gene</a>.</div>;
    }
}