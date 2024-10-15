/* eslint-disable @lwc/lwc/no-async-operation */
import { api, LightningElement } from 'lwc';
import {log} from 'c/utility'
import { Redux } from 'c/lwcReduxCoral';
import { CHAT_STATUS } from 'c/chatwindowConstant';

export default class UrlWithCopyButton extends Redux(LightningElement) {
    @api urlText = 'www.google.com';
    icon = 'utility:copy'
    urlContainer = 'url-container'

    connectedCallback() {
        super.connectedCallback() //connect to redux
    }

    mapStateToProps(state){
        return state.chat;
    }


    copydetail(){
        try {
            let copyText = this.urlText;
            const elem = document.createElement("textarea");
            elem.value = copyText;
            document.body.appendChild(elem);
            elem.select();
            // eslint-disable-next-line  @locker/locker/distorted-document-exec-command
            document.execCommand('copy');
            document.body.removeChild(elem);
            this.icon = 'utility:success';
            
            setTimeout(() => {
                this.icon = 'utility:copy'
            }, 500);

        } catch (error) {
            log('ERROR', 'UrlWithCopyButton error:', error)
        }
        /* Get the text field */
    }


    get urlContainerClass () {
        return this.props.chatStatus === CHAT_STATUS.COMPLETE ? 'url-container complete' : 'url-container inprogress';
    }

    get disable () {
        return this.props.chatStatus === CHAT_STATUS.COMPLETE
    }

    
    
}