import { LightningElement, api } from 'lwc';

export default class ParkAsyncNotif extends LightningElement {
    @api message ='Customer is inactive. Please close this interaction.';
    @api isTimeout;
    @api timeoutDate = 'Feb 23, 2024, 2:00PM';

    
}