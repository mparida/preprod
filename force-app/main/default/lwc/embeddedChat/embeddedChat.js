/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, wire, api, track } from 'lwc';
import { APPLICATION_SCOPE, MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ONE_MESSAGE_CHANNEL from '@salesforce/messageChannel/OneMessage__c'; //FROM SALESFORCE TO CORAL MESSAGECHANNEL
import ONE_MESSAGE_USER_CHANNEL from '@salesforce/messageChannel/OneMessageComp__c'; // FROM CORAL TO SALESFORCE MESSAGE CHANNEL
import { loadStyle } from 'lightning/platformResourceLoader';
import chatCSS from '@salesforce/resourceUrl/ChatWindowStyles'; //GO TO STATIC RESOURCE TO VIEW THE CSS
import att_ChatCSS from '@salesforce/resourceUrl/ATT_ChatWindowStyles'; // CUSTOM MADE FOR AT&T

//utility
import { ACTION, splitMessageForRedaction, toggleRedactionSelectAllButton, updateRedactionWordsActions } from './utility/manualRedaction';
import { enableCoachSession} from './utility/chatSession';
import {  messageType } from './utility/constant';
import { setFeatureFlags } from './utility/featuresFlag';
import { cleanup, createSpanForSearchInputText, formatDate, handleShowChatPage } from './utility/genericFunction';
import {log , timeout} from 'c/utility';
import { formatNewbubble, handleNotTyping, handleTyping } from './utility/handleMessage';
import { disableParkLastAction, sendResumeMessageInOnem } from './utility/asyncChatFunc';


//REDUX STATE MANAGEMENT
import { Redux } from 'c/lwcReduxCoral';
import chatwindowActions from 'c/chatwindowActions'
import { CHAT_STATUS } from 'c/chatwindowConstant';

export default class ChatWindowLwc extends Redux(LightningElement) {
    @api recordId;
    agentName = "";
    showActiveChatsPage;
    @track showChatPage;
    showBottomButtons;
    //Booleans
    openChat = false;
    showNormalChat = false;
    showAgentSupervisorPage = true;
    showLeaveReasons = false;
    showConsultingChat = false;
    showConsultingInquiry = false;
    showConversation = true;
    showCustomerChat = true;
    showDetailsPage = false;
    showDetailsTab = false;
    showQueuePage = false;
    showSearchPage = false;
    showSettingsPage = false;
    showStandardResponse = false;
    showTransfer = false;
    showTransferReason = false;
    isConsulting = false;
    isTyping = false;
    showConsultingChatContent = false;
    isChatSearchOn = false;
    conferencebuttonFlag = false;
    transferFlag = true;
    consultFlag = false;
    conferenceFlag = false;
    txtLeaveReasonFlag = false;
    agentStatsFlag = false;
    disableTransferTab = false;
    isChatWithCustomerInput = true;
    showQueueModal = false;
    showProfanityPage = false;
    showSecondProfanityPage = false;
    isProfanityDetected = false;
    profanityFlag = true;
    queueWaitingTimeFlag = false;
    transferNotesFlag = false;
    profaneWordsFlag = true;
    isSubjectPositionTop = false;
    agentqueuecount = false;
    isDisplayRedactionModal = false;
    isDisplayManualRedactButton = true;
    selectAllManualRedaction = false;
    isCustomSelectManualRedaction = false;
    //Strings,Numbers
    customerName = 'Loading Chat';
    delayTimeout = null;
    chatInputField = '';
    consult_chatInputField = '';
    chatmode = 'chat';
    selectedTransferReason = '';
    selectedLeaveReason = '';
    selectedQueue = '';
    selectedSupervisor = '';
    transferringTo = '';
    transferMode = '';
    searchAgent = '';
    searchQueue = '';
    searchChat = '';
    chatAreaMode = 'chat';
    typingTimeout = null;
    typingState = 'nottyping';
    mergeFieldValues = null;
    chatNick = null;
    chatHeaderLabel = 'Customer';
    conferenceButtonTooltip = 'Conference';
    agentDestination = '';
    chatupdateStartTime = '';
    chatSubjectText = '';
    hiperMessage = '';
    subjectPosition = 'inchat';
    chatInputPlaceholder = 'This message is sent to the customer';
    customerInputPlaceholder = 'This message is sent to the customer';
    supervisorChatInputPlaceholder = 'This message is sent to the supervisor';
    sendtoCustomer = '';
    sendtoSupervisor = '';
    chatLogo = 'chatLogo';
    chatupdateChannel = '';
    redactedText = '';
    redactedbubbleid = '';
    bubblemessage = '';
    typingIdleTimeSecs = 20;
    bubbleId = 0;
    currentTextCount = 0;
    maxTextCount = 250;
    characterLimitReached = '';
    //Arrays
    activeChats = [];
    kvps = [];
    @track searchMessageList = [];
    queues = [];
    searchedStandardResponses = [];
    standardResponses = [];
    agents = [];
    teams = [];
    supervisors = [];
    searchedQueues = [];
    searchedAgents = [];
    transferReasons = [];
    leaveReasons = [];
    consultMessageList = [];
    @track messageList = [];
    firstRender = true;
    chatEnded = false;
    mergedFieldMap = [];
    activechatreversed = [];
    profaneWords = [];
    detectedProfaneWords = [];
    redactionWords = [];
    selectedManualRedactionText = new Set();
    //adding array of for redacted words
    @track listOfCurrentRedactedWords = [];
    flagForRedactedWordsInActiveChat;
    flagForRedactionModal;
    removeRedactionHighlight = false;
    //to identify if transfer chat;
    isChatTransfer= false;
    chatTransferFlag = false;
    //two-way coaching properties
    isSupervisorSession = false;
    isActiveChatForCustomer = false;
    isActiveChatForSupervisor = false;
    currentChatToCustomer = '';
    currentChatToSupervisor = '';
    twoWayCoachingMode = false;
    twoWayCoachingFlag = false;
    isSendtoCustomer = true;
    isSendtoSupervisor = false;
    isSupervisorNameFlag = false;//ATT695
    isAgentNameFlag = false
    displayTransferReasons = false;
    newHeight = '100'; //default height
    resizeableTextAreaFlag = false;  //for the resizableTextAreaFlag
    @track embeddedChatContainerClass = 'chatPage' 
    isTypingCustomer = false;
    isSupervisorTyping = false; //ATT628
    isTypingFlag = false;
    supervisorName= '';
    callbacks = {}
    /* Child component placeholder*/
    countMessageLWC; 
    resizeableTextareaLWC;
    /* End of child comp*/

    originalMsgFromHiperOrStandardResponse;
    isChatStatsEnable = false;  //ATT-99 Chat statistics
    //ATTC-74 added the timeout props once customer is inactive and received parked event
    isTimeout
    timeoutDate
    parkMessage = 'Customer is inactive. Please close this interaction.';
    isParkLastAction = false;
    isRenderedParkLastAction = false;
    subscription = null;
    runOnceForMessageList = false;
    listOfSupervisors = [];
    shouldOpenChatWindow = true; //ATTC-473
    mapStateToProps(state){
        return state.consult;
    }
    mapDispatchToProps(){
        const {consult , chatStatus} = chatwindowActions;
        return {...consult , ...chatStatus};
    }
    renderedCallback(){
        if (this.firstRender) {
            Promise.all([
                loadStyle(this, chatCSS),
                loadStyle(this, att_ChatCSS)
            ]).then(() =>
            {
                log('INFO', 'CSS Files loaded');
                this.showActiveChatsPage = true;
                this.showChatPage = false;
                this.showBottomButtons = false;
                //this.handleOpen();
            }).catch(error =>
            {
                log('ERROR', 'Rendered Callback Error: ' + error);
            });

            this.countMessageLWC = this.template.querySelector('c-count-messages'); 
            
            this.firstRender = false;
        }

        this.resizeableTextareaLWC = this.template.querySelector('c-dynamic-resize');

       //to stay the highlighted or redacted words in active chat
        const isChatActive = this.isChatActive();
        if ((isChatActive) && !this.flagForRedactedWordsInActiveChat && !this.chatEnded) {
            // this will show the current redacted words
            this.highlightRedactedWordsInActiveChat(this.listOfCurrentRedactedWords);
            
            this.flagForRedactedWordsInActiveChat = true;
        } else if ((!isChatActive) && this.flagForRedactedWordsInActiveChat) {
        
            this.flagForRedactedWordsInActiveChat = false;
        } 
        //to stay the highlighted or redacted words in modal
        if (this.isDisplayRedactionModal && !this.flagForRedactionModal) {
            // this will show the current redacted words
            const listOfRedactedWordsChildren = this.template.querySelectorAll('.txtManualRedaction span');
            const currentBubbleMessageId = this.redactedbubbleid;
            const currentListOfRedactedWords =this.listOfCurrentRedactedWords.filter(text => currentBubbleMessageId === text.bubbleMessageId);

            listOfRedactedWordsChildren.forEach((child ,index) => {
                const x = currentListOfRedactedWords.find(redact => redact.text === child.textContent && redact.id === `${this.redactedbubbleid}-${index}`);
                
                if (x?.isRedacted ) {
                    child.classList.add('highlight');
                } 
            })
            this.flagForRedactionModal = true;
        } else if (!this.isDisplayRedactionModal && this.flagForRedactionModal) {
            // Reset the flag when the modal is closed
            this.flagForRedactionModal = false;
        }

        // these are disable/enable button for redaction modal
        this.toggleRedactionClearButton();
        this.toggleRedactionSaveButton();
        toggleRedactionSelectAllButton(this);

        // this is for ATT 747 highlight the redacted words on chat transfer. This will run once only.
        const getChat = this.activeChats.find(activeChat => activeChat.entityid === this.recordId);
        const isTransfer   = getChat?.kvp.find(c => c.key === 'TRANSFER_HO');
        const isThereAnyRedactedWords =getChat?.kvp.find(c => c.key === 'Redactions');
        const listOfMessages =  this.messageList.filter(msg=> msg.UserName === this.customerName);
        if(!this.chatTransferFlag && isTransfer && isThereAnyRedactedWords && listOfMessages.length>0) {
            this.formatRedactedListofWords();
            this.getCurrentRedactedWords();
            this.isChatTransfer =false;
            this.chatTransferFlag = true;
        }else if(!isTransfer &&  !isThereAnyRedactedWords && this.messageList.length>0) {
           
            this.chatTransferFlag = false;
        }
        
        if (this.twoWayCoachingMode && this.isSupervisorSession && this.showConversation) {
            const supervisorButton = this.template.querySelector('.supervisorButtonDiv');
            const customerButton = this.template.querySelector('.customerButtonDiv');

            //this is to retain class for  button when session w/ supervisor is activated
            if (this.isActiveChatForSupervisor &&  !supervisorButton?.classList.contains('active')) {
                this.toggleSupervisorButton();
            }
            //this is to retain class for  button when session w/ customer is activated
            if (this.isActiveChatForCustomer &&  !customerButton?.classList.contains('active')) {
                this.toggleCustomerButton();
            }
        }else if(!this.isSupervisorSession && this.twoWayCoachingMode &&  this.showConversation ) {
            const textarea = this.resizeableTextareaLWC;

            if (this.isSendtoSupervisor) {
                this.toggleCustomerButton();
                textarea?.removeClasslist('customerMode');
            }
           
        }
        //to retain height of textarea
        const textarea = this.resizeableTextareaLWC;
        if (textarea) this.newHeight = textarea.offsetHeight;
        this.applyMediaQuery(); // this is to monitor the height of the window or for small screen
        
    }

    @wire(MessageContext)
    messageContext;
  
    isChatActive ()  { 
        return   !(!this.openChat || this.showDetailsPage || this.showTransfer || this.showSearchPage || this.showActiveChatsPage || this.showLeaveReasons || this.showStandardResponse || this.removeRedactionHighlight || this.showProfanityPage || this.showSecondProfanityPage || this.showTransferReason);
    }

    toggleRedactionClearButton () {
        const isThereAnyRedactedWordSelected = this.getActiveMessageForRedactionArray().some(redacted => redacted.isRedacted);
        const redactionClearAllElement = this.template.querySelector('.redactionClearAll');

        if (redactionClearAllElement) {
            const isClearButtonDisable = redactionClearAllElement.disabled;
            if (isThereAnyRedactedWordSelected && isClearButtonDisable) {  
                    redactionClearAllElement.disabled = false;
                    redactionClearAllElement.classList?.remove("disable");
                
            }else if (!isThereAnyRedactedWordSelected && !isClearButtonDisable){
                    redactionClearAllElement.disabled = true;
                    redactionClearAllElement.classList?.add("disable");
                
            }
        }
      
    }

    toggleRedactionSaveButton () {
        const isThereAnyRedactedWordSelected = this.getActiveMessageForRedactionArray().some(redacted => redacted.isForUpdate);
        const redactionSaveButton= this.template.querySelector('.redactionSave');

        if (redactionSaveButton) {
            const isSaveButtonDisable = redactionSaveButton.disabled;
            if (isThereAnyRedactedWordSelected && isSaveButtonDisable) {  
                    redactionSaveButton.disabled = false;
                    redactionSaveButton.classList.remove("disable");
                
            }else if (!isThereAnyRedactedWordSelected && !isSaveButtonDisable){
                    redactionSaveButton.disabled = true;
                    redactionSaveButton.classList.add("disable");
                
            }
        }
    }

    isValidUrl = (text) => {
        const urlPattern = /^(https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}(?::\d{2,5})?(?:\/[^\s]*)?$/;
        return urlPattern.test(text);
    }

    get messagesArray()
    {

        const removeSpacesAndNewline = this.messageList.map(chat =>
        {
            const isFromCustomer = chat.class.includes('Customer');
            const isCurrentAgent = chat.class.includes('Agent');
            const isPendingChat = chat.class.includes('pending');
            if (chat?.message && (isFromCustomer ||isCurrentAgent) && !isPendingChat)
            {
                const newMessage = chat.message?.map(mes => mes.split(/(?=\n)/)).flat();
                return {
                    ...chat,
                    message: newMessage.filter(m => m !== '')
                }
            } else if (isPendingChat && !Array.isArray(chat?.message))
            {
                const newMessage = chat.message.split(/(?=\n)/);
                return {
                    ...chat,
                    message: newMessage.filter(m => m !== ''),
                    isPendingChat: true
                }
            }
           
            return chat.UserName === 'System' ? { ...chat, isSytemMessage: true } : chat;
            
        })

        
        let newMessageList = removeSpacesAndNewline.map(chat =>
        {

            return chat.isPendingChat ? chat : {
                ...chat, message: chat.message?.map(msg =>
                {

                    let isUrl = this.isValidUrl(msg.trim());
                    let isLongText = msg.trim().length > 28;
                    return {
                        text: msg,
                        isUrl,
                        isLongText
                    }
                })
            }

        })

       
        return newMessageList;
    }

    get consultMessagesArray(){
        return this.consultMessageList;
    }

    connectedCallback(){
        super.connectedCallback();
        this.openChat = true;
        this.subjectPosition = 'inchat';
        this.isSubjectPositionTop = false;     
        //this.startTimer();
        this.subscribeToMessageChannel();
        window.addEventListener('resize', this.applyMediaQuery);  
    }
    
    errorCallback(error, stack){
        log('ERROR', 'ChatwindowLWC' , {error, stack})
    }

    disconnectedCallback() {
        this.messageList=[];
        window.removeEventListener('resize', this.applyMediaQuery);
        this.cleanupSubscription();
      }
    
    applyMediaQuery() {
        const matchHeight = window.innerHeight < 780 ;
       
        if(this.resizeableTextAreaFlag || this.twoWayCoachingMode) {
            if (matchHeight) {
                this.embeddedChatContainerClass = this.subjectPosition === 'top' ? `chatPage subPosTop small-screen` : 'chatPage small-screen';
             
            } else {

                this.embeddedChatContainerClass = this.subjectPosition === 'top' ? 'chatPage subPosTop' : 'chatPage';
               
            }
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

    cleanupSubscription() {
        // Check if there is an active subscription and unsubscribe
        if (this.subscription) {
          unsubscribe(this.subscription);
          this.subscription = null;  // Reset the subscription reference
        }
      }
    //Click conference button on transfer tab (list of supervisors/agents)
    handleConference(event){
        let dataset = event.currentTarget.dataset || {}
        if (dataset.queue)
            this.selectedQueue = dataset.queue;
        else if (dataset.supervisorqueue)
            this.selectedQueue = dataset.supervisorqueue;
            
        this.conference();
        this.selectedQueue = '';
        this.chatmode = 'conference';
        handleShowChatPage(this);
    }
    //to bind this in html onClick
    handleShowChatPage() {
        handleShowChatPage(this)
    }
    //handleConsult
    showConsultingPage(){
        try {
            this.showConsultingChat = true;
            this.isConsulting = true;
            this.showConsultingInquiry = false;
            this.showConversation = true;
            this.chatmode = 'consulting';
            this.showCustomerChat = true;
            this.showTransfer = false;
            this.showNormalChat = true;
            this.consult();
            this.getSelector('.transferTab').classList.remove('active');
            this.getSelector('.chatTab').classList.add('active');
            this.getSelector('.transferTab').classList.remove('active');
            this.getSelector('.detailsTab').classList.remove('active');
            
            this.getSelector('.searchTab').classList.remove('active');
            this.setChatAreaClass(this.chatmode);
            this.setTransferTabDisabled();
            
        } catch (error) {
            log('ERROR', 'ChatWindowLWC showConsultingPage', error.message);
        }
        
    }

    handleCloseRedactionModal(){
        this.isDisplayRedactionModal = false;
        this.selectedManualRedactionText.clear();
        const bubbleId = this.redactedbubbleid;
        const forRevertedBack = this.listOfCurrentRedactedWords.filter(redact =>  redact.pending && bubbleId === redact.bubbleMessageId);
        this.updateRedactionWords({action:ACTION.CLOSE , payload:forRevertedBack});
    }
    
    handleDropConsult(){
        this.dropConsult();
        let transferTab = this.getSelector('.transferTab');
        if(transferTab){
            transferTab.classList.remove('disableTransferTab');
        }

        let consultationdiv = this.getSelector(`[data-id='consultation']`);
        if(consultationdiv){
            consultationdiv.classList.add('disableConsultationContent');
        this.getSelector('.consultChatContent').classList.add('completed');
        this.getSelector('.consult_chatul').classList.add('fullheight');
        }
        
        this.chatEnded = false;

        const event = new ShowToastEvent({
            title: 'Success',
            variant: 'success',
            message:
                'Drop consult successfully',
        });
        this.dispatchEvent(event);
    }

    handleClickManualRedactionText(event){
        try {

            const selectedWord = event.currentTarget.dataset.redactedwordtextarea;
            const currentId = event.currentTarget.dataset.index;

            if(!this.isCustomSelectManualRedaction){
                let selection = window.getSelection(),
                    text = selection.anchorNode.data,
                    index = selection.anchorOffset,
                    symbol = "a";
                // eslint-disable-next-line no-useless-escape
                while(/[a-zA-z0-9а-яА-Я!@#$&%()`.+,\/\"\-]/.test(symbol)&&symbol!==undefined){
                    symbol = text[index--];
                }
                index += 2;
                let word = "";
                symbol = "a";
                // eslint-disable-next-line no-useless-escape
                while(/[a-zA-z0-9а-яА-Я!@#$&%()`.+,\/\"\^\&\*\-]/.test(symbol) && index<text.length){
                    symbol = text[index++];
                word += symbol;
                }

                if(word.toString().trim() !== ''){
                    this.selectedManualRedactionText.add(word.toString());
                    const forUpdate = this.listOfCurrentRedactedWords.filter(redact => redact.id === currentId );
                    this.updateRedactionWords({action:ACTION.REDACT , payload: forUpdate})
                   
                }else if(selectedWord !== '') {
                    this.selectedManualRedactionText.add(selectedWord);
                    const forUpdate = this.listOfCurrentRedactedWords.filter(redact => redact.id === currentId );
                    this.updateRedactionWords({action:ACTION.REDACT , payload: forUpdate})
                }

                event.currentTarget.classList.add('highlight');
            }
        } catch (error) {
            log('ERROR','Selected Word Error: ',error.message);
        }
    }


    enableCustomSelectManualRedaction(){
        this.isCustomSelectManualRedaction = true;
    }

    handleCustomSelectionManualRedaction(){
        try {
            if(this.isCustomSelectManualRedaction){
                let txt = '';
                if (window.getSelection) {
                    txt = window.getSelection();
                } else if (window.document.getSelection) {
                    txt =window.document.getSelection();
                } else if (window.document.selection) {
                    txt = window.document.selection.createRange().text;
                }
                //if(txt.trim() != '' && txt.length > 1){
                    this.selectedManualRedactionText.add(txt);
                    log('INFO','Custom Selection success of Manual Redaction');
                //}
            }
        } catch (error) {
            log('ERROR','Custom Selection of Manual Redaction: ' ,error.message);
        }
          
    }

    //Event on Clicking leave button
    handleLeave(){
        try {
            this.twoWayCoachingMode = false;
            this.leave();
            this.showLeaveReasons = false;
            this.showQueueModal = false;
            this.removeRedactionHighlight = true;
            this.getSelector('.transferTab')?.classList.remove('active');
            this.getSelector('.backToActiveChatButton')?.classList.remove('disable');
            this.getSelector('.chatTabWrap')?.classList.remove('disable');
            handleShowChatPage(this);
            const superPl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: 'Agents' };
            log('INFO', JSON.stringify(superPl));
            publish(this.messageContext, ONE_MESSAGE_CHANNEL, superPl);
        } catch (error) {
            log('ERROR','Handle Leave Failed: ' ,error.message)
        }
    }


    
    handleClickRemoveRedactedText(event){
        const idForRemove = event.currentTarget.dataset.index;
       
        try {
            let removeButton = event.target;
            let wordtoRemove = removeButton.dataset.redactedword;
            let id = removeButton.dataset.index;
            //this.template.querySelector(`[data-redactedwordtextarea="`+ wordtoRemove +`"]`).classList.remove('highlight');
            this.template.querySelector(`[data-index="${id}"]`).classList.remove('highlight');
            this.selectedManualRedactionText.delete(wordtoRemove);
            const forRemove = this.listOfCurrentRedactedWords.filter(redact => redact.id === idForRemove);
            this.updateRedactionWords({action:ACTION.REMOVE , payload:forRemove});
        } catch (error) {
            log('ERROR','Remove Redacted Text: ',error.message);
        }
        
    }

    handleSend(e){
        const textarea =(this.resizeableTextAreaFlag || this.twoWayCoachingMode) && this.resizeableTextareaLWC;
        const currentMessage =  textarea && textarea.getValue();
       
        const event = {
            keyCode: e.detail?.keyCode ?? e.keyCode,
            shiftKey: e.detail?.shiftKey ?? e.shiftKey,
            name: e.detail?.name ??  e.target.dataset.name,
            target : {
                value  :e.detail?.target?.value ?? e.target.value ?? currentMessage ?? ''
             }
        }
        
        if(currentMessage.length === 0) this.countMessageLWC.setMessageSourceType(messageType.FREEHAND);

        //Message Handler for Normal and Conference Chats Else part is for Consultation and Conference
        if ((event.keyCode === 13 && !event.shiftKey && this.isChatWithCustomerInput === true) || 
            event.name === "sendChatButton"){

            let msg = (this.resizeableTextAreaFlag || this.twoWayCoachingMode) ? currentMessage :this.getSelector('.chatInputField').value ;
            let messageSource = this.countMessageLWC?.getMessageSourceType({...this.originalMsgFromHiperOrStandardResponse , currentMessage:currentMessage});
            
            if(event.keyCode === 13 && msg.length === 1) {
                if (this.resizeableTextAreaFlag) {
                    textarea?.clearValue();
                 
                }
                if (this.getSelector('.chatInputField')) {
                    this.getSelector('.chatInputField').value = null;
                    this.chatInputField = "";
                }
                return;
            }//hit enter on to send message even there is no message
            if (msg.length > 0 && msg.trim() !== '') {
                
                if(!this.isActiveChatForSupervisor) {
                    if(this.profanityFlag === true){
                        //this.getProfanities();
                        this.profanityFilter(msg);
                    }
                    
                    if(this.isProfanityDetected){
                        return;
                    }
                    
                    this.profanityAttempts = 0;
                }
                
                if (this.getSelector('.chatInputField')) {
                    this.getSelector('.chatInputField').value = null;
                    this.chatInputField = "";
                } 
                
                this.processPendingMessages()
                if(this.twoWayCoachingMode){
                            
                    if(this.isSendtoCustomer){
                        
                        const payload = { action: 'send', entityid: this.recordId, text: msg, agentName: this.agentName, destination: 'All' ,messageSource};
                        this.toOnemLMS(payload);

                        this.sendtoCustomer = '';
                        this.currentChatToCustomer = '';
                        
                    }
                    else if(this.isSendtoSupervisor){
                    
                        const payload = { action: 'send', entityid: this.recordId, text: msg, agentName: this.agentName, destination:'Agents' , messageSource : '', };
                        this.toOnemLMS(payload);

                        this.sendtoSupervisor = '';
                        this.currentChatToSupervisor = '';
                    }
                    
                    this.isTyping = false;

                        const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: this.isSendtoSupervisor ? 'Agents':'All' };
                        publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                        log('INFO',`ChatwindowLWC publish: nottyping`, JSON.parse(JSON.stringify(pl)));
                        textarea.clearValue(); // this will clear out the text value in textarea
                      
                        this.scrollDown();
                        
                    return;
                }
                //Two Way Coaching
                
                const payload = { action: 'send', entityid: this.recordId, text: msg, agentName: this.agentName, destination: 'All' ,messageSource};
               
               
                
                if(this.resizeableTextAreaFlag){
                   
                    textarea?.clearValue();
                  
                } 

                this.toOnemLMS(payload);
                this.isTyping = false;

                const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: 'All' };
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                this.scrollDown();
               
                return;
                
            }
        }
        else if((event.keyCode === 13 && !event.shiftKey  && this.isChatWithCustomerInput === false) || event.name === "sendChatButtonConsult"){
            let msg = this.getSelector('.consult_chatInputField').value.trim();
            if (msg.length > 0) {
                this.processPendingMessages();
                this.getSelector('.consult_chatInputField').value = null;
                this.consult_chatInputField = "";
                const payload = { action: 'send', entityid: this.recordId, text: msg, agentName: this.agentName, destination: 'Agents' };
                log('INFO', `ChatwindowLWC action: handleSend`, JSON.parse(JSON.stringify(payload)));
                
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
                this.consult_scrollDown();
            }
        }

        //Typing Action
        if((event.name === "chatTextArea" || event.name === "chatTextAreaConsult") && 
            event.target.value.length > 0 && !this.isTyping && currentMessage.trim().length){
            
            if(this.isConsulting || this.isSupervisorSession) {
                const pl = { action: 'typing', entityid: this.recordId, who: this.agentName, destination: this.isSendtoSupervisor ? 'Agents' : 'All' };

                if(this.isSendtoCustomer) this.currentChatToCustomer = currentMessage;
                if(this.isSendtoSupervisor) this.currentChatToSupervisor = currentMessage;

                log('INFO','ChatwindowLWC publish: typing',  pl);
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                this.isTyping = true;
            }
            else {
                const pl = { action: 'typing', entityid: this.recordId, who: this.agentName, destination: 'All' };
                log('INFO','ChatwindowLWC publish: typing',  pl);
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                this.isTyping = true;
            }
        }
        else if((event.name === "chatTextArea" || event.name === "chatTextAreaConsult") && 
               currentMessage.trim() === "" && this.isTyping) {
            
                if(this.isConsulting || this.isSupervisorSession) {
                    const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: this.isSendtoSupervisor ? 'Agents' : 'All'};
                    log('INFO','ChatwindowLWC publish: nottyping',  pl);
                    publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                    this.isTyping = false;
                }
                else {
                    const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: 'All' };
                    log('INFO','ChatwindowLWC publish: nottyping',  pl);
                    publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                    this.isTyping = false;
                }
        }else if(currentMessage.trim() === "") {
            if(this.isSendtoCustomer) this.currentChatToCustomer = currentMessage;
            if(this.isSendtoSupervisor) this.currentChatToSupervisor = currentMessage;
            if (this.isSupervisorSession) {
                const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: this.isSendtoSupervisor ? 'Agents' : 'All'};
                log('INFO','ChatwindowLWC publish: nottyping',  pl);
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                this.isTyping = false;
            }
            
        }
    }
    //Message to publish
    async handleMessage(message){
        try {
            
            switch (message.action)
            {
                case 'newbubble': {
                    if (!this.isValidMessage(message.entityid) || !message) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
        
                    const {payload} = message
                    
                    // Remove pending classes
                    if(message.payload.classes.includes('Agent')){
                        this.removePendingClasses();
                    }
    
                    let tempmessageList = this.messageList;
                    let consult_tempmessageList = this.consultMessageList;
                    let newMessage = formatNewbubble(message.payload, this.listOfSupervisors);

                    this.agentDestination = message.payload.destination;
                    //Consultation Else normal chat
                    if(message.payload.destination === 'Agents' && (this.chatmode === 'consulting' || this.chatmode === 'consultee')){

                        if(this.twoWayCoachingMode){
                            tempmessageList = [...tempmessageList, newMessage];
                            this.messageList = Object.assign([], tempmessageList);
                            this.searchMessageList = this.messageList;
                            log('INFO', 'Resume_chat');
                            this.toOnemLMS({action:'resume_chat' ,entityid:this.recordId,  messageList:this.messageList});
                            if(this.showChatPage){
                                this.scrollDown();
                            }
                        }
                        else{
                            consult_tempmessageList.push(newMessage);
                            this.consultMessageList = Object.assign([], consult_tempmessageList);
                            if(this.showConsultingChatContent){
                                this.consult_scrollDown();
                            }
                        }
                         
                    }
                    else{
                        tempmessageList = [...tempmessageList, newMessage];
                        this.messageList = Object.assign([], tempmessageList);
                        this.searchMessageList = this.messageList;
                
                        if (message.payload.destination === 'All' && message.payload.who === 'System') this.toOnemLMS({action:'resume_chat' ,entityid:this.recordId,  messageList:this.messageList});
                        
                        if(this.showChatPage){
                            this.scrollDown();
                        }
                    }

                    if(payload.classes === 'Agent Me')  this.agentName = payload.who
                    
                    this.getActiveChats();
                    this.setTextAreaFocus('chatInputField');
                  
                    break;
                }
                case 'opened':
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    if (!this.isValidMessage(message.entityid) || !message) return;
                    
                   
                    if(message.success){
                        this.chatNick = message.agentName;
                       
                        this.activateChat(message.entityid);
                        handleShowChatPage(this);
        
                        this.getProfanities();   
                    }
                    
                   
                    if(!this.showChatPage) this.getActiveChats();
                    this.isTimeout= false;
                   
                    break;
                case 'gotTransferList':
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    try {
                        this.teams = message.agentSkills;
                        this.searchedAgents = this.teams;
                        if(this.isSupervisorNameFlag) 
                        {
                           
                            this.supervisors = message.supervisors.map(supervisor => ({...supervisor, disable: supervisor.state === "Ready" ? 'slds-m-left_xx-small' :'slds-m-left_xx-small' })); //this will add disableTransfer props if there is available agents true if not false
                        }
                        else 
                        {
                            this.supervisors = message.supervisorQueueDetails.map(supervisor => ({...supervisor, disable: parseInt(supervisor.numAgents,10) ? 'slds-m-left_xx-small' :'slds-m-left_xx-small disable' })); //this will add disableTransfer props if there is available agents true if not false
                        }

                        if (this.isAgentNameFlag) 
                        {
                            this.queues = message.agents.map(queue => ({...queue, disable: 'slds-m-left_xx-small'}));
                        }
                        else
                        {
                           
                            this.queues = message.queueDetails.map(queue => ({...queue, disable: parseInt(queue.numAgents,10) ? 'slds-m-left_xx-small' :'slds-m-left_xx-small disable' }));
                          
                        } 

                        this.searchedQueues = this.queues;
                        this.transferReasons = message.transferReasons;
                       
                    } catch (error) {
                        
                        log('ERROR', `chatwindowLWC action: ${message.action}`, message);
                    }
                    break;
                case 'gotActiveChats':{
                    
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.activeChats = message.payload;
                    let getActiveChatsOnly = message.payload.filter(chat => chat.state !== "Completed") ?? [];
                    if(getActiveChatsOnly.length === 1 && this.shouldOpenChatWindow) handleShowChatPage(this); //to open the chatwindow when there single instance of chat. 
                    if (!this.listOfSupervisors.length) this.getSupervisorList();
                    this.scrollDown()
                    //
                    break;
                }
                case 'chatupdate':{
                    if (!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    if(!this.profaneWords.length) {
                        this.getProfanities()
                    }
                    setFeatureFlags(this , message)
                    this.agentName = message?.whoAmI ?? '';
                    this.kvps = message.payload.kvp;
                    this.mergedFieldMap = message.mergeFieldMapping;
                    this.leaveReasons = message.leaveReasons;
                    this.customerName = message.payload.name;
                    this.chatmode = message.payload.mode;
                    this.chatupdateStartTime = message.started;
                    this.twoWayCoachingFlag = message.payload.twowaycoaching ?? false;
                    this.chatSubjectText = message.subject;
                    this.chatupdateChannel = message.channel;
                    this.chatLogo = 'chatLogo smsIcon ' + this.chatupdateChannel;

                    if(this.subjectPosition === 'top'){
                        try {
                            this.isSubjectPositionTop = true;
                            this.getSelector('.customerNameDiv')?.classList.add('chatSubjectHeader');
                            
                        } catch (error) {
                            log('ERROR', `chatwindowLWC action: ${message.action}`, error);
                        }
                    }
                    else{
                        try {
                            this.isSubjectPositionTop = false;
                            this.getSelector('.customerNameDiv')?.classList.remove('chatSubjectHeader');
                            if(this.chatmode === 'consulting' || this.chatmode === 'consultee'){
                                this.getSelector('.multipleTab')?.classList.add('inChat');
                            }
                        } catch (error) {
                            log('ERROR', `chatwindowLWC action: ${message.action}`, error);
                        }
                        
                        
                    }
                    
                    if(this.chatmode === "complete" || message.payload.asyncAgentClosed){
                        const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: 'All' };
                      
                        publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                        cleanup(this);
                        this.setChatCompleted(true);
                        log('INFO', 'Stop typing ChatCompleted' , pl); 
                        this.props.setChatStatus(CHAT_STATUS.COMPLETE);           
                    }
                    else{
                        try {
                            let resumeChat = message.payload?.coralLastAction === "PARK";
                            if(resumeChat) {
                                this.isParkLastAction = true;
                                log('INFO', 'Chat was resumed from PARK',  message.payload.kvp.find(({ key }) => key === 'CORAL_LASTACTION')?.value)
                            }
                            this.setChatCompleted(false);
                            this.props.setChatStatus(CHAT_STATUS.INPROGRESS); 
                            this.isTimeout = false;
                            this.onMatchMsgHistoryToLWCMsg(message.payload?.numChatHistory);
                        } catch (error) {
                            log('ERROR', `chatwindowLWC action: ${message.action}`, error);
                        }
                        
                    }
                    
                    if(this.chatmode === 'consultee'){
                        this.isConsultee();
                    }
                   
                    this.handleConsultContent();
                    enableCoachSession(this, message.payload.twowaycoaching);
                   
                    break;
                }
                case 'gotStandardResponses':
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.standardResponses = message.payload.menu;
                    this.searchedStandardResponses = this.standardResponses;
                    
                    break;
                case 'left':
                    if (!this.isValidMessage(message.entityid) || !message) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.setChatCompleted(true);
                    
                    if (this.chatNick !== message.who)
                    {
                        //this.getSelector('.typingWrapper').classLisst.add('hide');
                        this.isSupervisorTyping = false
                        this.isTypingCustomer = false;
                    }
                    
                    this.removeRedactionHighlightWhenLeftChat();
                    disableParkLastAction(this);
                    this.chatEnded = true;
                    this.profanityAttempts = 0;
                    break;
                case 'parked':
                    if (!this.isValidMessage(message.entityid) || !message) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.setChatCompleted(true);
                    
                    if (this.chatNick !== message.who)
                    {
                        //this.getSelector('.typingWrapper').classLisst.add('hide');
                        this.isSupervisorTyping = false
                        this.isTypingCustomer = false;
                    }
                    this.removeRedactionHighlightWhenLeftChat();
                    disableParkLastAction(this);
                    this.chatEnded = true;
                    this.profanityAttempts = 0;
                    this.isTimeout = message.timeout && message.success;
                    this.parkMessage = message.timeout ? message?.message : '';
                    this.timeoutDate = message.timeout && message.success ? formatDate(new Date()) : '';
                    break;
                case 'setTabName':
                    if(!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.invokeWorkspaceAPI('setTabLabel', {
                        tabId: message.tabid,
                        label: message.label
                    });
                    break;
                case 'setTabHighlighted': {
                    if(!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    let req = { tabId: message.tabId, highlighted: message.highlighted };
                    if (message.state)
                    {   
                        req.options = { pulse: (message.pulse ? true : false), state: message.state };
                        this.shouldOpenChatWindow = message.state === 'success'; //ATTC-473

                        if (message.state === 'success' && message.highlighted) handleShowChatPage(this);
                       
                        if (message.state === 'success' && !this.highlightSuccessTabOnce && req.highlighted){
                            req.highlighted = true;
                            this.highlightSuccessTabOnce = true;
                        } else if (message.state === 'error' || message.state === 'warning') req.highlighted = true;
                        
                    }
                    this.invokeWorkspaceAPI('setTabHighlighted', req);
                    sendResumeMessageInOnem(this);
                    break;
                }
                case 'showChatPage':
                    if(!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    if(this.customerName === 'Loading Chat'){
                        this.getAllChatBubbles(true);
                        
                    }
                    this.getProfanities()
                    handleShowChatPage(this);
                    break;
                case 'gotChatHistory':
                    if(!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.openChat = true;
                    this.messageList = message.history;
                    
                    break;
                case 'reset':
                    if(!this.isValidMessage(message.entityid)) return;
                    this.messageList = message.messageList;
                    log('INFO', `chatwindowLWC action: ${message.action}`,{messageList:message.messageList});
                    break;
                case 'typing':
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    if(this.recordId!==message.entityid) return;
                    if(this.chatNick !== message.who) handleTyping(this,message);
                    break;
                case 'nottyping':
                    if(!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    if(this.chatNick !== message.who) handleNotTyping(this,message);
                    break;
                case "sent":
                    break;
                case 'ranApex':
                    if (message.context) {
                        let callback  = this.callbacks[message.context];
                        if (callback) callback(message.result)
                    }
                    break;
                case 'textinput': {
                    if(!this.isValidMessage(message.entityid)) return;
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.hiperMessage = message.text;       
                    if (this.resizeableTextAreaFlag || this.twoWayCoachingMode)
                    {
                        const textarea = this.resizeableTextareaLWC;
                        textarea?.setValue(this.hiperMessage)
                    } else
                    {
                        this.chatInputField = '';
                        this.chatInputField = this.hiperMessage;
                    }

                    if (this.countMessageLWC)
                    {
                        this.originalMsgFromHiperOrStandardResponse = { textInput: message.text, from: messageType.HIPER };
                        this.countMessageLWC?.setMessageSourceType(messageType.HIPER);
                    }
                    break;
                }
                case 'gotProfanities':
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.profaneWords = message.words;
                    break;
                case 'checkBubbles': {
                    if(!this.isValidMessage(message.entityid)) return;
                    let countOfMessages = this.messageList.filter(msg => !msg?.isConversationSummary).length;
                    if(countOfMessages <= 2) { //attc358
                        this.getAllChatBubbles();
                    }
                    break;
                }
                case 'cleared': {
                    if(!this.isValidMessage(message.entityid)) return;
                    this.messageList = [];
                    break;
                }
                case 'gotSupervisorList': {
                    log('INFO', `chatwindowLWC action: ${message.action}`, message);
                    this.listOfSupervisors =  message.supervisors;
                    break;
                }
                default:
                    break;
            }
            
        } catch (error) {     
            log('ERROR', `chatwindowLWC action: ${message.action}`, error);
        }
        
    }
    /* 
        method toOnemLMS
        description: send action with payload to Onemessage LMS coral widget
        parameters:
            payload-> atleast required the "action" properties
     */
    toOnemLMS(payload) {
        try {
            if (!payload?.action) throw Error('Action is required.'); //return error if no action found in the payload

            publish(this.messageContext, ONE_MESSAGE_CHANNEL , payload);
            log('INFO', `To onemessageLMS action: ${payload.action}.`, JSON.parse(JSON.stringify(payload)));

        } catch (error) {
            log('ERROR', `To onemessageLMS action: ${payload.action}.`, error)
        }
        
    }

    isValidMessage(id) {
        return id === this.recordId
    }

    onMatchMsgHistoryToLWCMsg(numChatHistory) { //ATTCH-358 AC2
        if(!numChatHistory) return;
        const messageListCount = this.messageList.length;
        if (numChatHistory !== messageListCount && !this.runOnceForMessageList) {
            log('INFO', 'Chatwindow onMatchMsgHistoryToLWCMsg getAllChatBubbles', );
            this.getAllChatBubbles();
            this.runOnceForMessageList = true;
        }
    }

    checkDuplicateMessage(bubbleid) {
        const isDuplicate = this.messageList.some(newbubble => newbubble.bubbleid === bubbleid);
        if (isDuplicate) {
            log('WARN', `chatwindowLWC: Found duplicate will reset the all bubbles`, {});
            this.getAllChatBubbles();
            return false;
        }

        return true;

    }

    getAllChatBubbles(fromShowChatPage) {
        const payload = {
            action:'getAllChatBubbles',
            entityid: this.recordId ,
            fromShowChatPage: fromShowChatPage,
        }

        this.messageList = []; //clear messageList

        log('INFO', 'Chatwindow getAllChatBubbles',payload );
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
    }

    handleOpen(){
        this.openChat = true;
        const payload = {   action: 'open', 
                            entityid: this.recordId 
                        };
        log('INFO', 'On Open event pub',payload );
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
    }
    
    handleShowActiveChatsPage(){
        this.showSettingsPage = false;
        this.showChatPage = false;
        this.showConversation = false;
        this.showTransfer = false;
        this.showSearchPage = false;
        this.showDetailsPage = false;
        this.showStandardResponse = false;
        this.showConsultingInquiry = false;
        this.showActiveChatsPage = true;
        
        timeout(() => {
            if(this.showBottomButtons){
                let agentStats = this.getSelector('.agentStatsWrapper');
    
                if(agentStats){
                    if(!this.agentStatsFlag){
                        agentStats.classList.add('hideAgentStats');
                    }
                }
            }
        });
        
    }
    
    handleShowConsultInquiry(event){
        this.showConsultingInquiry = true;
        this.showTransfer = false;
        this.showProfanityPage = false;
        let dataset = event.currentTarget.dataset || {}
        if (dataset.queue)
            this.selectedQueue = dataset.queue;
        else if (dataset.supervisorqueue){
            this.selectedQueue = dataset.supervisorqueue;
        }
       
        log('ERROR', 'Handle Show Consult Inquiry Error', {});
    }
    
    handleShowTransferReason(event){//Click transfer button of the selected queues
        let dataset = event.currentTarget.dataset || {}
       
        if(dataset.queue)
        {
            let agentName = dataset.agentname || '';
            this.selectedQueue = dataset.queue; 
            this.transferringTo = this.isAgentNameFlag ? `Transferring to Agent: ${agentName}`: `Transferring to Supervisor Queues: + ${dataset.queue}`;
        }
        else if (dataset.supervisorqueue)
        {
            let supervisorName = dataset.supervisorname || '';
            this.selectedQueue = dataset.supervisorqueue;
            this.transferringTo = this.isSupervisorNameFlag ? `Transferring to Supervisor: ${supervisorName}`: `Transferring to Supervisor Queues: + ${dataset.supervisorqueue}`;
        }
        else{
            log('ERROR', 'Unknown event received',{});
            return;
        }
        this.showTransferReason = true;
        this.showTransfer = false;

        this.setTextAreaFocus('txtTransferReason');
       
    }

    handleCloseConsultingInquiry(){
        this.showConsultingInquiry = false;
        this.showTransfer = true;
    }

    handleSearch(){
        this.showConversation = false;
        this.showTransfer = false;
        this.showSearchPage = true;
        this.showDetailsPage = false;
        this.showTransferReason = false;
        this.showStandardResponse = false;
        this.showConsultingInquiry = false;
        this.showLeaveReasons = false;
        this.showProfanityPage = false;
        
        //this.chatInputField = this.getSelector('.chatInputField').value.trim();
        this.getSelector('.chatTab').classList.remove('active');
        this.getSelector('.transferTab').classList.remove('active');
        this.getSelector('.searchTab').classList.add('active');

        if(this.showDetailsTab){
            this.getSelector('.detailsTab').classList.remove('active');
        }
      
        this.searchMessageList = this.messageList.filter(item => !item.class.includes('pending'))

        this.searchMessageList= this.searchMessageList.map(chat => {
            return {
                ...chat,
                message: chat.message.join(" ")
            }
        });
        
        timeout(()=>{
            this.setInputFocus('searchChatInput');    
        }) 
    }

    handleDetails(){
        this.showChatPage = true;
        this.showConversation = false;
        this.showTransfer = false;
        this.showSearchPage = false;
        this.showTransferReason = false;
        this.showStandardResponse = false;
        this.showConsultingInquiry = false;
        this.showLeaveReasons = false;
        this.showDetailsPage = true;
        this.showProfanityPage = false;
        
        this.getSelector('.chatTab').classList.remove('active');
        this.getSelector('.transferTab').classList.remove('active');
        this.getSelector('.searchTab').classList.remove('active');
        if(this.showDetailsTab){
            this.getSelector('.detailsTab').classList.add('active');
        }
        
    }

    handleAgentStatsPage(){
        this.showChatPage = false;
        this.showActiveChatsPage = false;
        this.showBottomButtons = true;
        this.showSettingsPage = true;
        this.showTransferReason = false;
        this.getSelector('.chattabbottom').classList.remove('active');
        this.getSelector('.agentstatstab').classList.add('active');
    }

    handleShowAgentSupervisortab(){
        try {
            this.showTransfer = true;
            this.showAgentSupervisorPage = true;
            this.showQueuePage = false;
            this.showTransferReason = false;
            
            

            timeout(()=>{
                this.getSelector('.agentsupervisortab').classList.add('slds-is-active');
                if(this.getSelector('.queuetab').classList.contains('slds-is-active')){
                    this.getSelector('.queuetab').classList.remove('slds-is-active');
                }
                this.setInputFocus('searchAgent');
            },100)
            
            
            
            
        } catch (error) {
            log('ERROR', 'Show Agent Supervisor Error: ' ,error.message);
        }
        
    }

    handleShowQueuetab(){
        try {
            this.showTransfer = true;
            this.showAgentSupervisorPage = false;
            this.showQueuePage = true;
            this.showTransferReason = false;
            this.getSelector('.agentsupervisortab').classList.remove('slds-is-active');
            this.getSelector('.queuetab').classList.add('slds-is-active');
            timeout(()=>{ this.setInputFocus('searchQueue');    })
           
           
            
        } catch (error) {
            log('ERROR', 'Show Queue Tab Error: ' ,error.message);
        }
        
    }

    handleCloseTransferReason(){
        try {
            this.showTransfer = true;
            this.showTransferReason = false;
            this.getSelector('.agentsupervisortab').classList.add('slds-is-active');
            this.getSelector('.queuetab').classList.remove('slds-is-active');
        } catch (error) {
            log('ERROR', 'Close Transfer Reason Error: ', error.message);
        }
        
    }

    handleToggleClick(event) {
        let caret = event.target;

        if (caret.iconName === 'utility:down') caret.iconName = 'utility:up';
        else caret.iconName = 'utility:down';

        let responseContainer = caret.closest('.responseContainer');
        for(let i = 0; i < responseContainer.length; i++){
            if(caret.iconName === 'utility:down'){
                responseContainer[i].classList.add('folder-open');
                responseContainer[i].classList.remove('folder-open');
            }
            if(caret.iconName === 'utility:up'){
                responseContainer[i].classList.add('folder-close');
                responseContainer[i].classList.remove('folder-open');
            }
        }

        let standardResponseschildren = caret.closest('.responseContainer').children;
        for(let i = 0; i < standardResponseschildren.length; i++){
            if(standardResponseschildren[i].tagName === 'UL' && caret.iconName === 'utility:down'){
                standardResponseschildren[i].style.display = 'block';
            }
            if(standardResponseschildren[i].tagName === 'UL' && caret.iconName === 'utility:up'){
                standardResponseschildren[i].style.display = 'none';
            }
        }
    }


    returnSearchChats(value , searchInput) {
        let messagetobematched = '';                
        messagetobematched = value.message.join(" ").trim();
        const re = new RegExp(searchInput, 'gi');
        let result = messagetobematched.match(re);
        
        return result;
    }

   

    highlight(text) {
        timeout(()=> {
            if (text.length > 0) {
                let searchedChat = this.template.querySelectorAll('.searchedChat');
                searchedChat.forEach(chat => {
                    createSpanForSearchInputText(chat,text);
                });
              }
        },350) //delay is important because handleSearchChat has debouncing. Highglight will loose if you remove the delay.  
      }
    

    handleSearchChat(event){
       
        try {
          
            this.searchMessageList = [];
            let searchInput = event.target.value;

            timeout(()=>{
                try
                {
                    this.searchMessageList = this.messageList.filter((item) => !item.class.includes('pending'));
    
                    this.searchMessageList = this.searchMessageList.filter((val) => this.returnSearchChats(val, searchInput));
                    this.searchMessageList = this.searchMessageList.map(chat =>
                    {
                        return {
                            ...chat,
                            message: chat.message.join(" ")
                        }
                    });
                } catch (error)
                {
                    log('ERROR', 'ErrorMessage: ',error.message);
                }
            },250)

           
            this.highlight(searchInput);
          
           
           

        } catch (error) {
            log('ERROR', 'Search Chat Error Message: ',error.message);
        }

        
    }
    handleClearAllManualRedaction(){
        try {
            this.isCustomSelectManualRedaction = false;
            const highlightedItems = this.template.querySelectorAll(".txtManualRedaction .highlight");

            highlightedItems.forEach((value) => {
                value.classList.remove('highlight');
            });
            this.selectedManualRedactionText.clear(); //this is not need once edit redaction modal is apply. DD
            this.updateRedactionWords({action:ACTION.CLEAR_ALL})
        } 
        catch (error) {
            this.log('ERROR','Clear All Manual Redaction Failed: ' + error.message);
        }
        
    }

    handleSearchStandardReponse(event){
        let searchInput = event.target.value.trim();

        if(searchInput.length > 0){
            window.clearTimeout(this.delayTimeout);
            //disable eslint from here because lwc need some delay to get the standard response from tagus
            //eslint-disable-next-line @locker/locker/distorted-window-set-timeout
            this.delayTimeout = setTimeout(()=>{
                this.searchedStandardResponses = this.filterData(this.standardResponses, function(item) {
                    let messagetobematched = '', label = item.label, value = item.value;
                    
                        if(label){
    
                            if(label.toLowerCase().includes(searchInput.toLowerCase())){
                                messagetobematched = label;
                            }
                            
                        }
    
                        if(value){
                            if(value.toLowerCase().includes(searchInput.toLowerCase()) && item.type === 'Text'){
                                messagetobematched = value;
                            }
                            
                        }
    
                    const re = new RegExp('\\b'+searchInput, 'gi');
                    return messagetobematched.match(re);
    
                });
                this.openAllSearchedStandardResponses();
            },100)
        
        }
        else{
            this.searchedStandardResponses = this.standardResponses;
        }
        
    }

    handleSearchAgent(event){
        // Debouncing this method: do not update the reactive property as
        // long as this function is being called within a delay of 300 ms.
        // This is to avoid a very large number of Apex method calls.
        //this.searchStandardResponse = [];
        
        let searchInput = event.target;
        timeout(() => {
            if (!searchInput.value) {
                this.searchedAgents = this.teams;
                for (let i = 0, supers = this.template.querySelectorAll('ul.super .groupList'); i < supers.length; i++)
                    supers[i].style.display = ''
            } 
            else {
                const re = new RegExp('\\b' + searchInput.value, 'i');
                this.searchedAgents = this.filterData(this.teams, function(item) {
                    let messagetobematched = '';
                    messagetobematched = item.name;
                    return messagetobematched.match(re);
                });
                for (let i = 0, supers = this.template.querySelectorAll('ul.super .groupList'); i < supers.length; i++){
                    let node = supers[i];
                    node.style.display = re.test(node.textContent) ? '' : 'none'
                }
            }
        }, 300);
        
        
    }

    handleShowRedactionModal(event){
        this.isDisplayRedactionModal = true;
        this.selectAllManualRedaction = false;
        this.redactedbubbleid = event.currentTarget.dataset.bubbleid;
        this.bubblemessage = event.currentTarget.dataset.msg;
        this.redactionWords = this.bubblemessage.split(',');

        this.createForRedactionWords(); //this will store all the words that is for redaction;


    }

    handleShowStandardResponse(){
        if(!this.chatEnded){
            try {
                // Merge Fields
                // Hard coded for ATT to find the KVP value to use when calling the Apex class
                // This should be parameterized at a later stage. 
                let chatTranscript = this.recordId;

                if(this.kvps.length > 0)
                {
                    for(let i = 0; i < this.kvps.length; i++)
                    {
                        if(this.kvps[i].key === 'SFChatID' && this.kvps[i].value.length > 0)
                            chatTranscript = this.kvps[i].value;
                    }
                }

                this.getMergeFieldValues(chatTranscript);
                this.showStandardResponse = true;
                this.showConversation = false;
               
                this.setInputFocus('standardResponseSearchInput');
                
                const payload = { action: 'getStandardResponses', entityid: this.recordId};
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
            } catch (error) {
                this.log('ERROR', 'StandardResponse ErrorMessage: ' + error.message);
            }
        }
    }
   
    handleClickStandardResponses(event){
        try {
            let textInput = this.processMergeFields(event.currentTarget.dataset.item);
            this.showStandardResponse = false;
            this.showConversation = true;

            if(this.resizeableTextAreaFlag || this.twoWayCoachingMode) {
                if(this.twoWayCoachingMode) {
                    if(this.isActiveChatForSupervisor){
                        this.currentChatToSupervisor = textInput;
                    }else {
                        this.currentChatToCustomer = textInput;
                    }
                }else {
                    this.currentChatToCustomer = textInput;
                }
            }else {
                this.chatInputField = '';
                this.chatInputField = textInput;
            }

            this.scrollDown();
            handleShowChatPage(this);
            if (this.countMessageLWC) 
            { 
                this.countMessageLWC.setMessageSourceType(messageType.STANDARD_RESPONSE); 
                this.originalMsgFromHiperOrStandardResponse = {textInput, from:messageType.STANDARD_RESPONSE};
            }

           
                if(this.chatmode === 'consulting'){
                    this.showCustomerSubtab();
                }   
           
    
        } catch (error) {
            this.log('ERROR', 'StandardResponse click ErrorMessage: ' + error.message);
        }
        
    }
   
    handleCloseStandardResponse(){
        this.showChatPage = true;
        this.showActiveChatsPage = false;
        this.showBottomButtons = false;
        this.showConversation = true;
        this.showTransferReason = false;
        this.showStandardResponse = false;
        this.showLeaveReasons = false; 
        this.openChat = true;
        this.showNormalChat = true;
        this.showSearchPage = false;
        this.showTransfer = false;
        this.showDetailsPage = false;
        
        timeout(() => {
            this.getSelector('.chatInputField').value = this.chatInputField;
            this.setTextAreaFocus('chatInputField');
            if(this.chatmode === 'consulting'){
                this.showCustomerSubtab();
            }   
        });
        
    }

    handleSelectAllManualRedaction(){
        try {
            //this.selectAllManualRedaction = true;
            const highlight = this.template.querySelectorAll('.txtManualRedaction span');
            highlight.forEach((value) => {
                value.classList.add('highlight');
            });

            this.redactionWords.forEach((value) => {
                this.selectedManualRedactionText.add(value);
            });
         
          
           this.updateRedactionWords({action:ACTION.SELECT_ALL});
           const forHighlight = this.getActiveMessageForRedactionArray().filter(curr => curr.isRedacted && !curr.pending);
           this.highlightRedactedWordsInActiveChat( forHighlight);

        } catch (error) {
            this.log('ERROR','Select All Manual Redaction Failed: ' + error.message);
        }
        
    }

    handleShowTransfer(){
        this.showConversation = false;
        this.showTransfer = true;
        this.showSearchPage = false;
        this.showDetailsPage = false;
        this.showTransferReason = false;
        this.showStandardResponse = false;
        this.showConsultingInquiry = false;
        this.showLeaveReasons = false;
        this.showProfanityPage = false;

        this.getSelector('.chatTab').classList.remove('active');
        this.getSelector('.transferTab').classList.add('active');
        this.getSelector('.searchTab').classList.remove('active');

        if(this.showDetailsTab){
            this.getSelector('.detailsTab').classList.remove('active');
        }
        
        timeout(()=> {
            this.setInputFocus('searchAgent');
        })
       
    
        this.handleShowAgentSupervisortab();
        
    }

    
    returnSearchChatsQueue(value, searchInput) {

        try {
            let messagetobematched = '';
            messagetobematched = value.name;
            const re = new RegExp('\\b' + searchInput, 'gi');
            let result = messagetobematched.match(re);
            return result;
        } 
        catch (error) {
            this.log('ERROR', 'ErrorMessage: ' + error.message);
        }
        return value;
    }
    handleSearchQueue(event){
       
        let searchInput = event.target.value;
        if(searchInput.length > 0){
            window.clearTimeout(this.delayTimeout);
            //disable eslint from here because lwc need some delay to get the standard response from tagus
            //eslint-disable-next-line @locker/locker/distorted-window-set-timeout
            this.delayTimeout = setTimeout(() => {
                
                this.searchedQueues = this.queues.filter((value) => this.returnSearchChatsQueue(value, searchInput));
               
            }, 100);
        }
        else{
            this.searchedQueues = this.queues;
        }


        
    }

    handleConsultContent(){
        let chatContent = this.getSelector('.consultationContent.chatContent'), 
            textAreaWrapper = this.getSelector('.consultTextAreaWrapper.textareaWrapper'),
            transferTab = this.getSelector('.transferTab'),
            consultChatUL = this.getSelector('.consult_chatul');

        if(this.chatmode !== 'consulting' && this.chatmode !== 'consultee' && (this.chatmode === 'chat' || this.chatmode === 'conference') ){
            if(chatContent) chatContent.classList.add('consultEnded');
            if(textAreaWrapper) textAreaWrapper.classList.add('hideTextAreaWrapper');
            if(transferTab) transferTab.classList.remove('disableTransferTab');
            if(consultChatUL) consultChatUL.classList.add('fullheight');
        }
        if(this.chatmode === 'consulting' || this.chatmode === 'consultee'){
            if(chatContent) chatContent.classList.remove('consultEnded');
            if(textAreaWrapper) textAreaWrapper.classList.remove('hideTextAreaWrapper');
            if(consultChatUL) consultChatUL.classList.remove('fullheight');
        }

        
    }

    handleSendProfanity(){
        try {
            let msg = '';

            if(this.resizeableTextAreaFlag || this.twoWayCoachingMode){
                msg = this.currentChatToCustomer;
                this.currentChatToCustomer = msg;
            }else {
                msg = this.chatInputField;
                this.chatInputField = msg;
            }
            
            
            if (msg.length > 0) {

                if(this.resizeableTextAreaFlag || this.twoWayCoachingMode)  this.processPendingMessages(msg);
                else this.processPendingMessages();

                this.showSecondProfanityPage = false;
                
                const payload = { action: 'send', entityid: this.recordId, text: msg, agentName: this.agentName, destination: 'All' , messageSource: this.countMessageLWC?.getMessageSourceType() ?? '' }; 
                this.toOnemLMS(payload);
               
                this.profanityAttempts = 0;
                this.currentChatToCustomer = '';
                this.chatInputField = '';
                handleShowChatPage(this);
                timeout(() => {
                    this.getSelector('.backToActiveChatButton')?.classList.remove('disable');
                    this.getSelector('.chatTab')?.classList.add('active');
                    this.getSelector('.chatTabWrap')?.classList.remove('disable');
                }, 100);
            }
        } catch (error) {
            this.log('ERROR','Send Profanity Error: ' + error.message);
        }
        
    }

    //LIGHTNING MESSAGE SERVICES
    activateChat(selectedentityId){
        const payload = {   action: 'activateChat', 
                            entityid: selectedentityId
                        };
        //this.log('INFO', 'Message activateChat: ' + JSON.stringify(payload));
        log('INFO', 'chatwindowLWC currentChat: ' , payload);
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
    }

    conference() {
        
        try {
            const payload = {   action: 'transfer',
                                disposition: '',
                                entityid: this.recordId,
                                mode: 'conference',
                                toAgent: '',
                                toQueue: this.selectedQueue
                        };
                this.log('INFO', 'Conference CHAT ' + JSON.stringify(payload));
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
                
        } catch (error) {
            this.log('ERROR', 'Conference Error: ' + error.message);
        }
        
    }
    
    consult(){
        
        try {
                const payload = {   action: 'transfer',
                                    disposition: '',
                                    entityid: this.recordId,
                                    mode: 'consult',
                                    toAgent: '',
                                    toQueue: this.selectedQueue,
                                    comment: this.getSelector('.txtConsultation').value
                        };
                this.log('INFO', 'Consult CHAT ' + JSON.stringify(payload));
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
        } catch (error) {
            this.log('ERROR', 'Consult Error: ' + error.message);
        }
    }

    transfer(){
        try{
            
            let note = this.getSelector('.txtTransferReason').value ?? '';
            let payload = {};
            if ((this.isSupervisorNameFlag && this.showAgentSupervisorPage) || (this.isAgentNameFlag && this.showQueuePage)) 
            {
                payload = {
                    action: 'transfer',
                    disposition: this.selectedTransferReason,
                    entityid: this.recordId,
                    mode: 'transfer',
                    toAgent: this.selectedQueue, //for the individual supervisor or agent name 
                    toQueue: '',
                    comment: note
                };
            }
            else 
            {
                payload = {
                    action: 'transfer',
                    disposition: this.selectedTransferReason,
                    entityid: this.recordId,
                    mode: 'transfer',
                    toAgent: '', 
                    toQueue:  this.selectedQueue,
                    comment: note
                };
            }

           
            this.log('INFO', 'Handle Transfer CHAT ' + JSON.stringify(payload));
            publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);

            this.selectedQueue = '';
            this.getSelector('.transferTab').classList.remove('active');
            handleShowChatPage(this);
        }catch (error){
            this.log('ERROR', 'Transfer Error: ' + error.message);
        }
    }

    getActiveChats(){
        try {
            const payload = {   action: 'getActiveChats', 
                            entityid: this.recordId,
                           
                        };
            log('INFO', 'getActiveChats: ', payload);
            publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
        } catch (error) {
            this.log('ERROR', 'getActiveChat Error: ' + error.message);
        }
        
    }

    getProfanities(){
        try {
            const payload = {   action: 'getProfanities',
                                entityid: this.recordId
                        };
                
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
                this.log('INFO', 'Get Profanities: ' + JSON.stringify(payload));
                
        } catch (error) {
            this.log('INFO', 'Get Profanities Error: ' + error.message);
        }
    }

    //Transfer Events 
    getTransferList(){
        const payload = {   action: 'getTransferList', 
                            entityid: this.recordId
                        };

        this.log('INFO', 'Handle Transfer CHAT ' + JSON.stringify(payload));
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
    }

    getSupervisorList() {
        const payload = {   action: 'getSupervisorList'};
        log('INFO', 'Request Supervisor List ' , payload);
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
    }

    leave(){
        try {
        const payload = {   action: 'leave', 
                            disposition: this.selectedLeaveReason,
                            entityid: this.recordId 
                        };
        this.log('INFO', 'Leave Success' + JSON.stringify(payload));
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
        
        } catch (error) {
            this.log('ERROR', 'Leave Error: ' + error.message);
        }
    }

    getIndexOfCustomerMessagesOnly = (bubbleId) =>{
        let listOfCustomerMessages = this.messageList.filter(msg => /Role_customer/.test(msg.class));
        let index = listOfCustomerMessages.findIndex(msg => msg.bubbleid === bubbleId) + 1;
        return index.toString();
    } 

    updateRedactions(){
        try{
            const redactedTexts = {};
            redactedTexts.key = this.getIndexOfCustomerMessagesOnly(this.redactedbubbleid);
            redactedTexts.value = [];
            
            const getCurrentListOfRedactedWord = this.getActiveMessageForRedactionArray();

            
            
            getCurrentListOfRedactedWord.forEach((redacted) => {

                if (!redacted.isRedacted && !redacted.isRedactedSystematically) return; 

                if (redacted.isRedactedSystematically && !redacted.isRedacted) { // this will retain the systematically redacted once the manually redacted is removed

                    if(!redacted.isPartOfSystemRedacted){ 
                        redactedTexts.value.push([redacted.offset, redacted.offset + redacted.text.length , 5]);
                    }else {
                        const isAllPartsSysTeamRedacted = getCurrentListOfRedactedWord.filter( red => { return red?.sysOffset && red.sysOffset[0] === redacted.sysOffset[0]}).every(w=> !w.isRedacted);

                        if(isAllPartsSysTeamRedacted) {
                            redactedTexts.value.push([...redacted.sysOffset , 5]);
                        }else {
                            const systemRedactedParts = getCurrentListOfRedactedWord.filter( red =>  red?.sysOffset && red.sysOffset[0] === redacted.sysOffset[0]).filter(w => !w.isRedacted);

                            systemRedactedParts.forEach(r => {
                                redactedTexts.value.push([r.offset, r.offset + r.text.length , 5]);
                            })

                        }

                    }

                     
                }else {

                    redactedTexts.value.push([redacted.offset, redacted.offset + redacted.text.length]); 
                }      
                
            });

            const payload = {   
                                action: 'updateRedactions',
                                entityid: this.recordId,
                                redactions: redactedTexts,
                                replace: true
                            };
            
            this.updateRedactionWords({action:ACTION.SAVE , payload: getCurrentListOfRedactedWord.filter(curr => curr.pending)});
            this.highlightRedactedWordsInActiveChat(this.listOfCurrentRedactedWords);
            this.toOnemLMS(payload);
            this.handleCloseRedactionModal();

            const event = new ShowToastEvent({
                title: 'Saved!',
                variant: 'success',
                message:
                    'All words manually redacted.',
            });
            this.dispatchEvent(event);

        }catch (error){
            log('ERROR', 'UpdateRedactions Error: ' , error);
        }
    }
  
    runApex(className, methodName, parameters, callback){
        let context = null;
        if (callback) {
            this.callbacks[context = Date.now().toString(16)] = callback;
        }
        this.log('INFO', 'runApex({'+className+'}.{'+methodName+'}) with ' + JSON.stringify(parameters));
        publish(this.messageContext, ONE_MESSAGE_CHANNEL, {action: "runApex", className: className, methodName: methodName, parameters: parameters, context: context});
    }

    clickSubtab(event){
        var subtabName = event.currentTarget.dataset.tab;
       
        try {
                this.isChatWithCustomerInput = true;
                let i, subtab, chatContent;
                chatContent = this.template.querySelectorAll('.chatContent');
                
                for(i = 0; i < chatContent.length;i++){
                    chatContent[i].style.display = 'none';
                } 
                subtab = this.template.querySelectorAll('.subtab');
                
                for(i = 0; i < subtab.length;i++){
                    subtab[i].style.backgroundColor = 'transparent';
                    subtab[i].classList.remove('active');
                } 
                
                if(subtabName === 'consultation'){
                    this.isConsulting = true;
                    this.showConsultingChatContent = true;
                    this.isChatWithCustomerInput = false;
                    if(this.chatmode === 'conference'){
                        
                        this.getSelector('.multipleTab .chatContent .textareaWrapper').style.display = 'block';
                        this.getSelector('.consultChatContent .textareaWrapper').style.display = 'none';
                        this.getSelector('.consultChatContent').style.background = '#efefef';
                        this.getSelector(`[data-tab="consultation"]`).style.background = '#efefef';
                        this.getSelector(`.consult_chatul`).style.background = '#efefef';
                        this.getSelector(`.consult_chatul`).closest('div').style.background = '#efefef';
                        this.getSelector(`[data-tab="chat"]`).classList.add('active');
                        this.getSelector(`[data-tab="consultation"]`).classList.remove('active');
                        this.getSelector(`.consultChatContent`).classList.add('conferenceMode');
                    
                    }
                    this.consult_scrollDown();
                }

                if(this.chatmode === 'consultee'){
                        this.getSelector('.chatul').classList.add('supervisorChat');
                }
                
                let div = this.getSelector('[data-id="'+subtabName+'"]');
                let currentTab = this.getSelector('[data-tab="'+subtabName+'"]');
                
                if(subtabName === 'chat'){
                    this.scrollDown();
                }

                timeout(() => {
                    if (div) {
                        div.style.display = 'block';
                        currentTab.classList.add('active');
                    }
                });

                if(this.chatEnded) this.setChatCompleted(true);
        } catch (error) {
            this.log('ERROR', 'Subtab ErrorMessage: ' + error.message);
        }
    }

    showCustomerSubtab(){
        let customerSubTab = this.getSelector('.chatSubtab');
        let consultationSubTab = this.getSelector('[data-tab="consultation"]');
        try {
            
            if(customerSubTab){
                customerSubTab.style.display = 'block';
                customerSubTab.classList.add('active');
                consultationSubTab.classList.remove('active');
                this.showNormalChat = true;
                this.showConsultingChatContent = false;
                this.getSelector('.mainChatContent').style.display = 'block';
            }

            this.scrollDown();
        } catch (error) {
            this.log('ERROR', 'showCustomerSubtab ErrorMessage: ' + error.message);
        }
    }

    setChatAreaClass(mode){
        this.chatAreaMode = {consulting: 'consulting multipleTab', consultee: 'consulting multipleTab'}[mode] || mode;
        timeout(() => {
            try {
                let chatArea = this.getSelector('.chatArea');
                let consultationContent = this.getSelector('.consultationContent');
                let i, chatContent;

                if (!chatArea) return;
                    chatArea.classList.remove('chat', 'multipleTab', 'consulting', 'conference');
                
                    if(this.isConsulting && mode !== 'consultee' && mode !== 'consulting'){
                    chatArea.classList.add('multipleTab');
                    
                    chatContent = this.template.querySelectorAll('.chatContent');
                    for(i = 0; i < chatContent.length;i++){
                        chatContent[i].style.display = 'none';
                    } 
                    this.showConsultingChatContent = true;
                    if (consultationContent) consultationContent.style.display = 'block';
                }

                if(mode === 'chat' && this.isConsulting){
                    consultationContent.classList.add('disableConsultationContent');
                    this.getSelector('.consultChatContent').classList.add('completed');
                }
                
                if(mode === 'consulting' && this.isConsulting){
                    chatArea.classList.add('consulting', 'multipleTab');
                    
                    chatContent = this.template.querySelectorAll('.chatContent');
                    for(i = 0; i < chatContent.length;i++){
                        chatContent[i].style.display = 'none';
                    } 
                    this.showConsultingChatContent = true;
                    if (consultationContent) consultationContent.style.display = 'block';
                    
                    this.getSelector(`[data-tab="consultation"]`).classList.add('active');
                    
                }

                if(mode === 'consultee' && this.isConsulting){

                    this.conferencebuttonFlag = true;
                        this.showConsultingChatContent = true;
                        this.conferenceButtonTooltip = 'Only agents can initiate conference';
                        this.conferenceFlag = true;

                    chatContent = this.template.querySelectorAll('.chatContent');
                    for(i = 0; i < chatContent.length;i++){
                        chatContent[i].style.display = 'none';
                    }
                    chatArea.classList.add('multipleTab');
                    if (consultationContent) consultationContent.style.display = 'block';
                    this.getSelector(`[data-tab="consultation"]`).classList.add('active');

                    this.getSelector(`.conferenceButton`).setAttribute('disabled','');
                    
                    this.getSelector('.mainChatContent .textAreaWrapper').style.display = 'none';

                    consultationContent.classList.remove('disableConsultationContent');
                    this.getSelector('.consultChatContent').classList.remove('completed');
                }

                if(mode === 'conference' && this.isConsulting){
                    
                    chatArea.classList.add('chat','multipleTab');

                    this.showDetailsPage = false;
                    this.showConsultingChatContent = false;
                    this.getSelector(`[data-tab="chat"]`).classList.add('active');
                    this.getSelector(`[data-tab="consultation"]`).classList.remove('active');
                    //CSS STYLING NEEDED
                    this.getSelector(`.multipleTab .chatContent .textareaWrapper`).style.display = 'block';
                    
                    this.chatHeaderLabel = 'Conference';

                    let consultChatContent = this.getSelector('.consultChatContent');
                    if (consultChatContent) {
                        consultChatContent.style.display = 'block';
                    }
                }
            } catch (error) {
                this.log('ERROR','Chat Area Class Error: ' + error.message);
            }
        });    
    }

    isConsultee(){
        this.conferencebuttonFlag = true;
        this.showConsultingChat = true;
        this.isConsulting = true;
        handleShowChatPage(this);
        this.setTransferTabDisabled();
    }

    selectedTextInput(event){
        let textInputName =(this.twoWayCoachingMode || this.resizeableTextAreaFlag) ? event.detail.name :event.target.dataset.name //
        //if Agent clicks the chat with customer input 
        //else Agent click consulting chat input
        if(textInputName === 'chatTextArea'){
            this.isChatWithCustomerInput = true;
        }
        else if(textInputName === 'chatTextAreaConsult'){
            this.isChatWithCustomerInput = false;
        }
    }
    
    formatAMPM(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        let strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    processPendingMessages(pendingMessage){
       
        let pendingClass = ' pending';
        let msg = '';
        let tempmessageList = this.messageList;
        let consult_tempmessageList = this.consultMessageList;
        let textarea = this.resizeableTextareaLWC;
        let role = (this.isActiveChatForSupervisor && this.isSupervisorSession) ? 'Whisper Role_agent' : 'Role_agent'; 
        
        if(this.isChatWithCustomerInput && textarea){
            //msg = this.getSelector('.chatInputField')?.value;
            msg = textarea.getValue();
        }
        else if (pendingMessage) {
            msg = pendingMessage;
        }
        else if (!this.twoWayCoachingMode || !this.resizeableTextAreaFlag) {
            msg = this.getSelector('.chatInputField')?.value;
        }
        else{
            msg = this.getSelector('.consult_chatInputField')?.value;
            
        }
        
        let newMessage = {  UserName: this.agentName, 
                            date: this.formatAMPM(new Date), 
                            message: msg.replace(/\n$/, ''),
                            text:msg.replace(/\n$/, ''), 
                            UserType: 'user', 
                            class:`slds-chat-listitem slds-chat-listitem_inbound Agent Me ${role} ${pendingClass}`, 
                            bubbleid: 'Sysgen' + this.getUniqueBubbleId()
        }

        if(!this.isChatWithCustomerInput){
            consult_tempmessageList.push(newMessage);
            this.consultMessageList = Object.assign([], consult_tempmessageList);
            if(this.showConsultingChatContent){
                this.consult_scrollDown();
            }
        }
        else{
            tempmessageList = [...tempmessageList, newMessage];
            this.messageList = Object.assign([], tempmessageList);
            this.searchMessageList = this.messageList;
            if(this.showChatPage){
                this.scrollDown();
            }
        }
    }

    removePendingClasses(){
        this.messageList = this.messageList.filter(msg => !msg?.class.includes('pending'));        
    }

    showModal(){
        this.showQueueModal = true;
    }

    closeModal(){
        this.showQueueModal = false;
    }

    scrollDown(){
        if(this.showConversation && this.showNormalChat)
        {
            timeout(() => {
                    let containerChoosen = this.getSelector('.chatul')?.lastElementChild;
                        containerChoosen?.scrollIntoView({ behavior: "smooth", block: "end"});
            },100);
        }
    }

    consult_scrollDown(){
        if(this.showConversation && this.showConsultingChat)
        {
            timeout(() => {
                let containerChoosen = this.getSelector('.consult_chatul')?.lastElementChild;
                    containerChoosen.scrollIntoView({ behavior: "smooth", block: "end"});
            });
        }
    }
    //Formatted log 
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
    
    clickCustomer(event){
        try {
            
            let selectedentityId = event.currentTarget.dataset.entityid;
            let time = event.currentTarget.dataset.time;
            let customerName = event.currentTarget.dataset.item;
            if(selectedentityId === 'pending') {
                this.searchActiveChat({time, customerName});
                return;
            }
            this.showNormalChat = true;
            this.activateChat(selectedentityId);
            if(this.recordId === selectedentityId){
                handleShowChatPage(this);

                if(this.chatEnded){
                    this.setChatCompleted(true);
                }
            }

        } catch (error) {
            this.log('INFO', 'Clicking Chat Tab Error: ' + JSON.stringify(error));
        }
    }

    searchActiveChat(detail) {
        try {
            const payload = {   action: 'searchActiveChat', 
                ...detail
            };
            log('INFO', 'searchActiveChat: ' , payload);
            publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
        } catch (error) {
            this.log('ERROR', 'searchActiveChat: ' + JSON.stringify(error));
        }
    }

    setTextAreaFocus(classname){
        timeout(() => {
            let customerChatInput = this.getSelector('.' + classname);
            
            if(!customerChatInput) return;
            customerChatInput.focus();
            this.chatInputField = customerChatInput.value;
           
        });
        
    }

    setInputFocus(classname){
        let customerChatInput = this.getSelector('.' + classname);

        if(!customerChatInput) return;
        customerChatInput.focus();
    }

    showSFDetailsTab(){
        try{
            const payload = {   action: 'otherAction',
                                subAction: 'showSFDetailsTab',
                                details: 'Show more details',
                                entityid: this.recordId
                            };
            this.log('INFO', 'Showing SF Details Tab ' + JSON.stringify(payload));
            publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
        }
        catch (error){
            this.log('INFO', 'Showing SF Details Tab Error: ' + error.message);
        }
    }

    selectTransferReason(event){
       this.selectedTransferReason =  event.currentTarget.dataset.transferreason;
       let transferReasonli = this.template.querySelectorAll('.transferReasonli');
       for(let i = 0;i < transferReasonli.length;i++){
           if(transferReasonli[i].classList.contains('highlightReason')){
            transferReasonli[i].classList.remove('highlightReason');
           }
       }
       event.currentTarget.classList.add('highlightReason');
    }

    selectLeaveReason(event){
        this.selectedLeaveReason =  event.currentTarget.dataset.leavereason;

        let leaveReasonli = this.template.querySelectorAll('.leaveReasonli');
        for(let i = 0;i < leaveReasonli.length;i++){
            if(leaveReasonli[i].classList.contains('highlightReason')){
                leaveReasonli[i].classList.remove('highlightReason');
            }
        }
        event.currentTarget.classList.add('highlightReason');
    }

    clickTransferTab(){
        if(!this.chatEnded){
            this.handleShowTransfer();
            this.getTransferList();
        }
    }

    setChatCompleted(completed){

        try {
            this.chatEnded = completed;
            //if (completed) this.stopTimer(); CES252
            if(this.showTransfer) handleShowChatPage(this); //ATTC-499

            for (let i = 0, parts = 'chatArea,chatLogo,chatHeader,chatContent,chatTabWrap,textareaWrapper'.split(','), element; i < parts.length; i++){
                if ((element = this.getSelector('.' + parts[i])))
                element.classList.toggle('completed', completed);
                    else
                        log('WARN', `Could not find ${parts[i]}`);
                element = this.getSelector('.btnToStandardResponse');
                if (element) element.style.display = completed ? 'none' : '';
                if (completed) // FIXME what is the opposite?
                {
                    element = this.getSelector('.chatContent');
                    if (element) element.style.overflowY = 'scroll';
                    
                }
            }
        } catch (error) {
            log('ERROR','SetChatCompleted Error',error.message);
        }

    }

    characterCounter(){
        try {
            this.currentTextCount = this.getSelector('.txtTransferReason').value.length;
            let theCount = this.getSelector('.the-count');
            
            if (this.currentTextCount === this.maxTextCount) {
                this.characterLimitReached = 'Character limit reached';
                theCount.classList.add('max');
            }
            else{
                this.characterLimitReached = '';
                theCount.classList.remove('max');
            }
        } catch (error) {
            this.log('ERROR','Character counter error: ' + error.message);
        }
        
    }

    openAllSearchedStandardResponses(){
        timeout(() => {
            try {
                if(this.template.querySelectorAll('.standardResponseCaret').length > 0 && this.template.querySelectorAll('.responseContainer ul').length > 0){
                    let carets = this.template.querySelectorAll('.standardResponseCaret');
                    let standardResponseschildren = this.template.querySelectorAll('.responseContainer ul');
                    for(let i = 0; i < standardResponseschildren.length; i++){
                        standardResponseschildren[i].style.display = 'block';
                    }
                    for(let i = 0; i < carets.length; i++){
                            carets[i].iconName = 'utility:down';
                    }    
                }
            } catch (error) {
                this.log('ERROR','openAllSearchedStandardResponses' + error.mesaage);
            }
            
        },1000);
        
    }

    handleBacktoActiveChats(){
        try {
            
            this.showChatPage = false;
            this.showTransfer = false;
            this.shouldOpenChatWindow = false;
            this.handleShowActiveChatsPage();
           
           // timeout(this.hideNoCoral(),1000);
            
        } catch (error) {
            this.log('ERROR', 'Backto Active Chats Error Message: ' + error.message);
        }
        
    }

    hideNoCoral(){
        let chatList = this.getSelector('div.chat_list:before');
            
        if(chatList)
            chatList.style.display = 'none';
        else
            timeout(this.hideNoCoral(),1000);
        
    }

    getSelector(path){
        if(this.template){
            return this.template.querySelector(path);
        }
        return '';
    }

    getMergeFieldValues(recId)
    {
        this.runApex("CoralSoftphoneResources","getLiveChatTranscript",{transcriptId:recId},this.gotMergeFieldValues.bind(this));
    }

    gotMergeFieldValues(result)
    {
        let mapping = this.mergeFieldValues = {}
        function expandProperties(prefix, obj) {
            if (typeof obj !== 'object')
                mapping[prefix] = obj;
            else if (obj instanceof Array)
                for (let i = 0; i < obj.length; i++)
                    expandProperties(prefix + '[' + i + ']', obj[i]);
            else
                for (let p in obj) {
                    if (Object.hasOwn(obj, p))  {
                        expandProperties(prefix ? prefix + '.' + p : p, obj[p])
                    }
                }
                    
        }
        if(result) expandProperties('', result)
    }

    processMergeFields(text)
    {
        var finalText = text;
        if(this.chatNick) 
        {
            let nlup =  new RegExp('\\{!User.FirstName\\}','g');
            finalText = finalText?.replace(nlup,this.chatNick);
        }
        if(this.mergeFieldValues)
        {
            let keys = Object.keys(this.mergeFieldValues);
            for(let i = 0; i < keys.length; i++)
            {
                let lupKey = keys[i];
                for(let j = 0; j < this.mergedFieldMap.length; j++)
                {
                    // Check the map
                    if(this.mergedFieldMap[j].field === keys[i])
                    {
                        lupKey = this.mergedFieldMap[j].token
                        break;
                    }
                }
                let lup = new RegExp('\\{!'+lupKey+'\\}','g');
                finalText = finalText?.replace(lup,this.mergeFieldValues[keys[i]]);
            }
        }
        return finalText;
    }

    filterData(data, predicate) {
        return !data ? null : data.reduce((list, entry) => {
            let clone = null;
            if (predicate(entry)) {
                // if the object matches the filter, clone it as it is
                clone = Object.assign({}, entry)
            } else if (entry.menu != null) {
                // if the object has childrens, filter the list of children
                let children = this.filterData(entry.menu, predicate)
                if (children.length > 0) {
                    // if any of the children matches, clone the parent object, overwrite
                    // the children list with the filtered list
                    clone = Object.assign({}, entry, {menu: children})
                }
            }
            // if there's a cloned object, push it to the output list
            if(clone) list.push(clone)
            return list;
        }, [])
    
    }
    
    showLeaveReasonsPage(){
        timeout(()=>{
            this.showLeaveReasons = true;
            this.showConversation = false;
            this.showProfanityPage = false;
            this.showSecondProfanityPage = false;
    
            this.getSelector('.backToActiveChatButton')?.classList.add('disable');
            this.getSelector('.chatTab')?.classList.remove('active');
            this.getSelector('.chatTabWrap')?.classList.add('disable');
        },300)
    }

    handleCloseLeaveReason(){
        this.showLeaveReasons = false;
        timeout(() => {
            this.getSelector('.backToActiveChatButton')?.classList.remove('disable');
            this.getSelector('.chatTab')?.classList.add('active');
            this.getSelector('.chatTabWrap')?.classList.remove('disable');
        }, 300);
        handleShowChatPage(this);
    }

    clickSearchedText(event){
        this.isChatSearchOn = true;
        handleShowChatPage(this);
        this.searchMessageList = [];
        let selectedMessage = event.currentTarget.dataset.searchmessage.replace('\n','');
        const element = this.template.querySelector(`li[data-searchmessage="${selectedMessage}"] .searchedChat`).querySelector('span');
 
        let matchedMessage; 
        timeout(()=>{
            try {
                matchedMessage = this.getSelector("[data-msg='"+selectedMessage+"']");

                if (element)
                {
                    const listOfChildren = [...matchedMessage.children];
                    listOfChildren.forEach(child =>
                    {
                        const searchInput = element.textContent;
                        const reg = new RegExp(searchInput, 'gi');
                        let result = child.textContent.match(reg);

                        if (result)
                        {
                            createSpanForSearchInputText(child,searchInput);
                           
                        }
                    })
                }else {
                    matchedMessage.classList.add('highlightSearch');
                    
                }
                matchedMessage.scrollIntoView(false);
               
            } catch (error) {
                this.log('ERROR', 'ErrorMessage: ' + error.message);
            }
        },300)
           
    }

    clickfolderIcon(event){
        let folderIcon = event.target;
        
        if(folderIcon.classList.contains('folder-open')){
            folderIcon.classList.remove('folder-open');
            folderIcon.classList.add('folder-close');
        }
        else{
            folderIcon.classList.add('folder-open');
            folderIcon.classList.remove('folder-close');
        }
        
        if(folderIcon.iconName === 'utility:opened_folder')  folderIcon.iconName = 'utility:open_folder'; 
        else folderIcon.iconName = 'utility:opened_folder';
        
        let iconchildren = folderIcon.closest('.iconContainer').children;
        for(let i = 0; i < iconchildren.length; i++){
            if(iconchildren[i].tagName === 'UL' && folderIcon.iconName === 'utility:opened_folder'){
                iconchildren[i].style.display = 'block';
            }
            if(iconchildren[i].tagName ==='UL' && folderIcon.iconName === 'utility:open_folder'){
                iconchildren[i].style.display = 'none';
            }
        }
    }
    invokeWorkspaceAPI(methodName, methodArgs)
    {
        return new Promise((resolve, reject) =>
        {
            const apiEvent = new CustomEvent("internalapievent", {
                bubbles: true, //remove this failed in lwc code scanner
                composed: true,
                cancelable: false,
                detail: {
                    category: "workspaceAPI",
                    methodName: methodName,
                    methodArgs: methodArgs,
                    callback: (err, response) =>
                    {
                        if (err)
                        {
                            return reject(err);
                        }
                        return resolve(response);

                    }
                }
            });
            window.dispatchEvent(apiEvent);
        });
    }

    copydetail(event){
        /* Get the text field */
        var copyText = event.target.dataset.kvp;
       
        const elem = document.createElement('textarea');
        elem.value = copyText;
        document.body.appendChild(elem);
        elem.select();
        // eslint-disable-next-line  @locker/locker/distorted-document-exec-command
        document.execCommand('copy');
        document.body.removeChild(elem);
    }
    
      
    setTransferTabDisabled(){
        let transferTab = this.getSelector('.transferTab');
        this.disableTransferTab = true;
        if(transferTab){
            transferTab.classList.add('disableTransferTab');
        }
    }

    dropConsult(){
        try {
            const payload = {   action: 'dropconsult',
                                entityid: this.recordId
                        };
                this.log('INFO', 'Drop Consult: ' + JSON.stringify(payload));
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
                
        } catch (error) {
            this.log('ERROR', 'Drop Consult: ' + error.message);
        }
    }
    
    selectActiveTabAgentStats(event){

        let currentTab = event.currentTarget;

        if(currentTab.classList.contains('chattabbottom')){
            this.handleBacktoActiveChats();
            currentTab.classList.add('selected');
            this.getSelector('.agentstatstab').classList.remove('selected');
        }
        else{
            this.handleAgentStatsPage();
            currentTab.classList.add('selected');
            this.getSelector('.chattabbottom').classList.remove('selected');
        }
        
    }

    getUniqueBubbleId(){
        return     this.bubbleId++ + '';
    }

    profanityFilter(textInput){
        
        if(textInput.length > 0){

            //let splitTextInput = textInput.trim().split(' ');
            let profaneregEx;
            this.isProfanityDetected = false;
            this.detectedProfaneWords = [];
            for(let i = 0; i < this.profaneWords.length; i++){
                profaneregEx = new RegExp('\\b' + this.profaneWords[i] + '\\b','gi');
                if(textInput.match(profaneregEx)){
                    this.isProfanityDetected = true;
                    this.detectedProfaneWords.push(`"` + this.profaneWords[i] +`"`);
                    
                    this.log('WARN','Profane word detected: ' + this.profaneWords[i]);
                }
            }

            if(this.isProfanityDetected){
                this.profanityAttempts = this.profanityAttempts + 1;
                this.showConversation = false;

                if (this.resizeableTextAreaFlag || this.twoWayCoachingMode) {
                    this.currentChatToCustomer = textInput;
                }else {
                    this.chatInputField = textInput;
                }
                
                
                timeout(() => {
                if(this.profanityAttempts > 1){
                    this.showProfanityPage = false;
                    this.showLeaveReasons = false;
                    this.showSecondProfanityPage = true;
                    
                }else{
                    this.blockedMessage(textInput);
                    this.showSecondProfanityPage = false;
                    this.showProfanityPage = true;
                    
                }

                    this.getSelector('.backToActiveChatButton')?.classList.add('disable');
                    this.getSelector('.chatTab')?.classList.remove('active');
                    this.getSelector('.chatTabWrap')?.classList.add('disable');
                },100);
            }

            return this.isProfanityDetected;
        }

        return false;

    }
    
    cancelProfanity(){
        try {
            this.showConversation = true;
            this.showProfanityPage = false;
            timeout(() => {
                this.getSelector('.backToActiveChatButton')?.classList.remove('disable');
                this.getSelector('.chatTab')?.classList.add('active');
                this.getSelector('.chatTabWrap')?.classList.remove('disable');
            }, 300);
            
            handleShowChatPage(this);
        } catch (error) {
            this.log('ERROR','Cancel Profanity Error---' + error.message);
        }
        
    }

    blockedMessage(msg){
        try {
            const payload = {   action: 'blockedmessage',
                                text: msg,
                                entityid: this.recordId
                        };
                this.log('INFO', 'Handle Block Message ' + JSON.stringify(payload));
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, payload);
        } catch (error) {
            this.log('ERROR', 'Block Message Error: ' + error.message);
        }
    }


    activateChatToCustomer () {
        const textarea = this.resizeableTextareaLWC;
      
        textarea.removeClasslist('active supervisor');
        textarea.addClassList('active customer');
       
        this.chatInputPlaceholder = this.customerInputPlaceholder;

        this.isActiveChatForCustomer = true;
        this.isActiveChatForSupervisor = false;

    }

    activateChatToSupervisor () {
        
        const sendButton = this.template.querySelector('.sendButton');
        sendButton.classList.add('send supervisor');
       
        this.chatInputPlaceholder = this.customerInputPlaceholder;
        this.isActiveChatForCustomer = false;
        this.isActiveChatForSupervisor = false;
    }


    toggleCustomerButton(){

        try {
            if (this.resizeableTextAreaFlag || this.twoWayCoachingMode) {
                const textarea = this.resizeableTextareaLWC;
                textarea.removeClasslist('supervisorMode');
                textarea.addClasslist('customerMode');
                textarea.setValue(this.currentChatToCustomer);
                this.isActiveChatForCustomer = true;
                this.isActiveChatForSupervisor = false;
            }else {
                this.getSelector('.chatInputField').classList.add('customerMode');
                this.getSelector('.chatInputField').classList.remove('supervisorMode');
                this.getSelector('.chatInputField').value = this.sendtoCustomer;
            }
            this.chatInputPlaceholder = this.customerInputPlaceholder;
            this.isSendtoCustomer = true;
            this.isSendtoSupervisor = false;
            this.template.querySelector('.customerButtonDiv')?.classList.add('active');
            this.getSelector('.supervisorButtonDiv')?.classList.remove('active');
            this.getSelector('.sendButton').classList.add('customerMode');
            this.getSelector('.sendButton').classList.remove('supervisorMode');
            this.isTyping = false;
        } catch (error) {
            this.log('ERROR','toggleCustomerButton error: ' + error.message);
        }
         
    }

    toggleSupervisorButton(){
        try {
            if (this.resizeableTextAreaFlag || this.twoWayCoachingMode) {
                const textarea = this.resizeableTextareaLWC;
                textarea.removeClasslist('customerMode');
                textarea.addClasslist('supervisorMode');
                textarea.setValue(this.currentChatToSupervisor);
                this.chatInputPlaceholder = this.supervisorChatInputPlaceholder;
                this.isActiveChatForCustomer = false;
                this.isActiveChatForSupervisor = true;
            }else {
                this.getSelector('.chatInputField').classList.add('supervisorMode');
                this.getSelector('.chatInputField').classList.remove('customerMode');
                this.getSelector('.chatInputField').value = this.sendtoSupervisor;

            }
            this.isSendtoCustomer = false;
            this.isSendtoSupervisor = true;
            this.getSelector('.supervisorButtonDiv').classList.add('active');
            this.getSelector('.customerButtonDiv').classList.remove('active');
            this.getSelector('.sendButton').classList.remove('customerMode');
            this.getSelector('.sendButton').classList.add('supervisorMode');

           /*  if(this.isTyping)
            {
                const pl = { action: 'nottyping', entityid: this.recordId, who: this.agentName, destination: 'All' };
                this.log('INFO', JSON.stringify(pl));
                publish(this.messageContext, ONE_MESSAGE_CHANNEL, pl);
                this.isTyping = false;
            } */

        } catch (error) {
            this.log('ERROR','toggleSupervisorButton error: ' + error.message);
        }  
        
    }

    chatInputOnchange(event){
        try{
            if (this.isActiveChatForCustomer){
                this.currentChatToCustomer = event.detail.value;
            }
            else if (this.isActiveChatForSupervisor){
                this.currentChatToSupervisor = event.detail.value;
            } else{
                if (!this.resizeableTextAreaFlag && !this.twoWayCoachingMode){
                    this.sendtoCustomer = this.getSelector('.chatInputField').value;
                } else{
                    this.currentChatToCustomer = event.detail.value;
                }

            }
        } catch (error){
            this.log('ERROR', 'Chat Input Error: ' + error.message);
        }  
    }
    
    updateRedactionWords({action , payload=this.getActiveMessageForRedactionArray()}) {
        try {
            const currentListOfRedaction = payload;
            this.listOfCurrentRedactedWords = this.listOfCurrentRedactedWords.map(redacted => {

                const forUpdate = currentListOfRedaction.find(curr => redacted.id === curr.id);
              

                if (forUpdate) {
                   return updateRedactionWordsActions({forUpdate, action,redacted});
                }
                return redacted;
            })
        } catch (error) {
            this.log('ERROR', `${error.message}. Error on updateRedactionWords function.`)
        }
    }

    getRedactedWordsFromOneMessageLMSByActiveBubbleId() {
        const getChat = this.activeChats.find(activeChat => activeChat.entityid === this.recordId);
        let redactedWords = getChat.kvp.find(({key}) => key === 'Redactions')?.value ;

        if(redactedWords) {
            const parseRedactedWords = JSON.parse(redactedWords);
            const systematicRedactedWords = parseRedactedWords[this.redactedbubbleid];    
            return systematicRedactedWords
        } 

        return null;
        
    
    }

    createForRedactionWords() {
        try {
            const systematicRedactionWords = this.getRedactedWordsFromOneMessageLMSByActiveBubbleId();
            const text = this.messageList.find(msg => msg.bubbleid=== this.redactedbubbleid )?.text;
            const redactedbubbleid = this.redactedbubbleid;
           
            if(text) {
                const findListOfCurrentRedactionWord = splitMessageForRedaction({text,redactedbubbleid ,systematicRedactionWords})         
                const forAddInRedactionList = findListOfCurrentRedactionWord.filter(redact => !this.listOfCurrentRedactedWords.some(curr => curr.id ===  redact.id));

                if(forAddInRedactionList.length){
                    this.listOfCurrentRedactedWords = [...this.listOfCurrentRedactedWords, ...forAddInRedactionList];
                }
            }
        } catch (error) {
            this.log('Error' , `Unable to display redact words ${error.message}`)
        }
    }

    getActiveMessageForRedactionArray() {
        return this.listOfCurrentRedactedWords.filter(redacted => redacted.bubbleMessageId === this.redactedbubbleid );
    }

  
    highlightRedactedWordsInActiveChat(forRedactedWords) {
        
        forRedactedWords.forEach(redacted => {
            /* unique id fo message span */
            const [bubbleId , redactedId] = redacted.id.split('-');
            const targetText = this.template.querySelector(`.Customer [data-bubbleid="${bubbleId}"][data-msgid="${redactedId}"]`);
            if (redacted.isRedacted && !redacted?.pending && targetText) targetText.classList.add('highlight');
            else  targetText?.classList.remove('highlight');
         })
    }

    removeRedactionHighlightWhenLeftChat() {
        this.listOfCurrentRedactedWords.forEach(redacted => {
            /* unique id fo message span */
            const [bubbleId , redactedId] = redacted.id.split('-');
            const targetText = this.template.querySelector(`.Customer [data-bubbleid="${bubbleId}"][data-msgid="${redactedId}"]`);
            if(targetText) {
                targetText.classList.remove('highlight');
            }
             
         })
    }

  
    get manualRedactedListModal(){
        return this.getActiveMessageForRedactionArray().filter(redacted => redacted.isRedacted);
    }

   
    get manualRedactionWordListModal(){
        return this.getActiveMessageForRedactionArray();
    }

    formatRedactedListofWords () {
      try {
        const listOfMessages =  this.messageList.filter(msg=> msg.UserName === this.customerName);

        if (listOfMessages.length > 0) {
            const listOfWordsForRedaction = listOfMessages.map(msg => {
                    let offset = 0;
                    return  msg.text.split(/\s/)
                                .map(w => {
                                    let start = offset; 
                                    offset += w.length + 1; 
                                    return {offset:start, text:w}
                                })
                                .filter(w=> w.text.length)
                                .map((w,i) => {
                                    return {
                                        ...w,
                                        id:`${msg.bubbleid}-${i}`,
                                        isRedacted:false,
                                        bubbleMessageId:msg.bubbleid,
                                        isPrevRedacted:false,
                                        pending : false,
                                        isForUpdate: false,
                                        
                                    }
                                });

            })
            this.listOfCurrentRedactedWords = [...this.listOfCurrentRedactedWords, ...listOfWordsForRedaction.flat()];
        }
       
      } catch (error) {
        this.log('Error', 'Unable to initialize the list of words for redaction')
      }
      
    }
   
    getCurrentRedactedWords() {
        const getChat = this.activeChats.find(activeChat => activeChat.entityid === this.recordId);
        let redactedWords = getChat.kvp.find(({key}) => key === 'Redactions')?.value ;
        if(redactedWords) {
            const parseRedactedWords = JSON.parse(redactedWords);
            this.messageList.forEach(msg => {
                const currRedactedWords = parseRedactedWords[msg.bubbleid];
                if(currRedactedWords?.length>0) {
                    currRedactedWords.forEach(redact => {
                        const [start,,agent] = redact;
                        this.listOfCurrentRedactedWords = this.listOfCurrentRedactedWords.map(m => {
                            
                            if(m.offset === start && msg.bubbleid === m.bubbleMessageId && agent){
                                return {
                                    ...m,
                                    isRedacted: true,
                                }
                            } 
                            return m; 
                        })

                    })
                }   
            })
            this.highlightRedactedWordsInActiveChat(this.listOfCurrentRedactedWords);   
        }
    }
        
    get currentText() {
        if(this.isActiveChatForCustomer) {
            return this.currentChatToCustomer;
        }else if (this.isActiveChatForSupervisor){
           return this.currentChatToSupervisor;
        }
        return this.currentChatToCustomer;
    }
    /* ATT Methods */
    get isResizableTextarea() {
        return this.twoWayCoachingMode || this.resizeableTextAreaFlag; 
    }

    get isEmptySupervisorsName()
    {
        return this.supervisors?.length

    }

    get typingText () {
        const isCustomerTyping = this.isTypingCustomer;
        const isSupervisorTyping = this.isSupervisorTyping;
        const customerName = this.customerName;
        const supervisorName = this.supervisorName;

        log('INFO', 'Typing', {isCustomerTyping,isSupervisorTyping,customerName,supervisorName})
        
        if(isCustomerTyping && isSupervisorTyping) return `${customerName} and ${supervisorName} are typing...`;
        if (isCustomerTyping) return `${customerName} is typing...`;
        if (isSupervisorTyping) return `${supervisorName} is typing...`;
        
        return false;
    }
    get typingClass () {
        const chatMode = this.chatmode; 
        const isCustomerTyping = this.isTypingCustomer;

        if (isCustomerTyping && chatMode !== 'conference') return 'slds-chat-listitem slds-chat-listitem_inbound Customer typingWrapper';
       
        switch (chatMode)
        {
            case 'consulting':
                return 'slds-chat-listitem slds-chat-listitem_inbound Agent Whisper Role_coach typingWrapper';
            case 'conference':
                return 'slds-chat-listitem slds-chat-listitem_inbound Agent Role_conference typingWrapper';
            default:
                return 'slds-chat-listitem slds-chat-listitem_inbound Customer typingWrapper';

        } 
    }
    get isCoachOrConferenceMode() { 
        return this.isSupervisorSession || this.chatmode === 'conference';
    }

    onSetHeight = (event) => {
        if (event.detail.newHeight) {
            this.newHeight = event.detail.newHeight;
        }
        
    }
}//end of the chatwindowLWC class