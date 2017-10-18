import GenomeNexusAPI from "./generated/GenomeNexusAPI";
import {getGenomeNexusApiUrl} from "./urls";

const client = new GenomeNexusAPI(getGenomeNexusApiUrl());

export default client;
