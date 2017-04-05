import HotspotAPI from "./generated/CancerHotspotsAPI";
import {getCbioPortalApiUrl, getHotspotsApiUrl} from "./urls";

const client = new HotspotAPI(getHotspotsApiUrl());
export default client;
