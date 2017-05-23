import {GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from "../constants";

export function isUncalled(geneticProfileId:string) {
    const r = new RegExp(GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX + "$");
    return r.test(geneticProfileId);
}
