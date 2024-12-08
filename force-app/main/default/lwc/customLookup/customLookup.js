import { LightningElement, api, track } from 'lwc';

export default class CustomLookup extends LightningElement {
    @api placeholder = 'Search...';
    @api fetchData; // Function to fetch data dynamically
    @track options = [];
    @track searchTerm = '';
    @track isSearching = false;

    async handleSearchChange(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm.length > 2 && this.fetchData) {
            this.isSearching = true;
            try {
                const data = await this.fetchData(this.searchTerm);
                this.options = data.map((item) => ({
                    label: item.Name,
                    value: item.Id,
                }));
            } catch (error) {
                console.error('Error fetching data:', error);
                this.options = [];
            }
            this.isSearching = false;
        } else {
            this.options = [];
        }
    }

    handleOptionClick(event) {
        const selectedValue = event.currentTarget.dataset.value;
        const selectedOption = this.options.find((option) => option.value === selectedValue);

        if (selectedOption) {
            this.searchTerm = selectedOption.label;
            this.options = [];
            this.dispatchEvent(
                new CustomEvent('selection', {
                    detail: selectedOption.value,
                })
            );
        }
    }
}
