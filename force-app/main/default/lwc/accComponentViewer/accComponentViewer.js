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
        {
            label: 'Feature Branch',
            fieldName: 'featureBranchUrl',
            type: 'url',
            typeAttributes: {
                target: '_blank',
                label: { fieldName: 'featureBranchLabel' },
                tooltip: null  // Prevents URL from showing in hover
            }
        },
        { label: 'Current Org', fieldName: 'copado__Environment__c', type: 'text' },
        { label: 'Promotion Name', fieldName: 'copado__Promotion__r.Name', type: 'text' },
        { label: 'Source Env', fieldName: 'SourceEnv', type: 'text' },
        { label: 'Destination Env', fieldName: 'DestinationEnv', type: 'text' },
        {
            label: 'Promotion Branch',
            fieldName: 'PromotionBranchUrl',
            type: 'url',
            typeAttributes: {
                target: '_blank',
                label: { fieldName: 'PromotionBranchLabel' },
                tooltip: null // Prevent hover tooltip
            }
        }
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

            // Process Components
            if (results.components && results.components.length > 0) {
                this.components = results.components;
            } else {
                this.components = [];
            }

            // Process Azure Branches and Format Promotion Branch URLs
            if (results.azureBranches && results.azureBranches.length > 0) {
                this.azureBranches = results.azureBranches.map(row => ({
                    ...row,
                    featureBranchUrl: row.featureBranchUrl,
                    featureBranchLabel: row.featureBranchLabel
                }));
            } else {
                this.azureBranches = [];
            }

            // Determine noResultsFound
            this.noResultsFound = this.components.length === 0 && this.azureBranches.length === 0;

            // Logs for Debugging
            console.log('Processed Components:', this.components);
            console.log('Processed Azure Branches:', this.azureBranches);
        } catch (error) {
            console.error('Error fetching data:', JSON.stringify(error));
            console.error('Error Details:', error.body?.message || error.message);

            // Handle specific error cases (e.g., Too Many Rows)
            if (error.body && error.body.message.includes('Too many query rows: 50001')) {
                alert('Too many records found. Please refine your search criteria to narrow the results.');
            } else {
                alert('An error occurred while fetching data. Please try again.');
            }
        }
    }


}
