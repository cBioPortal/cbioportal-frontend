export function getDataForSubmission(fileInput: HTMLInputElement | null, stringInput: string) {
    return new Promise<string>(resolve => {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            // get data from file upload
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const data = fileReader.result as string | null;
                if (data) {
                    resolve(data);
                } else {
                    resolve('');
                }
            };
            fileReader.readAsText(fileInput.files[0]);
        } else {
            // get data from text input
            resolve(stringInput);
        }
    });
}
