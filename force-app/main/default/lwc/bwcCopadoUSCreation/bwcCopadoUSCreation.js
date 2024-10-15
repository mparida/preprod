import { LightningElement, track, wire } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import makeSampleCallout from '@salesforce/apex/BWC_Copado_US_Callout.makeSampleCallout';
import createCopadoUserStories from '@salesforce/apex/bwcCopadoUSController.createCopadoUserStories';
import getBoardDetails from '@salesforce/apex/bwcCopadoUSController.getBoardNameValues';
import getActiveSprintDetails from '@salesforce/apex/BWC_Copado_US_Callout.getActiveSprintDetails';

    const columnsOnSearch = [
        {label: 'ITrack US#', fieldName: 'key'},
        {label: 'Summary', fieldName: 'summary'},
        {label: 'Copado Story', fieldName: 'copadoUrl',type: 'url',typeAttributes: {label:{fieldName:'copadoStory'},target: '_blank'}},
        {label: 'Epic', fieldName: 'epicName'},
        {label: 'Assignee', fieldName: 'assigneeName'}
    ]

    const columnsPostCreate=[
        {label: 'ITrack US#', fieldName: 'iTrack_US__c'},
        {label: 'Copado US#', fieldName: 'nameUrl',type: 'url',typeAttributes: {label:{fieldName:'Name'},target: '_blank'}}
    ];

export default class BwcCopadoUSCreation extends LightningElement {
    @track sprintNameOptions;
    @track boardNameOptions;
    @track dataOnFetch = [];
    @track dataPostCreate = [];
    @track displayFetchData = [];
    @track dataOnSearch = [];
    @track selectedRows = [];
    pageSelectedRows = [];
    columnsPostCreate = columnsPostCreate;
    columnsOnSearch = columnsOnSearch;
    isFetechTable = false;
    @track selectedBoard;
    @track selectedSprint;
    disableSprintCombo = true;
    @track totalSelectedRows = [];
    searchText = '';
    searchIssueKey = '';
    showSpinner = false;
    //DataTable Functional Variables
    totalRecords = 0;
    currentPage = 1;
    totalPages = 0;
    disablePrevious = true;
    disableNext = false;
    pageSize = 10;
    pageSwitch = false;
    selectionSet = new Set();
    totalSelectedRowIds = [];

    connectedCallback(){
        let boardOptions = [];
        getBoardDetails()
        .then(result => {
            result.forEach(e => {
                boardOptions.push({ label: e.Name, value:e.Itrack_Board_Number__c});
            });
            this.boardNameOptions = boardOptions;
        });
    }

    handleBoardSelection(event){
        this.showSpinner = true;
        this.disableSprintCombo = true;
        this.sprintNameOptions = [];
        this.searchIssueKey = '';
        this.selectedBoard = event.detail.value;
        let sprintOptions = [];
        if(this.isFetechTable) this.isFetechTable = false;
        getActiveSprintDetails({ boardID: this.selectedBoard })
        .then(result => {
            
            result.forEach(e => {
                sprintOptions.push({ label: e.name, value:e.id});
            });
            this.sprintNameOptions = sprintOptions;
            this.disableSprintCombo = false;
            this.showSpinner = false; 
        })

    }

    handleSprintSelection(event){
        if(this.isFetechTable) this.isFetechTable = false;
        this.selectedSprint = +event.detail.value;
    }

    handleIssueSearch(event){
        if(event.target.value != ''){
            this.searchIssueKey = event.target.value.trim().toUpperCase();
            this.disableSprintCombo = true;
            this.selectedBoard = '';
            this.selectedSprint = '';
            if(this.isFetechTable) this.isFetechTable = false;
        }
    }

    handleFetch()
    {
        if(this.selectedSprint != null || this.searchIssueKey != '')
        {
            this.showSpinner = true;
            this.searchText = ''
            this.displayFetchData = [];
            this.isFetechTable = true;
            this.selectedRows = [];
            makeSampleCallout({sprintId : this.selectedSprint, issueKey : encodeURIComponent(this.searchIssueKey)})
            .then(result => {
                if(result.length > 0){
                    result.forEach(e => {
                        if(e.copadoStory != '')  e.copadoUrl = '/' + e.copadoId;
                        e.epicName = e.fields.customfield_10970;
                    });
                }
                else{
                    const evt = new ShowToastEvent({
                        title: 'Info',
                        message: 'No User Stories to display',
                        variant: 'info',
                    });
                    this.dispatchEvent(evt);
                }
                this.totalSelectedRows = [];
                this.dataOnFetch = result;
                this.handlePagination(this.dataOnFetch);
                this.showSpinner = false;
            })
        }       
    }

    handlePrevious()
    {
        if(this.currentPage > 1)
        {
            this.pageSwitch = false;
            this.pageSelectedRows = [];
            this.currentPage -= 1;
            this.displayFetchData = this.dataOnFetch.slice((this.currentPage-1)*this.pageSize ,(this.currentPage)*this.pageSize);
            this.selectedRows = this.totalSelectedRows.map((row) => row.id);
            if(this.disableNext) this.disableNext = false;
            if(this.currentPage == 1) this.disablePrevious = true;
        }
    }

    handleNext()
    {
        if(this.currentPage < this.totalPages )
        {
            this.pageSwitch = false;
            this.pageSelectedRows = [];
            this.currentPage += 1;
            this.displayFetchData = this.dataOnFetch.slice((this.currentPage-1)*this.pageSize ,(this.currentPage)*this.pageSize);
            this.selectedRows = this.totalSelectedRows.map((row) => row.id);
            if(this.disablePrevious) this.disablePrevious = false;
            if(this.currentPage == this.totalPages) this.disableNext = true;
        }
    }

    handleSearch(event)
    {
        this.searchText = event.target.value.toLowerCase();
        this.searchHelper();
    }

    handleRowSelection(event){
        if(!this.pageSwitch) {
            const currentSelectedRows = event.detail.selectedRows;
            const previousSelectedRows = this.pageSelectedRows;

            if(currentSelectedRows.length < previousSelectedRows.length){
                const deselectedRows = previousSelectedRows.filter(r => !currentSelectedRows.includes(r));
                if(deselectedRows.length > 0){
                    deselectedRows.forEach(e => {
                        this.totalSelectedRows = this.totalSelectedRows.filter(r => r != e);
                    });
                }
            }
            else if(currentSelectedRows.length > previousSelectedRows.length)
            {
                const curSelectedRows = currentSelectedRows.filter(r => !previousSelectedRows.includes(r));
                if(curSelectedRows.length > 0){
                    curSelectedRows.forEach(r => {
                        if(!this.totalSelectedRows.includes(r))
                            this.totalSelectedRows.push(r);
                    });
                }
            }
            this.pageSelectedRows = event.detail.selectedRows;
        }
        else {
            this.pageSelectedRows = [];
            this.pageSwitch = false;
        }
    }

    handleCreate()
    {
        this.showSpinner = true;

        //let lstUserStories = [];
        if(this.totalSelectedRows.length > 0){
            /* this.totalSelectedRows.forEach(e => { 
                lstUserStories.push(e);
            }); */

            createCopadoUserStories({ iTrackUSList: this.totalSelectedRows, sprintId: this.selectedSprint })
            .then(result => {
                let fetchDataTemp = this.dataOnFetch;
                fetchDataTemp.forEach(f => {
                    result.forEach(e => {
                        if(f.key == e.iTrack_US__c){
                            f.copadoUrl = '/' + e.Id;
                            f.copadoStory = e.Name;
                        }
                    });
                });

                this.dataOnFetch = fetchDataTemp;
                if(this.searchText == '') this.handlePagination(this.dataOnFetch); 
                else this.searchHelper();
                
            })
        }
        else{
            const evt = new ShowToastEvent({
                title: 'Info',
                message: 'Please select atleast 1 User Story to sync',
                variant: 'info',
            });
            this.dispatchEvent(evt);
        }
        this.showSpinner = false;
    }

    searchHelper(){
        this.dataOnSearch = this.dataOnFetch.filter(item => {
            return item.key.toLowerCase().includes(this.searchText) || item.summary.toLowerCase().includes(this.searchText) || 
                item.copadoStory?.toLowerCase().includes(this.searchText) || item.epicName?.toLowerCase().includes(this.searchText) ||item.assigneeName?.toLowerCase().includes(this.searchText);
            /* rowValues = Object.values(item);
            return rowValues.any(value => value.toLowerCase().includes(this.searchText));*/
        });
        this.handlePagination(this.dataOnSearch);
    }

    handlePagination(data){
        this.displayFetchData = data.slice(0,this.pageSize);
        this.totalRecords = data.length;
        this.totalPages = Math.ceil(this.totalRecords/this.pageSize);
        this.currentPage = 1;
        this.disablePrevious = true;
        if(this.totalPages < 2)
        {
            this.disableNext = true;
        }
        else{
            this.disableNext = false;
        }
        this.selectedRows = this.totalSelectedRows.map((row) => row.id);
    }
}