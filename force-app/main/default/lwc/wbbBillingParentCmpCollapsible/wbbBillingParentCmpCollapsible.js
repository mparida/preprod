import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { loadStyle } from 'lightning/platformResourceLoader';
import customStyles from '@salesforce/resourceUrl/checkboxStyle';
import billingPageTitle from '@salesforce/label/c.WBB_SET_UP_BILLING_PAGE_LABEL';
import wbbExtenderServicesErrorMsgMissingOtpCardDetails from '@salesforce/label/c.wbb_Existing_Without_EWCS_OTP_Not_Filled';
import * as paymentServices from 'c/wbbPaymentServices';
import * as BuyFlowUtils from "c/buyFlowUtils";
import labelWarningMessage from '@salesforce/label/c.WBB_WARNING_MESSAGE';
import { CurrentPageReference } from 'lightning/navigation';
import { publish, MessageContext, createMessageContext } from 'lightning/messageService';
import buyFlowChannel from '@salesforce/messageChannel/buyFlow__c';
import scrollToTopMsgChnl from '@salesforce/messageChannel/ScrollToTopMsgChannel__c';
import ERROR_CODE_400 from '@salesforce/label/c.WBB_ERROR_400';
import ERROR_CODE_500 from '@salesforce/label/c.WBB_ERROR_500';
import SUCCESS_CODE_200 from '@salesforce/label/c.WBB_SUCCESS_CODE_200';
import Patch_Error_Message from '@salesforce/label/c.Patch_Error_Message';
import WBB_MESSAGE_BEFORE_SPINNER from '@salesforce/label/c.WBB_MESSAGE_BEFORE_SPINNER';
import WBB_MESSAGE_DURING_SPINNER from '@salesforce/label/c.WBB_MESSAGE_DURING_SPINNER';
import WBB_MESSAGE_AFTER_SPINNER from '@salesforce/label/c.WBB_MESSAGE_AFTER_SPINNER';
import WBB_INFORMATION_TITLE from '@salesforce/label/c.WBB_INFORMATION_TITLE';
import { Redux } from 'c/lwcRedux';
import * as BwcUtils from 'c/bwcUtils';
import { DEFAULT_STORE_NAME } from 'c/reduxConstants';
import { addCommunicationPreferences, updateBuyFlowPaymentMethod, updateAddOnSubmitPaymentAuthorizeResponse, addCart, adduuId, addCartId, updateAutoPayPaymentMethod, updateOTPPaymentMethod, updateOneTimeCharges, updatePayment, updateFutureBills, updateBillingTnC } from 'c/buyFlowActions';
import { addBankDetails } from 'c/buyFlowActions';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { NavigationMixin } from 'lightning/navigation';
import prepaymentMessage from '@salesforce/label/c.Prepayment_Message';
import * as getCartServices from 'c/wbbGetCartServices';
import * as billingServices from 'c/wbbBillingServices';
import { addDigitalAccount, addBusinessKeys, updateGetPaymentMethod } from 'c/buyFlowActions';
import * as getTopOfferServices from 'c/accslsServiceOfferParentServices';
//import { setTnC } from 'c/buyFlowActions'; -- remove temporally for uniqa
import { updateTnC } from 'c/buyFlowActions';
import WbbBillingUpdateFailErrorMsg from '@salesforce/label/c.WbbBillingUpdateFailErrorMsg';
import { connect } from 'c/connect';
import wbbBillingUpdateFailInfoMsg from '@salesforce/label/c.wbbBillingUpdateFailInfoMsg';
import WbbBillingUpdateSuccessMsg from '@salesforce/label/c.WbbBillingUpdateSuccessMsg';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import proRationAmountMsg from '@salesforce/label/c.ProRationAmountMsg';
import Payment_Authorization_Error_Message from '@salesforce/label/c.Payment_Authorization_Error_Message';
import Payment_Terms_Alert_Message from '@salesforce/label/c.Payment_Terms_Alert_Message';
import browserEncryptionFlag from '@salesforce/customPermission/Browser_Encryption_Feature_Flag';
import infoMessageForSameABPandOTP from '@salesforce/label/c.wbbMsgSameABPandOTP';
import wbbNewAbpAndOtp from '@salesforce/label/c.wbbNewAbpAndOtp';
import WBB_ALERT_DONT_STORE_OTP from '@salesforce/label/c.WBB_ALERT_DONT_STORE_OTP';
import getAllPaymentBusinessKeys from '@salesforce/apex/PaymentTermsController.getPaymentTandCCriteria';
import getTermsAndConditionsAccFlow from '@salesforce/apex/PaymentTermsController.getTermsAndConditions';
import wbb_terms_info_toast from '@salesforce/label/c.wbb_terms_info_toast';
import * as BwcConstants from 'c/bwcConstants';
import { logAnalyticsEvent as bwcLogAnalyticsEvent } from 'c/buyFlowUtils';//14434
import * as wbbParentCmpCollapsibleService from 'c/wbbParentCmpCollapsibleService';
import { createActivity } from 'c/bwcInteractionActivityService';//14434
import { initializeHelperAppJWT, navigateToHelperApp, buildJWTBody } from 'c/buyFlowPeripheralService';
import getRetailCustomSettings from '@salesforce/apex/RetailUtil.getRetailCustomSettings';
import * as bwcCartItemServices from 'c/bwcCartItemServices';
import SHOW_SECURITY_SECTION_BY_PRODUCT from '@salesforce/label/c.ShowSecuritySectionByProduct'; // ST1 SPTSLSDEL-18151.
import PatchBillingPreferenceErrormsg from '@salesforce/label/c.PatchBillingPreferenceErrormsg';
import getCartWarningToast from '@salesforce/label/c.WBB_CART_API_WARNING_MSG';
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import strUserId from '@salesforce/user/Id';
import infoConsentMessage from '@salesforce/label/c.infoConsentMessage';
import hasEnterCustomerPaymentDetailsPermission from '@salesforce/customPermission/Enter_Customer_Payment_Details';
import CenterProfiles from '@salesforce/label/c.Centers_Profiles';
import hasPeripheralAccess from "@salesforce/customPermission/hasPeripheralAccess";
import * as wbbParentServices from 'c/wbbParentServices';
import retailProfiles from '@salesforce/label/c.Retail_Profiles';
import SF_SetupBilling_PL from '@salesforce/label/c.SF_SetupBilling_PL';
import Setup_Billing_Back_Button from '@salesforce/label/c.Setup_Billing_Back_Button';
import Setup_Billing_Offers_Async from '@salesforce/label/c.Setup_Billing_Offers_Async'
import LabelProductNameBB from '@salesforce/label/c.Product_Name';
import LabelProductNameAIA from '@salesforce/label/c.ProductType_InternetAir';
import getProfileNameFromEmpRecord from '@salesforce/apexContinuation/TC_NotificationController.getProfileNameFromEmpRecord';
import isRetailChannels from '@salesforce/label/c.isRetailChannels';
import isCentersChannels from '@salesforce/label/c.isCentersChannels';
import * as BwcBillingAccount from 'c/bwcBillingAccount';
import Id from '@salesforce/user/Id';
import USERNAME from '@salesforce/schema/User.Username';
import STOREID from '@salesforce/schema/User.StoreLocationId__c';
import USERID from '@salesforce/schema/User.ATTUID__c';
import EnableTncLongVersionOnBillingRetailAia from '@salesforce/label/c.EnableTncLongVersionOnBillingRetailAia'; //28099
import EnableTncLongVersionOnBillingRetailBb from '@salesforce/label/c.EnableTncLongVersionOnBillingRetailBb'; //28099
import EnableTncLongVersionOnBillingCentersBb from '@salesforce/label/c.EnableTncLongVersionOnBillingCentersBb'; //28099
import EnableTncLongVersionOnBillingCentersAia from '@salesforce/label/c.EnableTncLongVersionOnBillingCentersAia'; //28099
import getVisibility from '@salesforce/apex/BuyFlowUtils.getVisibility'; //28099
import * as FlowState from 'c/flowStateUtil';
import HAS_ENTER_BILLING_PAYMENT_DETAILS from '@salesforce/customPermission/Enter_Billing_Payment_Details';//SPTSLSATT-8762
import hasVoiceRedactionPermission from "@salesforce/customPermission/VoiceRedaction";//SPTSLSATT-8762
import getFlowStateByInteractionId from '@salesforce/apex/buyFlowStateUpsert.getFlowStateByInteractionId'; //CDEX-308265 ak4124 -11/19/24
import getFlowState from '@salesforce/apex/buyFlowStateUpsert.getFlowState'; //CDEX-295779 //SPTSLSATT-20214	
const COMPONENT_TYPE = 'LWC';//nebula logger
const COMPONENT_NAME = 'wbbParentCmpCollapsible';//nebula logger
import Payment_Info_Missing from '@salesforce/label/c.Payment_Info_Missing'; //CDEX-375153 ak4124 3/25/25
import { logAnalyticsEvent as LogAnalyticsEvent } from 'c/bwcAnalyticsEventServices';//CDEX-403465
import updateFlowStateByFeatureFlag from '@salesforce/apex/buyFlowStateUpsert.updateFlowStateByFeatureFlag';
import upsertBillingPageSectionStatus from '@salesforce/apex/buyFlowStateUpsert.upsertBillingPageSectionStatus';
import getBillingPageSectionStatus from '@salesforce/apex/buyFlowStateUpsert.getBillingPageSectionStatus';




import { getChannel} from 'c/legalTermHelper';

export default class WbbBillingParentCmpCollapsible extends NavigationMixin(Redux(LightningElement)) {
    @track suppliedValues;
    isNewBillingPageEnabled = true;
    channelName;
    @wire(CurrentPageReference) pageRef;
    @track sectionDataTrack;
    @track billingSectionData;
    @track paymentTermsSectionData;
    @track oneTimeChargesSection;
    @track paymentDetailSectionData;
    @track securityInfoSectionData;
    @track paperlessBillingSectionData;
    @track termsAndConditionsSectionData;


    @track billingPreferenceSectionData;

    reconsentconfirm = false;//CDEX-347096 - Lokesha L N - 9/24
    isPaymentRetrivalRequired = false;
    isAchRetailFeatureFlagEnabled = false;//SPTSLSATT-20214	
    isBillingCallRequired = true; //Changes for CDEX-336499 Added by sk3077
    @track cardCaptured = false; //CDEX-308265 ak4124 11/19/24
    response;//CCSTSP-1944
    KEYS = {
        OA: 'OA',
        AP: 'AP',
        ME: 'ME',
        OP: 'OP',
        OF: 'OF',
        PAPERLESS_DISCLOSURE: 'PAPERLESS_DISCLOSURE',
        READALOUD_AUTO_E_BILL: 'ReadAloud_AUTOPAY_E-BILL'
    };

    get getBan() {
        let ban = this.props?.customer?.interactionDetails?.BAN;
        if (!this.pageRef.state.c__cartAvailable && this.pageRef.state.c__ban) {
            ban = this.pageRef.state.c__ban;
        }
        //CDEX-324686 and CDEX-325631 - Start 07/25 
        //GTT Ban Pull - Removed this logic No need - 1/15 - CDEX-375688 and CDEX-375083
        // if (this.recordId && (ban == undefined || ban == '')) 
        //     {
        //     try {
        //         setTimeout(function() {
        //             const result = FlowState.getStateByInteractionId(this.recordId);
        //             ban = result?.AIABAN__c;
        //           }, 2000); 
        //     }
        //     catch (error) {
        //         BwcUtils.log('Error in receiving credRefNumber');
        //     }
        // } 
        //CDEX-324686 and CDEX-325631 - End  
        console.log('BanInside getBanNumber', JSON.stringify(ban));
        let jslog = { 'message': JSON.stringify(ban) };
        BwcUtils.nebulaLogger(this.recordId, 'LWC', 'ParentCmpCollapsible', 'getBan()', jslog);
        return ban;
    }
    get disableBackButton() {//CDEX-359025 CCSTSP-1352 WLS ToyStory
        let isbackButtonDisbaled = this.flowName == BwcConstants.WLS_BUYFLOW_JOURNEY_NAME ? !this.isWLSFlowBackButtonEnabled : false;
        return isbackButtonDisbaled;
    }

    mapStateToProps(state) {
        return {
            services: state.productOffers,
            customer: state.customer,
            promotions: state.promotions,
            cartId: state.cartId,
            shippingMethod: state.shippingMethod,
            communicationPreferences: state.communicationPreferences,
            billingAddress: state.billingAddress,
            uuId: state.uuId, //10290
            selectedService: state.selectedService,
            tnc: state.tnc,
            cart: state.cart,
            camsProductPurchaseReview: state.camsProductPurchaseReview,
            paymentBusinessKeys: state.paymentBusinessKey,
            camsPaymentMethod: state.getPaymentMethod,// ST1 #8681
            buyFlowPaymentMethod: state.getBuyFlowPaymentMethod,
            camsPaymentAuthorizeResponse: state.camsPaymentAuthorizeResponse,
            peripheralParameters: state.peripheralParameters,
            topOffersImpression: state.topOffersImpression,
            payment: state.payment,
            pages: state.pages,
            employeeInfo: state.employeeInfo,
            interaction: state.interaction,
            readAloudContext: state.readAloudContext,//SPTSLSDEL-29058
            cashRegisterInfo: state.cashRegisterInfo,//cash Enhancement
            buyFlowOrderSummary: state.buyFlowOrderSummary
        };
    }

    mapDispatchToProps() {
        return { updateOneTimeCharges, updateAutoPayPaymentMethod, updateOTPPaymentMethod, addDigitalAccount, addCart, adduuId, addCartId, updateTnC, addBankDetails, addCommunicationPreferences, addBusinessKeys, updateGetPaymentMethod, updateBuyFlowPaymentMethod, updateAddOnSubmitPaymentAuthorizeResponse, updatePayment, updateFutureBills, updateBillingTnC };
    }

    label = {
        billingPageTitle, labelWarningMessage, ERROR_CODE_400, ERROR_CODE_500, SUCCESS_CODE_200, Patch_Error_Message, prepaymentMessage,
        WBB_MESSAGE_BEFORE_SPINNER,
        WBB_MESSAGE_DURING_SPINNER,
        WBB_MESSAGE_AFTER_SPINNER,
        WBB_INFORMATION_TITLE, WbbBillingUpdateFailErrorMsg, wbbBillingUpdateFailInfoMsg, proRationAmountMsg, wbb_terms_info_toast,
        WbbBillingUpdateSuccessMsg, Payment_Authorization_Error_Message, Payment_Terms_Alert_Message, infoMessageForSameABPandOTP, WBB_ALERT_DONT_STORE_OTP, wbbExtenderServicesErrorMsgMissingOtpCardDetails,
        wbbNewAbpAndOtp, SHOW_SECURITY_SECTION_BY_PRODUCT, PatchBillingPreferenceErrormsg, getCartWarningToast, CenterProfiles, infoConsentMessage, retailProfiles,
        SF_SetupBilling_PL, Setup_Billing_Back_Button, Setup_Billing_Offers_Async, LabelProductNameBB, LabelProductNameAIA, isRetailChannels, isCentersChannels,
        EnableTncLongVersionOnBillingRetailAia, EnableTncLongVersionOnBillingRetailBb, EnableTncLongVersionOnBillingCentersBb, EnableTncLongVersionOnBillingCentersAia, Payment_Info_Missing
    };
    eventDetail;
    @api originalCity;
    @api originalState;
    @api originalAddress1;
    @api originalAddress2;
    @api originalZipCode;
    @api interactionRecordIdValue;
    @api originalIndividualId;
    @api originalSourceLocation;
    @api originalSourceUser;
    @api originalMerchantId;
    @api originalProfileName;
    @api originalDueMonthly;
    @api originalAccountId = '';
    @api originalAccountType;
    @api originalCustomerType;
    @api otp = false;
    @api peripheralParameters;
    @api persistedState;
    @track objApiResponse;
    @track paymentTermToast = false;
    @track isbankaccount = true;
    @api originalinteractionRecordId;
    @track evtButtonSelected = '';
    @track oneTimeAddResponse;
    @api isCenters;
    isRetail = false;
    showBillingTerms = false;
    curStoreProfile = false;
    @track prfName;
    tncCompleted = false;//sc1012
    isLoading = false;
    isClosed = true;
    @track disableButton = true;
    errorInContinue = false;
    validateCheckbox = false;
    paymentTypeMethodButtonRequired = true;
    disableButtonPayment = false;
    isLoadingNextPage = false;
    showModalSpinnerPrt = true; //CCSTSP-424
    @track cardData;
    tncData;
    @track oneTimeCardData;
    errorMessageLabel;
    errorMessageLabelOneTime; //Variable for Server Error Message for One Time.
    errorMessageIcon;
    errorMessageBackground;
    showAlert = false;
    showAlertOneTime = false; //Boolean to show/hide Server error for One Time.
    payMethodIdParent = null;
    otpMethodIdParent = null;
    responseforRecurring;
    responseForOtp;
    @api cartId = '';
    disableButtonPaymentOtp = false;
    @api originalPrepaymentCharges; //SPTSLSDEL-4510
    @api originalOtherCharges; //SPTSLSDEL-4510
    oneTimeCharges;
    advPay = false;
    patchingDetails = [];
    preAuthorizationId = null;
    allProductOrderLineItemIdList = [];
    storeOneTimePaymentProfile = false;
    uuid;
    isModalOpen = false; //Boolean for modal class
    modalCardValidation = false; //Boolean for validate the modal
    boolPaymentTerms = false; //Boolean to track payment terms consent
    boolTermsConditions = false; //Boolean to track terms & conditions consent
    parentSpinner; //Boolean for the spinner
    parentSpinnerOTP; //Boolean for otp spinner
    tcOfferComponentConfig = [];
    m_PageLoadImpresion = [];
    //Variables for Handling Error Message 2191
    @track otpFailureData;
    @track recurringFailureData;
    @track otpSelectedTab;
    @track recurringSelectedTab;
    @track otpErrorResponse;
    @track recurringErrorResponse;
    @track finalData;
    @track newCardSelectedForOTP = false;
    //1387 variable declaration
    @api timeoutRequired = false;
    @api getError = false;
    myDetails;
    @api isCloseBtnRequired;
    @api errorDescription;
    @track isPatchError;
    @track spinnerChangeStyle;
    @api updateErrorFieldName;

    encryptCardNumber = false;
    encryptCardNumberOneTime = false;
    paymentDetails = false;

    //API attribute for flow Name.
    @api flowName;
    @track strProrationAmount;
    @track paymentType;
    @track paymentNumber;
    @track otpPaymentType;
    @track otpPaymentNumber;
    boolShowPaymentError = false;
    @track strDefaultPaymentProfile = '';
    @track oldCardSelected = false;

    @track clearOutABPandHideABP = false;
    @track copyDataFromABPToOTPandHideABP = false;
    @track displayOTPSectionandHideABP = false;
    displayPaymentDetailSection = true;

    //this will hold both Banks and Cards filtered for OTP
    @track uncheckedArrayToParent;
    //Sowmya
    @wire(MessageContext) messageContext;

    //show Toast Error - 9.3 33366 
    @api showToastError = false;
    @track showToastErrorAutopay = false;
    //check if all new entry card details are filled - is controlled by the child event
    otpAllFilledEvent = false;

    //vo923r is used to ignore the user selection of the existing one time payment details if user selects Add New Card or Bank
    ignoreExistingOTPList = false;
    termsAndPayment = [];
    patchBillingPreferenceSuccess = false;
    isPaymentCalloutSuccess = false;
    //vo923r 
    userSelectedOTPCHeck = false;
    paymentDetailsRecurring = {};
    paymentDetailsOneTime = {};
    newCardSelectedForRecurring = false;
    statusMessage = '';
    successFlag = '';
    //hr061m
    emptyCode = true;
    emptyDate = true;
    emptyHolder = true;
    emptyZip = true;
    emptycard = true;
    emptyHolderBnk = true;
    emptyRnBnk = true;
    emptyAnBnk = true;
    emptyBankType = true;
    existingCardModal = false;
    showTopError;

    @api isExistingCustomer;
    migrationFrom;
    billingAddressPlaceId;
    serviceAddressPlaceId;
    @api address1;
    @api address2;
    @api banId;
    @api orderId;
    @api lstlineItemId = [];
    @api recordId;
    storeName;
    boolPaperlessBilling = false;
    enrollPaperlessBillingCheckBoxVal = true;
    isTncAccepted = false;
    isTncReacceptanceRequired;
    offersAndServiceProductName;
    productSubCategoryBB;
    productSubCategoryAIA;

    @api customerType = '';
    @api placeId = '';
    calloutRetryCount = 0;
    characteristicValue = 'ADSL';
    enrollInAutoPaycheckbox = true;
    billingPrefResponse; //Changes for CDEX-336499 Added by sk3077
    //variable for communication preference
    CONSTANT = {
        SMS: 'SMS',
        EMAIL: 'Email'
    };

    @track selectedCommPref = [];
    @track commPrefEmailObj =
        {
            preferenceType: 'Email',
            preferenceValue: true
        };
    @track commPrefSMSObj =
        {
            preferenceType: 'SMS',
            preferenceValue: false
        };

    //Edit button variant for Billing
    billingEditButtonVariant = 'default'

    //nh0274 US7995, 7996, 8000
    addressMatchValidation;
    updateBillingInfoApiSuccess = false;
    disableEditAddressButton;
    billingAddress;
    isNewUser = true;
    boolNotification = false;

    informationContentLabel = this.label.WBB_MESSAGE_BEFORE_SPINNER;

    paymentBusinessKeys = [];
    @track paymentConsent;
    @track termsConsent = false;


    //SPTSLSATT-8762
    isRaisrActive = false;

    lstPaymentTerms;
    costPrice;

    @track showInfoMsgForSameABPandOTP = false;
    @track showInfoMsgForNewABPandOTP = false;
    @track showInfoForNoOtpStorage = false;
    @track storeOtpProfileSelectedPreviously = false;
    @track showInfoMsgForStoringOTP = false;
    @track isnewcard = false;
    @track isnewbankaccount = false;
    @track styleForToast = 'background-color: #C23934; padding: bottom -20px;';
    closeErrorToast = true;
    @track businessKeysfromMetadata = {};
    @track businessTandCForAccFlow = {};
    @track oneTimeChargeForFlow;
    // 14119
    isPaymentDetail = '';
    @track productType = '';
    //16848
    properties;
    //questions=[]; //Commented for US-24354 US-20465
    flag = false;
    deviceType = '';
    communicationType = '';
    reasonSelectedOnATTDevice = '';
    //data={}; //Commented for US-24354 US-20465
    //variables for Feature Flag for Security Section SPTSLSDEL-18151 ST1.
    allowedProductsForSecurityInfoSection;
    showSecuritySection = false;
    showBillingPerfrences = false;
    showPaymentSection = false;
    showTermsConditionsection = false;
    boolRecurringErrorFlag = false;
    boolOtpErrorFlag = false;
    buyFlowPaymentMethod = {};
    camsPaymentMethodPayload = {};
    objOneTimeAddResponse;
    objAddResponse;

    peripheralCustomSetting = false;
    showPeripheralBlocker;

    boolEditPopup = false;
    storeEditOrder;
    storeIdForChild = '';
    //variables fror secure component 
    isLoggedInUserWFH = false;
    isRedactionFrameworkWorking = false;
    showSecurePaymentSection = false;
    prefetchedData = {};
    isDisableLongVersionTnc;
    isDisableTncOnCustomerDevice;
    //To show peripheral button story 14932
    get showPeripheral() {
        return FORM_FACTOR !== 'Large' && this.peripheralCustomSetting && hasPeripheralAccess ? true : false;
    }

    get showPeripheralRC() {
        return FORM_FACTOR !== 'Large' && this.props.peripheralParameters
            && ((this.props.peripheralParameters.paymentCardInformation || this.props.peripheralParameters.accNum) && (this.props.peripheralParameters.paymentPromptType == 'RC' || this.props.peripheralParameters.paymentPromptType == 'BOTH')) || this.props.peripheralParameters.paymentProfileId
            && this.peripheralCustomSetting && hasPeripheralAccess ? true : false;
    }


    get showPeripheralOC() {
        return FORM_FACTOR !== 'Large' && this.props.peripheralParameters
            && ((this.props.peripheralParameters.paymentCardInformation || this.props.peripheralParameters.accNum) && (this.props.peripheralParameters.paymentPromptType == 'OC')) || (this.props.peripheralParameters.paymentAuthorizationId && (this.props.peripheralParameters.paymentPromptType == 'OC' || (this.props.peripheralParameters.paymentPromptType == 'BOTH' && !this.enrollInAutoPaycheckbox)))//CDEX-362585 sk9969 11/12
            && this.peripheralCustomSetting && hasPeripheralAccess ? true : false;
    }

    c__storeId = '';
    c__userId = '';

    @wire(getRecord, { recordId: Id, fields: [USERNAME, STOREID, USERID] })
    mapUserDetails({ error, data }) {
        if (error) {
            BwcUtils.log('mapUserDetails ERROR => ' + error);
        }
        else if (data) {
            if (data.fields.StoreLocationId__c.value != null) {
                this.c__storeId = data.fields.StoreLocationId__c.value;
                this.storeIdForChild = this.c__storeId;
            }
            if (data.fields.ATTUID__c.value != null) {
                this.c__userId = data.fields.ATTUID__c.value;
            }
        }
    }

    renderedCallback() {
        Promise.all([
            loadStyle(this, customStyles)
        ]).then(() => {
            window.console.log('Files loaded.');
        }).catch(error => {
            window.console.log('Error ' + error.body.message);
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'renderedCallback', error); //nebula logger
        });
    }

    // Patch Profile
    @track patchApiProfile = {
        'channel': {
            'name': 'ATTR',
            'role': 'Agent'
        },
        'payments': []
    };

    @track paymentProfile = {
        accountType: this.originalAccountType,
        lastName: 'Mcd',
        firstName: 'John',
        individualId: this.originalIndividualId,
        accountId: this.AccountId,
        storeTermsConditionConsent: false,
        tncId: 0,
        customerAgreement: '',
        temporaryProfileKey: '',
        profileName: 'TestPayment Method',
        paymentMethod: this.paymentMethod,
        profileOwnerId: ''
    }

    @track paymentMethod = {
        type: '',
        card: {},
        bankAccount: {}
    };

    /*fetching payMethodId for checked saved payment &otp detail*/
    payMethodId(event) {
        this.oldCardSelected = true;
        this.newCardSelectedForRecurring = false;
        this.payMethodIdParent = event?.detail?.value?.value ? event?.detail?.value?.value : event?.detail?.value; //CDEX-383247 3/4 - vm8859
        this.cardData = null;
        if (this.payMethodIdParent === 'new card' || this.payMethodIdParent === 'new account') {
            this.payMethodIdParent = null;
            //varibale to be used for omni 14434
            this.newCardSelectedForRecurring = true;
        }
    }
    otpMethodId(event) {
        this.otpMethodIdParent = event?.detail?.value?.value ? event?.detail?.value?.value : event?.detail?.value; //CDEX-383247 3/4 - vm8859
        this.oneTimeCardData = null;
        this.newCardSelectedForOTP = false;
        if (this.otpMethodIdParent === 'new card' || this.otpMethodIdParent === 'new account') {
            this.otpMethodIdParent = null;
            this.newCardSelectedForOTP = true;
        }
    }

    //vo923r event to close the error message
    closewarningclick(event) {
        this.showToastError = false;
        this.isLoadingNextPage = false;
    }

    //vo923r handle the filter radio buttoms
    handleFilterList(event) {
        if (event && event.detail) {
            this.uncheckedArrayToParent = JSON.parse(event.detail);
            this.oldCardSelected = true;
        }
    }

    handleSignCheck(event) {
        if (event.detail == true) {
            if(this.props.payment.paymentDefault.autoPayFlag || (this.oneTimeCharges > 0 && this.advPay)){
                this.showPaymentSection= true
                this.isPaymentRetrivalRequired = false;
                this.updatesectionDataContinue(4);
            }else{
                this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
                this.isContinueBtnDisabled = false;
                this.disableButton = false;
            }
        }
    }
    handleDataOnAnalytics(event) { //24800
        this.tncData = event.detail;
        console.log('tncData--' + this.tncData)
    }
    //vo923r 
    checkNewEntryWarning(event) {
        this.otpAllFilledEvent = event.detail;
    }

    //vo923r
    oneTimePaymentCheck(event) {
        this.userSelectedOTPCHeck = event.detail;
    }

    async getConfigMap() {
        await getTopOfferServices.gettcOfferComponentNames()
            .then((data) => {
                this.tcOfferComponentConfig = data;
                this.getPageLoadImpresion();
                BwcUtils.log('Config Settingmap =>' + JSON.stringify(data));
            })
            .catch((error) => {
                BwcUtils.log('Error:', error);
            });
    }
    getPageLoadImpresion() {
        const offerComponentName = this.tcOfferComponentConfig.filter(value => value.LWC_Component__c === 'Setup_Billing');
        let node = JSON.parse(JSON.stringify(this.props.topOffersImpression));
        if (node && node.analytics) {
            if (Array.isArray(node.analytics)) {
                node.analytics[0].componentName = offerComponentName[0]?.Component_Name__c;
                node.analytics[0].componentOrder = offerComponentName[0]?.Component_Order__c;
                node.analytics[0].slotOrder = 1;
            } else {
                node.analytics.componentName = offerComponentName[0]?.Component_Name__c;
                node.analytics.componentOrder = offerComponentName[0]?.Component_Order__c;
                node.analytics.slotOrder = 1;
            }

            this.m_PageLoadImpresion = node;
        }
        BuyFlowUtils.createImpression(this.label.SF_SetupBilling_PL, this.recordId, this.m_PageLoadImpresion, this.props.customer.serviceAddress.placeId);

    }
    updatingTncFlag(event) {
        this.tncCompleted = event.detail;
        console.log('tncCompleted' + this.tncCompleted);
        if (event.detail) {
            this.sectionDataTrack.find(element => element.sectionName == 'termsAndConditions').isValid = true;
        }
        
        if(this.props.payment.paymentDefault.autoPayFlag || (this.oneTimeCharges > 0 && this.advPay)){
            if(((!this.showBillingTerms && this.boolTermsConditions) || this.tncCompleted)){
                this.showPaymentSection= true
                this.isPaymentRetrivalRequired = false;
                this.updatesectionDataContinue(4);
            }
        }else{
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
            this.continueButtonEnablerUtility();
        }
    }

    async connectedCallback() {
        try {
            await super.connectedCallback();
            
            //START SPTSLSATT-20214	
            if (await getVisibility({ feature: 'BuyflowACIRetailBankEnabler' })) {
                this.isAchRetailFeatureFlagEnabled = true;
                //this.isPaymentRetrivalRequired = true;
            }
            //END SPTSLSATT-20214	

            if (this.props.pages.data.previousPage && this.props.pages.data.previousPage !== 'Review') {
                this.sectionDataTrack = Object.create(JSON.parse(JSON.stringify(wbbParentCmpCollapsibleService.sectionDataBilling)));
                this.sectionDataTrack = Array.from(this.sectionDataTrack);
            } else {
                this.sectionDataTrack = wbbParentCmpCollapsibleService.sectionDataBilling;
            }


            this.billingSectionData = this.sectionDataTrack.find(element => element.sectionName == 'billingAddress'); //1
            this.securityInfoSectionData = this.sectionDataTrack.find(element => element.sectionName == 'securityInfo'); //2
            this.billingPreferenceSectionData = this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences'); //3
            this.termsAndConditionsSectionData = this.sectionDataTrack.find(element => element.sectionName == 'termsAndConditions'); //4
            this.paymentDetailSectionData = this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails'); //
            let floStateRecord = await getFlowState({ recordId: this.recordId, journeyName: 'NewService' });
            
            if(!this.billingPreferenceSectionData.isChanged && floStateRecord && !floStateRecord.EnrollInAutoPayCheckbox__c && this.props.pages.data.previousPage === 'Review'){
                this.enrollInAutoPaycheckbox = false;
            }
            
            let flowStateRecord = await getFlowStateByInteractionId({ recordId: this.recordId });
            this.cardCaptured = flowStateRecord.cardCaptured__c;
            await this.fetchOffersAndServicesProductName();
            this.getSecureComponentAccess();
            this.productType = this.props.selectedService.service;
            await getRetailCustomSettings({ key: 'Is_Disable_Long_Version_TnC' }).then(output => {
                if (output === 'ON') {
                    this.isDisableLongVersionTnc = true;
                }
            }).catch(error => {
                console.log('error retrieving long version flag setting: ' + error);
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback getRetailCustomSettings', error); //nebula logger
            });
            await getRetailCustomSettings({ key: 'Is_Disable_TnC_On_Customer_Device' }).then(output => {
                if (output === 'ON') {
                    this.isDisableTncOnCustomerDevice = true;
                }
            }).catch(error => {
                console.log('error retrieving disable on customer device flag setting: ' + error);
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback getRetailCustomSettings', error); //nebula logger
            });
            if (this.props.employeeInfo && this.props.employeeInfo.channel && this.props.employeeInfo.channel !== '') {
                let empChannel = this.props.employeeInfo.channel;
                let retailProfileList = this.label.isRetailChannels.split(',');
                let centerProfileList = this.label.isCentersChannels.split(',');
                if (retailProfileList.includes(empChannel)) {
                    this.isRetail = true;
                } else if (centerProfileList.includes(empChannel)) {
                    this.isCenters = true;
                } else {
                    this.isCenters = true;
                }
            }
            else {
                this.isCenters = true;
            }
            this.handleShowBillingTerms();
            this.displayPaymentDetailSection = true;
            if (this.interactionRecordIdValue == undefined || this.interactionRecordIdValue == '') {
                this.interactionRecordIdValue = this.recordId;
            }
            this.uuid = this.originalinteractionRecordId;
            if (this.flowName === BwcBillingAccount.FlowName.LAUNCHSETUPBILLINGAMF.value) {
                this.flowName = BwcBillingAccount.FlowName.EXTENDERSERVICES.value;
                this.isLoading = true;
            }

            //Back Button scenario
            if ((this.props.selectedService?.service?.toLowerCase() === this.productSubCategoryAIA?.toLowerCase() || this.props.selectedService?.service?.toLowerCase() === this.productSubCategoryBB?.toLowerCase() || this.isWLSBuyFlow)
                && (this.props.pages.data.previousPage == 'Review')) {
                await this.getSectionStatus();    
                this.disableButton = false;
                this.sectionDataTrack.forEach(secData => {
                    secData.isEdited = true;
                    secData.isEditing = false;
                    secData.isDisabled = false;
                    secData.isValid = true;
                });
            }else if(this.showPeripheral && (this.props.peripheralParameters.paymentPromptType == 'OC' || this.props.peripheralParameters.paymentPromptType == 'RC' || this.props.peripheralParameters.paymentPromptType == 'BOTH')){
                await this.getSectionStatus();  
            }

            this.buyFlowPaymentMethod = this.props.buyFlowPaymentMethod;
            this.camsPaymentMethodPayload = this.props.camsPaymentMethod;
            this.getConfigMap();
            //Feature Flag for Security Section visibility based on product selection SPTSLSDEL-18151 ST1.
            let lstSecuritySectionProducts = this.label.SHOW_SECURITY_SECTION_BY_PRODUCT;
            this.allowedProductsForSecurityInfoSection = lstSecuritySectionProducts.includes('|') ? lstSecuritySectionProducts.split('|') : lstSecuritySectionProducts;
            //if(this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value && (this.allowedProductsForSecurityInfoSection.includes(this.props.selectedService.service) && !this.isExistingCustomer) && !this.isWLSBuyFlow){ //added WLS BwcConstants
            // this.showSecuritySection = true;
            //}
            const myURL = '/sf/shop/fulfillmentandbilling';//CDEX-403465
            LogAnalyticsEvent('SF_SetUpBilling_PL', this.interactionRecordIdValue,null,null,null,myURL);//CDEX-403465 added myURL; BuyFlowUtils-->bwcAnalyticsEventServices
            let paymentDetails = '';
            try {
                if (this.props && this.props !== {}) {
                    paymentDetails = this.props.camsPaymentMethod.defaultPaymentProfile;
                    if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                        this.userSelectedOTPCHeck = this.props.camsPaymentMethod.oneTimePaymentProfile.paymentMethodId !== null && this.props.camsPaymentMethod.oneTimePaymentProfile.paymentMethodId !== '' ? true : false;
                        this.otpMethodIdParent = this.props.camsPaymentMethod.oneTimePaymentProfile.paymentMethodId;
                        //Get the default PaymentProfile # 8234 ST1
                        this.strDefaultPaymentProfile = paymentDetails.paymentMethodId ? paymentDetails.paymentMethodId : '';
                        this.payMethodIdParent = this.strDefaultPaymentProfile;
                    }
                    this.getDataFromRedux(this.props);
                }
            }
            catch (Error) {
                console.error('Error in Redux or Service' + JSON.stringify(Error));
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback Redux', Error); //nebula logger
            }

            await getAllPaymentBusinessKeys().then((result) => {
                this.businessKeysfromMetadata = result;
            }).catch(error => {
                this.error = error;
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback getAllPaymentBusinessKeys', error); //nebula logger
            });

            await getRetailCustomSettings({ key: 'EnablePaymentPeripheral' }).then(output => {
                if (output === 'ON') {
                    this.peripheralCustomSetting = true;
                }
            }).catch(error => {
                console.log('error retrieving enablePeripheral setting: ' + error);
                BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback getRetailCustomSettings', error); //nebula logger
            });

            if (this.isWLSBuyFlow && this.props.pages.data.previousPage != 'Review') {//WLS CCSTSP-1710 
                this.isWLSFlowBackButtonEnabled = await getVisibility({ feature: BwcConstants.WLS_FLOW_ENABLE_BACK_BTN_VC_FLAG }); //CDEX-359025 CCSTSP-1352 WLS 
                this.enrollInAutoPaycheckbox = false;
                this.enrollPaperlessBillingCheckBoxVal = false;
                this.props.payment.paymentDefault.autoPayFlag = false;
                this.props.payment.paymentDefault.paperlessBilling = false;
                this.props.updatePayment(this.props.payment);
            }

            if (this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                try {
                    this.boolNotification = true;
                    /*****************Get Cart Callout************************/
                    //get cartId from redux. if null get value from interim page
                    let cartIdParam = (this.props && this.props !== {} && this.props.cartId !== '' && this.props.cartId !== undefined) ? this.props.cartId : this.cartId;
                    let uuidParam = (this.props && this.props !== {} && this.props.uuId !== '' && this.props.uuId !== undefined) ? this.props.uuId : this.uuid;
                    if (uuidParam && uuidParam !== '') {
                        this.uuid = uuidParam;
                    }
                    if (cartIdParam && cartIdParam !== '') {
                        this.cartId = cartIdParam;
                    }
                    if (!this.cartId && this.cartId == '' && !cartIdParam && cartIdParam == '' && this.persistedState && this.persistedState.Cart_ID__c) {
                        cartIdParam = this.persistedState.Cart_ID__c;
                        this.cartId = cartIdParam;
                    }

                    this.boolNotification = true;
                    let getCartResponse = await getCartServices.getCart(cartIdParam, uuidParam, this.interactionRecordIdValue);

                    if (getCartResponse !== null && getCartResponse.httpCode === '200') {
                        if (this.showPeripheral || (this.showPeripheralRC || this.showPeripheralOC)) {
                            let output = await getRetailCustomSettings({ key: 'flowStatePageName' });
                            let isComingFromHelperApp = await getRetailCustomSettings({ key: 'flowStateHelperAppCallout' });
                            if (isComingFromHelperApp === 'ON' && this.persistedState && this.persistedState.Page_Name__c === output) {
                                this.props.addCart(getCartResponse);
                                this.props.adduuId(uuidParam);
                                this.props.addCartId(cartIdParam);
                                if (this.pageRef?.state?.c__billingAddress) {
                                    let billingAddress = JSON.parse(this.pageRef.state.c__billingAddress);
                                    this.originalCity = billingAddress.city;
                                    this.originalState = billingAddress.state;
                                    this.originalAddress1 = billingAddress.address1;
                                    this.originalAddress2 = billingAddress.address2;
                                    this.originalZipCode = billingAddress.zipcode;
                                    //Below code is to update redux with billing address
                                    this.props.customer.billingAddress.address.city = this.originalCity;
                                    this.props.customer.billingAddress.address.state = this.originalState;
                                    this.props.customer.billingAddress.address.zipCode = this.originalZipCode;
                                    this.props.customer.billingAddress.address.address1 = this.originalAddress1;
                                    this.props.customer.billingAddress.address.address = this.originalAddress1;
                                    this.props.customer.billingAddress.address.address2 = this.originalAddress2;
                                    this.props.addDigitalAccount(this.props.customer);

                                }

                                const showPaymentCmpInEditView = sessionStorage.getItem('showBackPaymentDetailForPeripheral');//SPTSLSATT-20787

                                this.sectionDataTrack.forEach(secData => {
                                    if (secData.order < this.paymentDetailSectionData.order) {
                                        secData.isEdited = true;
                                        secData.isEditing = false;
                                        secData.isDisabled = false;
                                        secData.isValid = true;
                                    } else if (secData.order == this.paymentDetailSectionData.order && !showPaymentCmpInEditView) {//SPTSLSATT-20787 showPaymentCmpInEditView
                                        secData.isEditing = true;
                                        secData.isDisabled = false;
                                        secData.isEdited = false;
                                    }
                                });
                                if (showPaymentCmpInEditView) {//SPTSLSATT-20787
                                    sessionStorage.removeItem('showBackPaymentDetailForPeripheral');
                                }
                            }
                        }
                        this.oneTimeCharges = getCartServices.updateOnetimeCharges(getCartResponse.productOrder);
                        this.advPay = getCartServices.togglePaymentMethod(this.oneTimeCharges);
                        this.patchingDetails = getCartServices.getOCLineItemIds(getCartResponse.productOrder);
                        if (this.props.customer.journeyType === 'MoveService') {
                            let prodListwithoutMoveFrom = [];
                            getCartResponse?.productOrder?.forEach(prdItem => {
                                if (prdItem?.action?.toLowerCase() !== 'move from') {
                                    prodListwithoutMoveFrom.push(prdItem);
                                }
                            });

                            this.allProductOrderLineItemIdList = getCartServices.allProductOrderLineItemIdList(prodListwithoutMoveFrom);

                        } else {
                            this.allProductOrderLineItemIdList = getCartServices.allProductOrderLineItemIdList(getCartResponse.productOrder);
                        }
                        if (this.oneTimeCharges > 0) {
                            this.props.updateOneTimeCharges(getCartResponse.orderTotalPrice);
                            if (this.props?.peripheralParameters && this.showPeripheral) {
                                if (this.props.peripheralParameters.paymentPromptType === 'BOTH') {
                                    this.userSelectedOTPCHeck = false;
                                } else {
                                    this.userSelectedOTPCHeck = true;
                                }
                            }
                        }
                        if (getCartResponse?.futureBills) {//CDEX-354011
                            this.props.updateFutureBills(getCartResponse.futureBills);
                        }
                    }
                    this.oneTimeChargeForFlow = this.oneTimeCharges;
                    /*****************Get Cart Callout************************/
                }
                catch (Error) {
                    console.error('Error in Get Cart Api ' + JSON.stringify(Error));
                    BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback', Error); //nebula logger
                }
            }
            else if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                await getTermsAndConditionsAccFlow({ paymentCriteriaMdtList: this.businessKeysfromMetadata, customerType: this.customerType })
                    .then((resultForAccFlow) => {
                        this.businessTandCForAccFlow = resultForAccFlow;
                    })
                    .catch(error => {
                        this.error = error;
                        BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback', error); //nebula logger
                    });

            }
            if (this.props != null && this.props.paymentBusinessKeys && this.props.paymentBusinessKeys.length > 0) {
                this.paymentConsent = true;
                this.boolPaymentTerms = true;
                this.boolTermsConditions = true;
                this.termsConsent = true;
                this.props.paymentBusinessKeys.forEach(key => {
                    this.paymentBusinessKeys = [...this.paymentBusinessKeys, key];
                });
            } else {
                // if (this.oneTimeChargeForFlow && this.oneTimeChargeForFlow > 0) {
                //     this.paymentBusinessKeys = [...this.paymentBusinessKeys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, this.oneTimeChargeForFlow > 0)];
                // } else {
                //     this.paymentBusinessKeys = [...this.paymentBusinessKeys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, false, false, false, false, true)];
                // }
                // if (this.paymentBusinessKeys && this.paymentBusinessKeys.length > 0) {
                //     this.paymentBusinessKeys = [...new Set(this.paymentBusinessKeys)];
                // }

                this.paymentBusinessKeys = this.retrieveBusinessKeyEnhanced(this.enrollInAutoPaycheckbox, this.oneTimeChargeForFlow, this.userSelectedOTPCHeck, this.storeOneTimePaymentProfile);
        
            }

            if (this.props != undefined && this.props?.camsPaymentMethod?.oneTimePaymentProfile) {
                this.storeOtpProfileSelectedPreviously = this.props.camsPaymentMethod.oneTimePaymentProfile.storeOneTimePaymentProfile;
            }

            if (this.originalAddress1) {
                // this.objApiResponse=JSON.stringify(a);
            }
            else {
                this.objApiResponse = null;
            }
            this.isLoading = true;
            if (this.props.buyFlowPaymentMethod && this.props.buyFlowPaymentMethod?.payOneTimeChargesSelected) {
                this.userSelectedOTPCHeck = this.props.buyFlowPaymentMethod.payOneTimeChargesSelected;
            }

            if (this.props?.peripheralParameters && this.showPeripheral) {
                if (this.pageRef.state.c__enrollInAutoPaycheckbox == false || this.pageRef.state.c__enrollInAutoPaycheckbox == 'false') {
                    this.enrollInAutoPaycheckbox = false;
                }
            }
            //CDEX-378265
            if (this.isWLSBuyFlow && this.props.pages.data.previousPage != 'Review') {
                this.updatesectionDataContinue(1);
            }
            //CDEX-339300
            if (this.disableButton) {
                this.continueButtonEnablerUtility();
            }


            await FlowState.upsertSetupBillingFields(this.recordId,null,null,this.props.payment.paymentDefault.autoPayFlag,null,null,null,null,null,
                null,null,this.paymentBusinessKeys.join('|'),null,null,null);

            this.channelName = await getChannel(this.recordId);
            updateFlowStateByFeatureFlag({interaction: this.recordId, featureFlag:'ShowEnhancedBillingPage',channel : this.channelName, isAdvancePayment : this.advPay});
            
            //billng preferences read aloud rule
            let contextMap = {};
            contextMap["isHighRisk"] = this.oneTimeCharges > 0;
            contextMap["isEnrollAutoPayCheck"] = this.enrollInAutoPaycheckbox;
            this.suppliedValues = contextMap;
        }
        catch (error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'connectedCallback', error); //nebula logger
        }
    }

   async getSectionStatus()
    {
             let billingSectionStatus =   await getBillingPageSectionStatus({interaction: this.recordId});
             if(billingSectionStatus.Billing_Page_Section_Complete_Status__c != null && billingSectionStatus.Billing_Page_Section_Complete_Status__c != '')
             { 
                 let sectionStatus = JSON.parse(billingSectionStatus.Billing_Page_Section_Complete_Status__c);
                 if(sectionStatus.securityinfo)
                 {
                   this.showSecuritySection = true; 
                 }
                 if(sectionStatus.enrollSection)
                 {
                   this.showBillingPerfrences = true; 
                 }

                 if(sectionStatus.termsCondition)
                 {
                   this.showTermsConditionsection = true; 
                 }
                 if(sectionStatus.payment)
                 {
                   this.showPaymentSection = true; 
                 }
             }
    }


    retrieveBusinessKeyEnhanced(enrollInAutoPaycheckbox,oneTimeChargeForFlow,userSelectedOTPCHeck,storeOneTimePaymentProfile){
        let paymentBusinessKeys=[];
        //ME 
        if (enrollInAutoPaycheckbox && oneTimeChargeForFlow && !userSelectedOTPCHeck) {
            paymentBusinessKeys = [paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, true, true, true, true, true)];
        }
        //ME 
        if (enrollInAutoPaycheckbox && oneTimeChargeForFlow && storeOneTimePaymentProfile) {
            paymentBusinessKeys = [paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, true, true, true, true, true)];
        }
        //OA
        if (enrollInAutoPaycheckbox && oneTimeChargeForFlow && userSelectedOTPCHeck && !storeOneTimePaymentProfile) {
            paymentBusinessKeys = [paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, true, false, false, false, true)];
        }
        //OP
        if (!enrollInAutoPaycheckbox && oneTimeChargeForFlow && storeOneTimePaymentProfile) {
            paymentBusinessKeys = [paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, true, true, true, true, false)];
        }
        //OF
        if (!enrollInAutoPaycheckbox && oneTimeChargeForFlow && !storeOneTimePaymentProfile) {
            paymentBusinessKeys = [paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, true, true, false, false, false)];
        }
        //AP LOW RISK
        if (enrollInAutoPaycheckbox && !oneTimeChargeForFlow) {
            paymentBusinessKeys = [paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, false, false, false, false, true)];
        }
        return paymentBusinessKeys;
    }

    async handleShowBillingTerms() { //28099
        if (!this.isDisableLongVersionTnc) {
            if (this.isRetail && this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                if (this.productType?.toLowerCase() === this.productSubCategoryBB?.toLowerCase()) {
                    this.showBillingTerms = await getVisibility({ feature: this.label.EnableTncLongVersionOnBillingRetailBb });
                    console.log("showBillingTerms retail bb-->" + this.showBillingTerms);
                } else if (this.productType?.toLowerCase() === this.productSubCategoryAIA?.toLowerCase()) {
                    this.showBillingTerms = await getVisibility({ feature: this.label.EnableTncLongVersionOnBillingRetailAia });
                    console.log("showBillingTerms retail aia-->" + this.showBillingTerms);
                }
            } else if (this.isCenters && this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                if (this.productType?.toLowerCase() === this.productSubCategoryBB?.toLowerCase()) {
                    this.showBillingTerms = await getVisibility({ feature: this.label.EnableTncLongVersionOnBillingCentersBb });
                    console.log("showBillingTerms--> centers bb" + this.showBillingTerms);
                } else if (this.productType?.toLowerCase() === this.productSubCategoryAIA?.toLowerCase()) {
                    this.showBillingTerms = await getVisibility({ feature: this.label.EnableTncLongVersionOnBillingCentersAia });
                    console.log("showBillingTerms centers aia-->" + this.showBillingTerms);
                }
            }
            if (this.flowName == BwcConstants.WLS_BUYFLOW_JOURNEY_NAME) { //WLS CCSTSP-1710
                this.showBillingTerms = true;
            }
        }
    }

    onEditClick(event) {
        if(event.detail.order == 4){
            this.paymentTermToast = false; //handling for reacceptance TnC for hide toast on edit scenario
            this.template.querySelector('c-wbb-terms-condition-parent-cmp-collapsible').resetMessageForDeviceType();
        }
        if (this.disableButton === false) {
            this.disableButton = true;
        }
        this.updatesectionData(event.detail.order);
    }

    updatesectionData(value) {
      //  let nextSectionOrder = (value == this.sectionDataTrack.find(element => element.sectionName == 'billingAddress').order) ||
      //      ((this.props.selectedService?.service?.toLowerCase() === this.productSubCategoryAIA?.toLowerCase()) && (value == this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences').order))
      //      ? value + 2 : value + 1;

            let nextSectionOrder = 1;
            if (value == this.sectionDataTrack.find(element => element.sectionName == 'billingAddress').order) {
                if (this.props.selectedService?.service?.toLowerCase() === this.productSubCategoryAIA?.toLowerCase()) {
                    nextSectionOrder = value + 2;
                }
                else {
                    nextSectionOrder = value + 1;
                }
            }

            else {
                nextSectionOrder = value + 1;
            }



            this.sectionDataTrack.forEach(secData => {
            if (secData.order == value) {
                secData.isEditing = true;
                secData.isDisabled = false;
                secData.isEdited = false;
            }
            else if (secData.order >= nextSectionOrder) {
                secData.isDisabled = true;
                secData.isEditing = false;
            }
        });
    }

    onContinueClick(event) {

        if (event.detail.order == 1) {
            if ((this.allowedProductsForSecurityInfoSection.includes(this.props.selectedService.service) && !this.isExistingCustomer) && !this.isWLSBuyFlow) { //added WLS BwcConstants
                this.showSecuritySection = true;
            }
            else {
                 if(this.isWLSBuyFlow)
                 {
                    this.showTermsConditionsection= true;
                    this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences').isValid = true;
                 }
                 else
                 {
                    this.showBillingPerfrences = true;
                 }
                 this.sectionDataTrack.find(element => element.sectionName == 'securityInfo').isValid = true
               }

        }

        else if (event.detail.order == 2) {
            this.showBillingPerfrences = true;
        }

        else if (event.detail.order == 3) {
            this.updatePaymentKey(3);
            this.showTermsConditionsection= true;
        }
        else if (event.detail.order == 4) {
            this.showPaymentSection= true
            this.isPaymentRetrivalRequired = false;
        }

        else if  (event.detail.order === 5) {//
            this.updatePaymentKey(event.detail.order);
        }

        this.updatesectionDataContinue(event.detail.order);
        this.updateBillingSectionStatus();
    }

    updateBillingSectionStatus()
    {

        let billingstatusJson = {
        Address: true,
        securityinfo: this.showSecuritySection,
        enrollSection: this.showBillingPerfrences,
        termsCondition: this.showTermsConditionsection,
        payment: this.showPaymentSection
        }
        upsertBillingPageSectionStatus({interaction:this.recordId, sectionCompleteStatus:JSON.stringify(billingstatusJson)});
    }




    updatePaymentKey(value) {
        let newAbpDetails = (this.isnewcard || this.isnewbankaccount) ? true : false;
        let isOneTimeCardData = this.oneTimeCardData ? true : false;
        //let filterpaymentBusinessKeys = paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, this.oneTimeCharges > 0, isOneTimeCardData, this.storeOneTimePaymentProfile, newAbpDetails, this.enrollInAutoPaycheckbox);

        let filterpaymentBusinessKeys = this.retrieveBusinessKeyEnhanced(this.enrollInAutoPaycheckbox, this.oneTimeChargeForFlow, this.userSelectedOTPCHeck, this.storeOneTimePaymentProfile);

        this.paymentBusinessKeys = typeof (this.paymentBusinessKeys) === 'string' ? [this.paymentBusinessKeys] : this.paymentBusinessKeys;
        //Cash Enhancement
        if (this.paymentBusinessKeys?.[0] !== filterpaymentBusinessKeys?.[0] && !this.props?.cashRegisterInfo?.isAdvpayCashPay) {
            this.paymentBusinessKeys = filterpaymentBusinessKeys;
            this.paymentTermToast = true;
            //this.reconsentconfirm = true;//CDEX-347096 - Lokesha L N - 9/24
            this.paymentBusinessKeys = typeof (this.paymentBusinessKeys) === 'string' ? [this.paymentBusinessKeys] : this.paymentBusinessKeys;

            if(value != 3){
                this.updatesectionDataContinue(3);
                this.sectionDataTrack.find(element => element.sectionName == 'termsAndConditions').isValid = false;
            }
        }
        if (this.paymentTermToast) {
            this.paymentConsent = false;
            this.sectionDataTrack.find(element => element.sectionName == 'termsAndConditions').isValid = false;
            this.disableButton = true;
        }else if(value != 3){
            this.sectionDataTrack.find(element => element.sectionName == 'termsAndConditions').isValid = true;
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
            this.disableButton = false;
        }
        
        FlowState.upsertSetupBillingFields(this.recordId,null,null,this.props.payment.paymentDefault.autoPayFlag,null,null,null,null,null,
            null,null,this.paymentBusinessKeys.join('|'),null,null,null);
    }
    billingTermContinueHandler(event) {
        //this.continueButtonEnablerUtility();
        if(this.props.payment.paymentDefault.autoPayFlag || (this.oneTimeCharges > 0 && this.advPay)){
            if(((!this.showBillingTerms && this.boolTermsConditions) || this.tncCompleted)){
                this.showPaymentSection= true
                this.isPaymentRetrivalRequired = false;
                this.updatesectionDataContinue(4);
            }
        }else{
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
            this.continueButtonEnablerUtility();
        }
    }
    onPaymentTermToast(event) {
        this.paymentTermToast = event.detail;
        console.log('paymentterms' + this.paymentTermToast);
    }
    handleBillingTnCDetailsParent(event) {
        this.deviceType = event.detail.booleanOwnDeviceSelected === true ? BwcConstants.SetupBilling.ONCUSTOMERDEVICE : BwcConstants.SetupBilling.ONATTDEVICE;
        this.communicationType = this.deviceType === BwcConstants.SetupBilling.ONCUSTOMERDEVICE ? event.detail.isEmailSelected === true ? BwcConstants.SetupBilling.EMAIL : BwcConstants.SetupBilling.SMS : '';
        this.reasonSelectedOnATTDevice = this.deviceType === BwcConstants.SetupBilling.ONATTDEVICE ? event.detail.reasonSelectedOnATTDevice : '';
        
        let billingTnc = {deviceType : '',reason : '',communicationVia: ''};
		billingTnc.deviceType = this.deviceType;
		billingTnc.reason = this.reasonSelectedOnATTDevice;
		billingTnc.communicationVia = this.communicationType;
		this.props.updateBillingTnC(billingTnc);
    }

    updatesectionDataContinue(value) {
        let nextSectionOrder = 1;
        if (value == this.sectionDataTrack.find(element => element.sectionName == 'billingAddress').order) {
                if (this.props.selectedService?.service?.toLowerCase() === this.productSubCategoryAIA?.toLowerCase()) {
                    nextSectionOrder = this.isWLSBuyFlow? value + 3: value + 2;
                }

                else {
                    nextSectionOrder = this.isWLSBuyFlow? value + 3: value + 1;
                }
            }

            else {
                nextSectionOrder = value + 1;
            }

        this.sectionDataTrack.forEach(secData => {
            if (secData.order == value) {
                secData.isValid = true;
                secData.isEdited = true;
                secData.isEditing = false;
                secData.isDisabled = false;
                secData.isChanged = false;
            }
            else if (secData.order == nextSectionOrder) {
                secData.isEditable = true;
                secData.isEditing = true;
                secData.isDisabled = false;
                secData.isEdited = false;
            }
        }); 
    }

    handlePeripheralPaymentId(event) {
        this.payMethodIdParent = event.detail.value;
        this.cardData = this.props.peripheralParameters?.paymentCardInformation;
    }


    handleSelectedOption(event) {
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.PAYMENTDETAILS.value).isChanged = true;
    }

    handletoggle(event) {

        this.evtButtonSelected = event.detail;
        if (this.evtButtonSelected === 'Account') {
            this.isbankaccount = true;
            this.isClosed = true;
        } else if (this.evtButtonSelected === 'Card') {
            this.isbankaccount = false;
        }
    }

    handleCheckBoxPaperlessBilling(event) {
        this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences').isUpdate = true;
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.PAPERLESSBILLING.value).isChanged = true;
        this.boolPaperlessBilling = event.detail;

    }

    //vo923r handle the event which tells that the existing OTP selection can be ignored (Can use this for Bank as well)
    ignoreOTPUserSelection(event) {
        if (event) {
            this.ignoreExistingOTPList = event.detail;
        }
    }

    errorAlertHandler(objErrorResponse) {
        if (objErrorResponse === '400') {
            this.showAlert = true;
            this.errorMessageBackground = 'error';
            this.errorMessageIcon = 'utility:error';
            this.errorMessageLabel = this.label.ERROR_CODE_400;
        }
        if (objErrorResponse === '500') {
            this.showAlert = true;
            this.errorMessageBackground = 'error';
            this.errorMessageIcon = 'utility:error';
            this.errorMessageLabel = this.label.ERROR_CODE_500;
        }
    }

    /*
    * Show or Hide Toast Message.
    */
    showToastMessage(type, title, message, variant, boolShowToast) {
        if (boolShowToast) {
            this.template.querySelector('c-wbb-toast-message-for-iso').showToast(title, message, variant, type);
        }
        else {
            this.template.querySelector('c-wbb-toast-message-for-iso').closeModel();
        }
    }

    /*
    * Meethod to display toast and uncheck payment consent
    */
    displayToastAndUncheckConsent(toastMessageToDisplay) {
        //style  and close button for info toast
        this.styleForToast = 'background-color: #706E6B;';
        this.closeErrorToast = false;
        //unchecking the consent                    
        this.boolPaymentTerms = false;
        this.continueButtonEnabler();
        this.template.querySelector('c-wbb-toast-message-for-iso').showToast('', toastMessageToDisplay, 'info', 'info', true);
    }

    /* START OF CONTINUE METHOD */
    async executeContinueButton() {
        try {
            let buyFlowPaymentMethod = this.props.buyFlowPaymentMethod;
            let camsPaymentMethodPayload = this.props.camsPaymentMethod;
            let isKeysChanged = false;
            let keys = [];
            this.showInfoMsgForSameABPandOTP = false;
            let isOneTimeCharges = this.oneTimeChargeForFlow > 0;
            let storeOTP = wbbParentServices.getStoreOtp(this?.oneTimeCardData?.isStoreOneTimeCardDetail, this.flowName, this.newCardSelectedForOTP, this.userSelectedOTPCHeck);
            let businessKey;
            let newAbpDetails = (this.isnewcard || this.isnewbankaccount) ? true : false;
            let keyOnLoad = paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges);
            if (isOneTimeCharges) {
                businessKey = paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP, this.isnewcard, false);
            }
            else {
                businessKey = keyOnLoad;
            }
            BwcUtils.log('Calculated BusinessKey==>' + businessKey);
            //CDEX-375153-ak4124-3/25/25 Start
            let flowStateRecord = await getFlowStateByInteractionId({ recordId: this.recordId });
            if (flowStateRecord && this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value && !this.isWLSBuyFlow && !this.showPeripheral && flowStateRecord.EnrollInAutoPayCheckbox__c && !flowStateRecord.ABPPaymentProfileId__c) {
                this.showToastMessage('error', 'Error', this.label.Payment_Info_Missing, 'error', true);//CDEX-375153-ak4124-3/25/25 accint changing to true;
                this.disableButton = true;
                return;
            }
            //CDEX-375153-ak4124-3/25/25 End
            //Start of SPTSLSATT-19288 by sk3077
            let bfPay = this.props.buyFlowPaymentMethod;
            let defaultPayment;
            let onetimePayment;
            if (bfPay.defaultPaymentProfile && bfPay.defaultPaymentProfile?.paymentType && bfPay.defaultPaymentProfile?.paymentMethod) {
                defaultPayment = bfPay.defaultPaymentProfile.paymentMethod + '|' + bfPay.defaultPaymentProfile.paymentType;
            }
            if (bfPay.oneTimePaymentProfile && bfPay.oneTimePaymentProfile?.paymentType && bfPay.oneTimePaymentProfile?.paymentMethod) {
                onetimePayment = bfPay.oneTimePaymentProfile.paymentMethod + '|' + bfPay.oneTimePaymentProfile.paymentType;
            }
            FlowState.upsertPaymentMethodtoFlowState(this.recordId, defaultPayment, onetimePayment);
            //End of SPTSLSATT-19288 by sk3077
            this.reinvokeBillingAPI(); //Changes for CDEX-336499 Added by sk3077
            let isNewAbp = isOneTimeCharges && !this.userSelectedOTPCHeck && this.paymentBusinessKeys.includes(keyOnLoad);

            if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                if (this.boolShowPaymentError) {
                    this.boolShowPaymentError = false;
                    this.showToastMessage('error', '', this.label.Payment_Authorization_Error_Message, 'error', false);
                }
                if (this.strProrationAmount > 0 &&
                    this.isbankaccount &&
                    !this.oneTimeCardData && (this.otpMethodIdParent === null || this.otpMethodIdParent === '' || this.otpMethodIdParent === undefined)) {
                    this.showToastMessage('error', '', this.label.wbbExtenderServicesErrorMsgMissingOtpCardDetails, 'error', true);
                    return;
                }

                if (isOneTimeCharges) {
                    if (this.userSelectedOTPCHeck && this.oldCardSelected && this.paymentBusinessKeys.includes(keyOnLoad) && (this.oneTimeCardData && this.oneTimeCardData.cardNumber) && storeOTP && businessKey
                        && !newAbpDetails) {
                        isKeysChanged = true;
                        this.showInforToastForAccFlow = true;
                        keys = [...keys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP)];
                    }
                    if (!this.userSelectedOTPCHeck && (this.cardData && this.cardData.cardNumber) && this.paymentBusinessKeys.includes(keyOnLoad) && businessKey) {
                        isKeysChanged = true;
                        this.showInfoMsgForNewABPandOTP = true;
                        keys = [...keys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP, this.isnewcard)];
                    }
                    // SLSDEL- 15863
                    if (this.userSelectedOTPCHeck && this.newCardSelectedForOTP && this.paymentBusinessKeys.includes(keyOnLoad) && storeOTP && newAbpDetails && businessKey) {
                        isKeysChanged = true;
                        this.showInforToastForAccFlow = true;
                        keys = [...keys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, isOneTimeCharges, this.userSelectedOTPCHeck, storeOTP, newAbpDetails)];
                    }
                }

            }

            if (isKeysChanged) {
                //Adding if block for SPTSLSDEL-9944
                if (this.showInfoMsgForSameABPandOTP === true) {
                    this.displayToastAndUncheckConsent(this.label.infoMessageForSameABPandOTP);
                } else if (this.showInfoForNoOtpStorage) {
                    this.displayToastAndUncheckConsent(this.label.WBB_ALERT_DONT_STORE_OTP);
                } else if (this.showInforToastForAccFlow) {
                    this.displayToastAndUncheckConsent(this.label.wbb_terms_info_toast);
                } else if (this.showInfoMsgForNewABPandOTP) {
                    this.displayToastAndUncheckConsent(this.label.wbbNewAbpAndOtp);
                } else if (this.showInfoMsgForStoringOTP) {
                    this.template.querySelector('c-wbb-toast-message-for-iso').showToast('', this.label.Payment_Terms_Alert_Message, 'info', 'info', true);
                }

                this.paymentBusinessKeys.forEach(oldKey => {
                    this.termsAndPayment = this.termsAndPayment.filter(value => value.businessKey !== oldKey && value.businessKey !== this.KEYS.READALOUD_AUTO_E_BILL);
                });
                //uncheck the consent checkbox here - logic goes here

                this.paymentConsent = false;

                this.paymentBusinessKeys = [];
                keys.forEach((key) => {
                    this.paymentBusinessKeys = [...this.paymentBusinessKeys, key];
                });
                this.paymentBusinessKeys = [...this.paymentBusinessKeys, paymentServices.filterBusinessKeys(this.businessKeysfromMetadata, false, false, false, false, true)];
                return;
            }

            try {
                this.props.addBusinessKeys(this.paymentBusinessKeys);
            } catch (error) {
                console.log('Error in Redux in BusinessKeys');
            }

            BwcUtils.log(' CONTINUE PAYMENT PROFILES ' + JSON.stringify(this.paymentProfile));
            this.showModalSpinnerPrt = true;
            this.isLoadingNextPage = true;
            this.recurringFailureData = null;
            this.otpFailureData = null;
            this.otpErrorResponse = null;
            this.recurringErrorResponse = null;
            //vo923r -- PARENT CONDITION : User checked the One time payment checkbox
            this.isClosed = wbbParentServices.getClosedValue(this.validateCheckbox, this.isbankaccount);

            this.isLoadingNextPage = false;
            this.onSubmitResponseReceived();
            //patching the billingPreference (paperless or paper)
            if (this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value && !this.errorInContinue) {

                /**Calling getCart API  to fetch the latest values and store in REDUX if user unchecked autopay
                 * SPTSLSDEL-20288
                **/
                //get cartId from redux. if null get value from interim page
                try {

                    let getCartResponse = await getCartServices.getCart(this.cartId, this.uuid, this.interactionRecordIdValue);
                    this.response = getCartResponse;//CCSTSP-1944
                    if (getCartResponse !== null && getCartResponse.httpCode === '200') {
                        this.props.addCart(getCartResponse);
                    }
                    if (this.isPaymentCalloutSuccess) {
                        const selectedEvent = new CustomEvent('continuesummary');
                        this.dispatchEvent(selectedEvent);
                    }

                    if (getCartResponse.httpCode >= 400) {
                        BwcUtils.showToast(this, {
                            message: this.label.getCartWarningToast,
                            variant: 'warning',
                            mode: 'dismissable'
                        });
                    }

                } catch (error) {
                    BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'executeContinueButton getCart Error', error); //nebula logger
                    if (this.isPaymentCalloutSuccess) {
                        const selectedEvent = new CustomEvent('continuesummary');
                        this.dispatchEvent(selectedEvent);
                    }
                    BwcUtils.log('Error in updating the Due monthly value in cart')
                    BwcUtils.showToast(this, {
                        message: this.label.getCartWarningToast,
                        variant: 'warning',
                        mode: 'dismissable'
                    });
                } finally {
                    if (this.response) { //CCSTSP-1944

                        let paymentDetailsArray = [];
                        let detail = {};
                        detail['paymentScheduledFlag'] = 0;
                        detail['paymentAmount'] = this.oneTimeChargeForFlow;
                        if (this.cardData) {
                            detail['paymentMethod'] = this.cardData.isCard ? 'CARD' : 'BANKACCOUNT';
                        }
                        else {
                            detail['paymentMethod'] = localStorage.getItem('paymentMethod');
                        }
                        detail['usedStoredProfileFlag'] = this.newCardSelectedForOTP === true ? 0 : 1;
                        paymentDetailsArray.push(detail);

                        let billingAddress = {
                            'city': this.props.customer.billingAddress.address.city,
                            'state': this.props.customer.billingAddress.address.state,
                            'address1': this.props.customer.billingAddress.address.address1,
                            'address2': this.props.customer.billingAddress.address.address2,
                            'zipcode': this.props.customer.billingAddress.address.zipCode
                        };

                        const recordDetail = {
                            statusMessage: this.response.httpCode == 200 ? 'Success' : 'error' + JSON.stringify(this.response),
                            successFlag: this.response.httpCode == 200 ? 1 : 0,
                            statusCode: this.response.httpCode == 200 ? 0 : 1,
                            paymentDetails: paymentDetailsArray,
                            reasonForAttDevice: this.reasonSelectedOnATTDevice,
                            selectLocalOrRemote: this.deviceType == BwcConstants.SetupBilling.ONCUSTOMERDEVICE ? 'Remote' : 'Local',
                            communicationsPreferences: this.communicationType,
                            billingAddress: billingAddress,
                            paperlessBillFlag: this.props.payment.paymentDefault.paperlessBilling == true ? 1 : 0,
                            autoPayFlag: this.props.payment.paymentDefault.autoPayFlag == true ? 1 : 0,
                            errorType: this.response.httpCode == 200 ? 'Success_Admit' : 'Failure'
                        }
                        const newRecordDetail = {
                            Custom_Event_Attributes__c: JSON.stringify(recordDetail)
                        }
                        const myURL = '/sf/shop/fulfillmentandbilling';//CDEX-403465
                        LogAnalyticsEvent('SF_SetUpBilling_Continue_Submit', this.recordId, null, null, newRecordDetail,myURL);//CDEX-403465 added myURL; BuyFlowUtils-->bwcAnalyticsEventServices
                    }
                }
                // <--Temporarily Commenting below code to unblock the continue navigation 
                // this code will be moved to sectional continue as part of payment detail tech story:24753-->

                // if(this.enrollInAutoPaycheckbox && this.isPaymentCalloutSuccess){
                const selectedEvent = new CustomEvent('continuesummary');
                this.dispatchEvent(selectedEvent);
                // }        
            } else if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                if (this.isPaymentCalloutSuccess) {
                    const selectedEvent = new CustomEvent('continuesummary');
                    this.dispatchEvent(selectedEvent);
                }
            }
            await FlowState.upsertSetupBillingFields(this.recordId, null, null, null, null, this.deviceType, this.communicationType, this.reasonSelectedOnATTDevice, null, null, null, null, null, null, this.cardCaptured); //CDEX -308265 ak4124 11/19/24
        }
        catch (error) {
            BwcUtils.nebulaLogger(this.recordId, COMPONENT_TYPE, COMPONENT_NAME, this.executeContinueButton.name, error); //nebula logger
        }
    }
    /* END OF CONTINUE METHOD */

    paperlessBillingCheckbox(event) {
        this.enrollPaperlessBillingCheckBoxVal = event.detail;
        this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences').isUpdate = true;

    }


    onSubmitResponseReceived() {

        const actionType = {
            action: 'SetUpBilling | Continue',
            type: 'Product Sales'
        };
        this.paymentDetailsRecurring = wbbParentServices.getPaymentDetailsRecurring(this.paymentDetailsRecurring, this.flowName, this.strProrationAmount,
            this.costPrice, this.newCardSelectedForRecurring, this.evtButtonSelected);

        this.paymentDetailsOneTime = wbbParentServices.getPaymentDetailsOneTime(this.paymentDetailsOneTime, this.flowName, this.strProrationAmount,
            this.costPrice, this.userSelectedOTPCHeck, this.storeOneTimePaymentProfile, this.newCardSelectedForOTP, this.paymentDetailsRecurring, this.evtButtonSelected);

        const recordDetail = wbbParentServices.getrecordDetailJson(this.tncData, this.paymentDetailsRecurring, this.paymentDetailsOneTime,
            this.props.customer.billingAddress.address, this.paymentConsent, this.termsConsent, this.statusMessage, this.successFlag, JSON.stringify(this.m_PageLoadImpresion));

        //To create interaction actvity
        createActivity(this.interactionRecordIdValue, actionType, recordDetail);

    }




    /**
    *@description Add the New Success Response to Main List.
    */
    checkPaymentDataInitialization(objSuccessResponse) {
        this.objApiResponse = JSON.stringify(wbbParentServices.updatePaymentDataInitialization(objSuccessResponse, this.objApiResponse));
    }

    /*Do not deploy just re sync*/
    handleSavedData(event) {
        this.cardData = event.detail;
        this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isUpdate = true;
        if (this.cardData) {
            this.paymentDetails = true;
            if (this.cardData.isCard) {
                this.isnewcard = true;
                this.isnewbankaccount = false;
                if (!this.encryptCardNumber && !((this.cardData.cardNumber).includes('jwe:'))) {
                    this.encryptCardNumber = true;
                    browserEncryptionFlag ? this.maskData(this.cardData.cardNumber) : this.cardData.cardNumber;
                }
                if (!(this.cardData.securityCode).includes('jwe:')) {
                    browserEncryptionFlag ? this.maskData(this.cardData.securityCode) : this.cardData.securityCode;
                }
            }
            if (this.cardData.isBank && !((this.cardData.bankAccountNumber).includes('jwe:'))) {
                this.isnewcard = false;
                this.isnewbankaccount = true;
                browserEncryptionFlag ? this.maskData(this.cardData.bankAccountNumber) : this.cardData.bankAccountNumber;
            }
        }
    }

    maskData(data) {
        let maskedData = this.template.querySelector('c-reusable-encryption-component').encryptData(data);
    }


    handleEncrypt(event) {
        let encryptDataJson = wbbParentServices.encryptData(this.cardData, event, this.paymentDetails, this.encryptCardNumber, this.oneTimeCardData, this.encryptCardNumberOneTime);
        this.cardData = encryptDataJson.cardData;
        this.oneTimeCardData = encryptDataJson.oneTimeCardData;
        this.encryptCardNumber = encryptDataJson.encryptCardNumber;
        this.encryptCardNumberOneTime = encryptDataJson.encryptCardNumberOneTime;
    }

    /**
     * @param {*} strPaymentProfile 
     * @param {*} strMode 
     * @param {*} strPaymentMethod 
     * @returns Response from the Continuation Callout.
     * @description Method calls the continuation Service and returns response.
     */
    async paymentProfileCallout(strPaymentProfile, strMode, strPaymentMethod) {
        let useCaseCredit = false;
        this.flowName = !this.flowName ? 'NewService' : this.flowName; //CDEX-378468 - 2/11
        const objResponse = await paymentServices.postPaymentProfileCallout(strPaymentProfile, strMode, strPaymentMethod, this.interactionRecordIdValue, this.flowName, this.props.customer.interactionDetails.uuid, useCaseCredit)
        return objResponse;
    }

    //cl142v -- handle modal display 
    handleButtonFunctionality(event) {
        this.disableButtonPayment = wbbParentServices.getDisablePaymentButton(event.detail.buttonEnable, event.detail.otp);
        this.disableButtonPaymentOtp = wbbParentServices.getDisablePaymentButtonOtp(event.detail.buttonEnable, event.detail.otp);
        this.existingCardModal = wbbParentServices.getExistingCardModal(event.detail.buttonEnable, event.detail.otp);
    }

    hideSuccessMessage() {
        this.myDetails = false;
        this.showTopError = false;
    }
    /**Build as part of 1387 */
    showResponseMessage(event) {
        if (event.detail.code >= '400') {
            if (event.detail.showPatchError) {
                this.isPatchError = true;
                this.errorMessageBackground = 'error';
                this.errorMessageIcon = 'utility:error';
                this.errorMessageLabel = event.detail.description;
                this.showTopError = !this.showTopError;
                this.scrollToErrorSection('topErrorDiv');
                this.getError = false;
                this.timeoutRequired = true;
                this.isCloseBtnRequired = true;
            } else {
                this.errorMessageBackground = 'error';
                this.errorMessageIcon = 'utility:error';
                this.errorMessageLabel = event.detail.description;
                //  this.myDetails=!this.myDetails;
                this.getError = true;
                let compVar = this.template.querySelector('c-wbb-payment-detail-cmp-collapsible'); //CDEX-378468 - 2/11
                if (compVar) {
                    this.template.querySelector('c-wbb-payment-detail-cmp-collapsible').showErrorFunction(event.detail.description);
                }
                this.timeoutRequired = false;
                this.isCloseBtnRequired = false;
            }
        } else if (event.detail.code == '1') {
            this.errorMessageBackground = 'success';
            this.errorMessageIcon = 'utility:success';
            this.errorMessageLabel = this.label.SUCCESS_CODE_200;
            this.myDetails = !this.myDetails;
            this.getError = false;
            this.timeoutRequired = true;
            this.isCloseBtnRequired = true;
        }
    }

    //handler for one-time 
    handleSavedDataForOneTime(event) {
        this.oneTimeCardData = event.detail;
        this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isUpdate = true;
        if (this.oneTimeCardData) {
            this.paymentDetails = false;
            if (this.oneTimeCardData.isCard) {
                if (this.oneTimeCardData?.isStoreOneTimeCardDetail) {
                    this.storeOneTimePaymentProfile = this.oneTimeCardData.isStoreOneTimeCardDetail ? this.oneTimeCardData.isStoreOneTimeCardDetail : false;
                }
                this.isnewcard = true;
                this.isnewbankaccount = false;
                if (!this.encryptCardNumberOneTime && !((this.oneTimeCardData.cardNumber).includes('jwe:'))) {
                    this.encryptCardNumberOneTime = true;
                    browserEncryptionFlag ? this.maskData(this.oneTimeCardData.cardNumber) : this.oneTimeCardData.cardNumber;
                }
                if (!(this.oneTimeCardData.securityCode).includes('jwe:')) {
                    browserEncryptionFlag ? this.maskData(this.oneTimeCardData.securityCode) : this.oneTimeCardData.securityCode;
                }
            }
            if (this.oneTimeCardData?.isStoreOneTimeCardDetail) {
                    this.storeOneTimePaymentProfile = this.oneTimeCardData.isStoreOneTimeCardDetail ? this.oneTimeCardData.isStoreOneTimeCardDetail : false;
                }
            if (this.oneTimeCardData.isBank && !((this.oneTimeCardData.bankAccountNumber).includes('jwe:'))) {
                this.isnewcard = false;
                this.isnewbankaccount = true;
                browserEncryptionFlag ? this.maskData(this.oneTimeCardData.bankAccountNumber) : this.oneTimeCardData.bankAccountNumber;
            }
        }

        let payload = {};
        payload.changeSecData = this.sectionDataTrack;
        publish(this.messageContext, buyFlowChannel, payload);

    }

    handleOrderSummaryNavigation() {
        const opentTabEvent = new CustomEvent('opentab');
        this.dispatchEvent(opentTabEvent);
        let componentDef = {
            componentDef: 'c:buyFlowOrderSummary',
            attributes: {
                recordId: this.recordId
            }
        };
        // Encode the componentDefinition JS object to Base64 format to make it url addressable
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    //Event to close the modal and not continue
    closeModalParent() {
        this.isModalOpen = false;
    }

    //Events to validate from the payment details
    handleCardDetails(event) {
        this.modalCardValidation = wbbParentServices.getModalCardDetailValidation(event.detail.cardDetails);
        this.emptyDate = wbbParentServices.getEmptyDate(event.detail.cardDetails);
        this.emptycard = wbbParentServices.getEmptycard(event.detail.cardDetails);
        this.emptyZip = wbbParentServices.getemptyZip(event.detail.cardDetails);
        this.emptyHolder = wbbParentServices.getEmptyHolder(event.detail.cardDetails);
        this.emptyCode = wbbParentServices.getEmptyCode(event.detail.cardDetails);
    }
    //Bank events
    handleBankDetails(event) {
        this.modalCardValidation = wbbParentServices.getModalCardValidation(event.detail.bankDetails);
        this.emptyBankType = wbbParentServices.getEmptyBankType(event.detail.bankDetails);
        this.emptyHolderBnk = wbbParentServices.getEmptyHolderBnk(event.detail.bankDetails);
        this.emptyRnBnk = wbbParentServices.getEmptyRnBnk(event.detail.bankDetails);
        this.emptyAnBnk = wbbParentServices.getEmptyAnBnk(event.detail.bankDetails);
    }
    handlePopupContinue(event) {
        if (this.oneTimeCharges > 0) {
            //this.paymentBusinessKeys = ['OF'];
            this.paymentBusinessKeys = this.retrieveBusinessKeyEnhanced(this.enrollInAutoPaycheckbox, this.oneTimeChargeForFlow, this.userSelectedOTPCHeck, this.storeOneTimePaymentProfile);
            this.boolPaymentTerms = false;

        }

    }
    //vo923r -- display modal when is selected the bank account and click back button
    parentbankaccountselected() {
        this.existingCardModal = true;
    }
    //on SecurePayment completed adding payment details to response attribute
    handleSecurePaymentCompleted(event) {
        if (this.objApiResponse) {
            try {
                let objeResp = (typeof this.objApiResponse === 'string') ? JSON.parse(this.objApiResponse) : this.objApiResponse;
                if (objeResp.Payments[0]?.paymentProfiles?.paymentProfileList) {
                    objeResp.Payments[0].paymentProfiles.paymentProfileList = [...objeResp.Payments[0].paymentProfiles.paymentProfileList, event.detail.value];
                }
                this.objApiResponse = JSON.stringify(objeResp);
            } catch {
                BwcUtils.log(' Error @ securepayment');
            }
        }
    }
    //Event to open the modal with the back button
    async backClickHandler() {
        const myURL = '/sf/shop/fulfillmentandbilling';//CDEX-403465
        LogAnalyticsEvent('SF_SetUpBilling_Back_Btn_Link_Click', this.interactionRecordIdValue,null,null,null,myURL);//CDEX-403465 added myURL; BuyFlowUtils-->bwcAnalyticsEventServices
        BuyFlowUtils.createImpression(this.label.Setup_Billing_Back_Button, this.recordId, this.m_PageLoadImpresion, this.props.customer.serviceAddress.placeId);

        let allCardBankFields = [this.emptyDate, this.emptyCode, this.emptyHolder, this.emptyZip, this.emptycard, this.emptyHolderBnk, this.emptyAnBnk, this.emptyRnBnk, this.emptyBankType];
        if (this.existingCardModal === true || this.modalCardValidation === true) {
            this.isModalOpen = true;

        } else if (this.trueChecker(allCardBankFields)) {
            this.backScreenAction();
        }
        await FlowState.upsertSetupBillingFields(this.recordId, null, null, null, null, this.deviceType, this.communicationType, this.reasonSelectedOnATTDevice, null, null, null, null, null, null, this.cardCaptured); //CDEX -308265 ak4124 11/19/24
    }

    /* function that returns true if every element of the array is true */
    trueChecker = (arr) => arr.every(v => v === true);


    //return to previousPage (currently is Interim)
    backScreenAction() {
        // vo923r -- Creates the event with the contact ID data.
        const selectedEvent = new CustomEvent('backinterim');

        // vo923r -- Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    /**
    * @description : This Handler is used to capture consent from PaymentTerms, update the variable and call continue button method 
    */
    PaymentTersmsHandler(event) {
        this.boolPaymentTerms = event.detail;
        this.paymentConsent = event.detail;
        this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences').isUpdate = true;
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.PAYMENTTERMS.value).isChanged = true;
        //  this.lstPaymentTerms.tncAcceptance = event.detail;
        this.continueButtonEnabler();
    }
    handleSecurityInformation() {
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.SECURITYINFORMATION.value).isChanged = true;
    }
    handlePaymentTermsChanged() {
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.BILLINGPREFRENCE.value).isChanged = true;
    }
    handlePaperlessBillingChanged() {
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.BILLINGPREFRENCE.value).isChanged = true;
    }
    handleBillingTermsChangedParent() {
        this.sectionDataTrack.find(element => element.sectionName == BwcBillingAccount.SectionName.TERMSANDCONDITIONS.value).isChanged = true;
    }

    addressMatchValidationParent(event) {
        this.sectionDataTrack.find(element => element.sectionName == 'billingAddress').isUpdate = true;
    }

    async EnrollAutopayCheckboxHandler(event) {  //SPTSLSDEL-20729
        let checkVal = event.detail;
        const myURL = '/lightning/r/interaction__c';//CDEX-403465
        LogAnalyticsEvent(BwcBillingAccount.AnalyticsEvent.SETUPBILLINGAUTOPAYBTN.value, this.recordId,null,null,null,myURL);//CDEX-403465 added myURL; BuyFlowUtils-->bwcAnalyticsEventServices
        if (checkVal !== this.enrollInAutoPaycheckbox) {
            this.sectionDataTrack.find(element => element.sectionName == 'billingPreferences').isUpdate = true; 
        }
        this.enrollInAutoPaycheckbox = checkVal;
        if (this.oneTimeCharges) { //with otp scenario
            if (this.userSelectedOTPCHeck) { //otp with diff payment for ABP and OTP               
                this.displayOTPSectionandHideABP = this.isWLSBuyFlow ? false : true;//CDEX-362985
            } if (!this.enrollInAutoPaycheckbox) { //otp with same payment for ABP and OTP
                this.copyDataFromABPToOTPandHideABP = true;
            }
            else if (this.enrollInAutoPaycheckbox) { //otp with same payment for ABP and OTP
                this.copyDataFromABPToOTPandHideABP = false;
            }
            if (this.oneTimeCharges > 0 && !this.enrollInAutoPaycheckbox && !this.storeOneTimePaymentProfile) {
                //this.paymentBusinessKeys = this.storeOneTimePaymentProfile ? ['OP'] : ['OF'];
                this.userSelectedOTPCHeck = false;
                BwcUtils.log(' PaymentBusiness Keys :123==' + this.paymentBusinessKeys);
                this.boolPaymentTerms = false;
            }
            // else if (!this.enrollInAutoPaycheckbox && this.storeOneTimePaymentProfile && this.oneTimeCharges) {
            //     this.paymentBusinessKeys = ['OP'];
            // }
            //Uncommented part of CDEX-347096 - Lokesha L N - 9/24
            // else if (this.enrollInAutoPaycheckbox && !this.storeOneTimePaymentProfile && this.oneTimeCharges) {
            //     this.paymentBusinessKeys = ['OA'];
            // }

            
            //CDEX-323249 - sk9969 - 10/17
            if (this.enrollInAutoPaycheckbox && this.oneTimeCharges) {
                if (!this.reconsentconfirm) {
                    this.userSelectedOTPCHeck = true;
                }

            }
            this.paymentBusinessKeys = this.retrieveBusinessKeyEnhanced(this.enrollInAutoPaycheckbox, this.oneTimeChargeForFlow, this.userSelectedOTPCHeck, this.storeOneTimePaymentProfile);

        } else { //No otp scenario
            this.clearOutABPandHideABP = true;
            if (!this.enrollInAutoPaycheckbox) {
                this.boolPaymentTerms = true;
                this.showPaymentSection= false;
            }
        }
        if (this.showPeripheral && !this.isWLSBuyFlow)//wls CDEX-362976
    {
            let jslog = { 'message': JSON.stringify(this.enrollInAutoPaycheckbox) };
            BwcUtils.nebulaLogger(this.recordId, 'LWC', 'wbbParentCmpCollapsible', 'EnrollAutopayCheckboxHandler', jslog);

            this.template.querySelector('c-wbb-payment-detail-cmp-collapsible').setDisplayAbp(this.enrollInAutoPaycheckbox);
        }
        this.props.payment.paymentDefault.autoPayFlag = this.enrollInAutoPaycheckbox;
        this.props.updatePayment(this.props.payment);
        if (!this.enrollInAutoPaycheckbox) {//CDEX-336499 Updating flowstate once unenrolled for ABP feature
            FlowState.upsertFlowStateTenderValue(this.recordId, '', '', 'Unenrolled', false);
        }

        if(!this.enrollInAutoPaycheckbox && !this.advPay){
            this.paymentBusinessKeys = [];
            updateFlowStateByFeatureFlag({interaction: this.recordId, featureFlag:'',channel : this.channelName, isAdvancePayment : this.advPay});
        }else{
            updateFlowStateByFeatureFlag({interaction: this.recordId, featureFlag:'ShowEnhancedBillingPage',channel : this.channelName, isAdvancePayment : this.advPay});
        }
        FlowState.upsertSetupBillingFields(this.recordId,null,null,this.enrollInAutoPaycheckbox,null,null,null,null,null,
            null,null,this.paymentBusinessKeys.join('|'),null,null,null);
        
    }

    /**
    * @description : This Handler is used to capture consent from Terms&Conditions, update the variable and call continue button method 
    */
    TermsConditionsHandler(event) {
        this.boolTermsConditions = event.detail;
        this.termsConsent = event.detail;
        //this.continueButtonEnablerUtility();
        if(this.props.payment.paymentDefault.autoPayFlag || (this.oneTimeCharges > 0 && this.advPay)){
            if(((!this.showBillingTerms && this.boolTermsConditions) || this.tncCompleted)){
                this.showPaymentSection= true
                this.isPaymentRetrivalRequired = false;
                this.updatesectionDataContinue(4);
            }
        }else{
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
            this.continueButtonEnablerUtility();
        }

    }

    handleTncUpdate(event) {
        this.isTncAccepted = event.detail;
    }

    handleTncReacceptance(event) {
        this.isTncReacceptanceRequired = event.detail;
        this.disableButton = true;
    }

    showErrorToast(title, mode) {
        const event = new ShowToastEvent({
            title: title,
            variant: 'error',
            mode: mode
        });
        this.dispatchEvent(event);
    }

    /**
    * @description : This Handler is to enable continue button when both payment terms and T&C consent is checked 
    */
    continueButtonEnabler() {
        //nh0274 The !this.userSelectsNoCommPref condition was removed from the if clause after to remove the Comm & Prefer section from the HTML
        //16th March - adding comm pref checkbox also to enable/disable logic
        if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value && this.boolPaymentTerms && this.boolTermsConditions) {
            this.disableButton = false;
        } else if (this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value && this.addressMatchValidation && this.updateBillingInfoApiSuccess) {
            if (this.enrollPaperlessBillingCheckBoxVal && this.enrollInAutoPaycheckbox) {
                if (this.boolPaymentTerms && this.boolPaperlessBilling) {
                    this.continueButtonEnablerUtility();
                } else {
                    this.disableButton = true;
                }
            } else if (!this.enrollPaperlessBillingCheckBoxVal && this.enrollInAutoPaycheckbox) {
                if (this.boolPaymentTerms) {
                    this.continueButtonEnablerUtility();
                } else {
                    this.disableButton = true;
                }
            } else if (this.enrollPaperlessBillingCheckBoxVal && !this.enrollInAutoPaycheckbox) {
                if (this.boolPaperlessBilling) {
                    this.continueButtonEnablerUtility();
                } else {
                    this.disableButton = true;
                }
            }
            else {
                this.continueButtonEnablerUtility();
            }
        }
        else {
            this.disableButton = true;
        }
    }

    continueButtonEnablerUtility() {
        //Cash Enhancement
        if (this.props.cashRegisterInfo.isAdvpayCashPay) {
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
        }
        //cash Enhancement
        let isValidFlag = true;
        this.sectionDataTrack.forEach(secData => {
            if (secData.isValid == false)
                isValidFlag = false;
        });

        if (((!this.showBillingTerms && this.boolTermsConditions) || this.tncCompleted) && isValidFlag) {
            this.disableButton = false;
        } else {
            this.disableButton = true;
        }
    }

    /**
          * @description :Method to retrive data from Redux and store it into Local variables.
      **/
    getDataFromRedux(reduxState) {
        this.getDataFromReduxCustomer(reduxState.customer);
        this.getDataFromReduxSelService(reduxState.selectedService);
        this.uuid = this.props.uuId;
        if (this.props.cart && this.props.cart.orderTotalPrice) {
            this.costPrice = this.props.cart.orderTotalPrice[0].finalPrice.taxIncludedAmount;
        }

        //Get Prorated Charges for Extender Services Flow.
        if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
            this.getProratedCharges(reduxState.camsProductPurchaseReview);
            this.oneTimeChargeForFlow = this.strProrationAmount;
        }

    }

    /**
     * @description Method to get prorated charges from redux.
     * @param {*} objProductPurchaseReview Response from ValidateAPI.
     */
    getProratedCharges(objProductPurchaseReview) {
        if (objProductPurchaseReview.content && objProductPurchaseReview.content.productDetails) {
            let productPriceDetails = objProductPurchaseReview.content.productDetails[0].productPriceRelationship;
            if (productPriceDetails) {
                for (let i = 0; i < productPriceDetails.length; i++) {
                    if (productPriceDetails[i].type === 'proratedCharges' && productPriceDetails[i].proratedCharges) {
                        this.strProrationAmount = productPriceDetails[i].proratedCharges.total;
                    }
                    if ((productPriceDetails[i].type === 'monthlyCharges' || productPriceDetails[i].type === 'MonthlyCharges') && productPriceDetails[i].monthlyCharges) {
                        this.costPrice = productPriceDetails[i].monthlyCharges.total;
                    }
                }
            }
        }
    }

    /**
        * @description :Method to retrive data from Customer object of Redux.
    **/
    getDataFromReduxCustomer(objCustomer) {

        this.isExistingCustomer = objCustomer.isExistingCustomer;
        let objInteractionDetails = objCustomer.interactionDetails;
        if (this.isExistingCustomer) {
            this.billingAddressPlaceId = objCustomer.billingAddress.placeId;
            this.serviceAddressPlaceId = objCustomer.serviceAddress.placeId;
            this.originalCity = objCustomer.billingAddress.address.city;
            this.originalState = objCustomer.billingAddress.address.state;
            this.originalAddress1 = objCustomer.billingAddress.address.address1;
            this.originalAddress2 = objCustomer.billingAddress.address.address2;
            this.originalZipCode = objCustomer.billingAddress.address.zipCode;
            this.customerType = BwcConstants.CustomerType.WBB_BSSE.value;
        }
        else {
            let objServiceAddress = objCustomer.serviceAddress.address;
            this.serviceAddressPlaceId = objCustomer.serviceAddress.placeId;
            this.originalCity = objServiceAddress.city;
            this.originalState = objServiceAddress.stateOrProvince;
            this.originalAddress1 = objServiceAddress.streetNr + ' ' + objServiceAddress.streetName + ' ' + objServiceAddress.streetType + ', ' + objServiceAddress.geographicSubAddress.subUnitType + ' ' + objServiceAddress.geographicSubAddress.subUnitNumber;
            this.originalAddress2 = '';
            this.originalZipCode = objServiceAddress.postcode;
            this.customerType = 'newUser';
        }
        // common attributes    
        if (objInteractionDetails && objInteractionDetails.firstName) {
            this.paymentProfile.firstName = objInteractionDetails.firstName;
        }
        if (objInteractionDetails && objInteractionDetails.lastName) {
            this.paymentProfile.lastName = objInteractionDetails.lastName;
        }
    }


    /**
        * @description :Method to retrive data from Selected Service object of Redux.
    **/
    getDataFromReduxSelService(objSelectedService) {
        this.migrationFrom = objSelectedService.migratedFrom;
    }



    //nh0274: US 3357
    readParentSpinner(isOneTimePayment, showParentSpinner) {
        if (isOneTimePayment === true || isOneTimePayment === 'true') {
            this.parentSpinnerOTP = showParentSpinner;
        } else {
            this.parentSpinner = showParentSpinner;
        }
    }


    scrollToErrorSection(divId) {
        const topDiv = this.template.querySelector('[data-id=' + divId + ']');
        topDiv.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }

    handlePaymentTermsInfo(event) {
        if (!this.isRetail) {
            if (this.flowName === BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
                this.termsAndPayment.push(event.detail);
            }
            else {
                event.detail.forEach(element => {
                    let objTermInfo = element;
                    objTermInfo.tncAcceptance = true;
                    this.termsAndPayment.push(objTermInfo);
                });
                BwcUtils.log('event---' + JSON.stringify(event.detail));
            }
        }
    }


    /**
     * @description Callout For Payment AUthorization For Extender Flow.
     */
    async postPaymentAuthorization(strAmount, strPaymentMethodId, flowName, uuid) {
        const objResponse = await paymentServices.postPaymentAuthorization(strAmount, strPaymentMethodId, flowName, uuid);
        return objResponse;
    }

    /**
     * @description Get Type & number of payment for One Time.
     */
    getOneTimePaymentDetails(objPaymentProfile) {
        if (objPaymentProfile.hasOwnProperty('card')) {
            let cardData = objPaymentProfile.card;
            this.otpPaymentType = cardData.cardType ? cardData.cardType : '';
            this.otpPaymentNumber = cardData.cardNumber ? cardData.cardNumber.substring(cardData.cardNumber.length - 4) : '';
        }
        else if (objPaymentProfile.hasOwnProperty('bankaccount')) {
            let bankAccountData = objPaymentProfile.bankAccount;
            this.otpPaymentType = bankAccountData.accountType ? bankAccountData.accountType : '';
            this.otpPaymentNumber = bankAccountData.accountNumber ? bankAccountData.accountNumber.substring(bankAccountData.accountNumber.length - 4) : '';
        }
    }


    /**
     * @description Update API called on Click of Continue to enroll for Autopay.
     * @param {*} strPaymentMethodId Data of PP to be enrolled.
     */
    async updateEnrollPaymentProfile(strPaymentMethodId) {
        let boolEnrollSuccess = false;
        let updateEnrollPaymentProfile = {};
        updateEnrollPaymentProfile.enrollPaymentPlan =
        {
            'accountNumber': this.props.camsProductPurchaseReview.content.accountDetails.ban ? this.props.camsProductPurchaseReview.content.accountDetails.ban : '',
            'systemId': 'RTB',
            'divisionId': 'RTB'
        };
        updateEnrollPaymentProfile.individualId = this.originalIndividualId;
        updateEnrollPaymentProfile.paymentMethodId = strPaymentMethodId;
        const objEnrollUpdatedResponse = await this.paymentProfileCallout(JSON.stringify(updateEnrollPaymentProfile), paymentServices.PostPaymentProfileMode.UPDATE, 'ENROLL');
        if (objEnrollUpdatedResponse && objEnrollUpdatedResponse.content && objEnrollUpdatedResponse.content.responseCode === '1') {
            boolEnrollSuccess = true;
        }
        else if (objEnrollUpdatedResponse && objEnrollUpdatedResponse.code >= '400') {
            boolEnrollSuccess = false;
            this.showTopError = true;
            this.errorMessageLabel = objEnrollUpdatedResponse.description;
            this.errorMessageBackground = 'error';
            this.errorMessageIcon = 'utility:error';
            this.scrollToErrorSection('topErrorDiv');
        }
        return boolEnrollSuccess;
    }
    async handlePeripheralbtnClick(event) {
        //SPTSLSATT-13142 Starts
        if (FORM_FACTOR !== 'Large') {
            const toastEvt = new ShowToastEvent({
                title: 'Payment App is in progress',
                variant: 'Success',
            });
            this.dispatchEvent(toastEvt);
        }
        //SPTSLSATT-13142 Ends
        this.eventDetail = new Object();
        let onetimechargesAmount = event.detail.oneTimeCharges;
        if (onetimechargesAmount !== undefined && onetimechargesAmount !== null) {
            this.eventDetail.onetimechargesAmount = onetimechargesAmount;
        }
        let billingAddress = {
            'city': this.props.customer.billingAddress.address.city,
            'state': this.props.customer.billingAddress.address.state,
            'address1': this.props.customer.billingAddress.address.address1,
            'address2': this.props.customer.billingAddress.address.address2,
            'zipcode': this.props.customer.billingAddress.address.zipCode
        };

        this.eventDetail.billingAddress = JSON.stringify(billingAddress);
        this.eventDetail.enrollInAutoPaycheckbox = this.enrollInAutoPaycheckbox;
        this.eventDetail.paymentType = event.detail.paymentType;
        this.eventDetail.storeOCProfile = event.detail.storeOCProfile !== undefined ? event.detail.storeOCProfile : this.oneTimeCardData?.isStoreOneTimeCardDetail;
        this.eventDetail.paymentProfileId = event.detail.paymentProfileIdRC ? event.detail.paymentProfileIdRC : '';
        this.eventDetail.cardDataRC = event.detail.peripheralCardDataRC ? event.detail.peripheralCardDataRC : '';
        this.eventDetail.paymentProfileIdOC = event.detail.paymentProfileIdOC ? event.detail.paymentProfileIdOC : '';
        this.eventDetail.cardDataOC = event.detail.peripheralCardDataOC ? event.detail.peripheralCardDataOC : '';
        this.eventDetail.authorizationId = event.detail.peripheralAuthorizationId ? event.detail.peripheralAuthorizationId : '';
        this.eventDetail.paymentType = event.detail.paymentType;
        this.eventDetail.storeOCProfile = event.detail.storeOCProfile !== undefined ? event.detail.storeOCProfile : this.oneTimeCardData?.isStoreOneTimeCardDetail;
        // CDEX-350868 - start
        this.eventDetail.AIAFeatureFlag = this.props.customer.interactionDetails.AIAFeatureFlag;
        this.eventDetail.multipleBans = this.props.customer.interactionDetails.multipleBans;
        // CDEX-350868 - end
        if (event.detail.paymentType == 'OC' && this.enrollInAutoPaycheckbox == true) {
            let ban = this.pageRef.state.c__ban;
            this.props.customer.interactionDetails.BAN = ban;
        }
        let jwtBody = await wbbParentServices.relaunchHelperApp(this.eventDetail, this.recordId, this.props.customer, this.oneTimeCardData);
        let token = await initializeHelperAppJWT(this.recordId, jwtBody);
        this.showPeripheralBlocker = true;
        let mUrlParams = {
            "jwt": token,
            "c__storeId": this.c__storeId,
            "c__userId": this.c__userId
        }
        navigateToHelperApp(this, NavigationMixin, mUrlParams, true, event.detail.paymentType, this.recordId, this.props.customer.serviceAddress.placeId);
    }

    async handleCancelTransaction() {
        this.template.querySelector('c-wbb-payment-detail-cmp-collapsible').enableUseCardReaderBtn();
        //alert('cancel '+this.pageRef.state.c__billingAddress);
        if (this.pageRef?.state?.c__billingAddress) {
            let billingAddressTemp = JSON.parse(this.pageRef.state.c__billingAddress);
            //Below code is to update redux with billing address
            this.props.customer.billingAddress.address.city = billingAddressTemp.city;
            this.props.customer.billingAddress.address.state = billingAddressTemp.state;
            this.props.customer.billingAddress.address.zipCode = billingAddressTemp.zipcode;
            this.props.customer.billingAddress.address.address1 = billingAddressTemp.address1;
            this.props.customer.billingAddress.address.address2 = billingAddressTemp.address2;

            this.props.addDigitalAccount(this.props.customer);

            let billingAddress = {
                'city': billingAddressTemp.city,
                'state': billingAddressTemp.state,
                'address1': billingAddressTemp.address1,
                'address2': billingAddressTemp.address2,
                'zipcode': billingAddressTemp.zipCode
            };
            this.eventDetail.billingAddress = JSON.stringify(billingAddress);
        }

        this.eventDetail.enrollInAutoPaycheckbox = this.enrollInAutoPaycheckbox;
        let jwtBody = await wbbParentServices.relaunchHelperApp(this.eventDetail, this.recordId, this.props.customer, this.oneTimeCardData);
        if (jwtBody) {
            jwtBody.c__paymentError = 'Transaction Cancelled';
        }
        let token = await initializeHelperAppJWT(this.recordId, jwtBody);
        this.showPeripheralBlocker = false;
        let mUrlParams = {
            "jwt": token,
            "c__storeId": this.c__storeId,
            "c__userId": this.c__userId
        }
        navigateToHelperApp(this, NavigationMixin, mUrlParams, true, this.eventDetail.paymentType, this.recordId, this.props.customer.serviceAddress.placeId);
    }



    parseToObj(value) {
        let obj = (typeof value === 'object') ?
            JSON.parse(JSON.stringify(value)) :
            JSON.parse(value);

        return obj;
    }

    async fetchOffersAndServicesProductName() {
        this.offersAndServiceProductName = await wbbParentServices.fetchMappingData();
        const productCategoryBB = this.offersAndServiceProductName.filter(value => value.Product_Name__c === this.label.LabelProductNameBB);
        this.productSubCategoryBB = productCategoryBB[0]?.ProductSubCategory__c;
        const productCategoryAIA = this.offersAndServiceProductName.filter(value => value.Product_Name__c === this.label.LabelProductNameAIA);
        this.productSubCategoryAIA = productCategoryAIA[0]?.ProductSubCategory__c;
    }

    /**@description : checking access for secure component */
    async getSecureComponentAccess() {
        if (this.flowName !== BwcBillingAccount.FlowName.EXTENDERSERVICES.value) {
            let isCenters = await paymentServices.getUserAccess(CenterProfiles);
            this.isLoggedInUserWFH = !HAS_ENTER_BILLING_PAYMENT_DETAILS;//SPTSLSATT-8762

            //SPTSLSATT-8762
            this.prefetchedData.email = this.props.customer.interactionDetails.email;
            this.prefetchedData.phone = this.props.customer.interactionDetails.mobilePhone;
            if (isCenters && this.isLoggedInUserWFH && !this.isRedactionFrameworkWorking && (!hasVoiceRedactionPermission && !this.isRaisrActive)) {//SPTSLSATT-8762  //CDEX-350834 isRetail and Migration_User added by sk3077
                this.showSecurePaymentSection = true;
            }
        }
    }
    handleButtons() {
        this.disableButton = true;
    }

    handleEditOptOut(event) {
        if (event.detail == "Yes") {
            this.boolEditPopup = false;
            this.disableButton = true;
            if (this.tncCompleted) {
                this.sectionDataTrack.forEach(secData => {
                    if (secData.sectionName === "termsAndConditions") {
                        secData.isValid = true;
                        secData.isEdited = true;
                        secData.isEditing = false;
                        secData.isDisabled = false
                    }
                });
            }
            this.sectionDataTrack.forEach(secData => { secData.isChanged = false });
            this.updatesectionData(this.storeEditOrder);
        }
        else {
            this.boolEditPopup = false;
            this.billingEditButtonVariant = 'default';
        }
    }
    handleContinueDisableCollapview(event) {
        //this.disableButton = event.detail;
        if(!this.props.payment.paymentDefault.autoPayFlag && !this.oneTimeCharges > 0 && !this.advPay){
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
            this.disableButton = event.detail;
        }
    }
    handleContinueDisable(event) {
        //this.disableButton = true;
        if(!this.props.payment.paymentDefault.autoPayFlag && !this.oneTimeCharges > 0 && !this.advPay){
            this.sectionDataTrack.find(element => element.sectionName == 'paymentDetails').isValid = true;
            this.disableButton = true;
        }
        if (event.detail == false) {
            this.sectionDataTrack.forEach(secData => { secData.isUpdate = false });
        }
    }


    //SPTSLSATT-8762
    handleRaisrStatus(event) {
        this.isRaisrActive = event.detail;
    }
    get resumeService() {
        return this.props?.interaction?.flowName == BwcBillingAccount?.CANCEL_SERVICE?.ResumeCancel?.name;
    }
    get accountNumberHeaderText() {
        return `${this.props?.interaction?.billingAccountNumber} (${this.props?.interaction?.billingAccountType})`
    }
    navigateToAccount() {
        this.template.querySelector('c-navigation-util')?.navigateToBillingAccount(this.recordId, this.props?.interaction?.billingAccountId, this.props?.interaction?.billingAccountNumber, BwcBillingAccount?.FlowName?.RESUMESERVICEFLOW.value);
    }
    get serviceAddress1() {
        return this.props?.interaction?.serviceAddress?.serviceAddress1;
    }

    get serviceAddress2() {
        return this.props?.interaction?.serviceAddress?.serviceAddress2;
    }
    get isWLSBuyFlow() { //CCSTSP-1710
        return (this.props.customer.journeyType == BwcConstants.WLS_BUYFLOW_JOURNEY_NAME); //wls toystory
    }
    get showPaymentMethodSection() {
        return !this.isWLSBuyFlow;  // wls CCSTSP-1710
    }
    //Start of changes for CDEX-336499 Added by sk3077
    async reinvokeBillingAPI() {
        if (this.isBillingCallRequired && this.props.selectedService?.service === 'FIBER' && this.props.pages?.data?.previousPage === "Fulfillment" && JSON.stringify(this.props.buyFlowOrderSummary) !== '{}' && !this.props.payment?.paymentDefault?.autoPayFlag && this.termsAndConditionsSectionData.isEditing) {
            let paperlessBillingChecked = this.props.payment?.paymentDefault?.paperlessBilling;
            let ban = this.props.customer?.interactionDetails?.BAN;
            let autopayFlag = this.props.payment.paymentDefault.autoPayFlag;
            let placeId = this.props.customer?.billingAddress?.placeId;
            let billingInfoResponse = await billingServices.updateBillingInfoAPI(ban, this.isExistingCustomer, placeId, this.migrationFrom,
                this.allProductOrderLineItemIdList, this.cartId, this.uuid, this.interactionRecordIdValue);

            if (billingInfoResponse?.code >= 400) {
                BwcUtils.showToast(this, {
                    message: billingInfoResponse?.message ?? this.label?.WbbBillingUpdateFailErrorMsg,
                    variant: 'error',
                    mode: 'sticky'
                });
                return;
            } else {
                this.billingPrefResponse = await paymentServices.patchBillingPreference(paymentServices.buildBillingPrefRequest(ban, paperlessBillingChecked, autopayFlag, this.payMethodIdParent), this.props.cartId, this.props.uuId, this.recordId);
                if (this?.billingPrefResponse?.httpCode >= 400) {
                    BwcUtils.showToast(this, {
                        message: this?.billingPrefResponse?.message ?? this.label?.PatchBillingPreferenceErrormsg,
                        variant: 'error',
                        mode: 'sticky'
                    });
                    return;
                }
            }
        }
    }
    //End of changes for CDEX-336499 Added by sk3077
}