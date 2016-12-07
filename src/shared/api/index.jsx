import Swagger from 'swagger-client';

const clientPromise = new Swagger({
    url: `${__API_ROOT__}/v2/api-docs`,
    usePromise: true
});
export default clientPromise;
