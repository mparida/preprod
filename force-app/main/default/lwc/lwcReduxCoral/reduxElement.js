/**
 * This file contains the ReduxElement that extends the LightningElement. This will be the parent component for all redux component
 *
 * @author : https://github.com/chandrakiran-dev
 */

 import { LightningElement, track } from "lwc";
 import { bindActionCreators } from "./lwcReduxCoral";
 const getStore = (thisArg, callback) => {
     try {
         const eventStore = new CustomEvent("lwcredux__getstore", {
             bubbles: true,
             composed: true,
             detail: store => {
                 callback(store);
             }
         });
         if (eventStore) {
             thisArg.dispatchEvent(eventStore);
         }
     } catch (error) {
         console.error(error);
     }
 };
 
 const prepareProps = (thisArg, store) => {
     try {
         if (thisArg.mapStateToProps) {
             const state = thisArg.mapStateToProps(store.getState());
             return Object.assign({}, thisArg.props, state);
         }
     } catch (error) {
         console.error(error);
     }
     return thisArg.props;
 };
 
 export default class ReduxElement extends LightningElement {
     @track props = {};
     oldState;
     _unsubscribe;
     connectedCallback() {
         getStore(this, store => {
             if (store) {
                 try {
                     let actions = {};
                     if (this.mapDispatchToProps) {
                         actions = this.mapDispatchToProps();
                     }
                     this.props = prepareProps(this, store);
                     this.props = Object.assign({}, this.props, bindActionCreators(actions, store.dispatch));
                     this._unsubscribe = store.subscribe(this._handleStoreChange.bind(this));
                 } catch (error) {
                     console.error(error);
                 }
             }
         });
     }
 
     disconnectedCallback() {
         if (this._unsubscribe) {
             this._unsubscribe();
         }
     }
 
     _forceUpdate() {
         getStore(this, store => {
             try {
                 if (store) {
                     this.props = prepareProps(this, store);
                 }
             } catch (error) {
                 console.error(error);
             }
         });
         this.props = Object.assign({}, this.props);
     }
 
     _handleStoreChange() {
         this._updateOnlyOnChange();
     }
 
     _updateOnlyOnChange(){
         getStore(this, store => {
             try {
                 if (store) {
                     if (this.mapStateToProps) {
                         const state = this.mapStateToProps(store.getState());
                         let reload = false;
                         for(const key of Object.keys(state)){
                             const value = state[key];
                             const oldValue = this.oldState ? this.oldState[key] : undefined;
                             if(value !== oldValue){
                                 reload = true;
                                 break;
                             }
                         }
                         this.oldState = state
                         if(reload){
                             this.props = Object.assign({}, this.props, state);
                         }
                         
                     }
                 }
             } catch (error) {
                 console.error(error);
             }
         });
     }
 }