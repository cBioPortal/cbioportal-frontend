## For using the notebook and its features: 

1. Naviagte to the `notebook` directory.
2. Create a **conda** environement with this code: `conda create -n jupyterlab-iframe-ext --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=20 git copier=7 jinja2-time jupyterlite-core`.
3. Activate it using the command: `conda activate jupyterlab-iframe-ext`
4. Then, install all the dependencies of the `**kernel**` and others using the command: `jupyter lite build --output-dir lite`.
5. Then try to run the command to check the notebook : `python -m http.server -b 127.0.0.1`
