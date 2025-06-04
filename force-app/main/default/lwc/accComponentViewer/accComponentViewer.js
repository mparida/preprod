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
    @track filteredComponents = [];
    @track filteredAzureBranches = [];
    @track isLoading = false; // Spinner flag

    @track componentColumns = [
        { label: 'Component Name', fieldName: 'Metadata Name', type: 'text' },
        { label: 'Component Type', fieldName: 'Metadata Type', type: 'text' },
        { label: 'User Story', fieldName: 'User Story', type: 'text' },
        { label: 'Developer', fieldName: 'Developer', type: 'text' },
        { label: 'Epic', fieldName: 'Epic', type: 'text' },
        { label: 'Team', fieldName: 'Team', type: 'text' },
        { label: 'Environment', fieldName: 'Environment', type: 'text' },
        { label: 'Release', fieldName: 'Release', type: 'text' }
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
        { label: 'Promotion Name', fieldName: 'Promotion Name', type: 'text' },
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
        this.isLoading = true;
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
            // Initialize filtered data to full data
            this.filteredComponents = [...this.components];
            this.filteredAzureBranches = [...this.azureBranches];
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
        }finally {
            this.isLoading = false; // Stop spinner
        }
    }

    handleComponentSearchDup(event) {
        let searchKey = event.target.value.toLowerCase(); // prefer-const
        var unusedVar = 42; // no-unused-vars

        if (searchKey != '') { // eqeqeq
            console.log('Searching...'); // no-console
            this.filteredComponents = this.components.filter(item =>
                Object.values(item).some(value =>
                    value ? value.toString().toLowerCase().includes(searchKey) : false // no-implicit-coercion
                )
            );
        } else
            this.filteredComponents = [...this.components]; // Reset to full data - curly
    }

    /* handleComponentSearch(event) {
         const searchKey = event.target.value.toLowerCase();
         if (searchKey) {
             this.filteredComponents = this.components.filter(item =>
                 Object.values(item).some(value =>
                     value && value.toString().toLowerCase().includes(searchKey)
                 )
             );
         } else {
             this.filteredComponents = [...this.components]; // Reset to full data
         }
     }*/

    /*THis function works, if you want to search from multiple values by comma separated
    handleComponentSearch(event) {
        const searchInput = event.target.value.toLowerCase();
        const searchTerms = searchInput.split(',').map(term => term.trim()); // Split by comma and trim spaces

        if (searchInput) {
            this.filteredComponents = this.components.filter(item => {
                // Check if all search terms match any column value
                return searchTerms.every(term =>
                    Object.values(item).some(value =>
                        value && value.toString().toLowerCase().includes(term)
                    )
                );
            });
        } else {
            this.filteredComponents = [...this.components]; // Reset to full data
        }
    }*/
    //Any random search with results appending, search should be separated by comma
    handleComponentSearch(event) {
        const searchKey = event.target.value.toLowerCase();

        // If the searchKey is empty, reset filteredComponents to full data
        if (!searchKey.trim()) {
            this.filteredComponents = [...this.components];
            return;
        }

        // Split the searchKey into individual terms, handling commas and trimming spaces
        const searchTerms = searchKey.split(',').map(term => term.trim()).filter(Boolean);

        // Initialize a set to avoid duplicate rows
        const resultSet = new Set();

        // Append matching records for each search term
        searchTerms.forEach(term => {
            this.components.forEach(item => {
                // Check if any value in the row matches the current term
                const isMatch = Object.values(item).some(value =>
                    value && value.toString().toLowerCase().includes(term)
                );

                // Add matching rows to the resultSet
                if (isMatch) {
                    resultSet.add(item);
                }
            });
        });

        // Update the filteredComponents with the unique results
        this.filteredComponents = Array.from(resultSet);
    }


    // Quick search for Azure Branches
    handleAzureBranchSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        if (searchKey) {
            this.filteredAzureBranches = this.azureBranches.filter(item =>
                Object.values(item).some(value =>
                    value && value.toString().toLowerCase().includes(searchKey)
                )
            );
        } else {
            this.filteredAzureBranches = [...this.azureBranches]; // Reset to full data
        }
    }

    exportComponentsToCSV() {
        const keys = [
            'Metadata Name',
            'Metadata Type',
            'User Story',
            'Developer',
            'Epic',
            'Team',
            'Environment',
            'Release'
        ];
        const csvData = this.convertToCSV(this.filteredComponents, keys);
        console.log('Generated CSV Data:', csvData);
        if (csvData) {
            this.downloadCSV(csvData, 'Components.csv');
        } else {
            alert('No data to export.');
        }
    }
    exportAzureBranchesToCSV() {
        const keys =  [
            'Name',
            'featureBranchLabel',
            'copado__Environment__c',
            'Promotion Name',
            'SourceEnv',
            'DestinationEnv',
            'PromotionBranchLabel'
        ];
        const csvData = this.convertToCSV(this.filteredAzureBranches, keys);
        console.log('Generated CSV Data:', csvData);
        if (csvData) {
            this.downloadCSV(csvData, 'Azure_Branches.csv');
        } else {
            alert('No data to export.');
        }
    }
    // Convert JSON to CSV format
    convertToCSV(data, keys) {
        console.log('Data to convert:', data);
        console.log('Keys:', keys);
        if (!data || !data.length) {
            return '';
        }

        const header = keys.join(',');
        const rows = data.map(row =>
            keys.map(key => {
                const value = key.split('.').reduce((o, k) => (o || {})[k], row) || '';
                return `"${value}"`;
            }).join(',')
        );
        console.log('Generated CSV Rows:', rows);
        const csv = `${header}\n${rows.join('\n')}`;
        console.log('Final CSV Content:', csv);
        return csv;
    }
    // Create and download CSV file
    downloadCSV(csvData, fileName) {
        console.log('CSV Data in downloadCSV:', csvData);
        console.log('File Name:', fileName);
        if (csvData) {
            // Create a data URI for the CSV content
            const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = csvContent;
            link.download = fileName;

            // Append link to the DOM and trigger a click
            document.body.appendChild(link);
            link.click();

            // Clean up by removing the temporary link
            document.body.removeChild(link);

            console.log('CSV file download triggered successfully.');
        } else {
            console.error('No CSV data to download.');
        }
    }

}