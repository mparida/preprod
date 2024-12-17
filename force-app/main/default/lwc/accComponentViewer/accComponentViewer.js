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
        { label: 'User Story', fieldName: 'copado__User_Story__r.name', type: 'text' },
        { label: 'Developer', fieldName: 'Commit_by_developer__c', type: 'text' },
        { label: 'Epic', fieldName: 'copado__User_Story__r.copado__Epic__r.name', type: 'text' },
        { label: 'Team', fieldName: 'copado__User_Story__r.copado__Team__r.Name', type: 'text' }
    ];
    @track azureBranchColumns = [
        { label: 'User Story', fieldName: 'Name', type: 'text' },
        { label: 'Feature Branch', fieldName: 'featureBranchUrl', type: 'url',
            typeAttributes: { target: '_blank', label: { fieldName: 'featureBranchLabel' } }
        },
        { label: 'Current Org', fieldName: 'copado__Environment__c', type: 'text' },
        { label: 'Promotion Name', fieldName: 'copado__Promotion__r.Name', type: 'text' },
        { label: 'Source Env', fieldName: 'SourceEnv', type: 'text' },
        { label: 'Destination Env', fieldName: 'DestinationEnv', type: 'text' },
        { label: 'Promotion Branch', fieldName: 'PromotionBranch', type: 'url', typeAttributes: { target: '_blank' } }
    ];

    handleFilterSelection(event) {
        const { arrItems } = event.detail;
        const filterKey = event.target.dataset.filterKey;

        console.log('Event Detail:', event.detail); // Verify what is coming in the event
        console.log('Filter Key:', filterKey); // Verify the filter key

        if (filterKey) {
            this.filters[filterKey] = arrItems ? arrItems.map((item) => item.value) : [];
            console.log(`Updated filters for ${filterKey}:`, this.filters[filterKey]);
        }
    }


    async handleSearch() {
        console.log('Final Filter State:', JSON.stringify(this.filters));
        try {
            const results = await fetchFilteredRecords({ filters: this.filters });
            console.log('Search Results:', results);

            // Check for components
            if (results.components && results.components.length > 0) {
                this.components = results.components;
                this.noResultsFound = false;
            } else {
                this.components = [];
                this.noResultsFound = true;
            }

            // Check for Azure branches
            if (results.azureBranches && results.azureBranches.length > 0) {
                this.azureBranches = results.azureBranches;
                this.noResultsFound = false;
            } else {
                this.azureBranches = [];
                this.noResultsFound = true;
            }

            console.log('Components:', this.components);
            console.log('Azure Branches:', this.azureBranches);
        } catch (error) {
            console.error('Error fetching data:', JSON.stringify(error));
            console.error('Error Details:', error.body.message);
            if (error.body && error.body.message.includes('Too many query rows: 50001')) {
                alert('Too many records found. Please refine your search criteria to narrow the results.');
            } else {
                alert('An error occurred while fetching data. Please try again.');
            }
        }
    }

}
