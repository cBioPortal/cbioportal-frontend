import * as React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { Checkbox, Radio } from 'react-bootstrap';
import { FilterMenuOpenContext } from 'shared/components/filterIconModal/FilterMenuOpenContext';
import ComparisonVsIcon from 'shared/components/ComparisonVsIcon';
import menuStyles from 'shared/components/categoricalFilterMenu/categoricalFilterMenu.module.scss';
import { getOptionSection, optionId } from './SectionedFilterUtils';
import styles from './sectionedFilterMenu.module.scss';

export type SectionedFilterOption = {
    // "<section>:<value>", see SectionedFilterUtils
    id: string;
    label: string;
    icon?: React.ReactNode;
    // listed only if some mutation has it or it is selected
    hideIfEmpty?: boolean;
};

export type SectionedFilterSection = {
    id: string;
    title: string;
    options: SectionedFilterOption[];
    // label of options that only appear in the data (e.g. unexpected values)
    labelOtherOption?: (value: string) => string;
};

export interface ISectionedFilterMenuProps {
    sections: SectionedFilterSection[];
    selections: Set<string>;
    matchAll: boolean;
    onChange: (selections: string[], matchAll: boolean) => void;
    // mutations per option, among the mutations that pass the other filters
    // of the table; only called while the menu is open
    getOptionCounts?: () => Map<string, number>;
    // true while the data of the options is loading; only called while open
    isLoading?: () => boolean;
    // e.g. "Loading annotations…", may include progress
    loadingMessage?: () => string;
    // message if the data of the options could not be loaded; the options
    // are not shown then, as their counts would be wrong
    getLoadError?: () => string | undefined;
    // opens a comparison with a group per given option
    onCompare?: (options: { id: string; name: string }[]) => void;
    // what the sections are, e.g. "source"
    sectionNoun?: string;
    dataTestPrefix: string;
}

function getSectionOptions(
    section: SectionedFilterSection,
    counts?: Map<string, number>
): SectionedFilterOption[] {
    if (!counts || !section.labelOtherOption) {
        return section.options;
    }
    const known = new Set(section.options.map(o => o.id));
    const prefix = optionId(section.id, '');
    const other = Array.from(counts.keys())
        .filter(id => id.startsWith(prefix) && !known.has(id))
        .sort()
        .map(id => ({
            id,
            label: section.labelOtherOption!(id.slice(prefix.length)),
        }));
    return [...section.options, ...other];
}

/**
 * Column filter menu with checkable options grouped in sections (e.g. the
 * annotation sources), their counts, whether a mutation has to match any or
 * all of the sections with a selection, and a comparison of the selected
 * options.
 */
const SectionedFilterMenu: React.FunctionComponent<ISectionedFilterMenuProps> = observer(
    props => {
        const isOpen = React.useContext(FilterMenuOpenContext);
        const sectionNoun = props.sectionNoun || 'section';
        if (isOpen && props.isLoading && props.isLoading()) {
            return (
                <div
                    className={classNames(menuStyles.menu, styles.menu)}
                    data-test={`${props.dataTestPrefix}-loading`}
                >
                    {props.loadingMessage ? props.loadingMessage() : 'Loading…'}
                </div>
            );
        }
        const loadError =
            isOpen && props.getLoadError ? props.getLoadError() : undefined;
        if (loadError) {
            return (
                <div
                    className={classNames(menuStyles.menu, styles.menu)}
                    data-test={`${props.dataTestPrefix}-error`}
                >
                    <i className="fa fa-exclamation-triangle" /> {loadError}
                </div>
            );
        }
        const counts =
            isOpen && props.getOptionCounts
                ? props.getOptionCounts()
                : undefined;
        const maxCount = counts ? _.max(Array.from(counts.values())) || 1 : 1;
        const sectionsWithSelection = _.uniq(
            Array.from(props.selections).map(getOptionSection)
        );
        const sections = props.sections.map(section => ({
            ...section,
            options: getSectionOptions(section, counts).filter(
                option =>
                    !option.hideIfEmpty ||
                    props.selections.has(option.id) ||
                    (counts && counts.get(option.id))
            ),
        }));

        const toggle = (id: string) => {
            const selections = new Set(props.selections);
            if (selections.has(id)) {
                selections.delete(id);
            } else {
                selections.add(id);
            }
            props.onChange(Array.from(selections), props.matchAll);
        };

        const compareOptions = _.flatMap(sections, section =>
            section.options
                .filter(
                    option =>
                        props.selections.has(option.id) &&
                        (!counts || (counts.get(option.id) || 0) > 0)
                )
                .map(option => ({
                    id: option.id,
                    name: `${section.title}: ${option.label}`,
                }))
        );

        return (
            <div className={classNames(menuStyles.menu, styles.menu)}>
                <div className={styles.match}>
                    <span className={styles.matchLabel}>Match</span>
                    <Radio
                        inline={true}
                        checked={!props.matchAll}
                        disabled={sectionsWithSelection.length < 2}
                        onChange={() =>
                            props.onChange(Array.from(props.selections), false)
                        }
                        data-test={`${props.dataTestPrefix}-match-any`}
                    >
                        any {sectionNoun}
                    </Radio>
                    <Radio
                        inline={true}
                        checked={props.matchAll}
                        disabled={sectionsWithSelection.length < 2}
                        onChange={() =>
                            props.onChange(Array.from(props.selections), true)
                        }
                        data-test={`${props.dataTestPrefix}-match-all`}
                    >
                        all {sectionNoun}s
                    </Radio>
                </div>
                <div className={styles.hint}>
                    Check values to show only the mutations that have them.
                </div>
                <div className={menuStyles.options}>
                    {sections.map(section => (
                        <div key={section.id}>
                            <div className={menuStyles.countsHeader}>
                                <span className={styles.sectionTitle}>
                                    {section.title}
                                </span>
                                {counts && (
                                    <span title="Number of mutations with this value, among the mutations that pass the filters of the other columns">
                                        Mutations
                                    </span>
                                )}
                            </div>
                            {section.options.map(option => {
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
                                        data-test={`${props.dataTestPrefix}-option-${option.id}`}
                                    >
                                        <Checkbox
                                            checked={props.selections.has(
                                                option.id
                                            )}
                                            onChange={() => toggle(option.id)}
                                            className={classNames(
                                                menuStyles.checkbox,
                                                styles.checkbox
                                            )}
                                        >
                                            {option.icon && (
                                                <span className={styles.icon}>
                                                    {option.icon}
                                                </span>
                                            )}
                                            {option.label}
                                        </Checkbox>
                                        {count !== undefined && (
                                            <>
                                                <span
                                                    className={menuStyles.count}
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
                {props.onCompare && (
                    <button
                        className={classNames(
                            'btn btn-default btn-xs',
                            menuStyles.compare
                        )}
                        disabled={compareOptions.length < 2}
                        title={
                            compareOptions.length < 2
                                ? 'Select at least two values to compare'
                                : `Compare the samples with mutations of each of the ${compareOptions.length} selected values in group comparison`
                        }
                        onClick={() => props.onCompare!(compareOptions)}
                        data-test={`${props.dataTestPrefix}-compare`}
                    >
                        <ComparisonVsIcon
                            className="fa fa-fw"
                            style={{ marginRight: 4 }}
                        />
                        Compare
                    </button>
                )}
            </div>
        );
    }
);

export default SectionedFilterMenu;
