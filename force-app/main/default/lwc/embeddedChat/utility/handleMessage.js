import { getSupervisorName } from "./chatSession";


export const handleIfSupervisor = (who,supervisors) => {
    return supervisors.find(supervisor => supervisor.loginid.trim().toLowerCase() === who.trim().toLowerCase() );
}

/* 
    function: formatNewbubble
    description: Process the message from onemessagelms to display to embeddedchat
    parameters:
        comp -> this (component object)
        payload -> data from 'newbubble' action from onemessagelms
 */
export const formatNewbubble = (payload, supervisors) =>
{
   
    let { classes, destination, role, who, date, text , bubbleid} = payload;
    let isSupervisor = payload?.type === 'conference' ? handleIfSupervisor(who, supervisors) : false ;

    if (classes === 'Agent Me' && destination === 'Whisper') 
    {
        classes = `${classes} ${destination}`;
    }

    if ( isSupervisor  && payload?.type === 'conference')
    {
        if (classes === 'Agent Me') classes = 'Agent'
        
        role = 'conference'
        
    }

    if(classes === 'System Chat Summary') {
        role = 'Summary'
    }
    

    return {
        UserName: who,
        date: date,
        message: text.split(' '),
        text: text,
        UserType: 'user', //what is the purpose of UserType?
        class: `slds-chat-listitem slds-chat-listitem_inbound ${classes} Role_${role}`,
        destination:destination,
        isConversationSummary: classes === 'System Chat Summary',
        bubbleid,
    }

}


export const handleTyping = (comp, message) => {
    const {destination, who} = message;
    if(who === comp.agentName) return;
   
    switch (comp.chatmode) {
        case 'conference':{
            const isSupervisor = handleIfSupervisor(who, comp.listOfSupervisors);
            if(isSupervisor) {
                getSupervisorName(comp,message);
                comp.isSupervisorTyping = true;
            }else {
                comp.isTypingCustomer = true
            }
            break;
        }
        case 'consulting':
            
            if(destination === 'Agents') { 
                getSupervisorName(comp,message); 
                comp.isSupervisorTyping = true;
            }
            if(destination === 'All') comp.isTypingCustomer = true;
        break;
        default:
            comp.isTypingCustomer = true;
            break;
    }
    comp.scrollDown()
   
   
}

export const handleNotTyping = (comp, message) => {
    const {destination, who} = message;

    if(who === comp.agentName) return;

    switch (comp.chatmode) {
        case 'conference':{
            const isSupervisorNotTyping = handleIfSupervisor(who, comp.listOfSupervisors);
            if(isSupervisorNotTyping) {
                comp.isSupervisorTyping = false;
            }else {
                comp.isTypingCustomer = false;
            }   
            break;
        }
        case 'consulting':
            if( destination === 'Agents') comp.isSupervisorTyping = false;
            if( destination === 'All') comp.isTypingCustomer = false;
        break;
        default:
            comp.isTypingCustomer = false;
            break;
    }
    comp.typingState = message.action;
    
}