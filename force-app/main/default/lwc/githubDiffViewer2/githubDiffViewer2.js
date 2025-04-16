/**
 * Created by mp1863 on 22/03/25.
 */

import { LightningElement, api, track } from 'lwc';
import getDiffJsonForPromotion from '@salesforce/apex/GitHubWebhookHandler2.getDiffJsonForPromotion';

export default class GithubDiffViewer extends LightningElement {
    @api recordId;
    @track files = [];
    @track selectedFileName = '';
    @track parsedLines = [];
    showModal = false;

    connectedCallback() {
        getDiffJsonForPromotion({ promotionId: this.recordId })
            .then(result => {
                this.files = result;
                console.log('files:',this.files);
            })
            .catch(error => {
                console.error('Error fetching diffs', error);
            });
    }

    openModal(event) {
        const fileName = event.target.dataset.id;
        const match = this.files.find(f => f.filename === fileName);
        if (match) {
            this.selectedFileName = match.filename;
            this.parsedLines = this.parseDiff(match.diff);
            this.showModal = true;
        }
    }

    parseDiff(diffString) {
        if (!diffString) return [];
        const lines = diffString.split('\n');
        return lines.map((line, index) => {
            let className = 'diff-line';
            if (line.startsWith('+') && !line.startsWith('+++')) className += ' added';
            else if (line.startsWith('-') && !line.startsWith('---')) className += ' removed';
            else className += ' neutral';
            return {
                key: index,
                content: line,
                className
            };
        });
    }

    closeModal() {
        this.showModal = false;
        this.selectedFileName = '';
        this.parsedLines = [];
    }
}