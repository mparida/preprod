import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import customCSS from '@salesforce/resourceUrl/toastCSS';
import USER_ID from '@salesforce/user/Id';

export default class PlatformEventListener extends LightningElement {
    isCSSLoaded = false;
    @api recordId;
    channelName = '/event/NotificationEvent__e';
    subscription = null;
    processedEventsKey = 'processedEventIds'; // Key for storing processed Replay IDs in localStorage

    renderedCallback() {
        if (this.isCSSLoaded) return;
        this.isCSSLoaded = true;
        loadStyle(this, customCSS)
            .then(() => {
                console.log('CSS Loaded...');
            })
            .catch(() => {
                console.log('Error Loading CSS...');
            });
    }

    connectedCallback() {
        this.ensureSubscription(); // Ensure subscription is active on load
        this.registerErrorListener();
    }

    // Ensure we are subscribed to the event channel with the correct replay ID
    ensureSubscription() {
        if (!this.subscription) {
            let replayId = -1; // Start with -1 to only fetch new events

            console.log('Subscribing to Platform Event with replay ID:', replayId);

            subscribe(this.channelName, replayId, (message) => {
                const payload = message.data.payload;
                const replayId = message.data.event.replayId;

                // Retrieve processed Replay IDs from localStorage
                let processedEvents = JSON.parse(localStorage.getItem(this.processedEventsKey)) || [];

                // If the event has already been processed, skip displaying it
                if (processedEvents.includes(replayId.toString())) {
                    console.log('Event already processed, skipping:', replayId);
                    return;
                }

                console.log('Received new Platform Event:', message);

                if (payload.UserId__c === USER_ID && payload.RecordId__c === this.recordId) {
                    console.log('Event matches current user and record');

                    // Show the toast message
                    this.showToast(payload);

                    // Add the Replay ID to the processed list and update localStorage
                    processedEvents.push(replayId.toString());
                    localStorage.setItem(this.processedEventsKey, JSON.stringify(processedEvents));
                } else {
                    console.log('Event does NOT match current user or record');
                }
            }).then((response) => {
                this.subscription = response;
                console.log('Successfully subscribed to Platform Event channel:', this.channelName);
            }).catch((error) => {
                console.error('Error subscribing to Platform Event:', error);
            });
        } else {
            console.log('Already subscribed to Platform Event channel');
        }
    }

    // Display a toast notification
    showToast(payload) {
        const event = new ShowToastEvent({
            title: payload.Title__c,
            message: payload.Message__c,
            variant: payload.Variant__c || 'info',
            mode: 'sticky'
        });
        this.dispatchEvent(event);
    }

    // Register error listener for subscription issues
    registerErrorListener() {
        onError((error) => {
            console.error('Error in Platform Event Subscription:', error);
        });
    }

    // Unsubscribe when component is disconnected to avoid memory leaks
    disconnectedCallback() {
        console.log('Entering disconnectedCallback'); // Log entry into disconnectedCallback
        if (this.subscription) {
            console.log('Attempting to unsubscribe from Platform Event channel...');
            unsubscribe(this.subscription, (response) => {
                console.log('Unsubscribed from Platform Event channel:', response);
                this.subscription = null;
            }).catch((error) => {
                console.error('Error during unsubscribe:', error);
            });
        } else {
            console.log('No active subscription to unsubscribe from.');
        }
    }
}