import OncoKbAPI from "./generated/OncoKbAPI";
import AppConfig from 'appConfig';

const client = new OncoKbAPI(`//${AppConfig.oncoKbApiRoot}`);

export default client;
