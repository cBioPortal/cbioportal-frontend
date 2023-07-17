import getBrowserWindow from './getBrowserWindow';

export default function fileDownloadToJupyter(data: any, fileName: string) {
    const win = getBrowserWindow();

    //this is necessary because it forces browser to re-evaluate
    //whether window exists. otherwise subsequent check will fail
    const nada = win.jupyter;

    if (!win.jupyter || !win.jupyter.window) {
        win.jupyter = window.open('/reactapp/jupyter/lab/index.html');
    }

    let attempts = 20;
    const interval = setInterval(() => {
        if (win.jupyter.jupyterapp) {
            console.log('sending data to jupyter window', fileName);

            //win.jupyter.aaron = data;
            win.jupyter.jupyterapp.serviceManager.contents.save(
                `/${fileName}`,
                {
                    content: data,
                    format: 'text',
                    mimetype: 'text',
                }
            );
            clearInterval(interval);
        } else {
            console.log('no jupyter window available');
            if (attempts < 1) {
                clearInterval(interval);
            } else {
                attempts--;
            }
        }
    }, 1000);
}
