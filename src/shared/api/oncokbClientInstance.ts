import OncoKbAPI from "./generated/OncoKbAPI";
import {getOncoKbApiUrl} from "./urls";

const client = new OncoKbAPI(getOncoKbApiUrl());

export default client;
