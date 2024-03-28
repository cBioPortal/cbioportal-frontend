import { Dictionary } from 'lodash';

export function openWindowWithPost(url: string, data: Dictionary<any>) {
    const form = document.createElement('form');
    form.target = '_blank';
    form.method = 'POST';
    form.action = url;
    form.style.display = 'none';

    for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
