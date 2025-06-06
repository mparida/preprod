import { api, LightningElement, track, wire } from 'lwc';
import { Redux } from 'c/lwcRedux';
import paymentDetailsTitle from '@salesforce/label/c.WBB_PAYMENT_DETAILS_LABEL';
import paymentMethodType from '@salesforce/label/c.WBB_PAYMENT_METHOD_TYPE';
import paymentMethodAccountButton from '@salesforce/label/c.WBB_PAYMENT_METHOD_ACCOUNT_BUTTON';
import paymentMethodCardButton from '@salesforce/label/c.WBB_PAYMENT_METHOD_CARD_BUTTON';
import oneTimePaymentDetailsTitle from '@salesforce/label/c.wbb_one_time_payment_details';
import payOneTimeCheckBoxLabel from '@salesforce/label/c.WBB_PAY_ONE_TIME';
import { CurrentPageReference } from 'lightning/navigation';
import usePaymentTerminal from '@salesforce/label/c.USE_PAYMENT_TERMINAL';
import errorPayOneTimeCharges from '@salesforce/label/c.WBB_ERROR_PAY_ONE_TIME_CHARGES';
import errorPaymentDetails from '@salesforce/label/c.WBB_ERROR_PAYMENT_DETAILS';
import erroroneTimePaymentDetails from '@salesforce/label/c.WBB_ERROR_ONE_TIME_PAYMENT_DETAILS';
import BUY_FLOW_PERIPHERAL_PROCESSING_ERROR from '@salesforce/label/c.Buy_Flow_Peripheral_Processing_Error';
import scrollToErrorMsgChannel from '@salesforce/messageChannel/ScrollToTopMsgChannel__c';
import { subscribe, MessageContext, APPLICATION_SCOPE, publish} from 'lightning/messageService';
import {getAIATenderPromotionCallout,helper_tenderPromotionCallout,helper_verifyOTPHandler, helper_updateBan, helper_verifyCVVHandler,setCVVUI, handleTenderCardInFlowState, handleTenderCardInFlowStateForExist, handleError, updatePaymentObject,setperipheralValueOnLoad} from './wbbBillingPaymentDetailCmpCollapsible_Helper';//SPTSLSATT-20214 setperipheralValueOnLoad
import browserEncryptionFlag from '@salesforce/customPermission/Browser_Encryption_Feature_Flag'; 
import * as peripheralService from 'c/buyFlowPeripheralService';
import * as FlowState from 'c/flowStateUtil';
import { NavigationMixin } from "lightning/navigation";
import * as BwcUtils from 'c/bwcUtils';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import cancelPayment from 'c/buyFlowCancelPaymentModal';
import Cancel_Payment_Label from '@salesforce/label/c.Cancel_Payment_Label';
import Cancel_Payment_Body from '@salesforce/label/c.Cancel_Payment_Body';
import Cancel_Payment_Sub_Body from '@salesforce/label/c.Cancel_Payment_Sub_Body';
import Cancel_Payment_CancelBtn from '@salesforce/label/c.Cancel_Payment_CancelBtn';
import Cancel_Payment_ConfirmBtn from '@salesforce/label/c.Cancel_Payment_ConfirmBtn'
import WBB_Delete_Card from '@salesforce/label/c.WBB_Delete_Card';
import WBB_Delete_Card_title from '@salesforce/label/c.WBB_Delete_Card_title';
import WBB_Delete_Card_body from '@salesforce/label/c.WBB_Delete_Card_body';
import { getErrorMessage as peripheralError } from 'c/buyFlowUtils';
import WBB_Cancel_Payment_Message from '@salesforce/label/c.WBB_Cancel_Payment_Message';
import WBB_Cancel_Payment_Error_Message from '@salesforce/label/c.WBB_Cancel_Payment_Error_Message';
import { updateBuyFlowPaymentMethod, updateBAN, setPeripheralParameters, addBusinessKeys,updateAutoPayPaymentMethod,updateOTPPaymentMethod,updateGetPaymentMethod,addCart,updateCashRegisterInfo, updateSecurePaymentFlag} from 'c/buyFlowActions';//Cash Enhancement
import STORE_PAYMENT_METHOD from '@salesforce/label/c.WBB_STORE_PAYMENT_METHOD';
import cardInfo from '@salesforce/label/c.Card_Info';
import verifyCVV from '@salesforce/label/c.Verfiy_CVV';
import Secure_Link_Payment_Success_Message from '@salesforce/label/c.Secure_Link_Payment_Success_Message';
import Card_Information_Save_Error from '@salesforce/label/c.Card_Information_Save_Error';
import * as paymentServices from 'c/wbbPaymentServices';
import * as wbbParentServices from 'c/wbbParentServices';
import scrollToTopMsgChnl from '@salesforce/messageChannel/ScrollToTopMsgChannel__c';
import ProfileOwnerPrefix from '@salesforce/label/c.Profile_Owner_Prefix';
import getMerchantId from '@salesforce/apex/BuyFlowUtils.getMerchantID';
import * as BwcBillingAccount from 'c/bwcBillingAccount';//25402
import * as WbbConstants from 'c/wbbConstants';
import hasVoiceRedactionPermission from '@salesforce/customPermission/VoiceRedaction';//SPTSLSATT-8762
import * as RAISR_MSG_CH from "c/bwcRaisrMsgPubSubCmp";   //SPTSLSATT-8762
import HAS_ENTER_BILLING_PAYMENT_DETAILS from '@salesforce/customPermission/Enter_Billing_Payment_Details';//SPTSLSATT-8762
import processTokenizedFields from '@salesforce/apex/WBB_PaymentProfileController.processTokenizedFields';//SPTSLSATT-8762
import getChanneltype from '@salesforce/apex/BWC_Utils.getChannelForCurrentInteraction';//SPTSLSDEL-27131
import prepaymentMessageNonCash from '@salesforce/label/c.Prepayment_MessageNonCash';//  CDEX-291568
import getFlowState from '@salesforce/apex/buyFlowStateUpsert.getFlowState'; //CDEX-295779
import * as BwcConstants from "c/bwcConstants";
import hasWfhPermission from '@salesforce/customPermission/WFH_Agent_Custom_Permission'; 
import getVisibility from '@salesforce/apex/BuyFlowUtils.getVisibility';//SPTSLSATT-13531
import wbbAutopay from '@salesforce/label/c.wbbAutopay';
import wbbAutopayGreyBox from '@salesforce/label/c.wbbAutopayGreyBox';
import Patch_Error_Message from '@salesforce/label/c.Patch_Error_Message';//GTT Ban Pull - 1/15 - CDEX-375688 and CDEX-375083
import * as BuyFlowUtils from "c/buyFlowUtils"; //CCSTSP-1944
import BB from '@salesforce/label/c.ProductType_Broadband';//  SPTSLSATT-13531
// import getTenderTypeInfo from '@salesforce/apex/buyFlowStateUpsert.getTenderInfo';//SPTSLSATT-13817

import OneTimePayment from '@salesforce/label/c.OneTimePayment';//SPTSLSATT-13530
import OneTimePaymentMessage from '@salesforce/label/c.OneTimePaymentMessage';//SPTSLSATT-13530
import OneTimePaymentMessageCash from '@salesforce/label/c.OneTimePaymentMessageCash';//SPTSLSATT-13530
import getFlowStateByInteractionId from '@salesforce/apex/buyFlowStateUpsert.getFlowStateByInteractionId'; // Cdec 325796
import BWC_Peripheral_Debug from "@salesforce/customPermission/BWC_Peripheral_Debug";
const COMPONENT_TYPE = 'LWC'; //SPTSLSATT-20239
const COMPONENT_NAME = 'WbbPaymentDetailCmpCollapsible'; //SPTSLSATT-20239
import PatchBillingPreferenceErrormsg from '@salesforce/label/c.PatchBillingPreferenceErrormsg';

export default class WbbBillingPaymentDetailCmpCollapsible extends NavigationMixin(Redux(LightningElement)) {
    flowState;bankDisc;debitCardDisc;CitiCardDisc;CreditCardDisc;abpOneTimePlan=false;
    pageName= 'BillingPagePaymentSection';showCashSection=false;otpSummaryViewCash=false;autoPaySummaryView=false;
    AIADiscountInfo='';AIATendertypeABP_FeatureFlag=false;showAiaTenderInfo=false;showAiaReadToCust=false;AIATenderReadToCustObj='AIA_BillingPageABP_ReadAloud';
    @wire(CurrentPageReference) pageRef;
    mapStateToProps(state) {
        return {
            customer: state.customer,cartId: state.cartId,uuId: state.uuId,camsPaymentMethod : state.getPaymentMethod,peripheralParameters: state.peripheralParameters,camsPaymentAuthorizeResponse: state.camsPaymentAuthorizeResponse,buyFlowPaymentMethod: state.getBuyFlowPaymentMethod,camsProductPurchaseReview: state.camsProductPurchaseReview,cart: state.cart,payment: state.payment,cashRegisterInfo:state.cashRegisterInfo
        };
    }
    mapDispatchToProps() {
        return { updateBuyFlowPaymentMethod ,updateBAN, setPeripheralParameters,addBusinessKeys,updateAutoPayPaymentMethod,updateOTPPaymentMethod,updateGetPaymentMethod,addCart,updateCashRegisterInfo, updateSecurePaymentFlag};//Cash Enhancement
    }
    label={paymentDetailsTitle,STORE_PAYMENT_METHOD,paymentMethodType,paymentMethodAccountButton,oneTimePaymentDetailsTitle,paymentMethodCardButton,payOneTimeCheckBoxLabel,errorPayOneTimeCharges,errorPaymentDetails,erroroneTimePaymentDetails,usePaymentTerminal,WBB_Cancel_Payment_Message, WBB_Cancel_Payment_Error_Message,cardInfo, verifyCVV,Secure_Link_Payment_Success_Message,Card_Information_Save_Error,ProfileOwnerPrefix,prepaymentMessageNonCash,BB,wbbAutopay,wbbAutopayGreyBox,OneTimePayment,OneTimePaymentMessage,OneTimePaymentMessageCash,Patch_Error_Message,PatchBillingPreferenceErrormsg}; //GTT Ban Pull - 1/15 - CDEX-375688 and CDEX-375083
    @wire(MessageContext)
    messageContext;
    cvvInputSize;otpButtonSize = 4;authButtonSize;
    @api recordId;@api showPeripheralCard;@api showPeripheralOcCheck;@api paymentDetailSectionData;
    veriedDisabled = true;verified = false;verifiedOTP = false;verifyLabel;verifyOTPLabel;
    delCancelLabel;displayDel;displayOTPDel;veriedDisabledOTP = true;deleteCardStaticLabel = 'Delete Card';hideVerifyBtn = false;
    cardInfo = true;hideCVV = false;isDisableCheckbox = false;cvvClass = 'cvv';
     rcCvv;ocCvv;rcZip;
    @api interactionId;@api checkBoxOnetime = false;@api checkboxOnetime;@api storeDetails;@api otp;
     showPaymentComponent;showPaymentComponentForOneTime;isbankaccount; cardData;isnewcard = false;  isnewbankaccount = false ;  paymentDetails = false; 
    encryptCardNumber = false; encryptCardNumberOneTime = false; 
    @api storeOneTimePaymentProfile ; @api patchingDetails; 
    KEYS = { 
        OA: 'OA',AP : 'AP',ME : 'ME',OP : 'OP',OF : 'OF',PAPERLESS_DISCLOSURE : 'PAPERLESS_DISCLOSURE',READALOUD_AUTO_E_BILL : 'ReadAloud_AUTOPAY_E-BILL'
    };
    merchantId='';
    @api enrollInAutoPaycheckbox;
    @api termsAndPayment; 
    isPaymentCalloutSuccess = false;isPatchError; showTopError; 
    @api getError=false; @api statusMessage;@api successFlag;@api newCardSelectedForOTP;@api userSelectedOTPCHeck; 
    validateCheckbox = false; validatePreviousCard = false; 
    @api paymentTypeMethodButtonRequired;
     isBankAccount = false;isCreditOrDebit = false;isBankAccountOneTime = false;isCreditOrDebitOneTime = false;isAutoPayCheckBoxRequired=true;isAutoPayCheckBoxRequiredOtp=false;
	@api uncheckedArray;@api errorMessageLabel;@api errorMessageLabelOneTime; @api errorMessageIcon;@api errorMessageBackground;@api showAlert;@api showAlertOneTime = false; 
     payMethodId;OcPayMethodId;messageLabelAutoPay;nameForPayment='payment';nameForOneTimePayment='oneTime';isAccountOtp=false;
     isAutopayRequired=true;isAccountsExist=false;isCardsExist=false;
     showPaymentComponentForBankForOneTime;showPaymentComponentForCardForOneTime;showPaymentComponentForBank=false;showPaymentComponentForCard=false;
    paymentDetailSummaryData;paymentDetailOTPSummaryData;isPaymentDetail='';
    @api originalIndividualId;
    @api interactionRecordIdValue;
    showNonACHReadAlaud = false;featureFlag = false;tenderApiError = false;tenderInfoBanner=false;//SPTSLSATT-13531
    @api cartId;
    @track objApiResponse;
    @track patchApiProfile={
        'channel': {'name': 'ATTR','role': 'Agent'},
        'payments': []
    };
    showModalSpinner=true; //CCSTSP-424
    newAbpDetails=false;payMethodIdParent=null;showModalSpinnerPdt; cvvDisable = false;cvvDisableOtp = false;isStoreOneTimePaymentProfile = false;paymentMethodId;
    paymentMethodIdOtp;isDisableUseCardRead;isDisableUseCardReadRC;
     @api prePaymentCharges;@api advPay = false;
     isDisabled=true;isChecked=false;accountSelectionOneTimeDisabled = false;boolRecurringErrorFlag = false;boolOtpErrorFlag = false;
    buyFlowPaymentMethod = {};camsPaymentMethodPayload = {};objOneTimeAddResponse;objAddResponse;oneTimeChargeForFlow;
    @api businessKeysfromMetadata;@api paymentBusinessKeys;@api proratedChargesValue;
    boolProratedCharges = false;
    @api proRationAmountMsg;returnToEnable=false;messageLabel;messageIcon;messageBackground;@api flowName;
    newEntryFillUserSelection = false;showPeripheralError = false;showPeripheralErrorOTP = false;hasPaymentMethod;bankOrCardDetailsOneTime;/*SPTSLSATT-19998 start*/bankOrCardDetails = 'Account';/*SPTSLSATT-19998 end*/
    cardListValueOneTime=true;cardListValue = true;isScanButtonRequired = true;isStoreDetailCheckBoxRequired = false;isStoreDetailCheckBoxRequiredOtp=true;
    isCard=true;isShowToastAutoPay =false;cardType;cardLastfourDigits;expMonth;expYear;
    @api hideAbp;
     strProrationAmount = ''; costPrice = ''; disableButtonPaymentOtp = false; disableButtonPayment = false; paymentType; paymentNumber; otpPaymentType; otpPaymentNumber; 
    displayOtpHideAbpTemp=false;displayAbpTemp=false;firstTimeLoad = true;copyAbpToOtpTemp;abpCardData={};abpCardDataOtp={};
    otpCardDataInCollapsible=false;paymentDetailOTPSummaryData;otpSummaryView = false;selectedCardDetails;selectedBankDetails;
     cashvisibility = false;firstTimeLoad = true;// CDEX-293821
    @track result;tenderType;provideType='non-citiCobranded';autoPayStatus='Unenrolled';isAutoBillPaySet=false;updateTenderFlowState=false;@api agentId;//SPTSLSATT-13817
    showCardComponent = false;
    showPaymentFormForCardAbpPost = true;
    @track cardCaptured; //CDEX-30265 ak4124 11/19/24
    isAddNewCard=false;//CDEX-359467-ak4124-11/12/24
    paymentMethodCard= false; paymentMethodBank = false; // CDEX-363501-ak4124-12/3/24
    iscardSection = false; //CDEX-321969 | SPTSLSATT-19403 | SPTSLSATT-19400

    @track activeTabValue = 'ACH';
    @track activeTabValueOTP = 'ACHOTP';
    @api
    setDisplayAbp(value)
    {
        this.displayAbpTemp = value;
        this.displayAbp = value;
    }
    @api 
    get displayAbp(){
        return this.displayOtpHideAbpTemp;
    }
    set displayAbp(value){
            this.displayOtpHideAbpTemp = value;
        }
    @api 
    get displayOtpHideAbp(){
        return this.displayOtpHideAbpTemp;
    }
    set displayOtpHideAbp(value){
        this.displayOtpHideAbpTemp = value;
    }
    @api 
    get copyAbpToOtp(){
        return this.copyAbpToOtpTemp;
    }
    set copyAbpToOtp(value){
        this.copyAbpToOtpTemp = value;
        if (this.copyAbpToOtpTemp || this.isChecked) {
            this.otp = true;}else{
            this.otp = false;}
    }
    @api get editButtonVariant(){  
        let variant;
        variant = this.paymentDetailSectionData.isEditing ? "brand":"default";
        if(this.firstTimeLoad){//SPTSLSATT-20214 removed showPeripheral
        this.callPaymentRetrivalAPI();
        this.firstTimeLoad= false;
        }
        // this.changeButtonColour(this.cardListValue ? 'account' : 'card');
        this.activeTabValue = this.cardListValue ? 'ACH' : 'CARD' ;
        if(!this.showPeripheral && !this.firstTimeLoad){
            this.displayOtpHideAbpTemp = this.props.payment.paymentDefault.autoPayFlag;
            this.enrollInAutoPaycheckbox = this.props.payment.paymentDefault.autoPayFlag;
        }
        //START SPTSLSATT-20214
        if(this.showPeripheral && !this.isAchRetailFeatureFlagEnabled){
            setTimeout(() => {
                //this.changeButtonColour('card');
                this.activeTabValue = 'CARD' ;
            }, "2000");
            this.cardListValue = false;
            this.hasPaymentMethod= false;
        }
        //END SPTSLSATT-20214
        return variant;
    }
    
    _isPaymentRetrivalRequired = false;
    set isPaymentRetrivalRequired(value) {
        if (value && !this.isSettterMethodPaymentRetrivalCalled) {//SPTSLSATT-20214
            this._isPaymentRetrivalRequired = value;
            this.callPaymentRetrivalAPI(); //CDEX-400888
            this.isSettterMethodPaymentRetrivalCalled = true;//SPTSLSATT-20214
        }
    }
    @api get isPaymentRetrivalRequired() {
        return this._isPaymentRetrivalRequired;
    }
    isCreditCard; //CCSTSP-1944
    cardOTPType;
    cardOTPLastfourDigits;
    expMonthOTP;
    expYearOTP;
    useCaseCredit=false;
    isPaymentCardInfoFilled = false;
    @api cardDataPayloadHandler;@track recurringAndOtpData ;@api prepaymentMessage;
    boolPrePayment=false;
    @api showError;
    @api showErrorFunction(value){
        this.template.querySelector('c-reusable-card-list-cmp').boolDisplayErrorMethod(value);
    }
    @api updateErrorFieldName;@api timeoutRequired;@api isCloseBtnRequired;
    @api
    get finalData(){
        return this.recurringAndOtpData;
    }
    set finalData(value){
        if(value){
            this.checkErrorOnContinue(value);
            this.recurringAndOtpData = value;
        }
    }
    @api
    get isOneTimePaymentCheckbox(){
        return this.isChecked;
    }
    set isOneTimePaymentCheckbox(value){
        // this.isChecked = this.iscentersOTPBankEnabled ? false : value;//SPTSLSATT-22473
        // this.otp = this.iscentersOTPBankEnabled ? false : value;//SPTSLSATT-22473
    }
    @api
    get otPaymentMethodId(){
        return this.OcPayMethodId;
    }
    set otPaymentMethodId(value){
        this.OcPayMethodId = value;
    }
    @api showSecurePaymentSection; 
    @api ban;@track capabilities;@track capabilitesOtp;@api prefetchedData={};showSuccessBannerForABP = false;showSuccessBannerForOTP = false;
    get buyFlowCapabilities(){
        this.capabilities=this.cardListValue?'SALES_BANK_NO_CHECK_NUM':'SALES_CREDCARD';
        return this.capabilities;
    }
    get buyFlowCapabilitiesOtp(){
        if(this.otp && !this.cardListValueOneTime){
            this.capabilitesOtp = ['SALES_CREDCARD','SALES_OTP'];
        }    
        return this.capabilitesOtp;
    }
@track response;
    paymentTypeBank = true;
    oneTimePayment=false;
    @track profileListDetails;
    isLoading;

    @api showLoadingSpinner = false;
    @api showLoadingSpinnerOTP = false;
    isOneTimePayment = false;
    @api isShowToast = false;
    @api
    get showToastError(){
        return this.isShowToast;
    }
    set showToastError(value) {
        this.isShowToast = value;
    }
    @api
    get showToastAutopay(){
        return this.isShowToastAutoPay;
    }
    set showToastAutopay(value) {
        this.isShowToastAutoPay = value;
    }
    @api showPeripheral;@api productType;@api peripheralParameters;
    retailBankEnabler = false;//SPTSLSATT-20214
    isRetailBankEnabled = false;//SPTSLSATT-20214
    isBankSectionRender= true;//SPTSLSATT-20214
    isReatilBankAllFieldChecked = false;//SPTSLSATT-20214
    @api isAchRetailFeatureFlagEnabled = false;//SPTSLSATT-20214
    isSettterMethodPaymentRetrivalCalled = false;//SPTSLSATT-20214
    showWarningMsgForToggleBank = false;//SPTSLSATT-20214
    @api isRetail;//SPTSLSATT-22473
    @api isCenters;//SPTSLSATT-22473
    iscentersOTPBankEnabled = false;//SPTSLSATT-22473
    peripheralPaymentIdRC;peripheralCardDataRC;peripheralPaymentIdOC;peripheralCardDataOC;peripheralAuthorizationId;isContinueButtonDisable=true;executeContinueIsInProgress = false;
    get showOneTimeChargesCheckbox(){
        return this.prePaymentCharges && this.prePaymentCharges != null && this.prePaymentCharges > 0.00;
    }
    get cancelPaymentBtnSize(){
        return !this.isStoreOneTimePaymentProfile;
    }
    @api 
    enableUseCardReaderBtn(){
        this.isDisableUseCardRead = false;
        this.isDisableUseCardReadRC = false;
    }
    @track paymentProfile = {
        individualId: 'f92a53ce-fa11-4173-b109-bc7b4ec08178',
        storeTermsConditionConsent: false,
        tncId: 0,
        customerAgreement: '',
        profileName:'',
        paymentMethod: {}
    }
    @track paymentMethod = {
        type: '',
        card: {},
        bankAccount: {}
    };
isVoiceMaskingButtonVisible = hasVoiceRedactionPermission;
    get showVoiceRedactionButton(){return hasVoiceRedactionPermission;}
    hasRaisrPermissions = hasVoiceRedactionPermission;
    isRaisrActive = false;
    //SPTSLSATT-20239 - start
hideOnCatchError = '';//CDEX-398186
    @api setUpBillingPageIssues = false;
    get hidePaymentDetailSection(){
        return this.setUpBillingPageIssues && this.showLoadingSpinner ? 'slds-hide' : '';
    }
    @api lastExecutedTab = '';
    //SPTSLSATT-20239 - end
    checkErrorOnContinue(finalData){
        this.showAlert = false;
        this.showAlertOneTime = false;
        this.errorMessageBackground = 'error';
        this.errorMessageIcon = BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.UTILITY_ICON;
        if(finalData.recurringErrorResponse){
            this.showAlert = true;
            this.errorMessageLabel = finalData.recurringErrorResponse.description; 
            this.scrollToErrorSection('showAlertDiv');
        }
        if(finalData.otpErrorResponse){
            this.showAlertOneTime = true;
            this.errorMessageLabelOneTime = finalData.otpErrorResponse.description;
            this.scrollToErrorSection('showAlertOneTimeDiv');
        }
    }
     handleVanishError(){
        this.showAlert = false;
        this.errorMessageLabel = null;
    }
     handleVanishOneTimeError(){
        this.showAlertOneTime = false;
        this.errorMessageLabelOneTime = null;
    }
    //SPTSLSATT-19998 start
    handleHasSavedPayments(event){
        try {
        this.highLightLastExecutedTab();//CDEX-403787
        if(!this.otp){
        let paymentMethodType = event.detail.paymentMethodType;
        let savedPaymentMethods = event.detail.savedPaymentMethods;

        if(paymentMethodType === 'CARD' && !this.showPeripheral){//SPTSLSATT-20214
            this.hasSavedCards = savedPaymentMethods;
        } else if(paymentMethodType === 'ACCOUNT'){
            this.hasSavedAccounts = savedPaymentMethods;
        }

        if((this.bankOrCardDetails === 'Account' && this.hasSavedAccounts && !this.isAddNewBank) || (this.bankOrCardDetails === 'Card' && this.hasSavedCards && !this.isAddNewCard)){
            this.isContinueButtonDisable = false;
        } else if((this.bankOrCardDetails === 'Account' && !this.hasSavedAccounts) || (this.bankOrCardDetails === 'Card' && !this.hasSavedCards)){
            this.isContinueButtonDisable = true;
        }
        //START SPTSLSATT-20214
        if(this.showPeripheral && this.otp && !this.verifiedOTP){
            this.isContinueButtonDisable = true;
        }
        //END SPTSLSATT-20214
        } 
	} catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handleHasSavedPayments', error); //SPTSLSATT-20239
        }

    }
    
    //SPTSLSATT-19998 end
    get showPaymentFormForBank(){
        //CDEX-363501/502-ak4124-12/3/24 Start
        this.isAddNewCard = false;
        if(this.payMethodId && this.paymentMethodCard){
            this.isContinueButtonDisable = true;//SPTSLSATT-20214
         }
         if(this.isPaymentCardInfoFilled){//SPTSLSATT-20214
            this.isContinueButtonDisable = false;
         }
         if(this.isReatilBankAllFieldChecked ){//SPTSLSATT-20214
            this.isContinueButtonDisable = false;
         }
        if(this.isRetailBankEnabled && this.showPeripheral && this.showPeripheralCard && this.displayDel && !this.otp){//SPTSLSATT-20214 LOW
            this.isContinueButtonDisable = false;
         }
         //CDEX-363501/502-ak4124-12/3/24 End
        if((this.payMethodId && this.payMethodId.value === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value)){
            this.showPaymentComponentForBank = true;
        }
        if((this.showPaymentComponentForBank ||!this.hasPaymentMethod) && !this.isToggled){ //SPTSLSATT-19998
            return true;
        }
        return false;
    }
    get showPaymentFormForCard(){
        if((!this.showPaymentFormForCardAbpPost || this.profileListDetails) && !this.otp && !this.isAddNewCard && !this.iscardSection &&  this.hasSavedCards ) //CDEX-359467-ak4124-11/12/24 //SPTSLSATT-20214 -hasSavedCards
            this.isContinueButtonDisable = false;
        if(this.isRetailBankEnabled && !this.isBankSectionRender){//SPTSLSATT-20214
            if(!this.showPeripheralCard && !this.otp && !this.isContinueButtonDisable && !this.isDisableUseCardReadRC){
                this.isContinueButtonDisable = true;
            }
        }
        if(this.isRetailBankEnabled){
            if(this.showPeripheral && this.showPeripheralCard && this.displayDel && !this.otp){//SPTSLSATT-20214 LOW
                this.isContinueButtonDisable = false;
            }
            if(this.showPeripheral && this.showPeripheralOcCheck && this.displayOTPDel && this.otp && (this.showPeripheralCard && this.displayDel)){//SPTSLSATT-20214 HIGH
                this.isContinueButtonDisable = false;
            }
        }
        if((this.payMethodId && this.payMethodId.value === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_CARD)){
            this.showPaymentComponentForCard = true;
        }
        if((this.showPaymentComponentForCard ||!this.hasPaymentMethod) && this.showPaymentFormForCardAbpPost && this.isAddNewCard){//CDEX-363501/502-ak4124-12/3/24
            return true;
        }
        return false;
    }
    get showExistingPaymentMethod(){
        return this.hasPaymentMethod && !this.showPeripheral;
    }
    dispatchFilteredListEvent(filteredArrayVar){
        const filteredList = new CustomEvent('otpfilterlist',{
            detail:filteredArrayVar
        });
        this.dispatchEvent(filteredList);
    }
    get OneTimeShowPaymentFormForBank(){
        if((this.OcPayMethodId && this.OcPayMethodId.value === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value)){
            this.showPaymentComponentForBankForOneTime = true;}
        if(this.accountSelectionOneTimeDisabled){
            this.isBankAccountOneTime = false;this.isCreditOrDebitOneTime = true;
            this.togglePaymentButtonsOneTime('CardOneTime', this.isBankAccountOneTime, this.isCreditOrDebitOneTime);}
        if(this.showPaymentComponentForBankForOneTime ||!this.hasPaymentMethod){return true;}
        return false;
    }
    get OneTimeShowPaymentFormForCard(){
        if((this.OcPayMethodId && this.OcPayMethodId.value === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_CARD)){
            this.showPaymentComponentForCardForOneTime = true;
        }
        
        //CDEX-362585 sk9969 11/12
        if (this.showPeripheralOcCheck && !this.enrollInAutoPaycheckbox && this.peripheralParameters?.paymentPromptType == 'BOTH' && this.props.peripheralParameters.paymentAuthorizationId ){
            setCVVUI(this)
            this.cvvClass = 'cvvUnEnroll';
        }
        
        //START SPTSLSATT-20214
        if(this.showPeripheral && this.showPeripheralOcCheck && this.displayOTPDel && this.otp){
            this.isContinueButtonDisable = false;
        }else{
            this.isContinueButtonDisable = this.isRetailBankEnabled && this.showPeripheral ? true : this.isContinueButtonDisable;
        }
        //END SPTSLSATT-20214
        
        if(this.showPaymentComponentForCardForOneTime ||!this.showExistingPaymentMethod  || this.showPeripheralOcCheck){
            return true;
        }
        return false;
    }
    get OCHasSamePaymentProfile(){
        return this.peripheralPaymentIdOC && this.peripheralPaymentIdRC && this.peripheralPaymentIdOC === this.peripheralPaymentIdRC;
    }
    fetchAutoPayId(event) {
        this.showSuccessBannerForABP = false;
        this.isShowToastAutoPay=false;
        this.payMethodId = event.detail;
        let eventMsg = new CustomEvent('autopayselection',{
            detail: {
                value: this.payMethodId
            }
        });
        this.dispatchEvent(eventMsg)
    }
    fetchOCPayId(event) {
        this.showSuccessBannerForOTP = false;
        this.isShowToast=false;
        this.OcPayMethodId = event.detail;
        let eventMsg = new CustomEvent('otpselection',{
            detail: {
                value: this.OcPayMethodId
            }
        });
        this.dispatchEvent(eventMsg)
    }
    @api
    get proratedCharges(){
        return this.proratedChargesValue;
    }
    set proratedCharges(value){
        this.proratedChargesValue = value;
        this.proratedChargesValue = parseFloat(this.proratedChargesValue).toFixed(2); 
        this.proratedChargesValuAvailable();
    }
    @track existingCardArray =[];//CDEX-395641
    proratedChargesValuAvailable(){
        if(this.proratedChargesValue > 0 && this.proratedChargesValue){
            this.boolProratedCharges = true;
        }
        if(this.boolPrePayment  || this.boolProratedCharges ){
            this.isDisabled=false;
        }
        if((this.boolPrePayment && this.cardListValue===true) || (this.boolProratedCharges && this.cardListValue===true))
        {
            if (!this.peripheralParameters || !this.showPeripheral || (this.peripheralParameters.paymentPromptType && this.peripheralParameters.paymentPromptType !== 'BOTH' && this.peripheralParameters?.paymentError != BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.TRANSCATION_CANCELLED)) {
                this.isDisabled=true
                this.isChecked=true;
                this.otp=true;
                let checkACH= true;
                const OTPCheckedEvt = new CustomEvent('otpchecked', {
                    detail: checkACH
                });
                this.dispatchEvent(OTPCheckedEvt);
            }
            else if (this.showPeripheral && this.peripheralParameters && this.peripheralParameters.paymentPromptType && this.peripheralParameters.paymentPromptType === 'BOTH' && this.peripheralParameters?.paymentError != BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.TRANSCATION_CANCELLED) {
                this.isDisabled = true;
            }

            //START SPTSLSATT-22473
            if(this.iscentersOTPBankEnabled && !this.isRetail){
                this.isDisabled=false;
                this.isChecked=false;
                this.otp=false;
                let checkACH= false;
                const OTPCheckedEvt = new CustomEvent('otpchecked', {
                    detail: checkACH
                });
                this.dispatchEvent(OTPCheckedEvt);
            }
            //
            if(!this.isRetail){
                this.accountSelectionOneTimeDisabled = this.iscentersOTPBankEnabled ? false : true;
                this.cardListValueOneTime = this.iscentersOTPBankEnabled ? true : false;
            }else{
                this.accountSelectionOneTimeDisabled = true;
                this.cardListValueOneTime=false;
            }
            //
            //END START SPTSLSATT-22473

            this.activeTabValueOTP = this.accountSelectionOneTimeDisabled? 'CARDOTP':'ACHOTP';
        }
    }
    GetTenderPromotionCallout(){
    helper_tenderPromotionCallout(this);}

    renderedCallback(){
        let comp =  this.template.querySelector('lightning-tab');
        if(comp){
            const styleTag = document.createElement('style');
            styleTag.innerText = ".slds-is-active { background-color: #0176D3;}";
            this.template.querySelector('lightning-tab').appendChild(styleTag);
        }
    }

    async connectedCallback(){
        super.connectedCallback();
        try {
        //END SPTSLSATT-20214
        if(this.isAchRetailFeatureFlagEnabled)
        {   
            this.retailBankEnabler = false;
            this.isRetailBankEnabled = this.showPeripheral;
            this.isBankSectionRender = this.showPeripheral ? true : false;
        }
        else
        {
            this.retailBankEnabler = this.showPeripheral;
            this.isBankSectionRender  = false;
            if(this.showPeripheral){
                //this.changeButtonColour('card');
                this.activeTabValue =  'CARD' ;
                this.cardListValue = false;
                this.hasPaymentMethod= false;
            }
        }
        this.iscentersOTPBankEnabled = await getVisibility({feature: 'BuyflowACHCentersOTPBankEnabler'});//SPTSLSATT-22473
        this.AIATendertypeABP_FeatureFlag = await getVisibility({feature: 'EnableAIATendertypeABPInACC'});
        if(this.productType == 'WBB' && this.AIATendertypeABP_FeatureFlag){
            this.showAiaTenderInfo = true;
            this.showAiaReadToCust = true;
            getAIATenderPromotionCallout(this);
        }
         this.featureFlag = await getVisibility({feature: 'ShowABPDiscountOnBillingForBroadband'});//SPTSLSATT-13531
       if(this.productType == this.label.BB && this.featureFlag){
        this.tenderInfoBanner=true;
        this.GetTenderPromotionCallout();
       }
 // Start Cdex 325796 07/30
       this.result = await getFlowStateByInteractionId({recordId: this.recordId});
       this.cardCaptured = this.result?.cardCaptured__c;
       if(this.result.ABPPaymentProfileId__c !=null){
           this.payMethodId = this.result.ABPPaymentProfileId__c;
       }
       if(this.result.OneTimePaymentProfileId__c!=null){
           this.OcPayMethodId = this.result.OneTimePaymentProfileId__c;
       }  

        if (this.paymentDetailSectionData.isEdited) {
            if(this.props?.buyFlowPaymentMethod.defaultPaymentProfile){
                await this.handleABPDataSummaryView();
            }
            if(this.props?.buyFlowPaymentMethod.oneTimePaymentProfile){
                await this.handleOTPDataSummaryView();
            }  
            if(this.props?.cashRegisterInfo?.isAdvpayCashPay){//Cash Enhancement
                this.otpSummaryViewCash=true;
            }  
        }
       
        this.oneTimeChargeForFlow = this.prePaymentCharges;
	
	//moved code in helper SPTSLSATT-20214
       
       
        this.subscribeToMessageChannel();
        if(this.prePaymentCharges > 0.00 && this.prePaymentCharges){
            this.boolPrePayment=true;
        }
        this.proratedChargesValuAvailable();
        if(this.advPay && this.cardListValue === true){
            this.accountSelectionOneTimeDisabled=true;
            this.activeTabValueOTP = this.accountSelectionOneTimeDisabled? 'CARDOTP':'ACHOTP';
        }
        //START SPTSLSATT-22473
        if(!this.isRetail && this.iscentersOTPBankEnabled){
            this.accountSelectionOneTimeDisabled =  this.advPay && this.cardListValue === true ? false : true;
        }
        //END SPTSLSATT-22473
        this.isLoading=true;
        if (this.hasPaymentMethod === true){
            this.validatePreviousCard = true;
        }
        this.messageLabelAutoPay = Object.assign(this.label.errorPaymentDetails);
        this.messageLabel = Object.assign(this.label.erroroneTimePaymentDetails);
        this.messageBackground = 'error';
        this.messageIcon = BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.UTILITY_ICON;
        this.closeWarningHandler();
        if(this.showPeripheral){
            setperipheralValueOnLoad(this);//SPTSLSATT-20214
        }
        



        if (hasWfhPermission && !HAS_ENTER_BILLING_PAYMENT_DETAILS && this.showSecurePaymentSection == false) {
            this.showSecurePaymentSection = this.props.customer.isSecurePaymentEnabled;
            this.isVoiceMaskingButtonVisible = !this.props.customer.isSecurePaymentEnabled;
        }
        if(!this.setUpBillingPageIssues){//CDEX-398186
        this.showLoadingSpinner = false;
        }

        //CDEX-365373 - Start
        const showPaymentCmpInEditView = sessionStorage.getItem('showPaymentCmpInEditView');
        if(showPaymentCmpInEditView){
            this.handleEdit();
            sessionStorage.removeItem('showPaymentCmpInEditView'); 
        }
        //CDEX-365373 - End
        //SPTSLSATT-20239 - start
        if(this.setUpBillingPageIssues && this.lastExecutedTab == 'accountTab'){
            const button = this.refs.accountTab;
            button.click();
        } else if(this.setUpBillingPageIssues && this.lastExecutedTab == 'cardTab'){
            const button = this.refs.cardTab;
            button.click();
        } 
        //SPTSLSATT-20239 - end
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback', error); //SPTSLSATT-20239
        }
    }

    async callPaymentRetrivalAPI(){
        if(this.setUpBillingPageIssues){//SPTSLSATT-20239
            this.showLoadingSpinner = true;
        }
        let peripheralIndicatorForCard = false;
        if(this.isPaymentDetail === '' || !this.isSettterMethodPaymentRetrivalCalled){ //CDEX-400888
            let paymentDetails='';
            let otpDetails='';
            let autoPayMethodId = '';
                if(this.props && this.props != {}){
                    if(this.props.camsPaymentMethod){
                    paymentDetails = this.props.camsPaymentMethod.defaultPaymentProfile;
                    otpDetails=this.props.camsPaymentMethod.oneTimePaymentProfile;
                    autoPayMethodId = this.props.camsPaymentAuthorizeResponse.autoPayMethodId;
                }
            }
            await paymentServices.getPaymentProfiles(this.originalIndividualId,this.interactionRecordIdValue)
            .then((retrievalResponse) => {
                //Removed If loop for CDEX-403787
                this.isPaymentDetail= 'SUCCESS';
                if(retrievalResponse){
                    if(retrievalResponse.Payments[0].errorpaymentProfiles && retrievalResponse.Payments[0].errorpaymentProfiles.code >='400'){
                        this.objApiResponse =null; 
                        if(this.setUpBillingPageIssues){//CDEX-398186
                            this.showLoadingSpinner = false;
                        } 
                    }
                    else{
                        this.objApiResponse = JSON.parse(JSON.stringify(retrievalResponse));
                        BwcUtils.log('Retrieval Payment Profile Response:--' + JSON.stringify(this.objApiResponse));
                        if(this.objApiResponse && this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value){
                            var isPreselected = false;
                            this.objApiResponse.Payments[0]?.paymentProfiles?.paymentProfileList?.forEach((objPaymentProfile) => { 
                                //CDEX-363501/502-ak4124-12/3/24 Start
                                if(this.objApiResponse.Payments[0]?.paymentProfiles.paymentProfileList[0]?.paymentMethodType == 'CARD'){
                                    this.paymentMethodCard = this.showPeripheral ? false : true;//SPTSLSATT-20214
									this.isCreditCard = this.objApiResponse.Payments[0]?.paymentProfiles.paymentProfileList[0]?.card?.trueCreditCardIndicator; //CCSTSP-1944
				                    peripheralIndicatorForCard = this.showPeripheral ? true : false;
                                }
                                if(this.objApiResponse.Payments[0]?.paymentProfiles.paymentProfileList[0]?.paymentMethodType == 'BANKACCOUNT'){
                                    this.paymentMethodBank = true;
                                }
                                if(objPaymentProfile?.paymentMethodType == 'CARD'){//CDEX-395641
                                    this.existingCardArray.push(objPaymentProfile.paymentMethodId);
                                }
                                //CDEX-363501/502-ak4124-12/3/24 End
                                if(objPaymentProfile.boolIsSelected){
                                    isPreselected = true;
                                    this.selectedCardDetails =  this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList[0];
                                    this.payMethodId = this.objApiResponse.Payments[0]?.paymentProfiles.paymentProfileList[0]?.paymentMethodId;
                                    this.isContinueButtonDisable =  peripheralIndicatorForCard ? true : false;//SPTSLSATT-20214
                                    
                                }
                            });
                            if(!isPreselected){
                                if(this.props.buyFlowPaymentMethod && this.props.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentMethodId || this.props.buyFlowPaymentMethod && this.props.buyFlowPaymentMethod?.oneTimePaymentProfile?.paymentMethodId){
                                    this.objApiResponse.Payments[0]?.paymentProfiles?.paymentProfileList?.forEach((objPaymentProfile) => {
                                         //CDEX-363501/502-ak4124-12/3/24 Start
                                        if(objPaymentProfile.paymentMethod =='CARD'){
                                            this.paymentMethodCard = this.showPeripheral ? false : true;//SPTSLSATT-20214
                                            peripheralIndicatorForCard = this.showPeripheral ? true : false;
                                        }
                                        if(objPaymentProfile.paymentMethod == 'BANKACCOUNT'){
                                            this.paymentMethodBank = true;
                                        }
                                        //CDEX-363501/502-ak4124-12/3/24 End
                                        if(this.props.buyFlowPaymentMethod && this.props.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentMethodId === objPaymentProfile.paymentMethodId){
                                            objPaymentProfile.boolIsSelected = true;
                                            //this.isContinueButtonDisable = false; //SPTSLSATT-19998
                                        }
                                        if(this.props.buyFlowPaymentMethod && this.props.buyFlowPaymentMethod?.oneTimePaymentProfile?.paymentMethodId === objPaymentProfile.paymentMethodId){
                                            objPaymentProfile.boolStoreOneTime = true;
                                            this.isContinueButtonDisable = peripheralIndicatorForCard ? true : false;//SPTSLSATT-20214
                                        }
                                    })
                                }else if(this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList.length>0){
                                    this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList[0].boolIsSelected = true;
                                    this.selectedCardDetails =  this.objApiResponse.Payments[0]?.paymentProfiles.paymentProfileList[0];
                                    this.payMethodId = this.objApiResponse.Payments[0]?.paymentProfiles.paymentProfileList[0]?.paymentMethodId;
                                   // if(!this.showPeripheral && selectedCardDetails.paymentMethod !='CARD'){//SPTSLSATT-20214
                                   //CDEX-398295 & CDEX-406233
                                    this.isContinueButtonDisable = false;
                            	//}CDEX-398295 & CDEX-406233
							}
                        }
                    }
                    }
				this.objApiResponse = JSON.stringify(this.objApiResponse);
                if(this.setUpBillingPageIssues && this.objApiResponse){//CDEX-398186
                    setTimeout(() => {//CDEX-403787
                        this.showLoadingSpinner = false;
                    }, 0);
                }
                }
                
            }).catch(error => {
                this.error = error;
                //CDEX-398186-start
                this.showLoadingSpinner = false;
                this.hideOnCatchError = 'slds-hide';
                        BwcUtils.showToast(this, {
                            message: 'There was an issue in retrieving payment profiles. Please try again', 
                            variant: 'error',
                            mode: 'sticky'
                        });
                //CDEX-398186 -end
                BwcUtils.error('Error in Promise catch Retrieval Payment Profile ' + error);
                this.isPaymentDetail='ERROR';
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'callPaymentRetrivalAPI', error); //SPTSLSATT-20239
            });
        }else if(this.setUpBillingPageIssues){//CDEX-398186
            this.showLoadingSpinner = false;
        }
        if(this.objApiResponse){
            this.objApiResponse=(typeof this.objApiResponse === 'string') ? JSON.parse(this.objApiResponse) : this.objApiResponse;
            this.objApiResponse=(typeof this.objApiResponse === 'string') ? JSON.parse(this.objApiResponse) : this.objApiResponse;
            if(this.objApiResponse?.Payments[0]?.paymentProfiles?.paymentProfileList != undefined && 
                this.objApiResponse?.Payments[0]?.paymentProfiles?.paymentProfileList != '')
			{
                this.profileListDetails=this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList;
                const oneTimeCardDetails = JSON.parse(JSON.stringify(this.profileListDetails));
                let filteredIsSelectedFalseData;
                if(this.props.customer.journeyType== BwcConstants.WLS_BUYFLOW_JOURNEY_NAME) { //WLS CCSTSP-1710 - to send all existing cards without filters
                    filteredIsSelectedFalseData = oneTimeCardDetails;               
                }else {
                    filteredIsSelectedFalseData = oneTimeCardDetails.filter(x => (x.boolIsSelected === false || x.boolIsSelected == null));
                }
                filteredIsSelectedFalseData.forEach(x => {
                    if(x.boolStoreOneTime) {
                        x.boolIsSelected = true;
                    }
                });
                this.uncheckedArray = JSON.stringify(filteredIsSelectedFalseData);
                this.objApiResponse = JSON.stringify(this.objApiResponse);
                this.dispatchFilteredListEvent(this.uncheckedArray);
                this.hasPaymentMethod = true;
                if(this.showPeripheral){
                    setCVVUI(this);
                }
            }
        }
        this.hasPaymentMethod= this.showPeripheralCard?false:true; //SPTSLSATT-20214

        //START SPTSLSATT-20214
        if(!this.isAchRetailFeatureFlagEnabled)
        {   
            this.hasPaymentMethod = true; //Center no Feature Flag
            if(this.showPeripheral)
            {
                this.hasPaymentMethod = false; //Retail if FF off
                this.isContinueButtonDisable= true;

                //this.changeButtonColour('card');
                this.activeTabValue = 'CARD' ;
                this.cardListValue = false;
                this.hasPaymentMethod= false;
                this.isBankSectionRender = false;
            }
        }
        
        //END SPTSLSATT-20214
        //Removed CDEX-403787 changes
    }
    highLightLastExecutedTab() {//CDEX-403787
        if (this.setUpBillingPageIssues && this.lastExecutedTab == 'accountTab') {
            const button = this.refs.accountTab;
            if (button) {
                button.click();
                
            }

        } else if (this.setUpBillingPageIssues && this.lastExecutedTab == 'cardTab') {
            const button = this.refs.cardTab;
            if (button) {
                button.click();
            }
        }
    }
    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                scrollToErrorMsgChannel,
                (message) => this.handleLmsMessage(message), {
                scope: APPLICATION_SCOPE
            }
            );
        }
    }
    async handleCancelPayment(event) {
        try {
        let confirmLabel ='';
        let title = '';
        let body = '';
        let eventType = '';
        const request = {};
        if (event.target.label == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.CANCEL_PAYMENT || this.OCHasSamePaymentProfile) {
            request['preAuthorizationId'] = this.peripheralAuthorizationId ? this.peripheralAuthorizationId : 'SFORCECC360559';
            request['cancelSection'] = event.target.name;
            confirmLabel = Cancel_Payment_ConfirmBtn;
            title = Cancel_Payment_Label;
            body = Cancel_Payment_Body;
            eventType = BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.CANCEL_PAYMENT;
            if (event.target.name === 'rcCancel') {
                request['paymentMethodId'] = this.peripheralPaymentIdRC;
                this.callDeletCancelPaymentModal(confirmLabel, title, body, request, eventType, this.cardType, this.cardLastfourDigits, this.expMonth, this.expYear, this.isStoreOneTimePaymentProfile);
            } else {
                request['paymentMethodId'] = this.peripheralPaymentIdOC;
                this.callDeletCancelPaymentModal(confirmLabel, title, body, request, eventType, this.cardOTPType, this.cardOTPLastfourDigits, this.expMonthOTP, this.expYearOTP, this.isStoreOneTimePaymentProfile);
            }        
        } else if (event.target.label == this.deleteCardStaticLabel) {
            request['paymentMethodId'] = this.peripheralPaymentIdRC;
            confirmLabel = WBB_Delete_Card;
            title = WBB_Delete_Card_title;
            body = WBB_Delete_Card_body;
            eventType = 'Delete Card';
            this.callDeletCancelPaymentModal(confirmLabel, title, body, request, eventType, this.cardType, this.cardLastfourDigits, this.expMonth, this.expYear,this.isStoreOneTimePaymentProfile);
        }
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handleCancelPayment', error); //SPTSLSATT-20239
        }
    }
    async callDeletCancelPaymentModal(confirmLabel, title, body, request, eventType, cardType, cardLastfourDigits, expMonth, expYear,storeOcCheck) {
        try {
        const result = await cancelPayment.open({
            size: 'small',
            showlabel: title,
            description: 'Accessible description of modal\'s purpose',
            cardInformation: cardType + ' ending in ' + cardLastfourDigits + ' | Exp: ' + expMonth + '/' + expYear,
            bodyContent: body,
            request: request,
            bodySubContent: Cancel_Payment_Sub_Body,
            cancelBtnLabel: Cancel_Payment_CancelBtn,
            confirmBtnLabel: confirmLabel,
            eventType: eventType,
            recordId: this.recordId,
            storeOc:storeOcCheck,
            flowName: this.flowName,
            uuid:  this.props.uuId
        })
        if (result.content && result.content.message.toLowerCase() === "success") {
            const errorObj = this.makeToastErrorEvent('Success', this.label.WBB_Cancel_Payment_Message, 'success');
            const { event } = errorObj;
            this.dispatchEvent(event);
            this.isContinueButtonDisable = true;
            let buyFlowPaymentMethod = this.props.buyFlowPaymentMethod;
            //OC or BOTH
            if(request.preAuthorizationId){
                await FlowState.clearAuthorizationIds(this.recordId, this.peripheralParameters.journeyName, this.peripheralParameters.serviceAddressId);
                
                buyFlowPaymentMethod.oneTimePaymentAuthorization = {};
              
                if(this.OCHasSamePaymentProfile){
                    buyFlowPaymentMethod.defaultPaymentProfile = {};
                    this.peripheralPaymentIdRC = null;
                    this.peripheralCardDataRC = null;
                    this.showPeripheralCard = false;
                    this.isDisableUseCardReadRC = false;

                    this.showPeripheralOcCheck = false;
                    this.isDisableCheckbox = false;
                }

                this.peripheralPaymentIdOC = null;
                this.peripheralAuthorizationId = null;
                this.peripheralCardDataOC = null;
               
                if(request.cancelSection == 'rcCancel'){
                    buyFlowPaymentMethod.defaultPaymentProfile = {};
                    this.showPeripheralCard = false;
                    this.peripheralPaymentIdRC = null;
                    this.peripheralCardDataRC = null;
                    this.isDisableUseCardReadRC = false;
                    //START SPTSLSATT-20214
                    this.isDisableUseCardRead = false;
                    this.isDisabled = false;
                    if(this.isRetailBankEnabled && (this.peripheralParameters?.paymentPromptType == 'BOTH' || this.peripheralParameters?.paymentPromptType == 'RC')){
                        this.isContinueButtonDisable = true;
                        this.peripheralParameters.paymentPromptType = '';
                    }
                    //END SPTSLSATT-20214
                }
                if(request.cancelSection == 'ocCancel'){
                    this.showPeripheralOcCheck = false;
                    this.isDisableCheckbox = false;
                    this.isDisableUseCardRead = false;
                    //START SPTSLSATT-20214
                    if(this.isRetailBankEnabled && this.peripheralParameters?.paymentPromptType == 'OC'){
                        this.isContinueButtonDisable = true;
                        this.peripheralParameters.paymentPromptType = '';
                    }
                    //END SPTSLSATT-20214
                }
                this.isDisableCheckbox = false;
                
               
                if(!this.showPeripheralCard && !this.isBankSectionRender){//SPTSLSATT-20214
                    this.isDisabled = false;
                }
            }else{
                buyFlowPaymentMethod.defaultPaymentProfile = {};
                this.showPeripheralCard = false;
                this.peripheralPaymentIdRC = null;
                this.peripheralCardDataRC = null;
                this.isDisableUseCardReadRC = false;
               
                if(!this.showPeripheralOcCheck){
                    this.isDisabled = false
                }
            }
            this.updateReduxOnVerify(true);
            this.props.updateBuyFlowPaymentMethod(buyFlowPaymentMethod);
        } else if (result.message === 'Error') {
            const errorObj = this.makeToastErrorEvent("Error", this.label.WBB_Cancel_Payment_Error_Message, 'Error');
            const { event } = errorObj;
            this.dispatchEvent(event);
            this.showPeripheralCard = true;
            this.showPeripheralOcCheck = true;
        }
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'callDeletCancelPaymentModal', error); //SPTSLSATT-20239
        }
    }
    async verifyCVVHandler(event){
        try {
    //Insted of individaulID send flowstate Data CDEX-382816
    let flow = !this.flowName?'NewService':this.flowName;
    this.flowStateRes = await getFlowState({recordId: this.recordId, journeyName: flow});
    //Insted of individaulID send flowstate Data CDEX-382816
    helper_verifyCVVHandler(this,event);
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'verifyCVVHandler', error); //SPTSLSATT-20239
        }
    }
    makeToastErrorEvent = (title, errorMsg, variant) => {
        
        const event = new ShowToastEvent({ title: title, message: errorMsg, variant: variant });
        const errorObj = { event };
        return errorObj;
    }
    async verifyOTPHandler() {
        try {
    //Insted of individaulID send flowstate Data CDEX-382816
    let flow = !this.flowName?'NewService':this.flowName; 
    this.flowStateRes = await getFlowState({recordId: this.recordId, journeyName: flow});
    //Insted of individaulID send flowstate Data CDEX-382816
    helper_verifyOTPHandler(this);
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'verifyOTPHandler', error); //SPTSLSATT-20239
        }
    }
    
    updateReduxOnVerify(clearCardInformation){
        let updatedPeripheralParameters = JSON.parse(JSON.stringify(this.peripheralParameters));
        updatedPeripheralParameters.paymentProfileId = this.peripheralPaymentIdRC;
        updatedPeripheralParameters.cardDataRC = this.peripheralCardDataRC;
        updatedPeripheralParameters.paymentProfileIdOC = this.peripheralPaymentIdOC;
        updatedPeripheralParameters.cardDataOC = this.peripheralCardDataOC;
        updatedPeripheralParameters.paymentAuthorizationId = this.peripheralAuthorizationId;
        if(clearCardInformation){
            updatedPeripheralParameters.paymentCardInformation = null;
            updatedPeripheralParameters.accNum = null;
        }
        this.props.setPeripheralParameters(updatedPeripheralParameters);
        helper_updateBan(this);
    }
    
    
    async maskData(data) {
        return 'jwe:' + await this.template.querySelector('c-reusable-encryption-component').getEncryptedData(data);
    }
    
    setRCVerifiedUI(cardDetails, paymentMethodId,authorizationId){
        try {
        let buyFlowPaymentMethod = this.props.buyFlowPaymentMethod;
        this.cvvInputSize = 2;
        this.verifyButtonSize = 5;
        this.authButtonSize = 2;
        this.verified = true;
        this.cvvDisable = true;
        this.veriedDisabled = true;
        this.displayDel = true;
        this.showPeripheralError = false;
        this.verifyLabel = this.peripheralParameters?.paymentPromptType != 'BOTH' ? 'Verified' : BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.AUTHRIZED;
        this.delCancelLabel = this.peripheralParameters?.paymentPromptType != 'BOTH' ? 'Delete Card' : BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.CANCEL_PAYMENT;
        this.cardType = cardDetails.cardType;
        this.cardLastfourDigits = cardDetails.lastFourDigits ? cardDetails.lastFourDigits : cardDetails.cardNumber?.substr(cardDetails.cardNumber.length - 4);
        this.expMonth = cardDetails.expireMonth;
        this.expYear = cardDetails.expireYear.length === 4 ? cardDetails.expireYear?.slice(- 2) : cardDetails.expireYear;
        //Fix added for CDEX-312261 to disable use card reader and displaying payment info Start 
        if(this.peripheralParameters?.paymentPromptType == 'BOTH' && this.props.peripheralParameters.paymentAuthorizationId!=null){ 
            this.setOTPVerifiedUI(cardDetails, authorizationId,  paymentMethodId); 
            this.isDisableUseCardRead = true; 
            this.showPeripheralOcCheck = true; 
            this.cvvClass = 'cvvUnEnroll'; 
        } 
        //Fix added for CDEX-312261 to disable use card reader and displaying payment info End
        if (this.peripheralParameters?.paymentPromptType == 'BOTH' || this.peripheralParameters?.paymentPromptType == 'OC') {
            this.template.host.style.setProperty('--btnFontSize', '0.60rem');
            if (this.verifyLabel == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.AUTHRIZED) {
                this.isContinueButtonDisable = false;
              this.template.host.style.setProperty(BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.BUTTON_PEDDING, '10px');
            } else {  
              this.template.host.style.setProperty(BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.BUTTON_PEDDING, '0px');
        }
        }
        // let paymentMethodId = peripheralProcessingResponse?.paymentProfileResponse?.content?.paymentProfiles?.paymentProfilesList[0]?.paymentMethodId;
        this.payMethodId = paymentMethodId;
        this.cardData = cardDetails;
        if(!buyFlowPaymentMethod.defaultPaymentProfile?.paymentNumber){
            buyFlowPaymentMethod.defaultPaymentProfile = {};
            buyFlowPaymentMethod.defaultPaymentProfile.paymentType = this.cardType ? this.cardType : '';
            buyFlowPaymentMethod.defaultPaymentProfile.paymentNumber = this.cardLastfourDigits ? this.cardLastfourDigits : '';
            buyFlowPaymentMethod.defaultPaymentProfile.expireMonth = cardDetails.expireMonth;
            buyFlowPaymentMethod.defaultPaymentProfile.expireYear = cardDetails.expireYear;
            buyFlowPaymentMethod.defaultPaymentProfile.name = cardDetails.cardHolderName;
            buyFlowPaymentMethod.defaultPaymentProfile.autoPay = true;
            buyFlowPaymentMethod.defaultPaymentProfile.paymentMethodId = paymentMethodId;
            this.props.updateBuyFlowPaymentMethod(buyFlowPaymentMethod);
            let eventMsg = new CustomEvent('peripheralpaymentid', {
                detail: {
                    value: paymentMethodId
                }
            });
            this.dispatchEvent(eventMsg)
        }
        if(authorizationId){
            if(this.peripheralParameters?.paymentPromptType == 'BOTH' && !buyFlowPaymentMethod.oneTimePaymentAuthorization?.paymentNumber){
                buyFlowPaymentMethod.oneTimePaymentAuthorization = {};
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentType = this.cardType ? this.cardType : '';
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentNumber = this.cardLastfourDigits ? this.cardLastfourDigits : '';
                buyFlowPaymentMethod.oneTimePaymentAuthorization.name = cardDetails.cardHolderName;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.expireMonth = cardDetails.expireMonth;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.expireYear = cardDetails.expireYear;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentAuthorizationId = authorizationId;
                this.props.updateBuyFlowPaymentMethod(buyFlowPaymentMethod);
            }
        }
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'setRCVerifiedUI', error); //SPTSLSATT-20239
        }
    }
    setOTPVerifiedUI(cardDetails, authorizationId, paymentProfileId) {
        try {
        this.otpButtonSize = 2;
        this.cardOTPType = cardDetails.cardType;
        this.cardOTPLastfourDigits = cardDetails.lastFourDigits ? cardDetails.lastFourDigits : cardDetails.cardNumber?.substr(cardDetails.cardNumber.length - 4);
        this.expMonthOTP = cardDetails.expireMonth;
        this.expYearOTP = cardDetails.expireYear.length === 4 ? cardDetails.expireYear?.slice(- 2) : cardDetails.expireYear;
        this.verifyOTPLabel = BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.AUTHRIZED;
        this.displayOTPDel = true;
        this.cardInfo = true;
        this.verifiedOTP = true;
        this.veriedDisabledOTP = true;
        this.showPeripheralErrorOTP= (this.peripheralErrorMsg === this.label.Card_Information_Save_Error) ? true : false;
        this.template.host.style.setProperty('--cvvPadding', '12px');
        this.template.host.style.setProperty(BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.BUTTON_PEDDING, '12px');
        this.template.host.style.setProperty('--btnFontSize', '0.60rem');
        this.isContinueButtonDisable = false;  // Added as a fix for CDEX-307150

        if(authorizationId){
            this.cvvDisableOtp = true;
            //this.verifyOTPLabel = 'Verified';

            let buyFlowPaymentMethod = this.props.buyFlowPaymentMethod;
            if(!buyFlowPaymentMethod.oneTimePaymentAuthorization?.paymentNumber){
                buyFlowPaymentMethod.oneTimePaymentAuthorization = {};
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentType = cardDetails.cardType ? cardDetails.cardType : '';
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentNumber = cardDetails.lastFourDigits ? cardDetails.lastFourDigits : '';
                buyFlowPaymentMethod.oneTimePaymentAuthorization.name = cardDetails.cardHolderName;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.expireMonth = cardDetails.expireMonth;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.expireYear = cardDetails.expireYear;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentAuthorizationId = authorizationId;
                buyFlowPaymentMethod.oneTimePaymentAuthorization.paymentProfileId = paymentProfileId;
                this.props.updateBuyFlowPaymentMethod(buyFlowPaymentMethod);            
            }      
                if (this.showPeripheralOcCheck && this.peripheralAuthorizationId) {
                    this.isDisableCheckbox = true;
                    if(this.hideCVV){
                        this.hideVerifyBtn = true;                
                        this.cvvClass = 'cvvTo';
                    }else{          
                        this.cvvClass = 'cvv';
                    }
                }
            }
        }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'setOTPVerifiedUI', error); //SPTSLSATT-20239
        }
    }
    handleLmsMessage(message) {
        this.scrollToErrorSection(message.divID);
    }
    handleCvvInput(event) {
        var pattern = new RegExp(/^[0-9]*$/);
        let matchval = pattern.test(event.target.value);
        if(event.currentTarget.name == 'ocCvv'){
            if (matchval) {
                this.ocCvv = event.target.value;
            } else {
                event.target.value = '';
            }
            this.veriedDisabledOTP = !this.ocCvv || this.ocCvv.length <= 2;
        }else{
            if (matchval) {
                this.rcCvv = event.target.value;
            } else {
                event.target.value = '';
            }
            this.veriedDisabled = !this.rcCvv || this.rcCvv.length <= 2 || !this.rcZip || this.rcZip.length <5; //CDEX-351449-ak4124-11/19/24
        }
    }
    handleRCZipInput(event){
        this.rcZip = event.target.value;
        this.veriedDisabled = !this.rcZip || this.rcZip.length <5; //CDEX-351449-ak4124-11/19/24
    }
    handleChange(event) {
        this.storeDetails = event.target.checked;
        const custEvent = new CustomEvent('callComponent',{
            detail:this.storeDetails});
        this.dispatchEvent(custEvent);
    }
    onChangeEventHandler(event){
        this.userSelectedOTPCHeck = event.target.checked;
        this.isChecked = event.target.checked;
        if(this.userSelectedOTPCHeck===true){
            this.isContinueButtonDisable = true;
            this.otp=true;
            this.showCardComponent = false; //CDEX-295466

            //START SPTSLSATT-22473
            let isBypass = false;
            if(!this.isRetail && this.iscentersOTPBankEnabled && ((this.prePaymentCharges > 0.00 && this.advPay) || (this.boolProratedCharges))){
            isBypass = true;
            this.cardListValueOneTime = true;
            this.accountSelectionOneTime(event);
            }
            //END SPTSLSATT-22473
            
            if(!isBypass){//SPTSLSATT-22473
                if((this.prePaymentCharges > 0.00 && this.advPay) || (this.boolProratedCharges) || this.showPeripheral){
                    this.cardListValueOneTime = false;
                    this.cardSelectionOneTime(event);
                }else{
                    this.accountSelectionOneTime(event);
                }
            }
        }else{
            if(this.cardData){ 
                this.isContinueButtonDisable = false;
            }else{
                this.isContinueButtonDisable = true;
            }
            this.otp=false;
        }
        const OTPCheckedEvt = new CustomEvent('otpchecked', {
            detail: event.target.checked
        });
        this.dispatchEvent(OTPCheckedEvt);
        if(this.otp){
            this.isOneTimePayment = true;
            this.showPaymentComponent = false;
            console.log('----this.cardData---->',JSON.stringify(this.cardData));
            console.log('----this.oneTimeCardData---->',JSON.stringify(this.oneTimeCardData));
        }else{
            this.isOneTimePayment = false;
            if(this.returnToEnable === true){
                this.dispatchEvent(new CustomEvent('expiredcardactiveparent',{detail:{buttonEnable:'Yes',otp:'No'}}));
            }
        }
    }
    @api handleCallPaymentDetails(event) {
        this.showPaymentComponentForBank= event.detail.paymentDetailForBank;
        this.showPaymentComponentForCard= event.detail.paymentDetailForCard;
        this.isCardsExist=event.detail.isCardsExist;
        this.isAccountsExist=event.detail.isAccountsExist;
    }
    @api
    handleOneTimeCallPaymentDetails(event) {
        this.showPaymentComponentForBankForOneTime=event.detail.paymentDetailForBank;
        this.showPaymentComponentForCardForOneTime=event.detail.paymentDetailForCard;
    }
    handleCheckboxExecute(event){
        const isCheckedAuto = event.detail.isCheckedAuto;
        this.validateCheckbox = wbbParentServices.getValidateCheckBox('Yes', 'Card', this.validatePreviousCard);
        this.isClosed = wbbParentServices.getIsClosed('Yes', 'Card');
    }
    handleCheckboxExecuteBank(){
        this.validateCheckbox = wbbParentServices.getValidateCheckBox('Yes', 'Bank', this.validatePreviousCard);
        this.isClosed = wbbParentServices.getIsClosed('Yes', 'Bank');
    }
    //CDEX-321969 | SPTSLSATT-19403 | SPTSLSATT-19400 - Start
    handleBanksection(event){
        console.log('handleBanksection '+event.detail);
        if(event.detail == false){
            this.iscardSection = true;
            //this.isContinueButtonDisable = true; //SPTSLSATT-19998
        } 
    }
    //CDEX-321969 | SPTSLSATT-19403 | SPTSLSATT-19400 - End
    handleTileSelected(event){
        try {
        this.isContinueButtonDisable = (event.detail === WbbConstants?.PaymentDetail?.NEWACCOUNT.value || event.detail === WbbConstants?.PaymentDetail?.NEWCARD.value)?true:false;
        this.isAddNewCard = event.detail === WbbConstants?.PaymentDetail?.NEWCARD.value?true:false;//CDEX-359467-ak4124-11/12/24
        this.isAddNewBank = event.detail === WbbConstants?.PaymentDetail?.NEWACCOUNT.value ? true : false; //SPTSLSATT-19998
        if(this.isAddNewBank || this.isAddNewCard) {this.isToggled = false} //SPTSLSATT-19998
        this.handleSelectedOption(event);
        let objApiResponseTemp;
        if(typeof this.objApiResponse === 'string'){
          objApiResponseTemp=JSON.parse(this.objApiResponse);
        }else{
            objApiResponseTemp=JSON.parse(JSON.stringify(this.objApiResponse));
        }
        if(objApiResponseTemp){
        objApiResponseTemp.Payments[0].paymentProfiles.paymentProfileList.forEach(function (arrayItem) {
            if (arrayItem.bankAccount || arrayItem.card) {    
                if (arrayItem.paymentMethodId === event.detail){
                    arrayItem.boolIsSelected = true;
                } else {
                    arrayItem.boolIsSelected = false;
                } 
                }
            })
        }
            this.objApiResponse = JSON.stringify(objApiResponseTemp);
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handleTileSelected', error); //SPTSLSATT-20239
        }
    }
    handlePaymentdetailFieldCheckCollapsible(event){
        try {
        if(!this.showPeripheral)
        {
        this.isPaymentCardInfoFilled = event.detail === true?true:false;
        if (this.isChecked) {
            if (this.hasRaisrPermissions && this.cardData && this.oneTimeCardData) {
                this.isContinueButtonDisable = false;
            } else {
                this.isContinueButtonDisable = true;
            }
        } else {
        if(this.isPaymentCardInfoFilled){
           this.isContinueButtonDisable = false;
        }else{
            this.isContinueButtonDisable = true;
        }
   }
   }else if(this.showPeripheral && this.isRetailBankEnabled){//SPTSLSATT-20787
        this.isReatilBankAllFieldChecked = event.detail;
        if(this.otp)
        {
            if(this.verifiedOTP) 
            {
                this.isContinueButtonDisable =  event.detail  === true?false:true;
                this.isReatilBankAllFieldChecked = this.isContinueButtonDisable ? false : true;
            } 
            else
            {
                this.isContinueButtonDisable = true; 
                this.isReatilBankAllFieldChecked = false;
            } 

        }
        else
        {
            this.isContinueButtonDisable =  event.detail  === true?false:true;
            this.isReatilBankAllFieldChecked = this.isContinueButtonDisable ? false : true;
        }  
   }
        }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handlePaymentdetailFieldCheckCollapsible', error); //SPTSLSATT-20239
        }
        
   }

   handlePaymentdetailFieldCheckCollapsibleRetail(event){
       this.isReatilBankAllFieldChecked = event.detail;
        if(this.otp)
        {
            if(this.verifiedOTP) 
            {
                  this.isContinueButtonDisable =  event.detail  === true?false:true;
                  this.isReatilBankAllFieldChecked = this.isContinueButtonDisable ? false : true;
            } 
            else
            {
                this.isContinueButtonDisable = true; 
                this.isReatilBankAllFieldChecked = false;
            } 

        }
        else
        {
             this.isContinueButtonDisable =  event.detail  === true?false:true;
             this.isReatilBankAllFieldChecked = this.isContinueButtonDisable ? false : true;
        }     
    }

    handleOneTimeTileSelected(event) {
        try {
        let dispatchIgnoreVal = false;
        this.showCardComponent = true; 
        if (event.detail === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_CARD || event.detail === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.NEW_BANK) {
            dispatchIgnoreVal= true;
        }
        this.handleSelectedOption(event);
        const ignoreotplistEvt = new CustomEvent('disregardotplist', {
            detail: dispatchIgnoreVal
        });
        this.dispatchEvent(ignoreotplistEvt);
        if(this.uncheckedArray){
            
            let otpFilterObject = JSON.parse(this.uncheckedArray); 
            otpFilterObject.forEach(item => {
                if(item.paymentMethodId === event.detail){
                    item.boolIsSelected = true;
                }else {
                    item.boolIsSelected = false;
                }      
                
            });
            this.uncheckedArray = JSON.stringify(otpFilterObject);
            this.dispatchFilteredListEvent(this.uncheckedArray);
        }
    }	
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handleOneTimeTileSelected', error); //SPTSLSATT-20239
        }
    }	
    handleSelectedOption(event){
        const evt= new CustomEvent('selectedoption', {
            detail: event.detail
        });
        this.dispatchEvent(evt);
    }
    lastFour(cardNumber){	
        //vo923r	
        if(cardNumber) {	
            return cardNumber.substring(cardNumber.length - 4); 	
        } else {	
            return '';	
        }	
        	
    }
    handleCheckboxNotExecute(event){
        const isCheckedAuto = event.detail.isCheckedAuto;
        this.validateCheckbox = wbbParentServices.getValidateCheckBox('No', 'Card', this.validatePreviousCard);
        this.isClosed = wbbParentServices.getIsClosed('No', 'Card');
    }
    handleCheckboxNotExecuteBank(){
        this.validateCheckbox = wbbParentServices.getValidateCheckBox('No', 'Bank', this.validatePreviousCard);
        this.isClosed = wbbParentServices.getIsClosed('No', 'Bank');
    }
    accountSelection(event) {
        try {
        this.activeTabValue= 'ACH';    
        this.isPaymentCardInfoFilled = false;//SPTSLSATT-20214
        this.isReatilBankAllFieldChecked = false;//SPTSLSATT-20214
        if(this.showPeripheral && this.showPeripheralCard && this.displayDel){//SPTSLSATT-20214
           this.showWarningMsgForToggleBank = true; 
           return;
        }
        //START SPTSLSATT-20214
        if(this.isRetailBankEnabled)
        {
            this.hasPaymentMethod = true;
            this.isBankSectionRender= true;//SPTSLSATT-20214//CDEX-398483
        }
        //END SPTSLSATT-20214
        
        this.otp=false;
        this.isChecked = false;
        this.showTenderInfoBannerAndReadAloud(false,true);//SPTSLSATT-13531
        if((this.prePaymentCharges>0.00) || (this.boolProratedCharges))
        {
            this.isDisabled= this.iscentersOTPBankEnabled ? false : true;//SPTSLSATT-22473
            this.isChecked= this.iscentersOTPBankEnabled ? false :true;//SPTSLSATT-22473
            this.otp=this.iscentersOTPBankEnabled ? false : true;//SPTSLSATT-22473
            let checkACH= true;
            const OTPCheckedEvt = new CustomEvent('otpchecked', {
                detail: checkACH
            });
            this.dispatchEvent(OTPCheckedEvt);
            
        }
        if(this.advPay){
            this.accountSelectionOneTimeDisabled=true;
            this.activeTabValueOTP = this.accountSelectionOneTimeDisabled? 'CARDOTP':'ACHOTP';
        }

        //START SPTSLSATT-22473
        if(!this.isRetail && this.iscentersOTPBankEnabled && this.advPay){
            this.accountSelectionOneTimeDisabled =  false;
        }
        //END SPTSLSATT-22473
        
        //CDEX-363501/502-ak4124-12/3/24 Start
        if(this.isAddNewCard){
            this.isAddNewCard = false;
        }
        //CDEX-363501/502-ak4124-12/3/24 End
        this.isBankAccount = true;
        this.isCreditOrDebit = false;
        this.isBankAccountOneTime = false;
        this.isCreditOrDebitOneTime = false;
        //this.changeButtonColour(event.target.className);
        this.activeTabValue = 'ACH' ;
        this.togglePaymentButtons('Account', this.isBankAccount, this.isCreditOrDebit);
        this.lastExecutedTab = 'accountTab';//SPTSLSATT-20239
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'accountSelection', error); //SPTSLSATT-20239
        }
    }
    cardSelection(event) {
        try {
        this.activeTabValue= 'CARD'; 
        this.isPaymentCardInfoFilled = false;//SPTSLSATT-20214
        this.isReatilBankAllFieldChecked = false;//SPTSLSATT-20214
        //START SPTSLSATT-20214
        if(this.isRetailBankEnabled)
        {
            this.hasPaymentMethod = false;
            this.isContinueButtonDisable = true;
        }
        //END SPTSLSATT-20214
        this.isBankSectionRender= false;//SPTSLSATT-20214
        this.otp = false;
        this.showTenderInfoBannerAndReadAloud(true,true);//SPTSLSATT-13531

        //SPTSLSATT-19998 Start
        if(this.isAddNewBank){
            this.isAddNewBank = false;
        }
        //SPTSLSATT-19998 End

        if((this.prePaymentCharges>0.00) || (this.boolProratedCharges))
        {
            let checkACH= false;
            this.isDisabled=false;
            this.isChecked=false;
            this.otp=false;
            const OTPCheckedEvt = new CustomEvent('otpchecked', {
                detail: checkACH
            });
            this.dispatchEvent(OTPCheckedEvt);
        }
        this.isBankAccount = false;
        this.isCreditOrDebit = true;
        this.isBankAccountOneTime = false;
        this.isCreditOrDebitOneTime = false;
        var evtDetailCard = event.target;
        //this.changeButtonColour(event.target.className);
        this.activeTabValue =  'CARD' ;
        this.togglePaymentButtons('Card', this.isBankAccount, this.isCreditOrDebit);
        if(!this.showPaymentFormForCardAbpPost && !this.showPeripheral) //SPTSLSATT-20214 added showPeripheral
            this.isContinueButtonDisable = false;
        if(this.showPeripheral && this.showPeripheralCard && this.displayDel && this.peripheralParameters.paymentPromptType == 'BOTH' && (this.prePaymentCharges>0.00) || (this.boolProratedCharges)){//SPTSLSATT-20214
            this.isDisabled = true;
        }
        if(this.isRetailBankEnabled && this.showPeripheral && this.showPeripheralCard && this.displayDel && !this.otp){//SPTSLSATT-20214 LOW
            this.isContinueButtonDisable = false;
        }
        this.lastExecutedTab = 'cardTab';//SPTSLSATT-20239
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'cardSelection', error); //SPTSLSATT-20239
        }
    }
    
    showTenderInfoBannerAndReadAloud(readaloudFlag,BannerFlag){
        if(this.featureFlag && this.productType.toLowerCase() == 'fiber'){
            if(this.tenderApiError){this.showNonACHReadAlaud = true; this.tenderInfoBanner=false;
            }else{this.showNonACHReadAlaud = readaloudFlag;this.tenderInfoBanner=BannerFlag;}
        }
    }
    // showTenderInfoBannerAndReadAloudForAIA(){
    //     if(this.productType == this.label.LabelProductNameAIA && this.AIATendertypeABP_FeatureFlag){
    //         this.showAiaTenderInfo = true;
    //         this.showAiaReadToCust = true;
    //     }
    // }
    accountSelectionOneTime(event) {
        try {
        this.activeTabValueOTP = 'ACHOTP' ;     
        this.isBankAccountOneTime = true;
        this.isCreditOrDebitOneTime = false;
        //this.changeButtonColourOneTime(event.target.className);
        this.activeTabValueOTP = 'ACHOTP';
        this.togglePaymentButtonsOneTime('AccountOneTime', this.isBankAccountOneTime, this.isCreditOrDebitOneTime);

        
        let iscashLoaded= this.template.querySelector("c-buyflow-onetime-cash-payment-l-w-c");
        if(iscashLoaded)
        iscashLoaded.changeCashButtonVariantBilling(event.target.className);
        this.showCashSection =false;//Resetting
        this.isContinueButtonDisable=true;
        if(this.props?.cashRegisterInfo){
        this.props.cashRegisterInfo.isAdvpayCashPay=false;
        this.props.updateCashRegisterInfo(this.props.cashRegisterInfo);
        }
        }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'accountSelectionOneTime', error); //SPTSLSATT-20239
        }        
    }
    cardSelectionOneTime(event) {
        try {
        this.activeTabValueOTP = 'CARDOTP' ;  
        this.isBankAccountOneTime = false;
        this.isCreditOrDebitOneTime = true;
        //this.changeButtonColourOneTime(event.target.className);
        this.activeTabValueOTP = 'CARDOTP';
        this.togglePaymentButtonsOneTime('CardOneTime', this.isBankAccountOneTime, this.isCreditOrDebitOneTime);
        
        let iscashLoaded= this.template.querySelector("c-buyflow-onetime-cash-payment-l-w-c");
        if(iscashLoaded)
        iscashLoaded.changeCashButtonVariantBilling(event.target.className);
        this.showCashSection =false;//Resetting
        this.isContinueButtonDisable=true;
        if(this.props?.cashRegisterInfo){
        this.props.cashRegisterInfo.isAdvpayCashPay=false;
        this.props.updateCashRegisterInfo(this.props.cashRegisterInfo);
        }
        }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'cardSelectionOneTime', error); //SPTSLSATT-20239
        }        
    }
     //Cash Enhancement starts
     toggleCashUI(event){
        if(event.detail.isCashbuttonClicked){
            let accountButton = this.template.querySelector('.accountOneTime');
            let cardButton = this.template.querySelector('.cardOneTime');
            if(accountButton){
            accountButton.variant='neutral';
            }
            if(cardButton){              
            cardButton.variant='neutral';
            }
            this.showCashSection= true;           
            this.isContinueButtonDisable=false;          
        }
    }
    handleCashPaySuccess(){
        this.otpSummaryViewCash=true;
        this.props.cashRegisterInfo.isAdvpayCashPay=true;
        this.props.updateCashRegisterInfo(this.props.cashRegisterInfo);
    }
    //Cash Enhancement ends
    togglePaymentButtons(accountOrCard, isBankAccount, isCreditOrDebit) {
        this.isToggled = true;//SPTSLSATT-19998
        this.showSuccessBannerForABP = false;
        if(!this.isCardsExist){
            this.showPaymentComponentForCard=false;
        }
        if(!this.isAccountsExist){        
            this.showPaymentComponentForBank=false;
        }
      
        if (isBankAccount && accountOrCard == 'Account') {
            this.bankOrCardDetails = accountOrCard;
            this.cardListValue = true;
            this.isbankaccount = true;
            this.isClosed = true; 
        } else if (isCreditOrDebit  && accountOrCard == 'Card') {
            this.bankOrCardDetails = accountOrCard;
            this.cardListValue = false;
            this.isbankaccount = false;
             //for 151519
             let checkACH= false;
             const OTPCheckedEvt = new CustomEvent('otpchecked', {
                 detail: checkACH
             });
             this.dispatchEvent(OTPCheckedEvt);
        }
    }
    togglePaymentButtonsOneTime(accountOrCardOneTime, isBankAccountOneTime, isCreditOrDebitOneTime) {
        this.showSuccessBannerForOTP = false;
        var selectedEvent = null;
     
        if (isBankAccountOneTime == true && accountOrCardOneTime == 'AccountOneTime') {
            this.bankOrCardDetailsOneTime = accountOrCardOneTime;
            this.cardListValueOneTime = true;
            // Creates the event with the data.
             selectedEvent = new CustomEvent('buttonselection', {
                detail: this.bankOrCardDetailsOneTime
            });
        } else if (isCreditOrDebitOneTime == true && accountOrCardOneTime == 'CardOneTime') {
            this.bankOrCardDetailsOneTime = accountOrCardOneTime;
            this.cardListValueOneTime = false;
            // Creates the event with the data.
             selectedEvent = new CustomEvent('buttonselection', {
                detail: this.bankOrCardDetailsOneTime
            });
        }
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
    changeButtonColour(className){
        let accountButton = this.template.querySelector('.account');
        let cardButton = this.template.querySelector('.card');
        if(cardButton || accountButton)
        {
        if(className == 'account'){
            if(accountButton.variant != 'brand'){
                accountButton.variant = 'brand';
                cardButton.variant = 'neutral';
            }
        }else if(className == 'card'){
            if(cardButton.variant != 'brand'){
                cardButton.variant = 'brand';
                accountButton.variant = 'neutral';
            }
        }
    }
    }
    changeButtonColourOneTime(className){
        let accountButton = this.template.querySelector('.accountOneTime');
        let cardButton = this.template.querySelector('.cardOneTime');
        if(accountButton || cardButton)
        {
        if(className == 'accountOneTime'){
            if(accountButton.variant != 'brand'){
                accountButton.variant = 'brand';
                cardButton.variant = 'neutral';
            }
        }else if(className == 'cardOneTime'){
            if(cardButton.variant != 'brand'){
                cardButton.variant = 'brand';
                accountButton.variant = 'neutral';
            }
        }
    }
    }
    

    handleSaveCard(event){
        this.cardData=event.detail;
        sessionStorage.setItem("CardDetailsEntered", true);
        if (this.cardData) { 
            this.paymentDetails = true;
            this.cardData.isRecurringAddNewData=true;
            if (this.cardData.isCard) {
                this.isnewcard = true;
                this.isnewbankaccount = false;
                if (!this.encryptCardNumber) {
                    this.encryptCardNumber = true;
                    browserEncryptionFlag ? this.maskData(this.cardData.cardNumber) : this.cardData.cardNumber;
                }
                browserEncryptionFlag ? this.maskData(this.cardData.securityCode) : this.cardData.securityCode;
            }
            if (this.cardData.isBank) {
                this.isnewcard = false;
                this.isnewbankaccount = true;
                browserEncryptionFlag ? this.maskData(this.cardData.bankAccountNumber) : this.cardData.bankAccountNumber;
            }
        }
        const cardsaveData = new CustomEvent('savecarddata',{
            detail:this.cardData
        });
        this.dispatchEvent(cardsaveData);
    }
 
    //Error Message
    closeWarningHandler(){
        //vo923r
        this.isShowToast = false;
        this.dispatchEvent(new CustomEvent('closewarningclick'));
    }
	
     handleCardDelete(event){
        this.deletePaymentProfile(event);
        this.showModalSpinnerPdt=false;
    }
    dispatchCustomEvent(event , strEventName){
        const customEventToDispatch = new CustomEvent(strEventName , {
            detail : event.detail
        });
        this.dispatchEvent(customEventToDispatch);
    }
    handleSaveCardOneTime(event){ 
        this.oneTimeCardData = event.detail;
        const oneTimeData = event.detail;
        this.isContinueButtonDisable = false;
        this.abpCardDataOtp = oneTimeData;
        this.otpCardDataInCollapsible = true;
        this.isStoreOneTimePaymentProfile = oneTimeData?.isStoreOneTimeCardDetail;
        if(this.showPeripheralOcCheck && !this.peripheralAuthorizationId){
            if(this.isStoreOneTimePaymentProfile){
                this.hideCVV = false;
                this.cardInfo = true;
                this.veriedDisabledOTP = true;
                this.cvvClass = 'cvv';
            }else{
                this.hideCVV = true;    
                this.cardInfo = false;
                this.veriedDisabledOTP = false;
                this.cvvClass = 'cvvTo';
                this.ocCvv = undefined;
            }
        }
        this.changeData = true;
        this.storeOneTimePaymentProfile = this.oneTimeCardData.isStoreOneTimeCardDetail;
        if (this.oneTimeCardData) {
            this.paymentDetails = false;
            oneTimeData.isRecurringAddNewData = false;
            if (this.oneTimeCardData.isCard) {
                if (!this.encryptCardNumberOneTime) {
                    this.encryptCardNumberOneTime = true;
                    browserEncryptionFlag ? this.maskData(this.oneTimeCardData.cardNumber) : this.oneTimeCardData.cardNumber; 
                }
                browserEncryptionFlag ? this.maskData(this.oneTimeCardData.securityCode) : this.oneTimeCardData.securityCode;
            }
            if (this.oneTimeCardData.isBank) {
                browserEncryptionFlag ? this.maskData(this.oneTimeCardData.bankAccountNumber) : this.oneTimeCardData.bankAccountNumber;
            }
       }
       const saveOneTimeCardData = new CustomEvent('savecarddataonetime',{
        detail:this.oneTimeCardData
    });
    this.dispatchEvent(saveOneTimeCardData);
    }
    isNewEntryNotNull(event) {
        this.newEntryFillUserSelection = event.detail;
        const allFill = new CustomEvent('newentryfill' , {
            detail : this.newEntryFillUserSelection
        });
        this.dispatchEvent(allFill);
    }
    handleDisableButton(){
        let buttonEnable = 'No' 
        let otp = 'No'
        this.disableButtonPayment = wbbParentServices.getDisablePaymentButton(buttonEnable, otp); 
        this.returnToEnable = false;
    }
    handleEnableButton(){
        this.dispatchEvent(new CustomEvent('expiredcardactiveparent',{detail:{buttonEnable:'Yes',otp:'No'}}));
        this.returnToEnable = true;
    }
    handleDisableButtonOtp(){
        if(this.isOneTimePayment){
            let buttonEnable = 'No' 
            let otp = 'Yes'
            this.disableButtonPaymentOtp = wbbParentServices.getDisablePaymentButtonOtp(buttonEnable, otp);  
        }
    }
    handleEnableButtonOtp(event){
        this.isContinueButtonDisable = false;
        this.selectedCardDetails = event.detail;
    }
    /**
     * @description: Method to fire Update event to Parent Cmp.
     */
     handleBankProfileUpdate(event){
        this.updatePaymentProfile(event);
    }
     handleCardDetailsUpdate(event){
        this.updatePaymentProfile(event);
    }
    handleDateInserted(){
        this.dispatchEvent(new CustomEvent('dateinsertedpnt',{detail:{cardDetails:'dateInserted'}}));
    }
    handleCardInserted(){
        this.dispatchEvent(new CustomEvent('cardinsertedpnt',{detail:{cardDetails:'cardInserted'}}));
    }
    handleZipInserted(){
        this.dispatchEvent(new CustomEvent('zipinsertedpnt',{detail:{cardDetails:'zipInserted'}}));
    }
    handleHolderInserted(){
        this.dispatchEvent(new CustomEvent('holderinsertedpnt',{detail:{cardDetails:'holderInserted'}}));
    }
    handleCodeInserted(){
        this.dispatchEvent(new CustomEvent('codeinsertedpnt',{detail:{cardDetails:'codeInserted'}}));
    }
    handleDateEmpty(){
        this.dispatchEvent(new CustomEvent('dateemptypnt',{detail:{cardDetails:'dateEmpty'}}));
    }
    handleCardEmpty(){
        this.dispatchEvent(new CustomEvent('cardemptypnt',{detail:{cardDetails:'cardEmpty'}}));
    }
    handleZipEmpty(){
        this.dispatchEvent(new CustomEvent('zipemptypnt',{detail:{cardDetails:'zipEmpty'}}));
    }
    handleHolderEmpty(){
        this.dispatchEvent(new CustomEvent('holderemptypnt',{detail:{cardDetails:'holderEmpty'}}));
    }
    handleCodeEmpty(){
        this.dispatchEvent(new CustomEvent('codeemptypnt',{detail:{cardDetails:'codeEmpty'}}));
    }
    handleBankTypeDetails(){
        this.dispatchEvent(new CustomEvent('banktypepnt',{detail:{bankDetails:'type'}}));
    }
    handleBankAcctDetails(){
        this.dispatchEvent(new CustomEvent('bankacctpnt',{detail:{bankDetails:'acct'}}));
    }
    handleBankAcctRnDetails(){
        this.dispatchEvent(new CustomEvent('bankacctrnpnt',{detail:{bankDetails:'acctrn'}}));
    }
    handleBankAcctAnDetails(){
        this.dispatchEvent(new CustomEvent('bankacctanpnt',{detail:{bankDetails:'acctan'}}));
    }
    handleBankAcctDetailsEmpty(){
        this.dispatchEvent(new CustomEvent('bankacctemptypnt',{detail:{bankDetails:'acctempty'}}));
    }
    handleBankAcctRnDetailsEmpty(){
        this.dispatchEvent(new CustomEvent('bankacctrnemprypnt',{detail:{bankDetails:'acctrnempry'}}));
    }
    handleBankAcctAnDetailsEmpty(){
        this.dispatchEvent(new CustomEvent('bankacctanemprypnt',{detail:{bankDetails:'acctanempry'}}));
    }
    handleFireSpinner(event){
        if(event.detail.isOneTimePayment === true || event.detail.isOneTimePayment === 'true'){
            this.showLoadingSpinnerOTP = event.detail.showLoadingSpinner;
        } else{
            this.showLoadingSpinner = event.detail.showLoadingSpinner;
        }
    }
    handlebankaccountselected(){
        this.dispatchEvent(new CustomEvent('parentbankaccountselected'));
    }
    scrollToErrorSection(divId){
        const topDiv = this.template.querySelector('[data-id='+divId+']');
        if(topDiv) {
            topDiv.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
        }
    }
    getCardDataFromReducer(reducer){
        let cardData;
        if(reducer.paymentNumber){
            let responseCardInfo = reducer;
    
            cardData = JSON.stringify({
                cardType: responseCardInfo.paymentType,
                lastFourDigits: responseCardInfo.paymentNumber,
                expireMonth: responseCardInfo.expireMonth,
                expireYear: responseCardInfo.expireYear.length === 4 ? responseCardInfo.expireYear?.slice(- 2) : responseCardInfo.expireYear
            })
        }
        return cardData;
    }
    handlePeripheralClick() {
        this.isDisableUseCardReadRC = true;
        if (!this.isChecked && this.prePaymentCharges != null && this.prePaymentCharges > 0.00) {
            this.dispatchEvent(new CustomEvent('peripheralbtnclick', { detail: { paymentType: 'BOTH', oneTimeCharges: this.prePaymentCharges } }));
        } else {
            this.dispatchEvent(new CustomEvent('peripheralbtnclick', { detail: { 
                paymentType: 'RC',
                peripheralCardDataOC: this.peripheralCardDataOC,
                paymentProfileIdOC: this.peripheralPaymentIdOC,
                peripheralAuthorizationId: this.peripheralAuthorizationId,
                storeOCProfile: this.isStoreOneTimePaymentProfile
            } }));
        }
    }
    handleOneTimePaymentPeripheralClick() {
        //START SPTSLSATT-20214
        if(this.isRetailBankEnabled && this.isBankSectionRender && this.cardData && this.cardData.isBank && this.enrollInAutoPaycheckbox && this.prePaymentCharges > 0){
            this.abpOneTimePlan=false; 
            let newAbpDetails = (this.isnewcard || this.isnewbankaccount)? true : false;
            this.handlePaymentProfile(this.payMethodId?.value != '' && (this.payMethodId?.value == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_CARD || this.payMethodId?.value == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value),this.cardData,true,newAbpDetails);
        }
        //END SPTSLSATT-20214

        this.isDisableUseCardRead = true;
        this.dispatchEvent(new CustomEvent('peripheralbtnclick', { detail: { 
            paymentType: 'OC', 
            oneTimeCharges: this.prePaymentCharges, 
            paymentProfileIdRC: this.peripheralPaymentIdRC, 
            peripheralCardDataRC: this.peripheralCardDataRC,
            storeOCProfile: this.isStoreOneTimePaymentProfile
        } }));
    }
    async createSecondTripHelperAppJWT(peripheralProcessingResponse, placeId) {
        try {
        let cardData;
        if (this.peripheralParameters.paymentPromptType == 'BOTH') {
            cardData = peripheralService.getCardDataFromProfile(peripheralProcessingResponse.paymentProfileResponse, this.peripheralPaymentIdRC);
        }
        let ocCardData;
        if (this.peripheralParameters.paymentPromptType == 'OC') {
            //Need this for the OC scenario when we aren't saving our payment profile
            if (!this.isStoreOneTimePaymentProfile) {
                ocCardData = peripheralService.getCardDataFromAuth(peripheralProcessingResponse.authorizeResponse);
            } else {
                ocCardData = peripheralService.getCardDataFromProfile(peripheralProcessingResponse.paymentProfileResponseOC, this.peripheralPaymentIdRC);
            }
        }
        //scenario where we've already done RC, and are starting OC 2nd round trip, we need to send RC info as well
        if(!cardData && this.peripheralCardDataRC){
            cardData = this.peripheralCardDataRC;
        }
        if(!peripheralProcessingResponse.paymentProfileId && this.peripheralPaymentIdRC){
            peripheralProcessingResponse.paymentProfileId = this.peripheralPaymentIdRC;
        }
        if (peripheralProcessingResponse.error) {
            if (this.peripheralParameters.paymentPromptType == 'OC') {
                ocCardData = null
            }
            if (this.peripheralParameters.paymentPromptType == 'BOTH' || this.peripheralParameters.paymentPromptType == 'RC') {
                cardData = null
            }
        }
        if(this.pageRef && this.pageRef.state && this.pageRef.state.c__ban)
        {
        let jslog = {'message':JSON.stringify(this.pageRef.state.c__ban)};
            BwcUtils.nebulaLogger(this.recordId, 'Test`LWC', 'wbbPaymentDetailCmpCollapsible', 'pageref.c__ban', jslog);
            let jslog1 = {'message':JSON.stringify(this.props.customer.interactionDetails.BAN)};
            BwcUtils.nebulaLogger(this.recordId, 'Test`LWC', 'wbbPaymentDetailCmpCollapsible', 'jslog1', jslog1);
        }
        
        let tempBan ='';
        if(this.pageRef && this.pageRef.state && this.pageRef.state.c__ban)
        {
            tempBan = this.pageRef.state.c__ban;
        }
            let billingAddress = {
            'city':this.props.customer.billingAddress.address.city,
            'state':this.props.customer.billingAddress.address.state,
            'address1':this.props.customer.billingAddress.address.address1,
            'address2':this.props.customer.billingAddress.address.address2,
            'zipcode':this.props.customer.billingAddress.address.zipCode
        };
        let jwtBody = await peripheralService.buildJWTBody({
            recordId: this.recordId, 
            paymentType: this.peripheralParameters.paymentPromptType, 
            journeyType: this.props.customer.journeyType, 
            placeId: this.props.customer.serviceAddress.placeId, 
            oneTimeCharges: this.peripheralParameters.paymentAmount, 
            storePaymentProfile: this.isStoreOneTimePaymentProfile,
            paymentProfileId: peripheralProcessingResponse?.paymentProfileId, 
            authorizationId: peripheralProcessingResponse?.authorizationId,
            cardDataOC: ocCardData,
            cardDataRC: cardData,
            paymentProfileIdOC: peripheralProcessingResponse?.paymentProfileIdOC,
            ban : tempBan,
            enrollInAutoPaycheckbox:this.enrollInAutoPaycheckbox,
            billingAddress:JSON.stringify(billingAddress)
        });
        if(peripheralProcessingResponse.error){
            jwtBody.c__paymentError = peripheralProcessingResponse?.error ? peripheralProcessingResponse?.error : BUY_FLOW_PERIPHERAL_PROCESSING_ERROR;
        }else{
            jwtBody.c__paymentSuccess = true;
        }
        let token = await peripheralService.initializeHelperAppJWT(this.recordId, jwtBody); /*Added for conflict resoluton*/
        return token;/*Added for conflict resoluton*/ 
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'createSecondTripHelperAppJWT', error); //SPTSLSATT-20239
        }
    }
    handleSecurePaymentCompleted(event){ 
        this.handleSecurePaymentData(event,false);
    }
    handleOTPSecurePaymentCompleted(event){
        this.handleSecurePaymentData(event,true);
    }
    handleSecurePaymentData(event,isOTP){
        try {
        if(event.detail){
            let paymentData = (typeof event.detail.paymentProfile === 'string') ? JSON.parse(event.detail.paymentProfile) : event.detail.paymentProfile;
            let selectedPayMethodId = paymentData?.paymentMethodId;
            if(isOTP){
                paymentData.boolStoreOneTime = true;
                this.OcPayMethodId = selectedPayMethodId;
                let eventMsg = new CustomEvent('otpselection',{
                    detail: {
                        value: selectedPayMethodId
                    }
                });
                this.dispatchEvent(eventMsg)
                this.showPaymentComponentForBankForOneTime = false;
                this.showPaymentComponentForCardForOneTime = false;
                this.showSuccessBannerForOTP = true;
            }else{
                paymentData.boolIsSelected = true;
                this.payMethodId = selectedPayMethodId;
                let eventMsg = new CustomEvent('autopayselection',{
                    detail: {
                        value: selectedPayMethodId
                    }
                });
                this.dispatchEvent(eventMsg);
                this.showPaymentComponentForBank = false;
                this.showPaymentComponentForCard = false;
                this.showSuccessBannerForABP = true;
            }
            let evt = new CustomEvent('handlesecurepaymentcompleted',{
                detail: {
                    value: paymentData
                }
            });
            this.dispatchEvent(evt);
			let objeResp = (typeof this.objApiResponse === 'string') ? JSON.parse(this.objApiResponse) : this.objApiResponse;
            if (objeResp.Payments[0]?.paymentProfiles?.paymentProfileList) {
                objeResp.Payments[0].paymentProfiles.paymentProfileList = [...objeResp.Payments[0].paymentProfiles.paymentProfileList,paymentData];
            }
            this.objApiResponse = JSON.stringify(objeResp);
            this.selectedCardDetails =  paymentData;
            let paymentProfile = {};
            paymentProfile=updatePaymentObject(this,paymentData,!isOTP);
            if(isOTP){
                this.buyFlowPaymentMethod.oneTimePaymentProfile = paymentProfile;
            }else{
                this.buyFlowPaymentMethod.defaultPaymentProfile = paymentProfile;                      
            }
            this.props.updateBuyFlowPaymentMethod(this.buyFlowPaymentMethod);
            this.isContinueButtonDisable = false;
        }
    }
        catch (error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handleSecurePaymentData', error); //SPTSLSATT-20239
        }
    }
    postPaymentProfileError(){
        try {
        this.finalData ={'recurringFailureData' : this.recurringFailureData , 'recurringErrorResponse' : this.recurringErrorResponse, 'recurringSelectedTab' :this.recurringSelectedTab,
        'otpFailureData' : this.otpFailureData , 'otpErrorResponse' : this.otpErrorResponse, 'otpSelectedTab' :this.otpSelectedTab};
        if(this.objOneTimeAddResponse && !this.boolOtpErrorFlag && this.oneTimeCardData && this.oneTimeCardData.isStoreOneTimeCardDetail){
            this.checkPaymentDataInitialization(this.objOneTimeAddResponse);
        } else if(this.objAddResponse && !this.boolRecurringErrorFlag) {
            this.checkPaymentDataInitialization(this.objAddResponse);
        }
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'postPaymentProfileError', error); //SPTSLSATT-20239
        }
    }
    async postPaymentProfileSuccess(){
        try {
        this.finalData ={'recurringFailureData' : null , 'recurringErrorResponse' : null, 'recurringSelectedTab' :null,
        'otpFailureData' : null , 'otpErrorResponse' : null, 'otpSelectedTab' :null};
        if(this.objOneTimeAddResponse && this.oneTimeCardData && this.oneTimeCardData.isStoreOneTimeCardDetail){
            this.checkPaymentDataInitialization(this.objOneTimeAddResponse);
        }
        if(this.objAddResponse){
            this.checkPaymentDataInitialization(this.objAddResponse); 
        }
        if(!this.showPeripheral  || this.isBankSectionRender)//SPTSLSATT-20214 isBankSectionRender
        {
        this.props.updateBuyFlowPaymentMethod(this.buyFlowPaymentMethod);
        this.props.updateAutoPayPaymentMethod(this.camsPaymentMethodPayload);
        }
        if(!this.showCashSection && !this.showPeripheral)  //Cash Enhancement
        this.props.updateOTPPaymentMethod(this.camsPaymentMethodPayload);
                    
        this.isPatchError=false;
        if(!this.disableButtonPayment && !this.disableButtonPaymentOtp){
            
            if(this.flowName!==BwcBillingAccount.FlowName.EXTENDERSERVICES.value){//25402
                
                    
                    if((!this.showCashSection && !this.showPeripheral) || this.isBankSectionRender){//Cash Enhancement //SPTSLSATT-20214 isBankSectionRender
                        this.objApiResponse = this.parseToObj(this.objApiResponse);
                    let paymentTypeDetails = wbbParentServices.getPaymentDetails(this.objApiResponse, this.OcPayMethodId, this.payMethodId);
                    this.otpPaymentType = paymentTypeDetails.otpPaymentType;
                    this.otpPaymentNumber = paymentTypeDetails.otpPaymentNumber;
                    this.paymentType = paymentTypeDetails.paymentType;
                    this.paymentNumber = paymentTypeDetails.paymentNumber;
                    this.objApiResponse = JSON.stringify(this.objApiResponse);
                    }
                    
                  
                     if(this.showPeripheralOcCheck && this.props.peripheralParameters && this.props.peripheralParameters.paymentAuthorizationId 
                        && this.props.peripheralParameters.paymentAuthorizationId != null && this.props.peripheralParameters.paymentAuthorizationId != '') {
                            this.preAuthorizationId =  this.props.peripheralParameters.paymentAuthorizationId;
                        }  
                    //--- Changes made for CDEX-150050 **Cash Enhancement ----
                    if(!(this.flowName!==BwcBillingAccount.FlowName.EXTENDERSERVICES.value && !this.enrollInAutoPaycheckbox && (!this.oneTimeChargeForFlow || this.oneTimeChargeForFlow==0) && !this.showCashSection && !this.showPeripheral))
                    {
                         //SPTSLSDEL-27131
                         if(this.patchApiProfile?.channel?.name && this.recordId){
                            this.patchApiProfile.channel.name = await getChanneltype({interactionId: this.recordId});
                        }
                        await this.postPatchProfileCallout(this.cartId,this.patchApiProfile);/*Added for conflict resoluton*/
                        /*Added for conflict resoluton*/
                    }
            }
            if(!this.isPatchError){                 
                this.isPaymentCalloutSuccess = true;
                this.isSettterMethodPaymentRetrivalCalled = false; //CDEX-400888
            }
            //GTT Ban Pull - 1/15 - CDEX-375688 and CDEX-375083
            else{
                this.isPaymentCalloutSuccess = false;
            }
            //GTT Ban Pull
        }
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'postPaymentProfileSuccess', error); //SPTSLSATT-20239
        }
    }
    async postPatchProfileCallout(cartId, requestJson) {
        try { 
            if ((this.OcPayMethodId === null && this.OcPayMethodId!=='') && this.payMethodId !==null) 
              {
                  this.OcPayMethodId = this.payMethodId; 
            }
            this.OcPayMethodId = (typeof this.OcPayMethodId === 'string') ? this.OcPayMethodId :this.OcPayMethodId?.value;
            this.payMethodId = (typeof this.payMethodId === 'string') ? this.payMethodId :this.payMethodId?.value;
            if(!this.userSelectedOTPCHeck && this.payMethodId !==null && this.payMethodId !== undefined && this.payMethodId !== ''){
                this.OcPayMethodId = this.payMethodId;
                this.otpSummaryView = false;
            }
            if(this.recordId && this.showSecurePaymentSection){
                await FlowState.getStateByInteractionId(this.recordId)
                .then(async(persistedState) => {
                    if(persistedState.CartExternalId__c && this.OcPayMethodId && this.OcPayMethodId.includes(persistedState.CartExternalId__c)){
                        this.storeOneTimePaymentProfile = false;
                        this.isStoreOneTimePaymentProfile = false;
                    }else{
                        this.storeOneTimePaymentProfile = true;
                        this.isStoreOneTimePaymentProfile = true;
                    }
                });  
            }
              if(this.patchingDetails && this.patchingDetails.length >0 && this.prePaymentCharges > 0){
                requestJson.payments = [];
                //GTT Ban Pull - CDEX-375688 and CDEX-375083

                let logforPatchPayment={
                    storeOTP:this.isStoreOneTimePaymentProfile,
                    isdiffcard:this.userSelectedOTPCHeck,
                    flowstatepreauth:this.flowState?.Authorization_IDs__c,
                    preauth:this.preAuthorizationId,
                    ocprofile:JSON.stringify(this.OcPayMethodId),
                    paymethod_id:JSON.stringify(this.payMethodId),
                    patchingdetails:JSON.stringify(this.patchingDetails),
                    buyflowpaymentdetails:JSON.stringify(this.props?.buyFlowPaymentMethod)
                    
                }
                let jslogForUpdatePaymentInfo = {'message':JSON.stringify(logforPatchPayment)};
                BwcUtils.nebulaLogger(this.recordId, 'logForUpdatePaymentInfo', 'wbbPaymentDetailCmpCollapsible', 'jslogForUpdatePaymentInfo', jslogForUpdatePaymentInfo);
       
                if(this.showPeripheral && this.flowState?.Authorization_IDs__c && !this.preAuthorizationId){
                    this.preAuthorizationId= this.flowState?.Authorization_IDs__c
                }
                if(!this.showPeripheral && this.enrollInAutoPaycheckbox && this.userSelectedOTPCHeck && this.isStoreOneTimePaymentProfile && !this.OcPayMethodId && this.payMethodId )
                {
                    this.OcPayMethodId =this.payMethodId 
                }       
                //GTT Ban Pull - CDEX-375688 and CDEX-375083
                this.patchingDetails.forEach(item =>{
                    if((item.amount > 0 && item.amount!== null) || this.props.customer.journeyType== BwcConstants.WLS_BUYFLOW_JOURNEY_NAME){ //WLS CCSTSP-1710
                        if(this.preAuthorizationId != null && this.preAuthorizationId != ''){                                
                            //requestJson.payments.splice(0,1); CDEX-405388
                            // CDEX_392818 Start rb263v
                            if(this.productType == this.label.BB && (this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.paymentProfileId)) 
                                {
                                    let dynamicOC = {                                
                                        'preAuthorizationId':this.preAuthorizationId,                                
                                        'role': this.props.customer.journeyType== BwcConstants.WLS_BUYFLOW_JOURNEY_NAME && item.role =='' ?'DueUponFulfillment' : item.role,//WLS CCSTSP-1710
                                        'lineItemId': item.itemId,
                                        'amount': item.amount,
                                        'storePaymentProfile': this.storeOneTimePaymentProfile,
                                        'bbflow':true,
                                        'paymentMethodId':this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.paymentProfileId                       
                                    };
                                     requestJson.payments.push(dynamicOC);
                                     this.OcPayMethodId = this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.paymentProfileId; // CDEX-392818
                                    }
                            else{
                            let dynamicOC = {
                                'preAuthorizationId':this.preAuthorizationId,
                                'role': this.props.customer.journeyType== BwcConstants.WLS_BUYFLOW_JOURNEY_NAME && item.role =='' ?'DueUponFulfillment' : item.role,//WLS CCSTSP-1710
                                'lineItemId': item.itemId,
                                'amount': item.amount,
                                'storePaymentProfile': this.storeOneTimePaymentProfile                       
                            };
                            requestJson.payments.push(dynamicOC);
                            }                                         
                           
                        } // CDEX_392818 END rb263v
                        else{  
                        let dynamicOC = {
                            'paymentMethodId':this.OcPayMethodId,
                            'role': this.props.customer.journeyType== BwcConstants.WLS_BUYFLOW_JOURNEY_NAME && item.role =='' ?'DueUponFulfillment' : item.role, //WLS CCSTSP-1710
                            'lineItemId': item.itemId,
                            'amount': item.amount,
                            'storePaymentProfile': (this.OcPayMethodId === this.payMethodId) ? true : (this.existingCardArray.includes(this.OcPayMethodId) ? true : this.storeOneTimePaymentProfile)
                        };//CDEX-395641 - updated storePaymentProfile false condition.
                      requestJson.payments.push(dynamicOC);
                        }
                    }
                });
            }
             //Cash Enhancement starts
            if(this.otp && this.showCashSection && this.prePaymentCharges>0){
                BwcUtils.log('Request JSON for Cash Patch Enters:::'+JSON.stringify(this.patchingDetails)+'==>'+this.patchApiProfile);
                let banForCash =(this.props.customer?.interactionDetails?.BAN )? this.props.customer?.interactionDetails?.BAN : this.ban;
                //GTT Ban Pull - added below condition to if - CDEX-375688 and CDEX-375083
                if(this.flowState?.AIABAN__c && (!banForCash ||(banForCash !== this.flowState?.AIABAN__c)) ){banForCash=this.flowState?.AIABAN__c};//CDEX-295779
                requestJson =await paymentServices.buildPaymentPatchForCashRequest(banForCash,this.patchingDetails,this.patchApiProfile,this.prePaymentCharges);
                if(!this.props?.customer?.interactionDetails?.BAN && banForCash )
		        {   
                    this.props.customer.interactionDetails.BAN = banForCash
			        this.props.updateBAN(this.props.customer);
		        }
                BwcUtils.log('Request JSON for Cash Patch'+JSON.stringify(requestJson));
                }
            //Cash Enhancement ends 

            if(this.prePaymentCharges > 0){
                const objResponse = await paymentServices.postPatchProfileCallout(cartId, JSON.stringify(requestJson),this.props.uuId, this.interactionRecordIdValue);
                if(BWC_Peripheral_Debug)
                    {
                        alert('requestJson for patch-->' +JSON.stringify(requestJson));
                        alert('objResponse for patch-->' +JSON.stringify(objResponse));
                    }
                if(objResponse.code >='400'){
                  //GTT Ban Pull - CDEX-375688 and CDEX-375083
                  this.isPatchError= true;
                  console.log('isPatchError >>>'+this.isPatchError);
                    if(this.oneTimeCardData && !this.oneTimeCardData.isStoreOneTimeCardDetail){
                        this.OcPayMethodId =null;
                    }
                    BwcUtils.showToast(this, {
                        message : 'There was an issue in submitting One time payment details. Please try again', //GTT Ban Pull - CDEX-375688 and CDEX-375083
                        variant: 'error',
                        mode : 'sticky'
                    });
                    return //GTT Ban Pull
                } else{
                return objResponse;
                }
            }
        }
          catch (Error) {
            BwcUtils.error('Error in patch Payment Profile ' + JSON.stringify(Error));
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'postPatchProfileCallout', Error); //SPTSLSATT-20239
                //GTT Ban Pull - CDEX-375688 and CDEX-375083
                this.isPatchError= true
               if(this.oneTimeCardData && !this.oneTimeCardData.isStoreOneTimeCardDetail){
                this.OcPayMethodId =null;
               }
	          BwcUtils.showToast(this, {
                    message : 'There was an issue in submitting One time payment details. Please try again', //GTT Ban Pull - CDEX-375688 and CDEX-375083
                    variant: 'error',
                    mode : 'sticky'
                });
              }
    }
    checkPaymentDataInitialization(objSuccessResponse){
        let strObjApiResponse = (typeof this.objApiResponse === 'string') ? this.objApiResponse : JSON.stringify(this.objApiResponse);
        //CDEX-383038 ak4124 4/15 Start
        if(objSuccessResponse.code==200){
        this.objApiResponse = JSON.stringify(wbbParentServices.updatePaymentDataInitialization(objSuccessResponse, strObjApiResponse));
    }
        //CDEX-383038 ak4124 4/15 End
    }
    createAddRequest(cardData, boolIsAutoPay, cartExternalId){
        this.paymentProfile = wbbParentServices.getCreateAddRequest(this.paymentProfile, cardData, boolIsAutoPay, this.paymentMethod,
            this.flowName, this.props.camsProductPurchaseReview, this.originalIndividualId, cartExternalId, this.label.ProfileOwnerPrefix);
    }
     async deletePaymentProfile(event) {
        this.readParentSpinner(event.detail.isOneTimePayment, true);
        const strPaymentProfileId = event.detail.paymentMethodId;
        const strPaymentMethod = event.detail.type;
        try {
            // Payment Profile Info for Delete.
            const strPaymentProfile = {
                paymentMethodId: strPaymentProfileId
            };
            const objDeletedResponse = await this.paymentProfileCallout(JSON.stringify(strPaymentProfile), paymentServices.PostPaymentProfileMode.DELETE, strPaymentMethod); /*Added for conflict resoluton*/
            if (objDeletedResponse && objDeletedResponse.content && objDeletedResponse.content.responseCode === '1') {
                if (this.objApiResponse) {
                    this.objApiResponse = JSON.parse(this.objApiResponse);
                    const strToDeleteIndex = this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList.findIndex(objProfile => objProfile.paymentMethodId === strPaymentProfileId);
                    this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList.splice(strToDeleteIndex, 1);
                    this.profileListDetails=this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList;
                    this.objApiResponse = JSON.stringify(this.objApiResponse);
                    if (this.setUpBillingPageIssues) {//SPTSLSATT-20239
                        this.callPaymentRetrivalAPI();
                    }
                    const respMsg = new CustomEvent('showresponsemessage', {
                        detail: {
                            code:objDeletedResponse.content.responseCode,
                            description:this.label.SUCCESS_CODE_200,
                            showPatchError:false
                        }
                    });
                    this.dispatchEvent(respMsg);
                }
            } else if(objDeletedResponse && objDeletedResponse.code>='400'){
                this.errorDescription=objDeletedResponse.description;
                const respMsg = new CustomEvent('showresponsemessage', {
                    detail: {
                        code:objDeletedResponse.code,
                        description:objDeletedResponse.description,
                        showPatchError:false
                    }
                });
                this.dispatchEvent(respMsg);
            }
        }
        catch (error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'deletePaymentProfile', error); //CCSTMA-5828 //SPTSLSATT-20239
        }
        finally {
            this.readParentSpinner(event.detail.isOneTimePayment, false); 
        }
    }
    async paymentProfileCallout(strPaymentProfile, strMode, strPaymentMethod) {
        try {
        let useCaseCredit = false;
        const objResponse = await paymentServices.postPaymentProfileCallout(strPaymentProfile, strMode, strPaymentMethod,this.interactionRecordIdValue, this.flowName,this.props.customer.interactionDetails.uuid,useCaseCredit) /*Added for conflict resoluton*/    
        return objResponse;/*Added for conflict resoluton*/
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'paymentProfileCallout', error); //SPTSLSATT-20239
        }
    }
        async updatePaymentProfile(event) {
            this.readParentSpinner(event.detail.isOneTimePayment, true);
            const strPaymentType = event.detail.type;
            const objUpdatedCardData = event.detail.updatedDetails;
            try {
                this.paymentProfile = wbbParentServices.preUpdatePaymentProfile(event, this.paymentMethod, this.paymentProfile, this.originalIndividualId, this.objApiResponse);
                //Start raiser code
                let tokenizedFields = [];
                //SPTSLSATT-17085 
                this.paymentProfile.tokenizedFields = await processTokenizedFields({
                    tokenizedparams:{tokenizedFields: tokenizedFields, mode: 'update', pp: this.paymentProfile,cardData:JSON.stringify(objUpdatedCardData)}
                
            });
                BwcUtils.log('----parentCmpraiser request update paymentProfile---'+JSON.stringify(this.paymentProfile));
                //End raiser code
                const objUpdatedResponse = await this.paymentProfileCallout(JSON.stringify(this.paymentProfile), paymentServices.PostPaymentProfileMode.UPDATE, strPaymentType);/*Added for conflict resoluton*/
                /*Added for conflict resoluton*/
                if (this.objApiResponse !== null && this.objApiResponse !== '' && objUpdatedResponse && objUpdatedResponse.content && objUpdatedResponse.content.responseCode === '1') {
                    let updatePaymentMethodDetails = objUpdatedResponse.content.paymentProfiles.paymentProfilesList.filter(x => x.paymentMethodId ===  objUpdatedCardData.paymentMethodId )[0];
                    this.objApiResponse = JSON.parse(this.objApiResponse);
                     let objElement =   this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList.filter(x => x.paymentMethodId ===  objUpdatedCardData.paymentMethodId )[0];
                     objElement = wbbParentServices.postUpdatePaymentProfile(objElement,updatePaymentMethodDetails);
                     this.profileListDetails=this.objApiResponse.Payments[0].paymentProfiles.paymentProfileList;
                     const respMsg = new CustomEvent('showresponsemessage', {
                        detail: {
                            code:objUpdatedResponse.content.responseCode,
                            description:this.label.SUCCESS_CODE_200,
                            showPatchError:false
                        }
                    });
                    this.dispatchEvent(respMsg);
                     this.objApiResponse = JSON.stringify(this.objApiResponse);                
                     this.isContinueButtonDisable = false;
                 } else if(objUpdatedResponse && objUpdatedResponse.code>='400') {
                  this.errorDescription=objUpdatedResponse.description;
                  this.updateErrorFieldName=objUpdatedResponse.fieldName;
                  const respMsg = new CustomEvent('showresponsemessage', {
                    detail: {
                        code:objUpdatedResponse.code,
                        description:this.errorDescription,
                        showPatchError:false
                    }
                });
                this.dispatchEvent(respMsg);
                 
                }
            } catch (error) {
                BwcUtils.error('Error in Update Payment Profile ' + JSON.stringify(error.message));
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'updatePaymentProfile', error); //SPTSLSATT-20239
            } finally {
                this.readParentSpinner(event.detail.isOneTimePayment, false); 
            }
        }
        handleEdit(){ 

            this.callPaymentRetrivalAPI();
            this.isPaymentDetail ='';
            const passEditClickEvent = new CustomEvent("editclick", {
                detail:this.paymentDetailSectionData
            });
              this.dispatchEvent(passEditClickEvent);  
              if(this.showPeripheral)
                {
                    if(this.peripheralParameters && this.peripheralParameters.cardDataRC && this.prePaymentCharges != null && this.prePaymentCharges > 0.00)
                    {        
                        if(this.peripheralParameters.cardDataOC || this.isDisableUseCardRead )
                        {
                            
                            this.isContinueButtonDisable = false;                 
                        }
                    }
                    else if(this.peripheralParameters && this.peripheralParameters.cardDataRC)
                    {
                        this.isContinueButtonDisable = false;
                    }
                }
        }
        async executeContinue(){
            this.boolOtpErrorFlag =false;//CDEX-347037 Samrat 9/24
            this.boolRecurringErrorFlag = false;//CDEX-347037 Samrat 9/24
            if(!this.executeContinueIsInProgress) { 
                //CDEX-295779
                let flow = !this.flowName?'NewService':this.flowName; //1/15 - CDEX-375693, CDEX-375688 and CDEX-375083 - logs
                this.flowState = await getFlowState({recordId: this.recordId, journeyName: flow});
                //CDEX-295779
                this.executeContinueIsInProgress = true;
                this.showLoadingSpinner = true;
            this.merchantId= await getMerchantId();
            let buyFlowPaymentMethod = this.props?.buyFlowPaymentMethod;
            if(this.isRetailBankEnabled){
                this.buyFlowPaymentMethod.oneTimePaymentAuthorization = this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization;  
            } 
            let isKeysChanged = false;
            let keys = [];
            this.showInfoMsgForSameABPandOTP=false;
            let isOneTimeCharges=this.oneTimeChargeForFlow > 0;
            let storeOTP = wbbParentServices.getStoreOtp(this?.oneTimeCardData?.isStoreOneTimeCardDetail, this.flowName, this.newCardSelectedForOTP, this.userSelectedOTPCHeck);
            let businessKey;
            let newAbpDetails = (this.isnewcard || this.isnewbankaccount)? true : false;
            let keyOnLoad= paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges);
            if(isOneTimeCharges){
                businessKey=paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP, this.isnewcard, false);
            } else{
                businessKey=keyOnLoad;
            }
            let isNewAbp = isOneTimeCharges && !this.userSelectedOTPCHeck && this.paymentBusinessKeys.includes(keyOnLoad);
            if(this.flowName!==BwcBillingAccount.FlowName.EXTENDERSERVICES.value){
                if(isOneTimeCharges){
                    if((this.cardData && this.cardData.cardNumber) || (this.oneTimeCardData && this.oneTimeCardData.cardNumber)){
                        if(this?.oneTimeCardData?.isStoreOneTimeCardDetail){
                            if(businessKey && this.paymentBusinessKeys!==undefined && !this.paymentBusinessKeys.includes(businessKey)){
                                isKeysChanged = true;
                                this.showInfoMsgForStoringOTP=true;
                                keys = [...keys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP)];
                    }
                    }else{
                            if(businessKey && !this.paymentBusinessKeys.includes(businessKey) && !this.isnewcard){
                                isKeysChanged = true;
                                this.showInfoMsgForStoringOTP=false;
                                keys = [...keys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP)];
                            }
                            //Adding for SPTSLSDEL-9944
                            if(isNewAbp){
                                isKeysChanged = true;
                                this.showInfoMsgForSameABPandOTP=true;
                                keys = [...keys,  paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP, this.isnewcard)];
                            }
        
                            if(this.userSelectedOTPCHeck && this.storeOtpProfileSelectedPreviously && businessKey && !this.paymentBusinessKeys.includes(businessKey)){
                                isKeysChanged = true;
                                this.showInfoForNoOtpStorage = true; 
                                keys = [...keys,  paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP)];
                            }
                        }  
                    }
                }else{
                    if(businessKey &&  this.paymentBusinessKeys!==undefined && !this.paymentBusinessKeys.includes(businessKey)){
                        isKeysChanged = true;
                        keys = [...keys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges)];
                    }
                }
            }
            if(!this.showCashSection){//Cash Enhancement
            try {
                this.props.addBusinessKeys(this.paymentBusinessKeys);
            } catch (error) {
                BwcUtils.log('Error in Redux in BusinessKeys');
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'executeContinue', error); //SPTSLSATT-20239
            }
            }
            BwcUtils.log(' CONTINUE PAYMENT PROFILES '+JSON.stringify(this.paymentProfile));
            this.showModalSpinnerPrt = true;
            this.isLoadingNextPage = true;
            this.recurringFailureData =null;
            this.otpFailureData = null;
            this.otpErrorResponse = null;
            this.recurringErrorResponse = null;
            
            if(this.flowName != BwcBillingAccount.FlowName.EXTENDERSERVICES.value  && !this.enrollInAutoPaycheckbox){  
                this.showToastError = false;
                this.userSelectedOTPCHeck=false;
                if(this.prePaymentCharges <= 0){
                    this.oneTimeCardData = null;
                }
            }else if (this.userSelectedOTPCHeck) { 
                if(this.OcPayMethodId==null && !this.oneTimeCardData && !this.showCashSection && !buyFlowPaymentMethod.oneTimePaymentAuthorization?.paymentAuthorizationId) {//Cash Enhancement
                    this.showToastError = true;
                    let payLoad = {};
                    payLoad.divID = 'showToastDiv';
                    publish(this.messageContext, scrollToTopMsgChnl, payLoad);
                } else {
                this.showToastError = false;                        
                }                
            } else {
                
                this.showToastError = false;
                this.userSelectedOTPCHeck=false;
                this.oneTimeCardData=null;
            }
            //main scenario 
            if(this.enrollInAutoPaycheckbox ){
            if(this.payMethodId==null && !this.cardData && !buyFlowPaymentMethod?.defaultPaymentProfile?.paymentMethodId)
            {
                //just to rerender in case continue button clicked twice
                this.showToastErrorAutopay = false;
                this.showToastErrorAutopay = true;
                let payLoad = {};
                payLoad.divID = 'showToastAutoPayDiv';
                publish(this.messageContext, scrollToTopMsgChnl, payLoad);  
            } else
            this.showToastErrorAutopay = false;
            }                                
            this.isClosed = wbbParentServices.getClosedValue(this.validateCheckbox,this.isbankaccount);
            if(this.showToastError || this.showToastErrorAutopay)
            {
                this.isLoadingNextPage = false;
                    this.executeContinueFinished();
                return false;
            }                            
            try{
                
                if(!this.showToastError && !this.showToastErrorAutopay){
                    if(this.prePaymentCharges > 0 && this.userSelectedOTPCHeck && (this.OcPayMethodId === this.payMethodId || this.OcPayMethodId ===this.payMethodId?.value)){
                        this.OcPayMethodId=null;
                    }        
                    
                    if(this.prePaymentCharges > 0 && !this.showCashSection && !this.showPeripheral){//Cash Enhancement
                    this.abpOneTimePlan=true;
                        await this.handlePaymentProfile((this.OcPayMethodId?.value=== BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_CARD || this.OcPayMethodId?.value == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value  ||this.OcPayMethodId===null) && !this.showSecurePaymentSection,this.oneTimeCardData,false,null);
                    }
                    
                    if((this.enrollInAutoPaycheckbox && !this.showPeripheral) 
                        || (this.enrollInAutoPaycheckbox && this.isRetailBankEnabled && this.isBankSectionRender && 
                            (((this.isReatilBankAllFieldChecked || (this.showCashSection && this.cardData && this.cardData.isBank)) && this.payMethodId?.value == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value) ||
                                (this.payMethodId?.value != '' && this.payMethodId?.value != BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value)))) {//SPTSLSATT-20214
                        this.abpOneTimePlan = false;
        
                        await this.handlePaymentProfile(this.payMethodId?.value != '' && (this.payMethodId?.value == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_CARD || this.payMethodId?.value == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD_Value),this.cardData,true,newAbpDetails);
                    }
                   
                    if(this.boolOtpErrorFlag || this.boolRecurringErrorFlag){ //CDEX-398390 issue fix
                        this.postPaymentProfileError();
                    }
                    else{
                        await this.postPaymentProfileSuccess();
                    }
                } 
                this.statusMessage=this.statusMessage+ 'Success '+' ';
                this.successFlag=this.successFlag+'1'+' ';
            }catch (Error) {
                this.errorInContinue = true;
                BwcUtils.error('Error in execute Continue Method' + JSON.stringify(Error.message));
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'executeContinue', Error); //SPTSLSATT-20239
                //Display any Error in catch block on UI.
                let objCatchBlockError =wbbParentServices.getContinueError(Error);
                const respMsg = new CustomEvent('showresponsemessage', {
                    detail: {
                        code:'400',
                        description:objCatchBlockError,
                        showPatchError:true
                    }
                });
                this.dispatchEvent(respMsg);
                this.statusMessage=this.statusMessage+ Error+' ';
                this.successFlag=this.successFlag+'0'+' ';
            }finally{
                            if(this.isPaymentCalloutSuccess){
                                if(this.otp){
                                    if(!this.showCashSection)//Cash Enhancement
                                    {
                                    await this.handleOTPDataSummaryView();
                                    } 
                                    else{
                                    this.handleCashPaySuccess();
                                    }                                
                  }
                        if(this.enrollInAutoPaycheckbox) {
                            await this.handleABPDataSummaryView();
                  }
                                // Add the code to open new section in collapsible
                                const passContinueClickEvent = new CustomEvent("continueclick", {
                                  detail:this.paymentDetailSectionData
                              });
                              this.dispatchEvent(passContinueClickEvent);
                            }        
                            
                    this.executeContinueFinished();             
                }
            this.OcPayMethodId = this.OcPayMethodId === this.payMethodId? '' : this.OcPayMethodId;
            this.OcPayMethodId = (typeof this.OcPayMethodId === 'string') ? this.OcPayMethodId :this.OcPayMethodId?.value;
            this.payMethodId = (typeof this.payMethodId === 'string') ? this.payMethodId : (this.payMethodId?.value === 'new card' ? this.payMethodId : this.payMethodId?.value);//CDEX-347037 Samrat 9/24
            await FlowState.upsertSetupBillingFields(this.recordId,null,null,null,null,null,null,null,this.payMethodId,
            this.OcPayMethodId,this.isChecked,null,null,null,this.cardCaptured); //CDEX-308265 ak4124 11/19/24

            this.handleUpdateBillingPref();//patching paperless billing
            }       
            if(this.setUpBillingPageIssues && this.lastExecutedTab != ''){//SPTSLSATT-20239
                const payload = new CustomEvent("selectedtab", {
                    detail: this.lastExecutedTab
                });
                this.dispatchEvent(payload);
            }       
        }
          parseToObj(value) { 
            return (typeof value === BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.OBJECT) ? 
                        JSON.parse(JSON.stringify(value)) : 
                        JSON.parse(value);  
        }  
        handleEncrypt(event) {
            let encryptDataJson = wbbParentServices.encryptData(this.cardData, event, this.paymentDetails, this.encryptCardNumber, this.oneTimeCardData, this.encryptCardNumberOneTime);
            this.cardData = encryptDataJson.cardData;
            this.oneTimeCardData = encryptDataJson.oneTimeCardData;
            this.encryptCardNumber = encryptDataJson.encryptCardNumber;
            this.encryptCardNumberOneTime = encryptDataJson.encryptCardNumberOneTime;
        }  
        showResponseMessage(code,description,showPatchError){ 
            if(code>='400'){
            if(showPatchError) {
                this.isPatchError=true;
                this.errorMessageBackground = 'error';
                this.errorMessageIcon = BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.UTILITY_ICON;
                this.errorMessageLabel = description;
                this.showTopError=!this.showTopError;
                this.scrollToErrorSection('topErrorDiv');
                this.getError=false;
                this.timeoutRequired=true;
                this.isCloseBtnRequired = true;
                } else{
                this.errorMessageBackground = 'error';
                this.errorMessageIcon = BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.UTILITY_ICON;
                this.errorMessageLabel = description;
                this.getError=true;
                this.showErrorFunction(description);
                this.timeoutRequired=false;
                this.isCloseBtnRequired = false;
            }
        } else if(code=='1')
           {
            this.errorMessageBackground = 'success';
            this.errorMessageIcon = 'utility:success';
            this.errorMessageLabel = this.label.SUCCESS_CODE_200;
            this.myDetails=!this.myDetails;
            this.getError=false;
            this.timeoutRequired=true;
            this.isCloseBtnRequired = true;
           }
        }                  
        async handleABPDataSummaryView(){
        let cardHolderName;
        let paymentMethodDetails;
        let paymentMethod;
        let Autopay;
        this.paymentDetailSummaryData=[];
        let jslog = {'message':JSON.stringify(this.props.buyFlowPaymentMethod)};
            BwcUtils.nebulaLogger(this.recordId, 'Test`LWC', 'wbbPaymentDetailCmpCollapsible', 'ABP-buyFlowPaymentMethod', jslog);
        if(this.props?.buyFlowPaymentMethod){
            //undefined issue fix
            cardHolderName={key:'Name',value:this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.name}; 
            paymentMethodDetails = this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentType  + " **" + this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentNumber;
            paymentMethod={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_METHOD,value:paymentMethodDetails}; 
            Autopay={key:'Autopay',value:this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.autoPay?'ON':'OFF'};    
        }
        this.paymentDetailSummaryData.push(cardHolderName);
        this.paymentDetailSummaryData.push(paymentMethod);
        this.paymentDetailSummaryData.push(Autopay);
        this.autoPaySummaryView=true;//Cash Enhancement
    }
    handleSelectedCardDetails(event){
        this.selectedCardDetails = event.detail;
    }
    async handleOTPDataSummaryView(){             
        this.paymentDetailOTPSummaryData=[];
        let cardHolderName;
        let paymentMethodDetails;
        let paymentMethod;
        let paymentStorage;
        let jslog = {'message':JSON.stringify(this.props.buyFlowPaymentMethod)};
            BwcUtils.nebulaLogger(this.recordId, 'Test`LWC', 'wbbPaymentDetailCmpCollapsible', 'OTP-buyFlowPaymentMethod', jslog);
        if(this.props?.buyFlowPaymentMethod){
            //undefined issue fix
            if(this.props?.buyFlowPaymentMethod && !this.showPeripheral)
            {
            cardHolderName={key:'Name',value:this.props?.buyFlowPaymentMethod?.oneTimePaymentProfile?.name}; 
            paymentMethodDetails = this.props?.buyFlowPaymentMethod?.oneTimePaymentProfile?.paymentType  + " **" + this.props?.buyFlowPaymentMethod?.oneTimePaymentProfile?.paymentNumber;
            paymentMethod={key:'Payment Method',value:paymentMethodDetails}; 
            if(this.props?.payment?.paymentDefault?.autoPayFlag){
            if(this.props?.buyFlowPaymentMethod?.oneTimePaymentProfile?.diffABPMethodForOTP){
                paymentStorage={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_STORAGE,value: (this.existingCardArray.includes(this.OcPayMethodId) || this.isStoreOneTimePaymentProfile) ?'Stored':'Not Stored'}; //CDEX-398186 
            }else{
                paymentStorage={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_STORAGE,value:'Stored'};
            }            
            } else {
                paymentStorage={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_STORAGE,value:this.isStoreOneTimePaymentProfile ?'Stored':'Not Stored'};
            }
        }               
            else
            {
                cardHolderName={key:'Name',value:this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.name}; 
                paymentMethodDetails = this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.paymentType  + " **" + this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.paymentNumber;
                paymentMethod={key:'Payment Method',value:paymentMethodDetails}; 
                if(this.props?.payment?.paymentDefault?.autoPayFlag){
                if(this.props?.buyFlowPaymentMethod?.oneTimePaymentAuthorization?.diffABPMethodForOTP){
                    paymentStorage={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_STORAGE,value:this.isStoreOneTimePaymentProfile ?'Stored':'Not Stored'};   
                }else{
                    paymentStorage={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_STORAGE,value:'Stored'};
                }     
                } else {
                    paymentStorage={key:BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.PAYMENT_STORAGE,value:this.isStoreOneTimePaymentProfile ?'Stored':'Not Stored'};
                }    
            }           
        }               
        
        if( this.props.customer.journeyType== BwcConstants.WLS_BUYFLOW_JOURNEY_NAME){ //WLS CCSTSP-1710

            this.paymentDetailOTPSummaryData.push(cardHolderName);
            this.paymentDetailOTPSummaryData.push(paymentMethod);
            this.otpSummaryView = true; 

        } 
        else{             
        this.paymentDetailOTPSummaryData.push(paymentMethod);
        this.paymentDetailOTPSummaryData.push(paymentStorage);
        this.otpSummaryView = true; 
    }
    }
    //updatePaymentObject moved to helper
    //SPTSLSATT-8762
    onRaisrEvent(event) {
        BwcUtils.log('in outstaing',JSON.parse(JSON.stringify(event.detail)));
        BwcUtils.log('logging raisr event');
        let isDisabled = true;
        let msg = event.detail.message;
        if (msg.messageSource === RAISR_MSG_CH.MSG_SOURCE.RAISR_DROP_DOWN_CONTROL) {
            if (msg.messageBody.reason === 'RAISR disabled by WFH') {
                if (hasWfhPermission && !HAS_ENTER_BILLING_PAYMENT_DETAILS) {
                this.showSecurePaymentSection = true;
                    this.isVoiceMaskingButtonVisible = false;
                    this.props.customer.isSecurePaymentEnabled = true;
                    this.props.updateSecurePaymentFlag(this.props.customer);
                    FlowState.upsertFlowStateSecurePaymentFlag(this.recordId, 'NewService', this.props.customer.serviceAddress.placeId, this.showSecurePaymentSection);
                }
            }
        }
    }
    //SPTSLSATT-8762
     handleisRaisrActive(event){
        this.isRaisrActive = event.detail;
    const activeRaisrEvent = new CustomEvent('israisractive', { detail: event.detail });
        this.dispatchEvent(activeRaisrEvent);
    }
     sendMessageToRaisrChannel( msg ){
        const raisrCh = this.template.querySelector( "c-bwc-raisr-msg-pub-sub-cmp");
        if ( raisrCh ) {
          raisrCh.postMessage( msg );
        }
      }
    async handlePaymentProfile(flag,cardData, paymentProfileFlag,newAbpDetails){
        try {
            let tempPayMethodId;
            if(paymentProfileFlag && tempPayMethodId === undefined && this.payMethodId?.length!==0){
            tempPayMethodId=(typeof this.payMethodId === 'string') ? this.payMethodId :this.payMethodId?.value;
            }
            else if(this.prePaymentCharges > 0 && this.props?.customer?.journeyType == BwcConstants.WLS_BUYFLOW_JOURNEY_NAME){ //WLS CCSTSP-1710
    if(!this.userSelectedOTPCHeck && (this.OcPayMethodId === this.payMethodId || this.OcPayMethodId == undefined )){
    tempPayMethodId=(typeof this.payMethodId === 'string') ? this.payMethodId :this.payMethodId?.value;
    }
    else{
    tempPayMethodId = (typeof this.OcPayMethodId === 'string') ? this.OcPayMethodId :this.OcPayMethodId?.value;
    }
            }
            else if(this.prePaymentCharges > 0 && !this.userSelectedOTPCHeck){
            tempPayMethodId=(typeof this.payMethodId === 'string') ? this.payMethodId :this.payMethodId?.value;
            }else if(this.prePaymentCharges > 0 && this.userSelectedOTPCHeck && (this.OcPayMethodId === this.payMethodId)){
            tempPayMethodId='';
            }else{
            tempPayMethodId = (typeof this.OcPayMethodId === 'string') ? this.OcPayMethodId :this.OcPayMethodId?.value;
            }
            if(flag && cardData){
                this.createAddRequest(cardData, paymentProfileFlag, this.props.cart.externalId);
                this.paymentProfile.merchantId=this.merchantId;
                const strPaymentMethod = cardData.isCard ? 'CARD' : 'BANKACCOUNT';
                let tokenizedFields = [];
                //SPTSLSATT-17085 
                this.paymentProfile.tokenizedFields = await processTokenizedFields(
    {tokenizedparams:
                {tokenizedFields: tokenizedFields, mode: 'add', pp: this.paymentProfile,cardData:JSON.stringify(cardData)}
                    }
                );
                //ABP change - start
                if(this.featureFlag && this.productType == this.label.BB && this.abpOneTimePlan==false)
                {
                handleTenderCardInFlowState(this, cardData);
                }
                //ABP change -end
                //PreAUth Chnage start
                let paymentType = this.abpOneTimePlan?  'Advance Pay Or Pre-Pay': 'Auto Bill Pay';
                let inputtype     = cardData.isCard? 'Credit Card' : 'Bank Account';
                FlowState.upsertCashTranscation(this.recordId,paymentType,inputtype);
                //PreAUth Chnage end
                BwcUtils.log('----parentCmpraiser request add paymentProfile---'+JSON.stringify(this.paymentProfile));
                this.objAddResponse = await this.paymentProfileCallout(JSON.stringify(this.paymentProfile), paymentServices.PostPaymentProfileMode.ADD, strPaymentMethod);/*Added for conflict resoluton*/
                if(this.objAddResponse && this.objAddResponse.content && this.objAddResponse.content.responseCode === '1'){
                    if(this.objAddResponse.content.paymentProfiles !== null && this.objAddResponse.content.paymentProfiles !== undefined && this.objAddResponse.content.paymentProfiles !== ''){
                        if(this.objAddResponse.content.paymentProfiles.paymentProfilesList !== null && this.objAddResponse.content.paymentProfiles.paymentProfilesList !== undefined && this.objAddResponse.content.paymentProfiles.paymentProfilesList.length > 0){
                            this.objAddResponse.content.paymentProfiles.paymentProfilesList.forEach((objAddPaymentProfile) => {
                                var boolRecordFound = false;
                                this.objApiResponse=(typeof this.objApiResponse === 'string') ? JSON.parse(this.objApiResponse) : this.objApiResponse;
                                if(strPaymentMethod === objAddPaymentProfile.paymentMethodType){
                                    if(this.objApiResponse && this.objApiResponse.Payments !== undefined && this.objApiResponse.Payments !== null){
                                        this.objApiResponse.Payments[0]?.paymentProfiles?.paymentProfileList?.forEach((objPaymentProfile) => {
                                            if(strPaymentMethod === objPaymentProfile.paymentMethodType && objAddPaymentProfile.paymentMethodId === objPaymentProfile.paymentMethodId){
                                                boolRecordFound = true;            
    }
 });
 }
                                    if(boolRecordFound === false){
                                        //put code with condition
                                        objAddPaymentProfile.boolIsSelected = paymentProfileFlag;
                                        tempPayMethodId= objAddPaymentProfile.paymentMethodId;
                                        let paymentProfile={};
                                        let camsPaymentProfile={};
                                        if(paymentProfileFlag){
                                            this.buyFlowPaymentMethod.defaultPaymentProfile = paymentProfile;
                                            this.camsPaymentMethodPayload.defaultPaymentProfile= camsPaymentProfile;
                                            this.payMethodId = objAddPaymentProfile?.paymentMethodId;
                                        }else{
                                            this.buyFlowPaymentMethod.oneTimePaymentProfile=paymentProfile;
                                            this.camsPaymentMethodPayload.oneTimePaymentProfile=camsPaymentProfile;
                                            this.OcPayMethodId = objAddPaymentProfile?.paymentMethodId;
                                        }
                                        if(!paymentProfileFlag && this.oneTimeCardData.isStoreOneTimeCardDetail){
                                            objAddPaymentProfile.boolStoreOneTime = true;
                                        }
                                        if(!paymentProfileFlag || (paymentProfileFlag && ((this.buyFlowPaymentMethod.oneTimePaymentProfile && this.buyFlowPaymentMethod.oneTimePaymentProfile.paymentMethodId 
                                        && objAddPaymentProfile.paymentMethodId !== this.buyFlowPaymentMethod.oneTimePaymentProfile.paymentMethodId)
                                        || !this.buyFlowPaymentMethod.oneTimePaymentProfile))){
                                            paymentProfile = updatePaymentObject(this,objAddPaymentProfile, paymentProfileFlag);  
                                        }
                                        camsPaymentProfile=paymentProfile;
                                        camsPaymentProfile.paymentMethod=objAddPaymentProfile.paymentMethodType;
                                        if(objAddPaymentProfile.paymentMethodType.toLowerCase() ==='bankaccount'){
                                            camsPaymentProfile.routingNumber =objAddPaymentProfile.bankAccount.routingNumber;
                                        } else{
                                            camsPaymentProfile.routingNumber='';
                                        }
                                        if(paymentProfileFlag){
                                            this.payMethodId = objAddPaymentProfile.paymentMethodId;
                                            this.buyFlowPaymentMethod.defaultPaymentProfile = paymentProfile;
                                            camsPaymentProfile.isNewAbp=newAbpDetails;
                                            this.camsPaymentMethodPayload.defaultPaymentProfile= camsPaymentProfile;
                                        }else{
                                            this.OcPayMethodId = objAddPaymentProfile.paymentMethodId;
                                            paymentProfile.storeOneTimePaymentProfile = this.isStoreOneTimePaymentProfile;
                                            this.buyFlowPaymentMethod.oneTimePaymentProfile=paymentProfile;
                                            camsPaymentProfile.diffABPMethodForOTP=this.userSelectedOTPCHeck;
                                            this.camsPaymentMethodPayload.oneTimePaymentProfile=camsPaymentProfile;
                                        }
                                    }
                                }
                            });
                        }
                    }
                    if(this.objApiResponse){
                        this.objApiResponse = JSON.stringify(this.objApiResponse);
                    }
                }
                else if(this.objAddResponse.code >= '400'){
                    if(this.cardData){
                    //this.payMethodId=null;//CDEX-347037 Samrat 9/24
                    this.recurringFailureData = this.cardData;this.recurringErrorResponse = this.objAddResponse;
                    this.recurringSelectedTab =  strPaymentMethod;this.boolRecurringErrorFlag = true;
            }
            else{
                    this.otpFailureData = this.oneTimeCardData;this.otpErrorResponse = this.objAddResponse;this.otpSelectedTab =  strPaymentMethod;
                    this.boolOtpErrorFlag = true;this.OcPayMethodId =null;
            }
        }
    }else{
                  if(tempPayMethodId ==='new card'){
            this.buyFlowPaymentMethod.oneTimePaymentProfile=null;
            this.camsPaymentMethodPayload.oneTimePaymentProfile=null;
        }
        let objApiResponseJSON  = this.parseToObj(this.objApiResponse);                                       
        if(objApiResponseJSON !== null &&  objApiResponseJSON !== undefined && objApiResponseJSON.Payments !== undefined  ){   
            if(objApiResponseJSON.Payments.length > 0 && objApiResponseJSON.Payments[0].paymentProfiles.paymentProfileList !== null &&   
                objApiResponseJSON.Payments[0].paymentProfiles.paymentProfileList !== undefined){
            //
            objApiResponseJSON.Payments[0].paymentProfiles.paymentProfileList.forEach(arrayItem => {
                if(tempPayMethodId !== null && arrayItem.paymentMethodId ===  tempPayMethodId){
                    let paymentProfile={};
                    let camsPaymentProfile={};
                    if(paymentProfileFlag){
                        this.buyFlowPaymentMethod.defaultPaymentProfile = paymentProfile;
                        this.camsPaymentMethodPayload.defaultPaymentProfile= camsPaymentProfile;
                    }else{
                        this.buyFlowPaymentMethod.oneTimePaymentProfile=paymentProfile;
                        this.camsPaymentMethodPayload.oneTimePaymentProfile=camsPaymentProfile;
                    }
                    paymentProfile=updatePaymentObject(this,arrayItem, paymentProfileFlag);  
                    camsPaymentProfile=paymentProfile;
                    camsPaymentProfile.paymentMethod=arrayItem.paymentMethodType;
                    if(this.featureFlag && this.productType == this.label.BB && this.abpOneTimePlan==false)
                    {
                        handleTenderCardInFlowStateForExist(this, arrayItem.card,arrayItem.paymentMethodType);
                    }
                    if(arrayItem.paymentMethodType.toLowerCase() ==='bankaccount'){
                        camsPaymentProfile.routingNumber = arrayItem.bankAccount.routingNumber;
                    }
                    else{camsPaymentProfile.routingNumber='';}
                    if(paymentProfileFlag){
                        this.buyFlowPaymentMethod.defaultPaymentProfile=paymentProfile;
                        camsPaymentProfile.isNewAbp=newAbpDetails;
                        this.camsPaymentMethodPayload.defaultPaymentProfile=camsPaymentProfile;
                    }else{
                        this.buyFlowPaymentMethod.oneTimePaymentProfile =paymentProfile;
                        this.camsPaymentMethodPayload.oneTimePaymentProfile =camsPaymentProfile;
                        this.camsPaymentMethodPayload.oneTimePaymentProfile.diffABPMethodForOTP=this.userSelectedOTPCHeck;
                    }}});}}}
    }
        catch(error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handlePaymentProfile', error); //SPTSLSATT-20239
        }
    }
    executeContinueFinished() { 
        this.executeContinueIsInProgress = false;this.showLoadingSpinner = false;
    	if(this.recordId){ //CCSTSP-1944
            let paymentDetailsArray = [];
            let detail = {};
            detail['paymentScheduledFlag'] = 0;
            detail['payOneTimeSeparatelyFlag'] = 0;
            detail['paymentAmount'] = this.oneTimeChargeForFlow;
            detail['paymentMethod'] = this.paymentMethodCard == true ? (this.isCreditCard == true ? 'CREDIT CARD' : 'DEBIT CARD') : 'BANKACCOUNT';
            localStorage.setItem('paymentMethod', this.paymentMethodCard == true ? (this.isCreditCard == true ? 'CREDIT CARD' : 'DEBIT CARD') : 'BANKACCOUNT');
            detail['usedStoredProfileFlag'] = this.newCardSelectedForOTP === true?0:1;
            paymentDetailsArray.push(detail);

            const recordDetail = {
                statusMessage: this.statusMessage,
                successFlag: this.successFlag,
                paymentDetails: paymentDetailsArray
            }
            const newRecordDetail = {
                Custom_Event_Attributes__c: JSON.stringify(recordDetail)
            }            
            BuyFlowUtils.logAnalyticsEvent('SetupBilling_PaymentDetails_Continue', this.recordId, null, null, newRecordDetail);
        }
    }
    
    //Moved handlError to helper
    
    readParentSpinner(isOneTimePayment, showParentSpinner) {
        if(isOneTimePayment === true || isOneTimePayment === 'true'){this.showLoadingSpinnerOTP = showParentSpinner;} else{this.showLoadingSpinner = showParentSpinner;}
    }
    cashvisibilitystatus(event){//  CDEX-291568
        this.cashvisibility = event.detail.isCashbuttonvisible;
    }
    handleShowCardComponentForOTP(event) {
        this.showCardComponent = true;
        this.isContinueButtonDisable = true; //CDEX-367228 (to disable continue button ->this event handler is triggered when add new card is clicked in reusablecard list)
    }
    handleShowCardComponentForAbp(event) {
        this.showPaymentFormForCardAbpPost = event.detail;
    }
     
    async handleUpdateBillingPref(){
        try{
            let payMethodIdForPatch;
            if(this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentMethodId && this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentMethodId !== undefined){
                payMethodIdForPatch = this.props?.buyFlowPaymentMethod?.defaultPaymentProfile?.paymentMethodId;
            }
            payMethodIdForPatch = (typeof payMethodIdForPatch === 'string') ? payMethodIdForPatch :payMethodIdForPatch?.value;
            //CDEX-324686 and CDEX-325631 - Start 07/25 
            //GTT Ban Pull 1/15 - CDEX-375693, CDEX-375688 and CDEX-375083 - logs 2
            let flow = !this.flowName?'NewService':this.flowName;
            let flowStateForPatch = await getFlowState({recordId: this.recordId, journeyName: flow});
            if(flowStateForPatch?.AIABAN__c && (!this.ban || (this.ban !== flowStateForPatch?.AIABAN__c )))
            {
                this.ban=flowStateForPatch?.AIABAN__c                  
            }
            if(this.enrollInAutoPaycheckbox && !payMethodIdForPatch && flowStateForPatch?.ABPPaymentProfileId__c)
            {
                payMethodIdForPatch=flowStateForPatch?.ABPPaymentProfileId__c
            }
            //GTT Ban Pull     
                    //this.ban="551800011427"  //temp gtt
            let logforpaperlesspatch={
                banId:this.ban,
                boolCheckBoxValue:this.props.payment.paymentDefault.paperlessBilling,
                enrollInAutoPaycheckbox:this.enrollInAutoPaycheckbox,
                payMethodIdParent:payMethodIdForPatch,
                cartId:this.cartId,
                uuId:this.props.uuId,
                recordId:this.recordId,
                AIABanFlowstate: flowStateForPatch?.AIABAN__c,
                flowname: this.flowName
            }
            let jslogforpaperlesspatch = {'message':JSON.stringify(logforpaperlesspatch)};
            BwcUtils.nebulaLogger(this.recordId, 'logforpaperlesspatch', 'paperlessBillingCmpCollapsible', 'jslogforpaperlesspatch', jslogforpaperlesspatch);      
            let billingPrefResponse = await paymentServices.patchBillingPreference(paymentServices.buildBillingPrefRequest(this.ban, this.props.payment.paymentDefault.paperlessBilling, this.enrollInAutoPaycheckbox, payMethodIdForPatch),this.cartId,this.props.uuId,this.recordId);
                    if(billingPrefResponse?.httpCode >= 400){ //SPTSLSATT-15289 updating the error message with back-end message
                    // BwcUtils.showToast(this, {
                    //     message : billingPrefResponse?.message ? billingPrefResponse?.message: this.label.PatchBillingPreferenceErrormsg, //GTT Ban Pull - CDEX-375688 and CDEX-375083 - 1/15
                    //     variant: 'error',
                    //     mode : 'sticky'
                    // });
                    BwcUtils.log('Error in Patching Paperless Billing Preference:'+ JSON.stringify(billingPrefResponse));
                    return;  
                }    
        }
        catch(error){
            BwcUtils.log('Error in Patching Paperless Billing Preference:'+ JSON.stringify(error));
            // BwcUtils.showToast(this, {
            //     message : this.label.PatchBillingPreferenceErrormsg,
            //     variant: 'error',
            //     mode : 'sticky'
            // });
        }
    }
}