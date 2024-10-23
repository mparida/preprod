/**
 * Created by mp1863 on 23/10/24.
 */

import { LightningElement, wire } from 'lwc';
import { subscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id'; // Retrieve the current user's ID

export default class PlatformEventListener extends LightningElement {
    channelName = '/event/NotificationEvent__e'; // Platform Event channel

    connectedCallback() {
        this.handleSubscribe(); // Subscribe to platform event on component load
        this.registerErrorListener(); // Register error handler
    }

    handleSubscribe() {
        subscribe(this.channelName, -1, (message) => {
            const payload = message.data.payload;
            // Display the toast only if the event is targeted to the logged-in user
            if (payload.UserId__c === USER_ID) {
                this.showToast(payload);
            }
        });
    }

    showToast(payload) {
        const event = new ShowToastEvent({
            title: payload.Title__c,
            message: payload.Message__c,
            variant: payload.Variant__c,
            mode: 'sticky' // Can be 'info', 'success', 'warning', or 'error'
        });
        this.dispatchEvent(event); // Trigger the toast message
    }

    registerErrorListener() {
        onError((error) => {
            console.error('Error in Platform Event Subscription:', error);
        });
    }
}