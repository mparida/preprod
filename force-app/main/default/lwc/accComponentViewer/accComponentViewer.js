import { LightningElement, track } from 'lwc';
import fetchLookupRecords from '@salesforce/apex/ACCComponentsViewerController.fetchLookupRecords';
import performSearch from '@salesforce/apex/ACCComponentsViewerController.searchComponents';

export default class MultiLookupComponent extends LightningElement {
    @track releaseSearchTerm = '';
    @track releaseOptions = [];
    @track selectedReleases = [];
    @track environmentSearchTerm = '';
    @track environmentOptions = [];
    @track selectedEnvironments = [];
    @track results = [];
    @track columns = [
        { label: 'Component Name', fieldName: 'ComponentName', type: 'text' },
        { label: 'Component Type', fieldName: 'ComponentType', type: 'text' },
        { label: 'User Story', fieldName: 'UserStory', type: 'text' },
        { label: 'Developer', fieldName: 'Developer', type: 'text' },
        { label: 'Team', fieldName: 'Team', type: 'text' },
        { label: 'Environment', fieldName: 'Environment', type: 'text' },
    ];

    // Handle release search
    handleReleaseSearch(event) {
        this.releaseSearchTerm = event.target.value;
        if (this.releaseSearchTerm.length > 2) {
            this.searchReleases(this.releaseSearchTerm);
        } else {
            this.releaseOptions = [];
        }
    }

    async searchReleases(searchTerm) {
        try {
            const records = await fetchLookupRecords({ objectName: 'copado__Release__c', searchTerm });
            this.releaseOptions = records.map((record) => ({
                Id: record.Id,
                Name: record.Name,
            }));
        } catch (error) {
            console.error('Error fetching releases:', error);
        }
    }

    handleReleaseSelection(event) {
        const selectedId = event.currentTarget.dataset.id;
        const selectedName = event.currentTarget.dataset.name;
        this.selectedReleases = [...this.selectedReleases, { Id: selectedId, Name: selectedName }];
        this.releaseOptions = [];
        this.releaseSearchTerm = '';
    }

    removeRelease(event) {
        const removeId = event.currentTarget.dataset.id;
        this.selectedReleases = this.selectedReleases.filter((release) => release.Id !== removeId);
    }

    // Handle environment search
    handleEnvironmentSearch(event) {
        this.environmentSearchTerm = event.target.value;
        if (this.environmentSearchTerm.length > 2) {
            this.searchEnvironments(this.environmentSearchTerm);
        } else {
            this.environmentOptions = [];
        }
    }

    async searchEnvironments(searchTerm) {
        try {
            const records = await fetchLookupRecords({ objectName: 'copado__Environment__c', searchTerm });
            this.environmentOptions = records.map((record) => ({
                Id: record.Id,
                Name: record.Name,
            }));
        } catch (error) {
            console.error('Error fetching environments:', error);
        }
    }

    handleEnvironmentSelection(event) {
        const selectedId = event.currentTarget.dataset.id;
        const selectedName = event.currentTarget.dataset.name;
        this.selectedEnvironments = [...this.selectedEnvironments, { Id: selectedId, Name: selectedName }];
        this.environmentOptions = [];
        this.environmentSearchTerm = '';
    }

    removeEnvironment(event) {
        const removeId = event.currentTarget.dataset.id;
        this.selectedEnvironments = this.selectedEnvironments.filter(
            (environment) => environment.Id !== removeId
        );
    }

    async handleSearch() {
        try {
            const filters = {
                releases: this.selectedReleases.map((release) => release.Id),
                environments: this.selectedEnvironments.map((environment) => environment.Id),
            };
            this.results = await performSearch({ filters });
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }
}