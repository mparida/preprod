import { LightningElement, track } from 'lwc';
import findCommonComponents from '@salesforce/apex/CommonComponentsController.findCommonComponents';
import { createRecord } from 'lightning/uiRecordApi';

export default class FindCommonComponents extends LightningElement {
    @track release1 = '';
    @track release2 = '';
    @track downloadUrl;
    @track temporaryRecordId;

    connectedCallback() {
        this.createTemporaryRecord();
    }

    async createTemporaryRecord() {
        const fields = {}; // No fields needed for a temporary record
        const objectApiName = 'copado__Release__c'; // Temporary context object
        try {
            const result = await createRecord({ apiName: objectApiName, fields });
            this.temporaryRecordId = result.id; // Store the temporary record ID
        } catch (error) {
            console.error('Error creating temporary record:', error);
        }
    }

    handleRelease1Change(event) {
        this.release1 = event.target.value; // Capture the selected Release 1 ID
    }

    handleRelease2Change(event) {
        this.release2 = event.target.value; // Capture the selected Release 2 ID
    }

    async handleFindCommonComponents() {
        if (!this.release1 || !this.release2) {
            return alert('Please select both Release 1 and Release 2');
        }

        try {
            const csvFileId = await findCommonComponents({ release1: this.release1, release2: this.release2 });
            this.downloadUrl = `/sfc/servlet.shepherd/document/download/${csvFileId}`;
            alert('Common components CSV has been generated and attached to the latest modified Account!');
        } catch (error) {
            console.error('Error finding common components:', error);
            alert('An error occurred. Please try again.');
        }
    }

    downloadCsv() {
        window.open(this.downloadUrl, '_blank');
    }
}
