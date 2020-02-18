import ResultsPageSettings from './ResultsPageSettings';
import { action, observable } from 'mobx';
import AppConfig from 'appConfig';
import { IDriverAnnotationControlsState } from './DriverAnnotationControls';
import * as React from 'react';

export function buildDriverAnnotationControlsState(self: ResultsPageSettings) {
    return observable({
        get distinguishDrivers() {
            return self.props.store.driverAnnotationSettings.driversAnnotated;
        },
        get annotateDriversOncoKb() {
            return self.props.store.driverAnnotationSettings.oncoKb;
        },
        get annotateDriversOncoKbDisabled() {
            return !AppConfig.serverConfig.show_oncokb;
        },
        get annotateDriversOncoKbError() {
            return self.props.store.didOncoKbFailInOncoprint;
        },
        get annotateDriversHotspots() {
            return self.props.store.driverAnnotationSettings.hotspots;
        },
        get annotateDriversHotspotsDisabled() {
            return !AppConfig.serverConfig.show_hotspot;
        },
        get annotateDriversHotspotsError() {
            return self.props.store.didHotspotFailInOncoprint;
        },
        get annotateDriversCBioPortal() {
            return self.props.store.driverAnnotationSettings.cbioportalCount;
        },
        get annotateDriversCOSMIC() {
            return self.props.store.driverAnnotationSettings.cosmicCount;
        },
        get hidePutativePassengers() {
            return self.props.store.driverAnnotationSettings.excludeVUS;
        },
        get annotateCBioPortalInputValue() {
            return self.props.store.driverAnnotationSettings.cbioportalCountThreshold + '';
        },
        get annotateCOSMICInputValue() {
            return self.props.store.driverAnnotationSettings.cosmicCountThreshold + '';
        },
        get customDriverAnnotationBinaryMenuLabel() {
            const label =
                AppConfig.serverConfig.oncoprint_custom_driver_annotation_binary_menu_label;
            const customDriverReport = self.props.store.customDriverAnnotationReport.result;
            if (label && customDriverReport && customDriverReport.hasBinary) {
                return label;
            } else {
                return undefined;
            }
        },
        get customDriverAnnotationTiersMenuLabel() {
            const label =
                AppConfig.serverConfig.oncoprint_custom_driver_annotation_tiers_menu_label;
            const customDriverReport = self.props.store.customDriverAnnotationReport.result;
            if (label && customDriverReport && customDriverReport.tiers.length) {
                return label;
            } else {
                return undefined;
            }
        },
        get customDriverAnnotationTiers() {
            const customDriverReport = self.props.store.customDriverAnnotationReport.result;
            if (customDriverReport && customDriverReport.tiers.length) {
                return customDriverReport.tiers;
            } else {
                return undefined;
            }
        },
        get annotateCustomDriverBinary() {
            return self.props.store.driverAnnotationSettings.customBinary;
        },
        get selectedCustomDriverAnnotationTiers() {
            return self.props.store.driverAnnotationSettings.driverTiers;
        },
    });
}

export function buildDriverAnnotationControlsHandlers(
    self: ResultsPageSettings,
    state: IDriverAnnotationControlsState
) {
    const handlers = {
        onSelectDistinguishDrivers: action((s: boolean) => {
            if (!s) {
                self.props.store.driverAnnotationSettings.oncoKb = false;
                self.props.store.driverAnnotationSettings.hotspots = false;
                self.props.store.driverAnnotationSettings.cbioportalCount = false;
                self.props.store.driverAnnotationSettings.cosmicCount = false;
                self.props.store.driverAnnotationSettings.customBinary = false;
                self.props.store.driverAnnotationSettings.driverTiers.forEach((value, key) => {
                    self.props.store.driverAnnotationSettings.driverTiers.set(key, false);
                });
                self.props.store.driverAnnotationSettings.excludeVUS = false;
            } else {
                if (!state.annotateDriversOncoKbDisabled && !state.annotateDriversOncoKbError)
                    self.props.store.driverAnnotationSettings.oncoKb = true;

                if (!state.annotateDriversHotspotsDisabled && !state.annotateDriversHotspotsError)
                    self.props.store.driverAnnotationSettings.hotspots = true;

                self.props.store.driverAnnotationSettings.cbioportalCount = true;
                self.props.store.driverAnnotationSettings.cosmicCount = true;
                self.props.store.driverAnnotationSettings.customBinary = true;
                self.props.store.driverAnnotationSettings.driverTiers.forEach((value, key) => {
                    self.props.store.driverAnnotationSettings.driverTiers.set(key, true);
                });
            }
        }),
        onSelectAnnotateOncoKb: action((s: boolean) => {
            self.props.store.driverAnnotationSettings.oncoKb = s;
        }),
        onSelectAnnotateHotspots: action((s: boolean) => {
            self.props.store.driverAnnotationSettings.hotspots = s;
        }),
        onSelectAnnotateCBioPortal: action((s: boolean) => {
            self.props.store.driverAnnotationSettings.cbioportalCount = s;
        }),
        onSelectAnnotateCOSMIC: action((s: boolean) => {
            self.props.store.driverAnnotationSettings.cosmicCount = s;
        }),
        onChangeAnnotateCBioPortalInputValue: action((s: string) => {
            self.props.store.driverAnnotationSettings.cbioportalCountThreshold = parseInt(s, 10);
            handlers.onSelectAnnotateCBioPortal && handlers.onSelectAnnotateCBioPortal(true);
        }),
        onChangeAnnotateCOSMICInputValue: action((s: string) => {
            self.props.store.driverAnnotationSettings.cosmicCountThreshold = parseInt(s, 10);
            handlers.onSelectAnnotateCOSMIC && handlers.onSelectAnnotateCOSMIC(true);
        }),
        onSelectCustomDriverAnnotationBinary: action((s: boolean) => {
            self.props.store.driverAnnotationSettings.customBinary = s;
        }),
        onSelectCustomDriverAnnotationTier: action((value: string, checked: boolean) => {
            self.props.store.driverAnnotationSettings.driverTiers.set(value, checked);
        }),
        onSelectHidePutativePassengers: (s: boolean) => {
            self.props.store.driverAnnotationSettings.excludeVUS = s;
        },
    };
    return handlers;
}

export function boldedTabList(tabs: string[]) {
    return (
        <span>
            {tabs.map((tab, index) => (
                <span>
                    <strong>{tab}</strong>
                    {index < tabs.length - 1 ? ', ' : ''}
                </span>
            ))}
        </span>
    );
}
