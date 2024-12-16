import { LightningElement, track } from 'lwc';
import fetchFilteredRecords from '@salesforce/apex/ACCComponentsViewerController.searchComponents';

export default class AccComponentsViewer extends LightningElement {
    @track filters = {
        releaseIds: [],
        epicIds: [],
        userStoryIds: [],
        componentIds: [],
        developerIds: [],
        teamIds: [],
        environmentIds: []
    };
    @track components = [];
    @track azureBranches = [];
    @track noResultsFound = false;
    @track componentColumns = [
        { label: 'Component Name', fieldName: 'copado__Metadata_API_Name__c', type: 'text' },
        { label: 'Component Type', fieldName: 'copado__Type__c', type: 'text' },
        { label: 'User Story', fieldName: 'copado__User_Story__c', type: 'text' },
        { label: 'Developer', fieldName: 'Commit_by_developer__c', type: 'text' },
        { label: 'Epic', fieldName: 'copado__User_Story__r.copado__Epic__c', type: 'text' },
        { label: 'Team', fieldName: 'copado__User_Story__r.copado__Team__c', type: 'text' }
    ];
    @track azureBranchColumns = [
        { label: 'User Story', fieldName: 'Name', type: 'text' },
        { label: 'Feature Branch', fieldName: 'copado__View_in_Git__c', type: 'url' },
        { label: 'Current Org', fieldName: 'copado__Environment__c', type: 'text' },
        { label: 'Promotion Name', fieldName: 'copado__Promoted_User_Stories__r.Name', type: 'text' }
    ];

    handleFilterSelection(event) {
        const { objectApiName, arrItems } = event.detail;
        const filterKey = `${objectApiName}Ids`;
        this.filters[filterKey] = arrItems.map((item) => item.value);
    }

    async handleSearch() {
        try {
            const filters = {
                releases: this.selectedReleases.map((item) => item.value),
                epics: this.selectedEpics.map((item) => item.value),
                userStories: this.selectedUserStories.map((item) => item.value),
                components: this.selectedComponents.map((item) => item.value),
                developers: this.selectedDevelopers.map((item) => item.value),
                teams: this.selectedTeams.map((item) => item.value),
                environments: this.selectedEnvironments.map((item) => item.value),
            };

            const results = await searchComponents({ filters });
            console.log('Search Results:', results);

            // Update UI with search results
            this.components = results.components || [];
            this.azureData = results.azure || [];
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching the data. Please try again.');
        }
    }

}
