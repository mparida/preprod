/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api } from 'lwc';
import {createStore, combineReducers, createLogger} from 'c/lwcReduxCoral';
import reducers from 'c/chatwindowReducer';

// Set ENABLE_LOGGING true if you wanna use the logger.
// We prefer to use the Custom label because we can directly access in the LWC components.
const ENABLE_LOGGING = false;

export default class CounterContainer extends LightningElement {
    @api recordId;
    @api store;
    initialize(){
        let logger;
        
        // Check for the Logging
        if(ENABLE_LOGGING){
            logger = createLogger({
                duration: true,
                diff: true
            });
        }
        
        const combineReducersInstance = combineReducers(reducers);
        this.store = createStore(combineReducersInstance, logger);
    }
}