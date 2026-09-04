import { getServerConfig } from 'config/config';

const MSK_INTERNAL_APP_NAMES = ['mskcc-portal'];

export function isMskInternalPortal(): boolean {
    return MSK_INTERNAL_APP_NAMES.includes(getServerConfig().app_name!);
}
