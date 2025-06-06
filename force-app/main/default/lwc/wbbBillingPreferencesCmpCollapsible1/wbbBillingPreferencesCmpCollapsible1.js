import { LightningElement, api } from 'lwc';
import { Redux } from 'c/lwcRedux';
import { updatePayment, addCart, updateTNCKeys } from 'c/buyFlowActions';
import getRetailCustomSettings from '@salesforce/apex/RetailUtil.getRetailCustomSettings';
import * as BwcBillingAccount from 'c/bwcBillingAccount';//25402
import * as BuyFlowUtils from 'c/buyFlowUtils';
import * as FlowState from 'c/flowStateUtil';

export default class WbbBillingPreferencesCmpCollapsible extends Redux(LightningElement) {
    @api suppliedValues;
    @api billingPreferencesSectionData;
    @api productType;
    @api recordId;

    isAutoPay;
    enrollPaperlessBillingCheckBoxVal;
    emailAddress;
    enableAutopay = false;
    isPaperlessBillingDisabled = false;
    isLoading = false;
    showModalSpinner = true;
    billingPreferenceSummaryData = [];

    mapStateToProps(state) {
        return {
            selectedService: state.selectedService,
            customer: state.customer,
            payment: state.payment,
            cart: state.cart,
            pages: state.pages,
            buyFlowPaymentMethod: state.getBuyFlowPaymentMethod,
            cartId: state.cartId,
            uuId: state.uuId
        };
    }

    mapDispatchToProps() {
        return {
            updatePayment,
            updateTNCKeys,
            addCart
        };
    }

    get editButtonVariant() {
        if(this.billingPreferencesSectionData.isEdited){
            this.handleEnroll();
        }
        return this.billingPreferencesSectionData.isEditing ? 'brand' : 'neutral';

    }

    async connectedCallback() {
        await super.connectedCallback();
        this.isAutoPay = this.props.payment.paymentDefault.autoPayFlag;
        this.enrollPaperlessBillingCheckBoxVal = this.props.payment.paymentDefault.paperlessBilling;
        this.emailAddress = this.props.customer.interactionDetails.email;
        console.log(JSON.stringify(this.billingPreferencesSectionData));

        /*if (this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value && !this.isWLSBuyFlow) {
            if (await BuyFlowUtils.fetchFeatureValue('EnableAutoPayCheckboxOnBillingPage')) {
                let output = await getRetailCustomSettings({ key: 'AllowedProductsToEnableAutopay' });
                this.allowedProductsToEnableAutopay = output.toLocaleLowerCase().split('|');
                if (this.allowedProductsToEnableAutopay.includes(this.productType.toLocaleLowerCase())) {
                    this.enableAutopay = true;
                }
            }
        }

        let output = await getRetailCustomSettings({ key: 'AllowedProductsToEnablePB' });
        if (output) {
            let availableProductsForPaperlessBilling = output.includes('|') ? output.split('|') : output;
            if (availableProductsForPaperlessBilling.includes(this.props.selectedService.service)) {
                this.isPaperlessBillingDisabled = false;
            }
        }*/

        

        /*this.boolCheckBoxValue = this.props.payment?.paymentDefault?.paperlessBillingConsentProvided;
        this.dispatchEvent(new CustomEvent('enrollpaperlessbillingcheckbox', { detail: this.enrollPaperlessBillingCheckBoxVal }));
        BwcUtils.log('paperless billing enrolled-->' + this.enrollPaperlessBillingCheckBoxVal);
        BwcUtils.log('Section data' + JSON.stringify(this.paperlessBillingSectionData));
        if (this.props && this.props !== {}) {
            this.emailAddress = this.props.customer?.interactionDetails?.email;
            if (this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {//25402
                if (this.props.selectedService?.service.toLowerCase() === this.productSubCategory.toLowerCase() || this.props.selectedService?.service === 'WBB') {
                    this.showPaperlessbillingSection = true;
                }
            }
            let output = await getRetailCustomSettings({ key: 'AllowedProductsToEnablePB' });
            if (output) {
                let availableProductsForPaperlessBilling = output.includes('|') ? output.split('|') : output;
                if (availableProductsForPaperlessBilling.includes(this.props.selectedService.service)) {
                    this.isPaperlessBillingDisabled = false;
                } else {
                    this.isPaperlessBillingDisabled = true;
                }
            }
        }
        if ((this.props.selectedService?.service.toLowerCase() === this.productSubCategoryAia?.toLowerCase() && this.props.pages.data?.previousPage == 'Review') ||
            (this.props.selectedService?.service.toLowerCase() === this.productSubCategoryBb?.toLowerCase() && this.props.pages.data?.previousPage == 'Review')) {
            if (this.enrollPaperlessBillingCheckBoxVal) {
                this.boolCheckBoxValue = true;
                this.handleEnroll();
            }
        }
        //retain acceptance
        let storedKey = this.props.customer.acceptedTNCKeys;
 
        let storekeyArray = BwcUtils.convertStringToArray(storedKey, ',');
        if (BwcUtils.isArrayContainValue(storekeyArray, this.tncKey)) {
            this.isTncChecked = true;
            this.boolCheckBoxValue = true;
            this.handleEnroll();//CDEX-339300
        }*/
    }

    paperlessBillingCheckBoxHandler(event) {
        let checkBoxVal = event.detail.checked;
        this.enrollPaperlessBillingCheckBoxVal = event.detail.checked;
        this.dispatchEvent(new CustomEvent('ispaperlessbillingchanged'));
        this.dispatchEvent(new CustomEvent('enrollpaperlessbillingcheckbox',{detail:checkBoxVal}));
    }

    autopayCheckboxHandler(event) {
        this.isAutoPay = event.detail.checked;
        this.dispatchEvent(new CustomEvent('ispaymenttermschangedparent'));
        this.dispatchEvent(new CustomEvent('enrollautopaycheckboxval', {detail:event.detail.checked}));
    }

    async executeContinue() {
        this.isLoading = true;
        this.props.payment.paymentDefault.autoPayFlag = this.isAutoPay;
        this.props.payment.paymentDefault.paperlessBilling = this.enrollPaperlessBillingCheckBoxVal;
        this.props.updatePayment(this.props.payment);
        this.handleEnroll();
        await FlowState.upsertSetupBillingFields(this.recordId, this.enrollPaperlessBillingCheckBoxVal, null, this.isAutoPay, null, null, null, null, null, null, null, null, null, null)
            .then(result => {
                this.isLoading = false;
            }).catch(error => {
                this.isLoading = false;
            });
        const passContinueClickEvent = new CustomEvent("continueclick", { detail: this.billingPreferencesSectionData });
        this.dispatchEvent(passContinueClickEvent);
    }

    handleEnroll() {
        this.billingPreferenceSummaryData = [];
        let enrollInAutopay = this.props.payment.paymentDefault.autoPayFlag ? 'Enrolled' : 'Unenrolled';
        let enrollInPaperlessBilling = this.props.payment.paymentDefault.paperlessBilling ? 'Enrolled' : 'Unenrolled';
        let summaryAutoPay = { key: 'AutoPay', value: enrollInAutopay };
        let summaryPaperlessBilling = { key: 'Paperless Billing', value: enrollInPaperlessBilling }
        this.billingPreferenceSummaryData.push(summaryAutoPay, summaryPaperlessBilling);
    }

    handleEdit() {
        const passEditClickEvent = new CustomEvent("editclick", {
            detail: this.billingPreferencesSectionData
        });
        this.dispatchEvent(passEditClickEvent);
    }
}