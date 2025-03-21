import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getGitDiff from '@salesforce/apex/GitHubService.getGitDiff';

const PROMOTION_FIELDS = [
    'copado__Promotion__c.Source_Env__c',
    'copado__Promotion__c.Destination_Env__c'
];

export default class GitHubDiffViewer extends LightningElement {
    @api recordId;
    @track diffData = [];
    @track isLoading = false;
    @track error;

    sourceBranch;
    targetBranch;

    // Wire service to fetch Copado Promotion record fields
    @wire(getRecord, { recordId: '$recordId', fields: PROMOTION_FIELDS })
    wiredPromotion({ error, data }) {
        if (data) {
            this.sourceBranch = data.fields.Source_Env__c.value;
            this.targetBranch = data.fields.Destination_Env__c.value;
        } else if (error) {
            console.error('Error fetching Promotion Record:', error);
            this.error = 'Failed to fetch Copado Promotion data';
        }
    }

    // ✅ Getter to dynamically update the UI title
    get gitDiffTitle() {
        return `GitHub Difference (${this.sourceBranch || 'Loading...'} → ${this.targetBranch || 'Loading...'})`;
    }

    // ✅ Process file differences to include CSS class names
    get processedDiffData() {
        return this.diffData.map(file => ({
            ...file,
            cssClass: this.getStatusClass(file.status)
        }));
    }

    // ✅ Function to determine CSS class based on file status
    getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'modified':
                return 'modified';
            case 'added':
                return 'added';
            case 'removed':
                return 'removed';
            default:
                return '';
        }
    }

    // Call Apex Method to Fetch GitHub Diff
    handleFetchDiff() {
        if (!this.sourceBranch || !this.targetBranch) {
            this.error = 'Source and Target branches are required!';
            console.error('Missing Source/Target Branch:', this.sourceBranch, this.targetBranch);
            return;
        }

        this.isLoading = true;

        getGitDiff({ promotionId: this.recordId, baseBranch: this.targetBranch, headBranch: this.sourceBranch })
            .then(response => {
                console.log('📢 API Response:', response);

                if (response.length > 0) {
                    this.diffData = response;
                    this.error = null;
                } else {
                    this.error = 'No differences found.';
                }
            })
            .catch(error => {
                console.error('🔥 Apex Error:', error);
                this.error = 'Error fetching GitHub Diff';
            })
            .finally(() => {
                this.isLoading = false;
            });
    }
}