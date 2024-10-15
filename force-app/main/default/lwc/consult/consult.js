import { LightningElement,track,api ,wire} from 'lwc';
import {
    APPLICATION_SCOPE,
    MessageContext,
    publish,
    subscribe,
    unsubscribe,
} from 'lightning/messageService';
import ONE_MESSAGE_CHANNEL from '@salesforce/messageChannel/OneMessage__c'; //FROM SALESFORCE TO CORAL MESSAGECHANNEL
import ONE_MESSAGE_USER_CHANNEL from '@salesforce/messageChannel/OneMessageComp__c'; // FROM CORAL TO SALESFORCE MESSAGE CHANNEL
import { enablementOfConferenceSession } from './utility/index';
import { log} from 'c/utility';

import { Redux } from 'c/lwcReduxCoral';
import chatwindowActions from 'c/chatwindowActions';


export default class Consult extends Redux(LightningElement) {
    isNotesStep = false; //1st step
    isSendRequestStep = false; //2nd step
    isOpenConsultModal =false; //openModal
    searchVal;
    currentCount = 0;
    supervisors = [];
    isLoading = false;
    old = false;
    notes ='';
    subscription = null;
    @api recordId;
    @api isSupervisorNameFlag = false;
    @track filterValue = [];
    @api isEmptySupervisorsName;
   
   

    @wire(MessageContext)
    messageContext;

    mapStateToProps(state){
        
        return state.consult;
    }

    mapDispatchToProps(){
        const {consult} = chatwindowActions;
        return consult;
    }

  
    connectedCallback() {
        super.connectedCallback();
        this.subscribeToMessageChannel();

    }

   

    disconnectedCallback(){
        this.cleanupSubscription();
    }

   
    subscribeToMessageChannel(){
        this.subscription = subscribe(
            this.messageContext,
            ONE_MESSAGE_USER_CHANNEL,
            (message) => this.handleMessage(message),
            { scope: APPLICATION_SCOPE }
        );
    }

    cleanupSubscription() {
        // Check if there is an active subscription and unsubscribe
        if (this.subscription) {
          unsubscribe(this.subscription);
          this.subscription = null;  // Reset the subscription reference
        }
      }

    handleMessage(message)
    {
        try
        {
            
            switch (message.action)
            {
                case 'newbubble':
                    log('INFO', `consultLWC action: ${message.action}`, message);
                    enablementOfConferenceSession(this, message.payload);
                    break;
                case 'gotTransferList':
                    log('INFO', `consultLWC action: ${message.action}`, message);
                    this.supervisors = this.isSupervisorNameFlag ? message.supervisors : message.supervisorQueueDetails;
                    this.isLoading = false;
                    break;
                case 'left':
                    if(this.recordId!==message.entityid){
                        return;
                    }
                    log('INFO', `consultLWC action: ${message.action}`, message);
                    break;
                case 'chatupdate': {
                    if (this.recordId !== message.entityid) return;
                    log('INFO', `consultLWC action: ${message.action}`, message);
                    const { payload } = message;
                    if (payload.mode === 'conference')  this.props.disableCoachingRequest() 
                    else  this.props.enableCoachingRequest();
                   
                    break;
                }
                default:
                    break;
            }
        } catch (error)
        {
            log('ERROR', `consultLWC action: ${message.action}`, error);
        }

    }


    getTransferList(){
        const payload = {   action: 'getTransferList', 
                            entityid: this.recordId
                        };

        log('INFO', 'Handle Transfer CHAT ' ,payload);
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
    }

    
    
    closeConsultModal () {
        this.isOpenConsultModal = false;
        this.isNotesStep = false
        this.isSendRequestStep = false;
        this.notes = "";
    }

    openConsultModal () {
      
        this.isOpenConsultModal = true;
        this.isNotesStep = false;
        this.isSendRequestStep=true;
        this.isLoading = true;
        this.getTransferList();
    }

    handleNext () {
        this.isNotesStep = false;
        this.isSendRequestStep = true;
        
        
    }

    handlePrevious() {
        this.isSendRequestStep = false;
        this.isNotesStep = true;
    }


    handleNoteChange(e) {
        const notes = e.detail.notes;
        this.notes =notes;
    }

 

    handleConsult(e)
    {
        try
        {
            const id = e.detail?.id;
            const notes = this.notes;

            const payload = {
                action: 'transfer',
                disposition: '',
                entityid: this.recordId,
                mode: 'consult',
                toAgent: this.isSupervisorNameFlag ? id : '', //for the individual supervisor name
                toQueue: !this.isSupervisorNameFlag ? id : '',
                comment: notes || ''
            };
            log('INFO', 'Consult CHAT ',payload);
            publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
            this.closeConsultModal();
            this.props.enableOngoingConsultRequest();
           
           
           
        } catch (error)
        {
            log('ERROR', 'Consult Error: ',error.message);
        }

    }

    handleLoading = (event) => {
        this.isLoading = event.detail.isLoading ?? false;
    }

    log(status, message){
		// eslint-disable-next-line @locker/locker/distorted-storage-constructor
		if (localStorage.corallog === 'suppress') return;
        let date = new Date();
        let datestring = '';
        datestring = this.padding(date.getFullYear().toString()) +
            this.padding(date.getMonth() + 1) + this.padding(date.getDate()) + ' ' +
            this.padding(date.getHours()) + ':' +
            this.padding(date.getMinutes()) + ':' +
            this.padding(date.getSeconds()) + '.' +
            this.padding(date.getMilliseconds());

        console.log(datestring + ' > [CHAT: ' + status + '] ' + message);
    }
    padding(n){
        return (n < 10 ? '0' : '') + n;
    }
    
}