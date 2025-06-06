import { LightningElement, track } from 'lwc';
import searchReleases from '@salesforce/apex/CommonComponentsController.searchReleases';
import searchEnvironments from '@salesforce/apex/CommonComponentsController.searchEnvironments';
import findCommonComponents from '@salesforce/apex/CommonComponentsController.findCommonComponents';

export default class FindCommonComponents extends LightningElement {
    @track release1 = '';
    @track release2 = '';
    @track environment1 = '';
    @track environment2 = '';
    @track downloadUrl;
    @track fileName = '';

    fetchReleases = async (searchTerm) => {
        try {
            const results = await searchReleases({ searchTerm });
            console.log('Results:', results);
            return results;
        } catch (error) {
            console.error('Error fetching releases:', error);
            return [];
        }
    };

    fetchEnvironments = async (searchTerm) => {
        try {
            const results = await searchEnvironments({ searchTerm });
            console.log('Results:', results);
            return results;
        } catch (error) {
            console.error('Error fetching environments:', error);
            return [];
        }
    };

    handleRelease1Selection(event) {
        this.release1 = event.detail;
    }

    handleRelease2Selection(event) {
        this.release2 = event.detail;
    }

    handleEnvironment1Selection(event) {
        this.environment1 = event.detail;
    }

    handleEnvironment2Selection(event) {
        this.environment2 = event.detail;
    }

    async handleFindCommonComponents() {
        if (!this.release1 || !this.release2 || !this.environment1 || !this.environment2) {
            return alert('Please select both Releases and Environments.');
        }

        try {
            const result = await findCommonComponents({
                release1: this.release1,
                release2: this.release2,
                environment1: this.environment1,
                environment2: this.environment2,
            });
            if (result.status === 'NO_COMMON_COMPONENTS') {
                this.downloadUrl = null;
                alert('No common components found.');
            } else {
                this.downloadUrl = `/sfc/servlet.shepherd/document/download/${result.contentDocumentId}`;
                this.fileName = result.fileName; // Store the file name
                alert('Common components CSV has been generated!');
            }
        } catch (error) {
            console.error('Error finding common components:', error);
            alert('An error occurred. Please try again.');
        }
    }

    // Download the generated CSV file
    downloadCsv() {
        console.log(this.downloadUrl);

        if (this.downloadUrl) {
            const link = document.createElement('a'); // Create a link element
            link.href = this.downloadUrl; // Set the download URL
            link.target = '_self'; // Ensure it behaves as a download and not as a tab navigation
            link.download = this.fileName ; // Store the file name; // Suggested file name
            document.body.appendChild(link); // Append the link to the DOM
            link.click(); // Programmatically click the link to trigger the download
            document.body.removeChild(link); // Clean up the DOM
        } else {
            alert('No download URL available. Please generate the CSV first.');
        }
    }
}