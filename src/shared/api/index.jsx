import Swagger from 'swagger-client';
import AppConfig from "appConfig";

const clientPromise = new Swagger({
    url: `http://${AppConfig.apiRoot}/v2/api-docs`,
    usePromise: true
});
export default clientPromise;
