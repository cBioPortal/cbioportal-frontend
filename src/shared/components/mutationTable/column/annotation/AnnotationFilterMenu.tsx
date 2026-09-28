import * as React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { Checkbox, Radio } from 'react-bootstrap';
import {
    levelIconClassNames,
    oncogenicityIconClassNames,
    OncoKbHelper,
} from 'oncokb-frontend-commons';
import { FilterMenuOpenContext } from 'shared/components/filterIconModal/FilterIconModal';
import menuStyles from 'shared/components/categoricalFilterMenu/categoricalFilterMenu.module.scss';
import { cancerHotspotsData, civicData } from './AnnotationHeader';
import {
    AnnotationFilterSource,
    annotationOptionId,
    CivicOption,
    getOptionSource,
    HotspotOption,
    OncogenicityOption,
} from './AnnotationFilterUtils';
import styles from './annotationFilterMenu.module.scss';

type AnnotationFilterOption = {
    id: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    // listed only if some mutation has it or it is selected
    hideIfEmpty?: boolean;
};

type AnnotationFilterSection = {
    source: AnnotationFilterSource;
    title: string;
    options: AnnotationFilterOption[];
};

function levelOptions(levels: string[], hideIfEmpty: boolean) {
    return levels.map(level => ({
        id: annotationOptionId(AnnotationFilterSource.LEVEL, `LEVEL_${level}`),
        label: `Level ${level}`,
        icon: <i className={levelIconClassNames(level)} />,
        hideIfEmpty,
    }));
}

function getSections(props: IAnnotationFilterMenuProps) {
    const sections: AnnotationFilterSection[] = [];
    if (props.showOncoKb) {
        const oncogenicity = (value: OncogenicityOption, label: string) => ({
            id: annotationOptionId(AnnotationFilterSource.ONCOGENICITY, value),
            label,
            icon: <i className={oncogenicityIconClassNames(value)} />,
        });
        sections.push(
            {
                source: AnnotationFilterSource.ONCOGENICITY,
                title: 'OncoKB oncogenicity',
                options: [
                    oncogenicity(
                        OncogenicityOption.ONCOGENIC,
                        'Oncogenic / Likely Oncog. / Resistance'
                    ),
                    oncogenicity(OncogenicityOption.NEUTRAL, 'Likely Neutral'),
                    oncogenicity(
                        OncogenicityOption.INCONCLUSIVE,
                        'Inconclusive'
                    ),
                    oncogenicity(OncogenicityOption.VUS, 'VUS'),
                    oncogenicity(OncogenicityOption.UNKNOWN, 'Unknown'),
                    {
                        ...oncogenicity(
                            OncogenicityOption.PATHOGENIC,
                            'Pathogenic / Likely Pathogenic (germline)'
                        ),
                        hideIfEmpty: true,
                    },
                ],
            },
            {
                source: AnnotationFilterSource.LEVEL,
                title: 'OncoKB highest level',
                options: [
                    ...levelOptions(OncoKbHelper.TX_LEVELS, false),
                    ...levelOptions(OncoKbHelper.DX_LEVELS, true),
                    ...levelOptions(OncoKbHelper.PX_LEVELS, true),
                ],
            }
        );
    }
    if (props.showHotspot) {
        const hotspot = (
            value: HotspotOption,
            index: number,
            label: string
        ) => ({
            id: annotationOptionId(AnnotationFilterSource.HOTSPOT, value),
            label,
            icon: cancerHotspotsData[index].legend,
        });
        sections.push({
            source: AnnotationFilterSource.HOTSPOT,
            title: 'Cancer Hotspots',
            options: [
                hotspot(
                    HotspotOption.RECURRENT,
                    0,
                    'Recurrent (or recurrent + 3D) hotspot'
                ),
                hotspot(HotspotOption.CLUSTERED_3D, 1, '3D clustered hotspot'),
                hotspot(HotspotOption.NONE, 2, 'Not a known hotspot'),
            ],
        });
    }
    if (props.showCivic) {
        const civic = (value: CivicOption, index: number, label: string) => ({
            id: annotationOptionId(AnnotationFilterSource.CIVIC, value),
            label,
            icon: civicData[index].legend,
        });
        sections.push({
            source: AnnotationFilterSource.CIVIC,
            title: 'CIViC',
            options: [
                civic(
                    CivicOption.WITH_VARIANTS,
                    0,
                    'In CIViC, with oncogenic activity info'
                ),
                civic(
                    CivicOption.NO_VARIANTS,
                    1,
                    'In CIViC, no oncogenic activity info'
                ),
                civic(CivicOption.NONE, 2, 'Not in CIViC'),
            ],
        });
    }
    return sections;
}

export interface IAnnotationFilterMenuProps {
    selections: Set<string>;
    matchAll: boolean;
    onChange: (selections: string[], matchAll: boolean) => void;
    // mutations per option, among the mutations that pass the other filters
    // of the table; only called while the menu is open
    getOptionCounts?: () => Map<string, number>;
    // true while annotation data is still loading
    isLoading?: () => boolean;
    showOncoKb?: boolean;
    showHotspot?: boolean;
    showCivic?: boolean;
}

/**
 * Filter menu of the annotation column: select annotations per source (OncoKB,
 * Cancer Hotspots, CIViC) and whether a mutation has to match any or all of
 * the sources with a selection.
 */
const AnnotationFilterMenu: React.FunctionComponent<IAnnotationFilterMenuProps> = observer(
    props => {
        const isOpen = React.useContext(FilterMenuOpenContext);
        if (props.isLoading && props.isLoading()) {
            return (
                <div
                    className={classNames(menuStyles.menu, styles.menu)}
                    data-test="annotation-filter-loading"
                >
                    <i className="fa fa-spinner fa-pulse" /> Loading
                    annotations…
                </div>
            );
        }
        const counts =
            isOpen && props.getOptionCounts
                ? props.getOptionCounts()
                : undefined;
        const maxCount = counts ? _.max(Array.from(counts.values())) || 1 : 1;
        const sourcesWithSelection = _.uniq(
            Array.from(props.selections).map(getOptionSource)
        );

        const toggle = (id: string) => {
            const selections = new Set(props.selections);
            if (selections.has(id)) {
                selections.delete(id);
            } else {
                selections.add(id);
            }
            props.onChange(Array.from(selections), props.matchAll);
        };

        return (
            <div className={classNames(menuStyles.menu, styles.menu)}>
                <div className={styles.match}>
                    <span className={styles.matchLabel}>Match</span>
                    <Radio
                        inline={true}
                        checked={!props.matchAll}
                        disabled={sourcesWithSelection.length < 2}
                        onChange={() =>
                            props.onChange(Array.from(props.selections), false)
                        }
                        data-test="annotation-filter-match-any"
                    >
                        any source
                    </Radio>
                    <Radio
                        inline={true}
                        checked={props.matchAll}
                        disabled={sourcesWithSelection.length < 2}
                        onChange={() =>
                            props.onChange(Array.from(props.selections), true)
                        }
                        data-test="annotation-filter-match-all"
                    >
                        all sources
                    </Radio>
                </div>
                <div className={styles.hint}>
                    Check annotations to show only the mutations that have them.
                </div>
                <div className={menuStyles.options}>
                    {getSections(props).map(section => (
                        <div key={section.source}>
                            <div className={menuStyles.countsHeader}>
                                <span className={styles.sectionTitle}>
                                    {section.title}
                                </span>
                                {counts && <span># in table</span>}
                            </div>
                            {section.options
                                .filter(
                                    option =>
                                        !option.hideIfEmpty ||
                                        props.selections.has(option.id) ||
                                        (counts && counts.get(option.id))
                                )
                                .map(option => {
                                    const count = counts
                                        ? counts.get(option.id) || 0
                                        : undefined;
                                    return (
                                        <div
                                            key={option.id}
                                            className={classNames(
                                                menuStyles.option,
                                                {
                                                    [menuStyles.emptyOption]:
                                                        count === 0,
                                                }
                                            )}
                                            data-test={`annotation-filter-option-${option.id}`}
                                        >
                                            <Checkbox
                                                checked={props.selections.has(
                                                    option.id
                                                )}
                                                onChange={() =>
                                                    toggle(option.id)
                                                }
                                                className={classNames(
                                                    menuStyles.checkbox,
                                                    styles.checkbox
                                                )}
                                            >
                                                <span className={styles.icon}>
                                                    {option.icon}
                                                </span>
                                                {option.label}
                                            </Checkbox>
                                            {count !== undefined && (
                                                <>
                                                    <span
                                                        className={
                                                            menuStyles.count
                                                        }
                                                    >
                                                        {count.toLocaleString()}
                                                    </span>
                                                    <span
                                                        className={
                                                            menuStyles.barCell
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                menuStyles.bar
                                                            }
                                                            style={{
                                                                width: `${(100 *
                                                                    count) /
                                                                    maxCount}%`,
                                                            }}
                                                        />
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

export default AnnotationFilterMenu;
