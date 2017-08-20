import PdbAnnotationAPI from "./generated/PdbAnnotationAPI";
import {getPdbAnnotationApiUrl} from "./urls";

const client = new PdbAnnotationAPI(getPdbAnnotationApiUrl());

export default client;
