import {timeout, log} from 'c/utility'
export const getSupervisorName = (e) =>
{
    // Input string
    const inputString = e;

    // Regular expression to capture text until "has joined the chat"
    const regex = /^(.*?)(?= has joined the chat)/;

    // Extract the text
    const match = inputString.match(regex);

    if (match)
    {
        const extractedText = match[1].trim();
        return extractedText;
    }

    console.info("Pattern not found in the input string.");
    return null

}


function formatDate(date)
{

    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
}

const createSpanForSearchInputText = (element, searchText) => {
    const textContent = element?.textContent ?? '';
    const regex = new RegExp(searchText, 'gi');
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    textContent.replace(regex, (match, index) =>
    {
        // Append text before the match
        const beforeMatch = document.createTextNode(textContent.substring(lastIndex, index));
        fragment.appendChild(beforeMatch);

        // Create and append span element for the matched text
        const span = document.createElement('span');
       
        span.classList.add('highlightSearchResult');
       
        const matchTextNode = document.createTextNode(match);
        span.appendChild(matchTextNode);
        fragment.appendChild(span);

        lastIndex = index + match.length;
        return match;
    });

    // Append any remaining text after the last match
    const remainingText = document.createTextNode(textContent.substring(lastIndex));
    fragment.appendChild(remainingText);

    // Clear existing content and append the modified fragment
    while (element.firstChild)
    {
        element.removeChild(element.firstChild);
    }
    element.appendChild(fragment);
}


const handleShowChatPage = (comp) => {

    try {
        //Set component visibility
        log('INFO', 'ChatwindowLWC showChatPage', {action:'showChatPage'});
       
        comp.showChatPage = true;
        comp.showActiveChatsPage = false;
        comp.showBottomButtons = false;
        comp.showConversation = true;
        comp.showTransferReason = false;
        comp.showStandardResponse = false;
        comp.showLeaveReasons = false; 
        comp.openChat = true;
        comp.showNormalChat = true;
        comp.showSearchPage = false;
        comp.showTransfer = false;
        comp.showDetailsPage = false;
        comp.showSecondProfanityPage = false;
        comp.isChatSearchOn = false;
        
        timeout(() => {
            comp.getSelector('.chatTab')?.classList.add('active');
        
            comp.getSelector('.transferTab')?.classList.remove('active');
            
            comp.getSelector('.searchTab')?.classList.remove('active');

            if(comp.showDetailsTab){
                comp.getSelector('.detailsTab')?.classList.remove('active');
                comp.showDetailsPage = false;
            }
            
            if(comp.showConsultingChat && (comp.chatmode === 'consulting' || comp.chatmode === 'conference' || comp.chatmode === 'consultee')){
                comp.showConsultingInquiry = false;
                comp.isConsulting = true;
                comp.showCustomerChat = true;
                comp.showTransfer = false;
                comp.showNormalChat = true;

                comp.getSelector('.chatSubtab')?.classList.remove('active');
                comp.getSelector('.transferTab')?.classList.remove('active');
                
                comp.setTransferTabDisabled();
                comp.setTextAreaFocus('consult_chatInputField');
            }
            
            // When chat is completed
            if (comp.chatEnded) {
                comp.setChatCompleted(true);
            }

            if(!comp.isSubjectPositionTop){
                comp.getSelector('.customerNameDiv')?.classList.remove('chatSubjectHeader');
            }else{
                comp.getSelector('.customerNameDiv')?.classList.add('chatSubjectHeader');
            }
            
            if(!comp.isChatSearchOn){
                comp.scrollDown();
            }

            
            comp.setTextAreaFocus('chatInputField');
            comp.setChatAreaClass(comp.chatmode);
            if (comp.resizeableTextAreaFlag || comp.twoWayCoachingMode) {
                const textarea = comp.template.querySelector('c-dynamic-resize');
                textarea?.setFocus();
            }    
        },100);
      

      
    
    
    } catch (error) {
        log('ERROR', 'Show Chat Page: ' ,error.message);
    }
}


const cleanup = (comp) => {
    //remove typing
    comp.currentChatToCustomer = '';
    comp.currentChatToSupervisor = '';
   

}

export { formatDate , createSpanForSearchInputText ,handleShowChatPage, cleanup}