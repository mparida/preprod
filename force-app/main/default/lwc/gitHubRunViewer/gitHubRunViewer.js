import { LightningElement, api, wire } from 'lwc';
import getLatestGitHubRun from '@salesforce/apex/GitHubWebhookHandler.getLatestGitHubRun';

export default class GitHubRunViewer extends LightningElement {
    @api recordId; // Promotion Record ID

    gitHubRun;
    isLoading = true;
    error;
    noDifferences = false; // Flag to track if no changes are found

    // Wire method to fetch latest GitHub run details
    @wire(getLatestGitHubRun, { promotionId: '$recordId' })
    wiredGitHubRun({ error, data }) {
        this.isLoading = false;
        if (data) {
            this.gitHubRun = data;
            this.error = null;
            this.processDiffResults();
        } else if (error) {
            this.error = 'Error fetching GitHub Run data';
            console.error('Error fetching GitHub Run data:', error);
        }
    }

    // Process and format the diff results
    processDiffResults() {
        if (!this.gitHubRun?.Run_Result__c || this.gitHubRun.Run_Result__c.trim() === '') {
            this.noDifferences = true;
        } else {
            let diffList = this.gitHubRun.Run_Result__c.split('\n').filter(line => line.trim() !== '');
            this.noDifferences = diffList.length === 0;
        }
    }

    get formattedDiff() {
        if (!this.gitHubRun?.Run_Result__c) return [];
        return this.gitHubRun.Run_Result__c.split('\n').filter(line => line.trim() !== '');
    }
}