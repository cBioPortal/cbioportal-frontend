import {getGenomeNexusApiUrl} from "./urls";
import GenomeNexusAPIInternal from "./generated/GenomeNexusAPIInternal";

const client = new GenomeNexusAPIInternal(getGenomeNexusApiUrl());

export default client;
