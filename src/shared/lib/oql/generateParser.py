#!/usr/bin/python
import os
import sys

os.system("pegjs "+sys.argv[1]+" oql-parser-tmp.js")

f = open("oql-parser-tmp.js","r")
nf = open("oql-parser.js","w")

test = len(sys.argv) >= 3 and sys.argv[2].startswith("-t")

if not test:
	f.readline()
	nf.write("const oql_parser = (function() {\n")

for line in f:
	nf.write(line)

if not test:
	nf.write("export default oql_parser;\n");

os.system("rm oql-parser-tmp.js")
