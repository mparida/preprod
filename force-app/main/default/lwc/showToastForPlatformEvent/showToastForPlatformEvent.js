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
    storageKey = 'lastEventId';
    replayIdKey = 'lastReplayId'; // Key for storing the last replay ID in sessionStorage

    renderedCallback() {
        if(this.isCSSLoaded) return;
        this.isCSSLoaded = true;
        loadStyle(this, customCSS)
            .then(result => {
                console.log('CSS Loaded...');
            })
            .catch(reason => {
                console.log('Error CSS Loading...');
            });
    }

    connectedCallback() {
        this.ensureSubscription(); // Ensure subscription is active on load
        this.registerErrorListener();
    }

    // Ensure we are subscribed to the event channel with the correct replay ID
    ensureSubscription() {
        if (!this.subscription) {
            // Retrieve the last Replay ID from sessionStorage or set it to -2 to fetch events from the last 24 hours
            let replayId = -2; // Default to -2 for last 24 hours if no stored ID
            const lastReplayId = sessionStorage.getItem(this.replayIdKey);

            if (lastReplayId) {
                replayId = parseInt(lastReplayId, 10); // Use stored replay ID if available
            }

            console.log('Subscribing to Platform Event with replay ID:', replayId);

            subscribe(this.channelName, replayId, (message) => {
                const payload = message.data.payload;
                console.log('Received Platform Event:', message);
                /*console.log('Current User ID:', USER_ID);
                console.log('Current Record ID:', this.recordId);
                console.log('Event UserId__c:', payload.UserId__c);
                console.log('Event RecordId__c:', payload.RecordId__c);*/

                if (payload.UserId__c === USER_ID && payload.RecordId__c === this.recordId) {
                    console.log('Event matches current user and record');
                    const eventId = message.data.event.replayId;

                    // Show the toast if this event hasn’t been shown yet in this session
                    if (sessionStorage.getItem(this.storageKey) !== eventId.toString()) {
                        this.showToast(payload);
                        sessionStorage.setItem(this.storageKey, eventId.toString());
                    }

                    // Update the lastReplayId in sessionStorage
                    sessionStorage.setItem(this.replayIdKey, eventId.toString());
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
        const message = '• This is the first line\n• This is the second line\n• Here is the third line';
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