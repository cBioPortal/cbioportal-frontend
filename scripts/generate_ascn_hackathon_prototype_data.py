#!/usr/bin/env python3
"""Generates the ASCN hackathon prototype JSON data asset.

This script is NOT run automatically and its output is NOT committed to
this repository -- the ASCN hackathon data is patient-derived and must
never be part of a PR. It is meant to be run manually/locally by a
developer who has a local copy of the ASCN hackathon repro bundle
(the one containing `hackathon_data.cohort.txt` and `facets_data/`, as
used by `ascn_hackathon_genomewide_viz_repro.R`).

Usage:
    python3 scripts/generate_ascn_hackathon_prototype_data.py \
        --data-dir /path/to/share_ascn_hackathon_genomewide_viz_repro_.../data

This reads, per sample in `hackathon_data.cohort.txt`, that sample's
reviewed ASCN fit (`fit_name` column -- usually "default", but a reviewed
`alt_dipLogR_*` override for a few samples) and the corresponding
`facets_data/<tumor_sample>_<normal_sample>/<fit_name>/*_purity.cncf.txt`
segmentation file, then writes a single JSON file consumed at runtime by
`src/pages/studyView/tabs/ascnCnSegments/AscnDataUtils.ts`
(`loadAscnPrototypeData()`), by default to:
    src/shared/static-data/ascnHackathonPrototypeData.json
That output path is git-ignored; re-run this script locally any time the
source data changes. If the JSON is absent, the tab shows an empty state.
"""

import argparse
import csv
import json
import os
import re
import sys

TUMOR_ONLY_RE = re.compile(r"^(P-\d+-T\d+-IM\d+)")
AUTOSOMES = {str(c) for c in range(1, 23)}

DEFAULT_OUTPUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src",
    "shared",
    "static-data",
    "ascnHackathonPrototypeData.json",
)


def read_tsv(path):
    with open(path, "r", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        return list(reader)


def num_or_none(value):
    if value is None or value == "" or value == "NA":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def load_cohort_rows(data_dir):
    cohort_path = os.path.join(data_dir, "hackathon_data.cohort.txt")
    rows = []
    for row in read_tsv(cohort_path):
        tumor_sample = row.get("tumor_sample")
        purity = num_or_none(row.get("purity"))
        if not tumor_sample or purity is None:
            continue
        match = TUMOR_ONLY_RE.match(tumor_sample)
        if not match:
            continue
        fit_name = (row.get("fit_name") or "default").strip() or "default"
        rows.append(
            {
                "tumor_only": match.group(1),
                "tumor_sample": tumor_sample,
                "normal_sample": row.get("normal_sample"),
                "purity": purity,
                "fit_name": fit_name,
            }
        )
    return rows


def load_cncf_segments(cncf_path, tumor_only):
    segments = []
    for row in read_tsv(cncf_path):
        chrom = row.get("chrom")
        if chrom not in AUTOSOMES:
            continue  # keep chr1-22 only
        tcn = num_or_none(row.get("tcn.em"))
        if tcn is None:
            continue
        lcn = num_or_none(row.get("lcn.em"))
        mcn = None if lcn is None else tcn - lcn
        cellular_fraction = num_or_none(row.get("cf.em"))
        segments.append(
            {
                "tumorSampleId": tumor_only,
                # kept as a string (not int), matching the backend's
                # `AbstractAscnRecord.chr: String` field -- this also
                # leaves room for non-autosome values (X/Y/M) in the future,
                # even though only chr1-22 are populated here.
                "chromosome": chrom,
                "start": int(float(row["loc.start"])),
                "end": int(float(row["loc.end"])),
                "tcn": tcn,
                "mcn": mcn,
                "lcn": lcn,
                # raw ASCN cellular fraction (cf.em), matching the
                # backend's `cellularFraction` field name/semantics. The
                # cf/purity ratio used for the CF threshold slider is
                # derived on the frontend (AscnDataUtils.ts), not baked in
                # here, since purity lives on the sample record.
                "cellularFraction": cellular_fraction,
            }
        )
    return segments


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        required=True,
        help=(
            "Path to the ASCN hackathon bundle's data directory "
            "(containing hackathon_data.cohort.txt and facets_data/)."
        ),
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help="Output JSON path (default: %(default)s).",
    )
    args = parser.parse_args()

    cohort_rows = load_cohort_rows(args.data_dir)
    samples = []
    segments = []
    skipped = []

    for row in cohort_rows:
        sample_dir = "{}_{}".format(row["tumor_sample"], row["normal_sample"])
        cncf_filename = "{}_purity.cncf.txt".format(sample_dir)
        cncf_path = os.path.join(
            args.data_dir, "facets_data", sample_dir, row["fit_name"], cncf_filename
        )
        if not os.path.isfile(cncf_path):
            skipped.append(row["tumor_only"])
            continue
        samples.append({"tumorSampleId": row["tumor_only"], "purity": row["purity"]})
        segments.extend(load_cncf_segments(cncf_path, row["tumor_only"]))

    if skipped:
        print(
            "WARNING: no cncf file found for {} sample(s), skipped: {}".format(
                len(skipped), ", ".join(skipped)
            ),
            file=sys.stderr,
        )

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump({"samples": samples, "segments": segments}, f)

    print(
        "Wrote {} samples / {} segments to {}".format(
            len(samples), len(segments), args.output
        )
    )


if __name__ == "__main__":
    main()
