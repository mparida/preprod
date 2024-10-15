/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {log, timeout} from 'c/utility'

export default class ConsultSupervisorList extends LightningElement
{
    timerId;
    @api isSupervisorNameFlag = false;
   
    @api isLoading = false;
    @api notes;
    @api supervisors = [];


    @track searchVal = '';
   
    get consultList()
    {
        return this.filterSupervisorList();
    }

    get isEmptySupervisorsName()
    {
        return this.filterSupervisorList().length
    }

    onPrevious()
    {
        this.searchVal = ''
        const onPreviousEvent = new CustomEvent('previous');
        this.dispatchEvent(onPreviousEvent);
    }

    filterSupervisorList()
    {
        const { searchVal, supervisors } = this;
        if (searchVal)
        {
            return supervisors.filter(supervisor => supervisor.name.toLowerCase().includes(searchVal));
        } 

            return supervisors;
       
    }

    onLoading = (value) => {
        const onLoadingEvent = new CustomEvent('loading', {detail: {isLoading:value}} )
        this.dispatchEvent(onLoadingEvent);
    }

    handleSearch(e)
    {
        //this.isLoading = true;
        
        this.onLoading(true);
        
        const value = e.target.value.toLowerCase();
        this.debounce(() =>
        {
            //this.isLoading = false;
            this.onLoading(false);
            this.searchVal = value;
        }, 250)
    }

    debounce(func, delay) {
        clearTimeout(this.timerId);
        this.timerId = timeout(func, delay);
      }

    onConsult(e)
    {
        try
        {
            const id = e.currentTarget?.dataset?.id;
            if (!id) {
                log('ERROR', 'Missing id for selected supervisor.');
                return;
            }
            const onConsultEvent = new CustomEvent('consult', {
                detail: {
                    id,
                }
            })

            this.dispatchEvent(onConsultEvent);
        }
        catch (error)
        {
            this.dispatchEvent(new ShowToastEvent({
                title: "Consult Error",
                message: error,
                variant: "error"
            }));
        }
    }




}