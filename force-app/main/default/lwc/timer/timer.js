/* eslint-disable @lwc/lwc/no-async-operation */
import { api, LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE, MessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import ONE_MESSAGE_USER_CHANNEL from '@salesforce/messageChannel/OneMessageComp__c'; // FROM CORAL TO SALESFORCE MESSAGE CHANNEL
import {log} from 'c/utility'
export default class Timer extends LightningElement {
    stoptime = true;
    timer = '00:00:00';
    hr = 0;
    min = 0;
    sec = 0;
    showTimer = false;
    setTimer;
    subscription = null;
    @api recordId;

    @wire(MessageContext)
    messageContext;

    connectedCallback()
    {
        clearTimeout(this.setTimer)
        this.subscribeToMessageChannel();

    }

    disconnectedCallback() {
        this.cleanupSubscription()
    }


    cleanupSubscription() {
        // Check if there is an active subscription and unsubscribe
        if (this.subscription) {
          unsubscribe(this.subscription);
          this.subscription = null;  // Reset the subscription reference
        }
      }
  

    subscribeToMessageChannel(){
        this.subscription = subscribe(
            this.messageContext,
            ONE_MESSAGE_USER_CHANNEL,
            (message) => this.handleMessage(message),
            { scope: APPLICATION_SCOPE }
        );
    }

    handleMessage = (message) =>
        {
            log('INFO', `timer action: ${message.action}`, {recordId:this.recordId, message} );
            try
            {
                const { action, entityid } = message;
                if(this.recordId!==entityid){
                    return;
                }
                switch (action)
                {
                    case 'opened':
                    case 'showChatPage': {
                        log('INFO', `StartTimer`, {});
                        this.startTimer();
                        break;
                    }
                    case 'chatupdate':
                        if(message.payload.mode === "complete" || message.payload.asyncAgentClosed){ 
                          this.stopTimer()
                          this.resetTimer()
                          log('INFO', `stoptimer`, {});
                        }
                        
                        this.startTimer();
                        log('INFO', `StartTimer`, {});
                        break;
                    case 'left':
                    case 'parked': {
                        this.showTimer = false;  
                        this.stopTimer();
                        this.resetTimer();
                        break;
                    }
                    default:
                        
                        break;
                }
            } catch (error)
            {
                log('ERROR', `timer (Unexpected action): ${message.action}`, error);
            }
    
        }

    startTimer()
    {   
        this.showTimer = true;
       

        if (this.stoptime)
        {
            this.stoptime = false;
            this.timerCycle();
        }
    }

    stopTimer()
    {   
        this.showTimer =false;
        if (!this.stoptime)
        {
            if(this.setTimer){
                clearTimeout(this.setTimer)
                this.setTimer = null
            }
            this.stoptime = true;
            
        } 
    }
    resetTimer(){
        this.hr = 0;
        this.min = 0;
        this.sec = 0;
        this.timer = '00:00:00';
    }

    timerCycle()
    {
        if (!this.stoptime )
        {


            this.sec = parseInt(this.sec, 10);
            this.min = parseInt(this.min, 10);
            this.hr = parseInt(this.hr, 10);

            this.sec = this.sec + 1;

            if (this.sec === 60)
            {
                this.min = this.min + 1;
                this.sec = 0;
            }

            if (this.min === 60)
            {
                this.hr = this.hr + 1;
                this.min = 0;
                this.sec = 0;
            }

            if (this.sec < 10 || this.sec === 0)
            {
                this.setsec = '0' + this.sec;
            }
            else
            {
                this.setsec = this.sec;
            }
            if (this.min < 10 || this.min === 0)
            {
                this.setmin = '0' + this.min;
            }
            else
            {
                this.setmin = this.min;
            }
            if (this.hr < 10 || this.hr === 0)
            {
                this.sethr = '0' + this.hr;
            }
            else
            {
                this.sethr = this.hr;
            }

            this.timer = this.sethr + ':' + this.setmin + ':' + this.setsec;

            this.setTimer = setTimeout(() => { this.timerCycle(); }, 1000);
            

        }
    }

    disconnectedCallback() {
         if(this.setTimer){
            clearTimeout(this.setTimer)
        } 
        
    }
}