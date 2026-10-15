import * as React from 'react';
import classNames from 'classnames';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import {
    AnnotationHeaderTooltipCard,
    AnnotationSources,
    cancerHotspotsData,
    civicData,
    OncoKbControls,
    OncokbLegendContent,
    sourceTooltipInfo,
} from './AnnotationHeader';
import FunctionalImpactColumnFormatter, {
    FunctionalImpactColumnName,
    FunctionalImpactColumnTooltip,
} from '../FunctionalImpactColumnFormatter';
import styles from './mutationAnnotationHeader.module.scss';

const FUNCTIONAL_IMPACT = 'functionalImpact';

type Source = {
    id: string;
    name: string;
    legend: () => JSX.Element;
};

export interface IMutationAnnotationHeaderProps {
    name: string;
    mergeOncoKbIcons?: boolean;
    onOncoKbIconToggle?: (mergeIcons: boolean) => void;
    showRevue?: boolean;
    // functional impact is available, e.g. from Genome Nexus
    enableFunctionalImpact?: boolean;
    // the functional impact predictions are shown in the cells
    showFunctionalImpact?: boolean;
}

function getSources(props: IMutationAnnotationHeaderProps) {
    const config = getServerConfig();
    const oncogenicity: Source[] = [];
    if (config.show_oncokb) {
        oncogenicity.push({
            id: AnnotationSources.ONCOKB,
            name: 'OncoKB',
            legend: () => (
                <AnnotationHeaderTooltipCard
                    controls={
                        <OncoKbControls
                            mergeIcons={props.mergeOncoKbIcons}
                            handleChange={props.onOncoKbIconToggle}
                        />
                    }
                    infoProps={sourceTooltipInfo[AnnotationSources.ONCOKB]}
                    overrideContent={<OncokbLegendContent />}
                />
            ),
        });
    }
    if (config.show_civic) {
        oncogenicity.push({
            id: AnnotationSources.CIVIC,
            name: 'CIViC',
            legend: () => (
                <AnnotationHeaderTooltipCard
                    infoProps={sourceTooltipInfo[AnnotationSources.CIVIC]}
                    legendDescriptions={civicData}
                />
            ),
        });
    }
    if (config.show_hotspot) {
        oncogenicity.push({
            id: AnnotationSources.CANCER_HOTSPOTS,
            name: 'Cancer Hotspots',
            legend: () => (
                <AnnotationHeaderTooltipCard
                    infoProps={
                        sourceTooltipInfo[AnnotationSources.CANCER_HOTSPOTS]
                    }
                    legendDescriptions={cancerHotspotsData}
                />
            ),
        });
    }
    if (config.show_revue && props.showRevue) {
        oncogenicity.push({
            id: AnnotationSources.REVUE,
            name: 'reVUE',
            legend: () => (
                <AnnotationHeaderTooltipCard
                    infoProps={sourceTooltipInfo[AnnotationSources.REVUE]}
                />
            ),
        });
    }
    const functionalImpact: Source[] = props.enableFunctionalImpact
        ? [
              {
                  id: FUNCTIONAL_IMPACT,
                  name: 'Mutation Assessor, SIFT, PolyPhen-2 and AlphaMissense',
                  legend: () => (
                      <div style={{ width: 450 }}>
                          {!props.showFunctionalImpact && (
                              <p>
                                  Show the predictions with{' '}
                                  <b>Columns › Functional Impact</b>, or by
                                  filtering on them in the Annotation filter.
                              </p>
                          )}
                          <FunctionalImpactColumnTooltip
                              active={FunctionalImpactColumnName.SIFT}
                          />
                      </div>
                  ),
              },
          ]
        : [];
    return { oncogenicity, functionalImpact };
}

/**
 * Lists the annotation sources, in the order of their icons in the cells;
 * hovering a source shows its legend.
 */
export const AnnotationSourcesTooltip: React.FunctionComponent<IMutationAnnotationHeaderProps> = props => {
    const { oncogenicity, functionalImpact } = getSources(props);
    const all = [...oncogenicity, ...functionalImpact];
    const [activeId, setActiveId] = React.useState(
        all.length > 0 ? all[0].id : undefined
    );
    const active = all.find(source => source.id === activeId);
    const sourceLink = (source: Source) => (
        <span
            key={source.id}
            className={classNames(styles.source, {
                [styles.activeSource]: source.id === activeId,
            })}
            onMouseEnter={() => setActiveId(source.id)}
            data-test={`annotation-source-${source.id}`}
        >
            {source.name}
        </span>
    );
    return (
        <div className={styles.tooltip} data-test="annotation-sources-tooltip">
            <table className={styles.sources}>
                <tbody>
                    {oncogenicity.length > 0 && (
                        <tr>
                            <th>Oncogenicity and clinical relevance</th>
                            <td>{oncogenicity.map(sourceLink)}</td>
                        </tr>
                    )}
                    {functionalImpact.length > 0 && (
                        <tr>
                            <th>
                                Functional impact
                                {!props.showFunctionalImpact && ' (hidden)'}
                            </th>
                            <td>{functionalImpact.map(sourceLink)}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className={styles.hint}>Hover a source for its legend.</div>
            {active && <div className={styles.legend}>{active.legend()}</div>}
        </div>
    );
};

/**
 * Header of the mutation annotation column: its name, with the sources as
 * tooltip, and the icons of the functional impact predictors over their
 * predictions, which are at the end of the cells.
 */
const MutationAnnotationHeader: React.FunctionComponent<IMutationAnnotationHeaderProps> = props => (
    <span className={styles.header}>
        <DefaultTooltip
            placement="top"
            overlay={() => <AnnotationSourcesTooltip {...props} />}
            destroyTooltipOnHide={true}
        >
            <span className={styles.name}>{props.name}</span>
        </DefaultTooltip>
        {props.showFunctionalImpact && (
            <>
                {/* keeps a line for the icons, which are placed in the corner */}
                <span className={styles.iconLine} />
                <span
                    className={styles.functionalImpactIcons}
                    data-test="annotation-functional-impact-icons"
                >
                    {FunctionalImpactColumnFormatter.headerIcons()}
                </span>
            </>
        )}
    </span>
);

export default MutationAnnotationHeader;
