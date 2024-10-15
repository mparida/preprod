import { LightningElement ,api, wire} from 'lwc';
import { chatType, iconName } from './utility/constant';
import { APPLICATION_SCOPE, MessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import ONE_MESSAGE_USER_CHANNEL from '@salesforce/messageChannel/OneMessageComp__c'; // FROM CORAL TO SALESFORCE MESSAGE CHANNEL
import {  setChatTypeLogo } from './utility/handleMessage';
import { STORAGE_KEY, setSessionStorageItem , log} from 'c/utility';


export default class ChatTypeIcon extends LightningElement
{

    chatType; //default sync chat
    isAsync;
    engagementType;
    activeTabId;
    @api activeChats;
    @api recordId;
    @api isTimeout;
    subscription = null;
    @wire(MessageContext)
    messageContext;
    
    connectedCallback()
    {
        this.subscribeToMessageChannel();
        let activeChats = this.formatActiveChats(this.activeChats);
        this.renderedChatTypeIcon(activeChats);
       
    }

    renderedChatTypeIcon(activeChats) {
        
        log('INFO', `chatTypeIcon activeChats`, JSON.parse(JSON.stringify(activeChats)));
        let currentChat = activeChats.find(chat => chat.entityid === this.recordId);

        if (currentChat) log('INFO', `chatTypeIcon currentChat`, JSON.parse(JSON.stringify(currentChat)));
        else {
            log('WARN', `chatTypeIcon currentChat`, 'No active chat')
        }
        if(currentChat) {
            this.isAsync = currentChat.isAsync ?? false;
            this.engagementType = currentChat.chatType;
            let action = currentChat.action ?? '';
            setChatTypeLogo(this.isAsync, this.engagementType, this, action);
        }
    }

    disconnectedCallback() {
        this.cleanupSubscription()
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
  

    handleMessage = (message) =>
    {
        try
        {
            const { action, payload, entityid } = message;
            
            switch (action)
            {
                case 'chatupdate': {
                    log('INFO', `chatTypeIcon action: ${message.action}`, message);
                    if (this.recordId !== entityid) return;
                    
                    const { isasync, engagementtype, asyncAgentClosed, mode, kvp } = payload;
                    if (isasync)
                    { //FOR ASYNC CHAT AND APPLE BUSINESS CHAT
                        this.isAsync = isasync;
                        const engagementTypeObj = kvp?.find(item => item.key === "engagement_type");
                        this.engagementType = engagementTypeObj?.value ?? engagementtype;
                        if (asyncAgentClosed === "Timed Out" || asyncAgentClosed === "User Ended" || mode === 'complete')
                        {
                            //this.onTimeout(false);
                            this.setChatStatus('parked');
                            return;
                        }
                        this.setChatStatus('engaged');
                    }
                    else
                    { //for SYNC CHAT
                        if (mode === 'complete')
                        {
                            this.setChatStatus('complete');
                            return;
                        }
                        this.setChatStatus('normal');//normal for sync web chat
                    }
                    break;
                }
                case 'parked':
                    log('INFO', `chatTypeIcon action: ${message.action}`, message);
                    if (this.recordId !== entityid) return;
                   
                    if (message)
                    { //to ensure it is leave
                        this.setChatStatus('parked');
                    }
                    break;
                case 'gotActiveChats': {
                    log('INFO', `chatTypeIcon action: ${message.action}`, message);
                    let activeChats = this.formatActiveChats(message.payload);
                    this.renderedChatTypeIcon(activeChats)
                    break;
                }
                default:
                    
                    break;
            }
        } catch (error)
        {
            log('ERROR', `chatTypeIcon (Unexpected action): ${message.action}`, error);
        }

    }

   
    /* get isAsync , action and chatType from activeChats */
    formatActiveChats = (payload) =>
    {
        return payload.map(chat =>
        {
            let action = '';
            let isAsync = chat.kvp.find(({ key }) => key === 'GCTI_Chat_AsyncMode')?.value === "true";
            let chatTypeIcon = isAsync ? chat.kvp.find(({ key }) => key === 'engagement_type')?.value : chatType.SYNC_CHAT;

            if (chat.state === 'Completed') 
            { 
                action = isAsync ? 'parked' : '';
                chatTypeIcon = isAsync ? chatTypeIcon : chatType.SYNC_CHAT_INACTIVE;  
            }
            else action = isAsync ? 'engaged' : '';

            return {
                entityid: chat.entityid,
                action: action,   //engaged or park or undefined
                isAsync: isAsync,
                chatType: chatTypeIcon
            }
        });
    }

    /* 
        function: setChatStatus 
        description: It updates the chat type icon dynamically depending if chat is engaged(async chat) , parked , complete and normal (web)
    */
    setChatStatus = (mode) =>
    {
        try
        {
            switch (mode)
            {
                case 'engaged':
                    setChatTypeLogo(this.isAsync, this.engagementType, this, 'engaged');
                    setSessionStorageItem(STORAGE_KEY.chatType, this.engagementType);
                    setSessionStorageItem(STORAGE_KEY.isAsync, this.isAsync);
                    setSessionStorageItem(STORAGE_KEY.action, 'engaged');

                    break;
                case 'parked':
                    setChatTypeLogo(this.isAsync, this.engagementType, this, 'parked');
                    setSessionStorageItem(STORAGE_KEY.chatType, this.engagementType);
                    setSessionStorageItem(STORAGE_KEY.isAsync, this.isAsync);
                    setSessionStorageItem(STORAGE_KEY.action, 'parked');

                    break;
                case 'complete':
                    setSessionStorageItem(STORAGE_KEY.chatType, chatType.SYNC_CHAT_INACTIVE);
                    setChatTypeLogo(false, chatType.SYNC_CHAT_INACTIVE, this);
                    setSessionStorageItem(STORAGE_KEY.action);

                    break;
                case 'normal':
                    setSessionStorageItem(STORAGE_KEY.chatType, chatType.SYNC_CHAT);
                    setChatTypeLogo(false, chatType.SYNC_CHAT, this);
                    setSessionStorageItem(STORAGE_KEY.action);

                    break;

                default:
                    log('WARN', `chatTypeIcon Invalid call from setChatStatus`);
                    break;
            }
        } catch (error)
        {
            log('ERROR', 'setChatStatus', error)
        }

    }


    get iconName() 
    {
        switch (this.chatType) 
        {
            case chatType.ASYNC_CHAT:

                return iconName.ASYNC
            case chatType.ASYNC_CHAT_INACTIVE:

                return iconName.ASYNC

            case chatType.APPLE_CHAT:

                return iconName.APPLE

            case chatType.APPLE_CHAT_INACTIVE:

                return iconName.APPLE;

            case chatType.SYNC_CHAT_INACTIVE:

                return iconName.SYNC

            default:
                return iconName.SYNC
        }


    }

  
}