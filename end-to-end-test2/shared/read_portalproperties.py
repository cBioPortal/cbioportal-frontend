#!/usr/bin/python3

import sys

filename = sys.argv[1]
with open(filename, 'r') as f:
  for l in f:
    l = l.strip()
    if l:
      e = l.split("=")
      e[0] = e[0].replace(".","_").upper()
      print('export '+e[0].rstrip()+"="+e[1].rstrip())
