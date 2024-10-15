import { LightningElement, api } from 'lwc';

export default class ConsultNotes extends LightningElement {
  
    @api notes;
    
    
    onCancel() {
        const closeEvent = new CustomEvent('cancel');
        this.dispatchEvent(closeEvent);
    }

    get currentCounterValue () {
        return this.notes ? this.notes.length : 0;
    }


    handleChange(e) {
        const handleChangeEvent = new CustomEvent('change', {
            detail:{
                notes : e.target.value
            }
        })
        
        this.dispatchEvent(handleChangeEvent);
       
    }

    onNext() {
        const onNextEvent  = new CustomEvent('next');
        this.dispatchEvent(onNextEvent);
    }


}