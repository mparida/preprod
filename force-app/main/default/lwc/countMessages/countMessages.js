import { LightningElement, api, wire } from 'lwc';
import
    {
        APPLICATION_SCOPE,
        MessageContext,
        subscribe,
        unsubscribe,
    } from 'lightning/messageService';
import ONE_MESSAGE_USER_CHANNEL from '@salesforce/messageChannel/OneMessageComp__c';
import { agentMessageTo, messageType } from './utility/constant';
export default class CountMessages extends LightningElement
{
    messages = [];
    messageSource = '';
    subscription = null;
    @api message;
    @wire(MessageContext)
    messageContext;

    //LWC Component
    textareaLWC;

    connectedCallback()
    {
        this.subscribeToMessageChannel();
    }
    subscribeToMessageChannel()
    {
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
  

    disconnectedCallback() {
        this.cleanupSubscription();
      }

    

    handleMessage(message)
    {
        
        switch (message.action)
        {
            case 'newbubble': {
                const {classes} = message.payload;
                this.messageSource = agentMessageTo.AgentMe !== classes ? this.messageSource : '';
                this.messages.push(message);
                break;
            }
            case 'textinput':
                try
                {
                    this.messageSource = messageType.HIPER;
                   
                } catch (error)
                {
                    console.log({error})
                }
                break;
            case 'typing' :  {
                let messageSource = this.messageSource;
               
                switch (messageSource)
                {
                    case messageType.HIPER:
                        this.messageSource = messageType.EDITED_HIPER
                        break;
                    case messageType.STANDARD_RESPONSE:
                        this.messageSource = messageType.EDITED_STANDARD_RESPONSE
                        break;
                    case "":
                        this.messageSource = messageType.FREEHAND;
                        break;
                    default:
                        break;
                }
                break;
            }
            default:
                break;
        }
    }

    @api setMessageSourceType(messageSource) {
       
        this.messageSource =messageSource;
    }
    
    @api clearMessageSource() {
        this.messageSource = '';
    }

    @api getMessageSourceType (originalMsgFromHiperOrStandardResponse) {
        
        const {textInput , from , currentMessage}  = originalMsgFromHiperOrStandardResponse ?? {textInput:null, from:null , currentMessage:null};
        const isCurrTextEqualToHiperOrStdResp = textInput?.localeCompare(currentMessage) === 0;
        
        if (isCurrTextEqualToHiperOrStdResp) return from;

        return this.messageSource
    }
    



}