import { LightningElement, api, track } from 'lwc';
import getDiffJsonForPromotion from '@salesforce/apex/GitHubWebhookHandler3.getDiffJsonForPromotion';

export default class GithubDiffViewer extends LightningElement {
    @api recordId;
    @track xmlFiles = [];
    @track nonXmlFiles = [];
    @track commonComponentsMap = {};
    @track selectedFileName = '';
    @track parsedLines = [];
    @track showModal = false;
    @track activeTab = 'nonXml';
    @track isLoading = true;
    @track error;

    connectedCallback() {
        this.loadDiffData();
    }

    loadDiffData() {
        this.isLoading = true;
        this.error = undefined;

        getDiffJsonForPromotion({ promotionId: this.recordId })
            .then(result => {
                this.xmlFiles = result?.xmlFiles || [];
                this.nonXmlFiles = result?.nonXmlFiles || [];
                this.commonComponentsMap = result?.commonComponentsMap || {};
            })
            .catch(error => {
                console.error('Error fetching diffs', error);
                this.error = error;
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleTabChange(event) {
        const tab = event.currentTarget.dataset.tab;
        if (tab === 'xml' || tab === 'nonXml') {
            this.activeTab = tab;
        }
    }

    openModal(event) {
        const fileName = event.currentTarget.dataset.id;
        const allFiles = [...this.xmlFiles, ...this.nonXmlFiles];
        const match = allFiles.find(f => f.filename === fileName);

        if (match) {
            this.selectedFileName = match.filename;
            this.parsedLines = this.parseDiff(match.diff);
            this.showModal = true;
        }
    }

    /**parseDiff(diffString) {
        if (!diffString) return [];
        const lines = diffString.split('\n');
        return lines.map((line, index) => {
            let className = 'diff-line';
            if (line.startsWith('+') && !line.startsWith('+++')) className += ' added';
            else if (line.startsWith('-') && !line.startsWith('---')) className += ' removed';
            return {
                key: index,
                content: line,
                className
            };
        });
    }**/
    parseDiff(diffString) {
        if (!diffString) return [];

        const lines = diffString.split('\n');
        const result = [];
        let previousWasEmpty = false;

        lines.forEach((line, index) => {
            const isIntentionalBlank = line.trim() === '' &&
                (lines[index-1]?.startsWith('@@') ||
                    lines[index+1]?.startsWith('@@'));

            if (line.trim().length > 0 || isIntentionalBlank) {
                let className = 'diff-line';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    className += ' added';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    className += ' removed';
                }

                result.push({
                    key: index,
                    content: line,
                    className
                });
                previousWasEmpty = false;
            }
        });

        return result;
    }

    closeModal() {
        this.showModal = false;
        this.selectedFileName = '';
        this.parsedLines = [];
    }

    get isXmlTabActive() {
        return this.activeTab === 'xml';
    }

    get isNonXmlTabActive() {
        return this.activeTab === 'nonXml';
    }

    get errorMessage() {
        return this.error?.body?.message || this.error?.message || 'Unknown error';
    }
}