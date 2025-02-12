/**
 * Created by mp1863 on 31/01/25.
 */

import { LightningElement, track } from 'lwc';

export default class CsvUploader extends LightningElement {
    @track selectedEnvironment;
    @track fileData;

    environmentOptions = [
        { label: 'Development', value: 'dev' },
        { label: 'Testing', value: 'test' },
        { label: 'Production', value: 'prod' }
    ];

    handleEnvironmentChange(event) {
        this.selectedEnvironment = event.detail.value;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.fileData = file;
        }
    }

    handleImport() {
        // Logic for handling CSV import will be implemented later
        console.log('Selected Environment:', this.selectedEnvironment);
        console.log('Uploaded File:', this.fileData);
    }
}
