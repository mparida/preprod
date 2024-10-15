const    ACTION = {
    SELECT_ALL : 'selectAll',
    CLEAR_ALL : 'clearAll',
    REMOVE : 'remove',
    SAVE : 'save',
    CLOSE :'close',
    REDACT : 'redact'
}

function updateRedactionWordsActions ({forUpdate, action,redacted}) {

        switch(action) {
            case ACTION.SELECT_ALL:
              return {
                ...redacted,
                isRedacted:true,
                pending:true,
                isForUpdate: !redacted?.isPrevRedacted
              }
            case  ACTION.REDACT:
                return {
                  ...redacted,
                  isRedacted:true,
                  pending:true,
                  isForUpdate: !redacted?.isPrevRedacted
                }
              
            case ACTION.CLEAR_ALL :
                return {
                    ...redacted,
                    isRedacted:false,
                    pending:true,
                    isForUpdate: redacted?.isPrevRedacted
                  }
            case  ACTION.REMOVE:
                return {
                        ...redacted,
                        isRedacted:false,
                        pending:true,
                        isForUpdate: redacted?.isPrevRedacted
                      }
                    
            case ACTION.SAVE:
                  return {
                    ...redacted,
                    pending:false,
                    isForUpdate:false,
                    isRedacted:forUpdate.isRedacted,
                    isPrevRedacted: forUpdate.isRedacted,
                    
                  }
            
            case ACTION.CLOSE:
                return {
                    ...redacted,
                    pending:false,
                    isForUpdate:false,
                    isRedacted:redacted.isPrevRedacted,            
                  }
            default:
             return redacted;
        }
}

const findIndexOfMinimumDistance = (arr, target) => {
  const distances = arr.map((num) => Math.abs(num[0] - target));
  const minDistance = Math.min(...distances);
  return distances.indexOf(minDistance);
};


function splitMessageForRedaction ({text,redactedbubbleid,systematicRedactionWords}) {
    try {
        let offset = 0;
        let textSys = [];
        return  text.split(/\s/)
                    .map(w => {
                        let start = offset; 
                        offset += w.length + 1; 
                     // this will check if this text is systematically redacted already.

                        //TODO temporary fixed for the special character redaction from coral salesforceintegration.js
                        const updatePartialMatchRedaction = systematicRedactionWords?.map(sys =>
                        {
                            let redactionPattern = /([\s\S]*?)([^a-z0-9\n]*(\d[^a-z0-9\n]*){3,})/ig; 
                            let isMatchWithPattern = redactionPattern.exec(text.substr(start, w.length));
                            
                            if(isMatchWithPattern) {
                                const indexWithMinDistance = findIndexOfMinimumDistance(systematicRedactionWords, start);
                                const [sysStart, sysEnd] = systematicRedactionWords[indexWithMinDistance];
                                const isRedSysPartialMatch = text.substr(sysStart, sysEnd-sysStart).includes(text.substr(start, w.length)); //To check if current word is partially match in systematically redaction
                                const isCurrPartialMatch = text.substr(start, w.length).includes(text.substr(sysStart, sysEnd-sysStart)); //To check if current word is partially match in systematically redaction
                                if (isRedSysPartialMatch || isCurrPartialMatch) return [start, sysEnd];
                               
                            }

                
                            if(!isMatchWithPattern) return null;
                            
                            
                            return sys;

                        });


                        const isRedactedSystematically = updatePartialMatchRedaction?.find(sys => sys && sys[0] === start);

                    
                        
                        if (isRedactedSystematically || textSys.length >0) {
                            
                            const [startSys,endSys] = isRedactedSystematically ?? [];
                            let offsetSys = startSys;
                    
                            if(!textSys.length) { //store in textSys the list of sytematically redacted words that split to match with the manual redaction modal
                                textSys = text.slice(startSys, endSys).split(/\s/).map(s=> {
                                    start = offsetSys;
                                    offsetSys += s.length + 1;
                                    return {offset:start , text:s , sysOffset:[startSys,endSys]}
                                });
                            }
                    
                            
                            if (startSys === start && endSys === (start + w.length)){ //this is to check if no need to split the systematicall redacted words
                                return {offset:start, text:w ,isRedactedSystematically:true , textSystematically: text.slice(startSys,endSys)}
                            }

                            const isRedactedSysFound = textSys.find(o => o.offset === start);
                            if(isRedactedSysFound) {
                                return { offset:start, 
                                        text:w ,
                                        isRedactedSystematically:true , 
                                        isPartOfSystemRedacted:true ,
                                        sysOffset: isRedactedSysFound.sysOffset,
                                        
                                        }
                            }
                                
                            
                        }
                    
                        return {offset:start, text:w , isRedactedSystematically: false}
                        })
                    .filter(w=> w.text.length)
                    .map((w,i) => {
                            return {
                                ...w,
                                id:`${redactedbubbleid}-${i}`,
                                isRedacted:false,
                                bubbleMessageId:redactedbubbleid,
                                isPrevRedacted:false,
                                pending : false,
                                isForUpdate: false,
                                
                            }
                    });

            
    } catch (error) {
        console.error('Error' , `Unable to display redact words ${error.message}`)
    }
    console.error('Error' , `Unneccesarry call for splitMessageForRedaction`)
    return null;
    
}

const toggleRedactionSelectAllButton = (comp) => {
    const isThereAnyRedactedWordSelected = comp.getActiveMessageForRedactionArray().every(redacted => redacted.isRedacted);
    const redactionSelectAllButton= comp.template.querySelector('.redactionSelectAll');

    if (redactionSelectAllButton) {
        const isSelectAllButtonDisable = redactionSelectAllButton.disabled;
        if (isThereAnyRedactedWordSelected && !isSelectAllButtonDisable) {  
                redactionSelectAllButton.disabled = true;
                redactionSelectAllButton.classList.add("disable");
            
        }else if (!isThereAnyRedactedWordSelected && isSelectAllButtonDisable){
                redactionSelectAllButton.disabled = false;
                redactionSelectAllButton.classList.remove("disable");
            
        }
    }
}

const menu = [
    { "label": "Global", "menu": [{ "label": "Coral Standard Responses", "menu": [{ "label": "Goodbye", "value": "Thank you for contacting us. Please reach out to us again if you experience any other issue. Good bye!", "type": "text" }, { "label": "Greeting", "value": "How can I ehklp you today. My name is Allan Salesforce", "type": "text" }] }] }]

export {updateRedactionWordsActions, splitMessageForRedaction, ACTION, menu, toggleRedactionSelectAllButton}