import Genome2StructureAPI from "./generated/Genome2StructureAPI";
import {getG2SApiUrl} from "./urls";

const client = new Genome2StructureAPI(getG2SApiUrl());

export default client;
