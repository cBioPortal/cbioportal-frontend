import { action, observable, ObservableMap } from 'mobx';
import { getServerConfig } from 'config/config';
import { MobxPromiseUnionType } from 'mobxpromise';
import _ from 'lodash';

export interface IAnnotationFilterSettings
    extends IDriverSettingsProps,
        IExclusionSettings {}

export interface IDriverSettingsProps {
    driverAnnotationSettings: DriverAnnotationSettings;
    didOncoKbFailInOncoprint?: boolean;
    didHotspotFailInOncoprint?: boolean;
    customDriverAnnotationReport: MobxPromiseUnionType<IDriverAnnotationReport>;
}

export interface IExclusionSettings {
    includeGermlineMutations: boolean;
    includeSomaticMutations: boolean;
    includeUnknownStatusMutations: boolean;
    hideUnprofiledSamples?: 'any' | 'totally' | false;
}

export interface DriverAnnotationSettings {
    includeDriver: boolean;
    includeVUS: boolean;
    includeUnknownOncogenicity: boolean;
    cbioportalCount: boolean;
    cbioportalCountThreshold: number;
    cosmicCount: boolean;
    cosmicCountThreshold: number;
    customBinary: boolean;
    customTiersDefault: boolean;
    driverTiers: ObservableMap<string, boolean>;
    includeUnknownTier: boolean;
    hotspots: boolean;
    oncoKb: boolean;
    driversAnnotated: boolean;
}

export interface IDriverAnnotationControlsState {
    distinguishDrivers: boolean;
    annotateDriversOncoKbDisabled: boolean;
    annotateDriversOncoKbError: boolean;
    annotateDriversOncoKb: boolean;

    annotateDriversHotspotsDisabled?: boolean;
    annotateDriversHotspotsError?: boolean;
    annotateDriversHotspots?: boolean;

    annotateDriversCBioPortal: boolean;
    annotateCBioPortalInputValue: string;

    annotateDriversCOSMIC?: boolean;
    annotateCOSMICInputValue?: string;

    customDriverAnnotationBinaryMenuLabel?: string;
    customDriverAnnotationTiersMenuLabel?: string;
    customDriverAnnotationTiers?: string[];
    selectedCustomDriverAnnotationTiers?: ObservableMap<string, boolean>;
    anyCustomDriverAnnotationTiersSelected?: boolean;
    annotateCustomDriverBinary?: boolean;
}

export interface IDriverAnnotationControlsHandlers {
    onSelectDistinguishDrivers: (distinguish: boolean) => void;
    onSelectAnnotateOncoKb: (annotate: boolean) => void;
    onSelectAnnotateHotspots?: (annotate: boolean) => void;
    onSelectAnnotateCBioPortal: (annotate: boolean) => void;
    onSelectAnnotateCOSMIC?: (annotate: boolean) => void;
    onChangeAnnotateCBioPortalInputValue?: (value: string) => void;
    onChangeAnnotateCOSMICInputValue?: (value: string) => void;
    onSelectCustomDriverAnnotationBinary?: (s: boolean) => void;
    onSelectCustomDriverAnnotationTier?: (value: string, s: boolean) => void;
}

export interface IDriverAnnotationReport {
    hasBinary: boolean;
    tiers: string[];
}

export function buildDriverAnnotationSettings(
    didOncoKbFailInOncoprint: () => boolean,
    config = getServerConfig()
): DriverAnnotationSettings {
    return observable({
        cbioportalCount: false,
        cbioportalCountThreshold: 0,
        cosmicCount: false,
        cosmicCountThreshold: 0,
        driverTiers: observable.map<string, boolean>({}, { deep: true }),

        _hotspots: true,
        _oncoKb: true,
        _includeDriver: true,
        _includeVUS: true,
        _includeUnknownOncogenicity: true,
        _customBinary: undefined,
        _includeUnknownTier: true,

        set hotspots(val: boolean) {
            this._hotspots = val;
        },
        get hotspots() {
            return (
                !!config.show_hotspot &&
                this._hotspots &&
                !didOncoKbFailInOncoprint()
            );
        },
        set oncoKb(val: boolean) {
            this._oncoKb = val;
        },
        get oncoKb() {
            return (
                config.show_oncokb &&
                this._oncoKb &&
                !didOncoKbFailInOncoprint()
            );
        },
        get includeDriver() {
            return this._includeDriver;
        },
        set includeDriver(val: boolean) {
            this._includeDriver = val;
        },
        get includeVUS() {
            return this._includeVUS;
        },
        set includeVUS(val: boolean) {
            this._includeVUS = val;
        },
        get includeUnknownOncogenicity() {
            return this._includeUnknownOncogenicity;
        },
        set includeUnknownOncogenicity(val: boolean) {
            this._includeUnknownOncogenicity = val;
        },
        get driversAnnotated() {
            const anySelected =
                this.oncoKb ||
                this.hotspots ||
                this.cbioportalCount ||
                this.cosmicCount ||
                this.customBinary ||
                _.some(this.driverTiers.entries(), entry => entry[1]);
            return anySelected;
        },

        set customBinary(val: boolean) {
            this._customBinary = val;
        },
        get customBinary() {
            return this._customBinary === undefined
                ? config.oncoprint_custom_driver_annotation_binary_default
                : this._customBinary;
        },
        get customTiersDefault() {
            return config.oncoprint_custom_driver_annotation_tiers_default;
        },
        get includeUnknownTier() {
            return this._includeUnknownTier;
        },
        set includeUnknownTier(val: boolean) {
            this._includeUnknownTier = val;
        },
    });
}

export function buildDriverAnnotationControlsHandlers(
    driverAnnotationSettings: DriverAnnotationSettings,
    state: IDriverAnnotationControlsState
): IDriverAnnotationControlsHandlers {
    const handlers = {
        onSelectDistinguishDrivers: action((s: boolean) => {
            if (!s) {
                driverAnnotationSettings.oncoKb = false;
                driverAnnotationSettings.hotspots = false;
                driverAnnotationSettings.cbioportalCount = false;
                driverAnnotationSettings.cosmicCount = false;
                driverAnnotationSettings.customBinary = false;
                driverAnnotationSettings.driverTiers.forEach((value, key) => {
                    driverAnnotationSettings.driverTiers.set(key, false);
                });
                driverAnnotationSettings.includeDriver = true;
                driverAnnotationSettings.includeVUS = true;
                driverAnnotationSettings.includeUnknownOncogenicity = true;
            } else {
                if (
                    !state.annotateDriversOncoKbDisabled &&
                    !state.annotateDriversOncoKbError
                )
                    driverAnnotationSettings.oncoKb = true;

                if (
                    !state.annotateDriversHotspotsDisabled &&
                    !state.annotateDriversHotspotsError
                )
                    driverAnnotationSettings.hotspots = true;

                driverAnnotationSettings.cbioportalCount = true;
                driverAnnotationSettings.cosmicCount = true;
                driverAnnotationSettings.customBinary = true;
                driverAnnotationSettings.driverTiers.forEach((value, key) => {
                    driverAnnotationSettings.driverTiers.set(key, true);
                });
            }
        }),
        onSelectAnnotateOncoKb: action((s: boolean) => {
            driverAnnotationSettings.oncoKb = s;
        }),
        onSelectAnnotateHotspots: action((s: boolean) => {
            driverAnnotationSettings.hotspots = s;
        }),
        onSelectAnnotateCBioPortal: action((s: boolean) => {
            driverAnnotationSettings.cbioportalCount = s;
        }),
        onSelectAnnotateCOSMIC: action((s: boolean) => {
            driverAnnotationSettings.cosmicCount = s;
        }),
        onChangeAnnotateCBioPortalInputValue: action((s: string) => {
            driverAnnotationSettings.cbioportalCountThreshold = parseInt(s, 10);
            handlers.onSelectAnnotateCBioPortal &&
                handlers.onSelectAnnotateCBioPortal(true);
        }),
        onChangeAnnotateCOSMICInputValue: action((s: string) => {
            driverAnnotationSettings.cosmicCountThreshold = parseInt(s, 10);
            handlers.onSelectAnnotateCOSMIC &&
                handlers.onSelectAnnotateCOSMIC(true);
        }),
        onSelectCustomDriverAnnotationBinary: action((s: boolean) => {
            driverAnnotationSettings.customBinary = s;
        }),
        onSelectCustomDriverAnnotationTier: action(
            (value: string, checked: boolean) => {
                driverAnnotationSettings.driverTiers.set(value, checked);
            }
        ),
        onSelectIncludePutativeDrivers: (s: boolean) => {
            driverAnnotationSettings.includeDriver = s;
        },
        onSelectIncludePutativePassengers: (s: boolean) => {
            driverAnnotationSettings.includeVUS = s;
        },
        onSelectIncludeUnknownOncogenicity: (s: boolean) => {
            driverAnnotationSettings.includeUnknownOncogenicity = s;
        },
        onSelectIncludeUnknownTier: (s: boolean) => {
            driverAnnotationSettings.includeUnknownTier = s;
        },
    };
    return handlers;
}

export function buildDriverAnnotationControlsState(
    driverAnnotationSettings: DriverAnnotationSettings,
    customDriverAnnotationReport: IDriverAnnotationReport | undefined,
    didOncoKbFailInOncoprint?: boolean,
    didHotspotFailInOncoprint?: boolean,
    config = getServerConfig()
): IDriverAnnotationControlsState {
    return observable({
        get distinguishDrivers() {
            return driverAnnotationSettings.driversAnnotated;
        },
        get annotateDriversOncoKb() {
            return driverAnnotationSettings.oncoKb;
        },
        get annotateDriversOncoKbDisabled() {
            return !config.show_oncokb;
        },
        get annotateDriversOncoKbError() {
            return !!didOncoKbFailInOncoprint;
        },
        get annotateDriversHotspots() {
            return driverAnnotationSettings.hotspots;
        },
        get annotateDriversHotspotsDisabled() {
            return !config.show_hotspot;
        },
        get annotateDriversHotspotsError() {
            return !!didHotspotFailInOncoprint;
        },
        get annotateDriversCBioPortal() {
            return driverAnnotationSettings.cbioportalCount;
        },
        get annotateDriversCOSMIC() {
            return driverAnnotationSettings.cosmicCount;
        },
        get includePutativeDrivers() {
            return driverAnnotationSettings.includeDriver;
        },
        get includePutativePassengers() {
            return driverAnnotationSettings.includeVUS;
        },
        get includePutativeUnknownOncogenicity() {
            return driverAnnotationSettings.includeUnknownOncogenicity;
        },
        get annotateCBioPortalInputValue() {
            return driverAnnotationSettings.cbioportalCountThreshold + '';
        },
        get annotateCOSMICInputValue() {
            return driverAnnotationSettings.cosmicCountThreshold + '';
        },
        get customDriverAnnotationBinaryMenuLabel() {
            if (customDriverAnnotationReport) {
                const label = getServerConfig()
                    .oncoprint_custom_driver_annotation_binary_menu_label;
                if (
                    label &&
                    customDriverAnnotationReport &&
                    customDriverAnnotationReport.hasBinary
                )
                    return label;
            }
            return undefined;
        },
        get customDriverAnnotationTiersMenuLabel() {
            if (customDriverAnnotationReport) {
                const label = getServerConfig()
                    .oncoprint_custom_driver_annotation_tiers_menu_label;
                if (
                    label &&
                    customDriverAnnotationReport &&
                    customDriverAnnotationReport.tiers.length
                )
                    return label;
            } else {
                return undefined;
            }
        },
        get customDriverAnnotationTiers() {
            if (
                customDriverAnnotationReport &&
                customDriverAnnotationReport.tiers.length
            ) {
                return customDriverAnnotationReport.tiers;
            } else {
                return undefined;
            }
        },
        get annotateCustomDriverBinary() {
            return driverAnnotationSettings.customBinary;
        },
        get selectedCustomDriverAnnotationTiers() {
            return driverAnnotationSettings.driverTiers;
        },
        get anyCustomDriverAnnotationTiersSelected(): boolean {
            const options = Array.from(
                this.selectedCustomDriverAnnotationTiers!.values()
            ).filter(Boolean);
            return options.length > 0;
        },
        get includeUnknownTier() {
            return driverAnnotationSettings.includeUnknownTier;
        },
    });
}

export const initializeCustomDriverAnnotationSettings = action(
    (
        report: IDriverAnnotationReport,
        annotationSettings: any,
        enableCustomTiers: boolean
    ) => {
        // initialize keys with all available tiers
        for (const tier of report.tiers) {
            annotationSettings.driverTiers.set(tier, enableCustomTiers);
        }
    }
);
