import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import DEVELOPER_FIELD from '@salesforce/schema/copado__User_Story__c.copado__Developer__c';
import PEER_REVIEWER_FIELD from '@salesforce/schema/copado__User_Story__c.Peer_Reviewer__c';

export default class ToastMessageComponent extends LightningElement {
    @api recordId; // The ID of the copado__User_Story__c record

    // Wire to get the record details
    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: [DEVELOPER_FIELD, PEER_REVIEWER_FIELD] 
    }) userStory({ error, data }) {
        if (data) {
            this.checkFieldsAndShowToast(data);
        } else if (error) {
            console.error('Error fetching record: ', error);
        }
    }

    // Method to check the fields and show the toast if necessary
    checkFieldsAndShowToast(record) {
        const developer = record.fields.copado__Developer__c.value;
        const peerReviewer = record.fields.Peer_Reviewer__c.value;

        if (!developer || !peerReviewer) {
            // Show error toast if either field is empty
            const evt = new ShowToastEvent({
                message: 'Both Developer and Peer Reviewer fields must be filled out.',
                variant: 'warning', // Red toast message
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }
    }
}