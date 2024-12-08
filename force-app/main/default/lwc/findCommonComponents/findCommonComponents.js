import { LightningElement, track, wire } from 'lwc';
import getReleases from '@salesforce/apex/CommonComponentsController.getReleases';
import findCommonComponents from '@salesforce/apex/CommonComponentsController.findCommonComponents';

export default class FindCommonComponents extends LightningElement {
    @track releaseOptions = [];
    @track release1 = '';
    @track release2 = '';
    @track downloadUrl;

    @wire(getReleases)
    wiredReleases({ error, data }) {
        if (data) {
            this.releaseOptions = data.map(release => ({
                label: release.Name,
                value: release.Id
            }));
        } else if (error) {
            console.error('Error fetching releases:', error);
        }
    }

    handleRelease1Change(event) {
        this.release1 = event.target.value;
    }

    handleRelease2Change(event) {
        this.release2 = event.target.value;
    }

    async handleFindCommonComponents() {
        if (!this.release1 || !this.release2) {
            return alert('Please select both Release 1 and Release 2');
        }

        try {
            const csvFileId = await findCommonComponents({ release1: this.release1, release2: this.release2 });
            this.downloadUrl = `/sfc/servlet.shepherd/document/download/${csvFileId}`;
            alert('Common components CSV has been generated and attached to the latest modified Account!');
        } catch (error) {
            console.error('Error finding common components:', error);
            alert('An error occurred. Please try again.');
        }
    }

    downloadCsv() {
        console.log(this.downloadUrl);
        const link = document.createElement('a'); // Create a link element
        link.href = this.downloadUrl; // Set the download URL
        link.target = '_self'; // Ensure it behaves as a download and not as a tab navigation
        link.download = 'CommonComponentsReport.csv'; // Suggested file name
        document.body.appendChild(link); // Append the link to the DOM
        link.click(); // Programmatically click the link to trigger the download
        document.body.removeChild(link); // Clean up the DOM
    }
}