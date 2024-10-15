import { log } from 'c/utility'
import { publish } from 'lightning/messageService';
import ONE_MESSAGE_CHANNEL from '@salesforce/messageChannel/OneMessage__c'; //FROM SALESFORCE TO CORAL MESSAGECHANNEL
export const sendResumeMessageInOnem = (comp) => {
    try {
        if(!comp.isRenderedParkLastAction) {
            if(comp.isParkLastAction) {
                publish(comp.messageContext, ONE_MESSAGE_CHANNEL, {action:'resume_chat' ,entityid:comp.recordId ,messageList:comp.messageList});
                comp.isRenderedParkLastAction=true;
                log('INFO', 'ChatwindowLWC send resume_chat message in onem', {action:'resume_chat' ,entityid:comp.recordId ,messageList:comp.messageList});
            }
        } 
    } catch (error) {
        log('ERROR', 'sendResumeMessageInOnem' , {error})
    }
  
}

export const disableParkLastAction = (comp) => {
    comp.isRenderedParkLastAction=false;
    comp.isParkLastAction = false;
    log('INFO', 'ChatwindowLWC disable park last action', {action:'resume_chat'});
}
/* END */