import HotspotAPI from "./generated/CancerHotspotsAPI";
import { getHotspots3DApiUrl} from "./urls";

const client = new HotspotAPI(getHotspots3DApiUrl());
export default client;
