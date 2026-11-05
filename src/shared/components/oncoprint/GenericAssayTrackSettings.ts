import _ from 'lodash';
import { GenericAssayOncoprintChartType } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';

// Oncoprint display settings of one generic assay profile. Add new per-profile
// settings here: they are stored in the generic_assay_track_settings URL
// param without further URL changes.
export type GenericAssayTrackSettings = {
    // Unset means heatmap.
    chartType?: GenericAssayOncoprintChartType;
    // Entity that stacked bar tracks are sorted by.
    sortBy?: string;
};

export type GenericAssayTrackSettingsMap = {
    [molecularProfileId: string]: GenericAssayTrackSettings;
};

export type GenericAssayTrackSettingsQuery = {
    generic_assay_track_settings?: string;
    // Read-only, for links created before generic_assay_track_settings.
    generic_assay_stacked_profiles?: string;
    generic_assay_stacked_absolute_profiles?: string;
    generic_assay_bar_profiles?: string;
    generic_assay_stacked_sortby?: string;
};

function splitProfileIds(raw: string | undefined): string[] {
    return raw ? raw.split(';').filter(x => x.length > 0) : [];
}

function parseLegacyParams(
    query: GenericAssayTrackSettingsQuery
): GenericAssayTrackSettingsMap {
    const settings: GenericAssayTrackSettingsMap = {};
    const setChartType = (
        raw: string | undefined,
        chartType: GenericAssayOncoprintChartType
    ) => {
        for (const profileId of splitProfileIds(raw)) {
            settings[profileId] = { ...settings[profileId], chartType };
        }
    };
    // Later types take precedence, as they did when these were separate
    // params: absolute over composition over per-row bars.
    setChartType(query.generic_assay_bar_profiles, 'bars');
    setChartType(query.generic_assay_stacked_profiles, 'composition');
    setChartType(query.generic_assay_stacked_absolute_profiles, 'absolute');
    for (const entry of splitProfileIds(query.generic_assay_stacked_sortby)) {
        const [profileId, sortBy] = entry.split(':');
        if (profileId && sortBy) {
            settings[profileId] = { ...settings[profileId], sortBy };
        }
    }
    return settings;
}

export function parseGenericAssayTrackSettings(
    query: GenericAssayTrackSettingsQuery
): GenericAssayTrackSettingsMap {
    if (!query.generic_assay_track_settings) {
        return parseLegacyParams(query);
    }
    try {
        const parsed = JSON.parse(query.generic_assay_track_settings);
        return _.isPlainObject(parsed) ? parsed : {};
    } catch (e) {
        return {};
    }
}

// URL updates that store the settings. Clears the legacy params, which would
// otherwise be read again once the settings are empty.
export function serializeGenericAssayTrackSettings(
    settings: GenericAssayTrackSettingsMap
): GenericAssayTrackSettingsQuery {
    const nonEmpty = _.omitBy(
        _.mapValues(settings, s =>
            _.omitBy(
                s,
                (value, key) =>
                    value === undefined ||
                    (key === 'chartType' && value === 'heatmap')
            )
        ),
        _.isEmpty
    );
    return {
        generic_assay_track_settings: _.isEmpty(nonEmpty)
            ? undefined
            : JSON.stringify(nonEmpty),
        generic_assay_stacked_profiles: undefined,
        generic_assay_stacked_absolute_profiles: undefined,
        generic_assay_bar_profiles: undefined,
        generic_assay_stacked_sortby: undefined,
    };
}

export function getProfilesWithChartType(
    settings: GenericAssayTrackSettingsMap,
    chartType: GenericAssayOncoprintChartType
): { [molecularProfileId: string]: true } {
    return _.mapValues(
        _.pickBy(settings, s => s.chartType === chartType),
        () => true as true
    );
}
