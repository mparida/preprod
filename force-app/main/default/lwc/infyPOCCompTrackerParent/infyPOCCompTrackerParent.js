import { LightningElement, wire, track } from 'lwc';
import getReleases from '@salesforce/apex/InfyPOCComponentTrackerController.getReleases';
import getMyCheckedInRecords from '@salesforce/apex/InfyPOCComponentTrackerController.getMyCheckedInRecords';
import manageCheckOut from '@salesforce/apex/InfyPOCComponentTrackerController.manageCheckOut';
import getAllOtherRecords from '@salesforce/apex/InfyPOCComponentTrackerController.getOtherRecords';
import manageCheckIn from '@salesforce/apex/InfyPOCComponentTrackerController.manageCheckIn';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class InfyPOCCompTrackerParent extends LightningElement {

@track releaseOptions = [];
selectedReleaseValue;
processRecords = true;
@track myCheckedInRecords = [];
@track otherRecords = [];
@track selectedRowstoCheckOut = [];
@track selectedRowstoCheckIn = [];
@track recordsToProcess = [];
@track myCheckInColumns = [
    { label: 'Metadata.APIName', fieldName: 'metadataAPIName', type: 'text' },
    { label: 'Release', fieldName: 'releaseName', type: 'text' },
    { label: 'Checked In?', fieldName: 'isCheckedIn', type: 'boolean' },
    { label: 'Checked In By', fieldName: 'checkedInBy', type: 'text' },
    { label: 'Checked In Time', fieldName: 'checkedInTime', type: 'text' },
];

@track isLoading = false;
@track iconCheckedout = 'utility:chevronright';
@track isMyCheckedInCompsVisible = false;
//get all releases and set dropdown values
@wire (getReleases)
    wiredReleases({error, data}){
        if(data){
            this.releaseOptions = data.map(release => ({
                label : release.Name,
                value: release.Id
            }));
        }else if(error){
            console.error('Error fetching info: '+JSON.stringify(error));
        }
    }
//handle release selection
handleReleaseChange(event){
    this.selectedReleaseValue = event.detail.value;
    this.fetchMyCheckedInRecords();
    this.fetchAllOtherRecords();
}
//fetch checked in records associated with logged in user
fetchMyCheckedInRecords(){
    this.myCheckedInRecords = [];
    this.isLoading = true;
    getMyCheckedInRecords({strRelease: this.selectedReleaseValue})
    .then(result => {
        this.isLoading = false;
        this.myCheckedInRecords = result;
    })
    .catch(error => {
        this.isLoading = false;
        console.error('Error fetching info: '+JSON.stringify(error));
    });
}

//fetch checked in records associated with logged in user
fetchAllOtherRecords(){
    this.otherRecords = [];
    this.isLoading = true;
    getAllOtherRecords({strRelease: this.selectedReleaseValue})
    .then(result => {
        this.isLoading = false;
        this.otherRecords = result;
    })
    .catch(error => {
        this.isLoading = false;
        console.error('Error fetching info: '+JSON.stringify(error));
    });
}


//handle check box selection for check-in
handleOtherRecordsSelection(event){
    this.selectedRowstoCheckIn.length = 0;
    event.detail?.selectedRows.forEach(result => {
        this.selectedRowstoCheckIn.push({
            id: result.Id,
            isCheckedIn: result.isCheckedIn
        });
    });
}

//handle check box selection for checkout
handleMyRecordsSelection(event){
    this.selectedRowstoCheckOut.length = 0;
    event.detail?.selectedRows.forEach(result => {
        this.selectedRowstoCheckOut.push(result.Id);
        /*this.selectedRowstoCheckOut.push({
            id: result.Id,
            isCheckedIn: result.isCheckedIn
        });*/
    });
}

//handle check in button functionality
handleCheckIn(){
    this.processRecords = true;
    this.recordsToProcess.length = 0;
    if(this.selectedRowstoCheckIn?.length>0){
        this.selectedRowstoCheckIn.forEach(result =>{
            if(result.isCheckedIn){
                this.processRecords = false;
            }else{
                this.recordsToProcess.push(result.id);
            }
        });
        if(!this.processRecords){
            this.showToast('Check-In failed', 'Unable to Check-in. One or more components have been checked-in by a different user.', 'warning');
        }
        if(this.processRecords && this.recordsToProcess?.length>0){
            manageCheckIn({lstCTRecords: this.recordsToProcess})
            .then(result => {
                this.fetchMyCheckedInRecords();
                this.fetchAllOtherRecords();
                this.selectedRowstoCheckIn = [];//flush selected rows
                this.showToast('Check-In Success!', 'Components have been checked in successfully.', 'success');
            })
            .catch(error => {console.error('Error fetching info: '+JSON.stringify(error));});   
        }
    }
}

//handle check out button functionality
handleCheckOut(){
    if(this.selectedRowstoCheckOut?.length>0){
        manageCheckOut({lstCTRecords: this.selectedRowstoCheckOut})
        .then(result => {
            this.fetchMyCheckedInRecords();
            this.fetchAllOtherRecords();
            this.selectedRowstoCheckOut = [];//flush selected rows
            this.showToast('Check-Out Success!', 'Components have been checked out successfully.', 'success');
        })
        .catch(error => {console.error('Error fetching info: '+JSON.stringify(error));});   
    }
}


//show toast message
showToast(title, message, variant){
    const event = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,
        mode:'sticky'
    });
    this.dispatchEvent(event);
}
//Display/Hide My Checked Out components
toggleMyCheckedinCompsTable(){
    this.isMyCheckedInCompsVisible = !this.isMyCheckedInCompsVisible;
    this.iconCheckedout = this.isMyCheckedInCompsVisible ? 'utility:chevrondown' : 'utility:chevronright';
}
}