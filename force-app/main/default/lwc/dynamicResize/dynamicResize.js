/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, api} from 'lwc';
import  { getLocalStorage, setLocalStorage } from './util/utility'
import { timeout, log } from 'c/utility';
export default class MyComponent extends LightningElement {

  @api placeholder;
  @api value;
  startY;
  startHeight;
  @api newHeight;
  timerId;

  handleChange(e){
    try {
      e.stopPropagation()
      const value = e.target.value;
      if (e.key === 'Enter' || e.keyCode === 13) return;
      if (value === '') return;
  
      const event = new CustomEvent("change", {
        detail: {
          value
        },
      });
  
     this.dispatchEvent(event)
    } catch (error) {
      log('ERROR', 'DynamicResize handleSend', error) 
    }
   
  }

  renderedCallback () {
    try {
      const textarea = this.template.querySelector('.dynamic_resize_textarea');
      if (textarea) {
        const height = getLocalStorage();
        textarea.style.height = (height? height : '100') + 'px';
        this.setFocus();
      }
      
    } catch (error) {
      console.log({error})
    }
   
  }

  errorCallback(error, stack) {
    // Log the error and stack trace
    console.error('Error in MyComponent:xxx', error);
    console.error('Stack trace:xxx', stack);
    
    // You can also log the error to an external service or perform other custom error handling
}


  selectedTextInput (e) {
    e.stopPropagation()
    let textInputName = e.target.dataset.name;
    const event = new CustomEvent("click", {
      detail: {
        name:textInputName
      },
    });
// Fire the event from c-list
     this.dispatchEvent(event);
   
  }

  handleSend (e) {
    try {
    
      e.preventDefault();

      if (e.target.value.trim() === '') return;

      const event = new CustomEvent("keyup", {
        detail: {
          keyCode : e.keyCode,
          shiftKey: e.shiftKey,
          name: e.target.dataset.name,
          target : {
             value  :e.target.value
          }
        },
      });

    

      this.dispatchEvent(event);
    
  
    } catch (error) {
      log('ERROR', 'DynamicResize handleSend', error) 
    }
   
    
  }

  debounce(func, delay) {
    clearTimeout(this.timerId);
    this.timerId = timeout(func, delay);
  }

  handleMouseDown(event) {
    if (event.target === this.template.querySelector('textarea')) return;
    event.stopPropagation();
    this.startY = event.clientY;
    this.startHeight = parseInt(
      window.getComputedStyle(this.template.querySelector('.dynamic_resize_textarea')).height,
      10
    );
    
    document.addEventListener('mousemove', this.resizeDiv);
    document.addEventListener('mouseup', this.stopResizeDiv);
  }

  handleMouseDownTexarea (e) {
    e.stopPropagation()
  }

  onsetheight = (newHeight) => {
     const onSetHeightEvents = new CustomEvent('setheight', {detail:{newHeight}});
     this.dispatchEvent(onSetHeightEvents);
  }

  resizeDiv = (event) => {
   
    const newHeight = this.startHeight + (this.startY - event.clientY);
    this.onsetheight(newHeight)
    setLocalStorage(newHeight);
    this.template.querySelector('.dynamic_resize_textarea').style.height = newHeight + 'px';
    
  };

  stopResizeDiv = () => {
    document.removeEventListener('mousemove', this.resizeDiv);
    document.removeEventListener('mouseup', this.stopResizeDiv);
  };

  adjustTextareaHeight(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  @api getValue () {
    const textArea = this.template.querySelector('textarea')
    return textArea.value;
  }

  @api clearValue () {
    const textArea = this.template.querySelector('textarea');
    textArea.value =null
    
  }

  @api addClasslist(mode) {
    const textArea = this.template.querySelector('textarea');
    textArea.classList.add(mode);
  }

  @api removeClasslist (mode) {
    const textArea = this.template.querySelector('textarea');
    textArea.classList.remove(mode);
  }
  @api setValue(text) {
    const textArea = this.template.querySelector('textarea');
    textArea.value = text
  }

  @api setFocus() {
    const textArea = this.template.querySelector('textarea');
    textArea?.focus();
  }
}