export default function formSubmit(path:string, params:{[s:string]:any}, target?:string, method:"get"|"post"="post") {
    const form = document.createElement('form');
    form.setAttribute('method', method);
    form.setAttribute('action', path);
    if (target) {
        form.setAttribute('target', target);
    }

    for (const key of Object.keys(params)) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', params[key]);
        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
}