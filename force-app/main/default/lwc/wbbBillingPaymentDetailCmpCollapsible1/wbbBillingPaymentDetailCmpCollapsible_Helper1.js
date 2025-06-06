import * as BwcUtils from 'c/bwcUtils';
import PRIPHERALDEVICE_KEYID from '@salesforce/label/c.PeripheralDeviceKeyId';
import * as peripheralService from 'c/buyFlowPeripheralService';
import * as FlowState from 'c/flowStateUtil';
//Removed PeripheralError import by Naga Kiran
import { NavigationMixin } from "lightning/navigation";
import getMerchantId from '@salesforce/apex/BuyFlowUtils.getMerchantID';

import retriveTenderPromotion from '@salesforce/apexContinuation/WBB_TenderPromotionController.GetTenderPromotionwithQueryParamas';
import FORM_FACTOR from '@salesforce/client/formFactor';//SPTSLSATT-13529
import hasPeripheralAccess from "@salesforce/customPermission/hasPeripheralAccess";//SPTSLSATT-13817
import { ShowToastEvent } from "lightning/platformShowToastEvent";//SPTSLSATT-13817
import validateCard from '@salesforce/apexContinuation/WBB_TenderValidateCardController.validateCard';
import * as WbbConstants from 'c/wbbConstants';
import getChanneltype from '@salesforce/apex/BWC_Utils.getChannelForCurrentInteraction';
import { getErrorMessage as peripheralError } from 'c/buyFlowUtils';
import * as BwcConstants from "c/bwcConstants";//SPTSLSATT-20214
import BWC_Peripheral_Debug from "@salesforce/customPermission/BWC_Peripheral_Debug";
const COMPONENT_TYPE = 'LWC';//nebula logger
const COMPONENT_NAME = 'wbbPaymentDetailCmpCollapsible_Helper';//nebula logger

   export const helper_tenderPromotionCallout = async(ref) =>{
    let prodType = '';
    if(ref.productType == ref.label.BB) {
      prodType = 'broadband';
    }
    //Channel Name
    let channelName = '';
    if(ref.recordId)
    {
        channelName = await getChanneltype({interactionId: ref.recordId});
    }
    retriveTenderPromotion({ cartId:ref.props.cartId, interactionId:ref.recordId, queryParams:'limit=50&offset=0&channel='+channelName+'&productType='+prodType+'&promoType=abp'})
          .then((result)=>{
               BwcUtils.log('inside Success in helper ');
            if(result != null && result != undefined){
               let response=result;
               BwcUtils.log('result data'+ JSON.stringify(response));
              if(response.httpCode >= 400){      
                  ref.tenderApiError = true;//SPTSLSATT-13529
                  ref.showTenderInfoBannerAndReadAloud(false,false);//SPTSLSATT-13529
              }
              else
              {
                   if(FORM_FACTOR === 'Large')
                   {
                       ref.showTenderInfoBannerAndReadAloud(false,true);
                   }
                   else
                   {
                     ref.showTenderInfoBannerAndReadAloud(true,true);
                   }
                 
                 let  skipFirst=0;
                 let bannarMessage ='';
                 let bankAccountMsg='';
                 let debitCardMsg='';
                 let attCardMsg='';
                 let creditCardMsg='';
               
                 let promotionsList=response.promotionsResponse;promotionsList.forEach(promotion =>{
                 if(skipFirst >0)
                 {
                  skipFirst= skipFirst+1;
                  let promotionCharacteristicsList=promotion.promotionCharacteristics;
                   let amount=0;
                  let citi = false;
                  BwcUtils.log('promotionCharacteristicsList',JSON.stringify(promotionCharacteristicsList));
                  promotionCharacteristicsList.forEach(promotionCharacteristic => {
                 
                  if( promotionCharacteristic.name == 'amount')
                  {
                      amount=Math.round(promotionCharacteristic.value);
                  }
                  else if( promotionCharacteristic.name == 'providerTypes')
                  {
                      if(promotionCharacteristic.value =='aTTcitiCobranded')
                      {
                          citi=true;
                      }
                  }
                else if( promotionCharacteristic.name == 'tenderTypes')
                {
 
                 let tederTypeArrayvalue=    promotionCharacteristic.value.split(',');
                    if(tederTypeArrayvalue.includes('ACH'))
                    {
                     // bannarMessage = bannarMessage+'Bank Account $'+amount +' | ';
                       bankAccountMsg='Bank Account $'+amount +' | ';
               
                    }
   
                     if(tederTypeArrayvalue.includes('CreditCard'))
                     {
                       if(citi)
                       {
                        //bannarMessage = bannarMessage+'AT&T Citi Card $'+amount +' | ';                      
                         attCardMsg='AT&T Citi Card $'+amount +' | ';                
                       }
                        else
                        {
                        //bannarMessage = bannarMessage+'Credit Card $'+amount + ' | ';                    
                        creditCardMsg='Credit Card $'+amount + ' | ';
                         }
                     
                      }
                     
   
                        if(tederTypeArrayvalue.includes('DebitCard'))
                       {
   
                         //bannarMessage = bannarMessage+'Debit Card $'+amount + ' | ';                        
                         debitCardMsg='Debit Card $'+amount + ' | ';
               
                        }
                  }
   
                 });
               }
               else
               {
                   skipFirst=1;
               }
 
 
              });
             
                bannarMessage = bankAccountMsg+debitCardMsg+attCardMsg+creditCardMsg;
                bannarMessage = bannarMessage.slice(0,-3);
                ref.bankDisc =  bannarMessage;
   
   
               
            }
            }
          })
          .catch((error)=>{
             BwcUtils.log('inside error in helper '+ JSON.stringify(error));
             BwcUtils.nebulaLogger(ref.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'helper_tenderPromotionCallout', error); //nebula logger
              ref.tenderApiError = true;//SPTSLSATT-13529
             ref.showTenderInfoBannerAndReadAloud(false);//SPTSLSATT-13529
          })  
    }

    export const getAIATenderPromotionCallout = async (ref) => {
        let prodType = 'WBB'; //'wireless';
        //Channel Name
        let channelName = '';
        if (ref.recordId) {
            channelName = await getChanneltype({ interactionId: ref.recordId });
        }
        retriveTenderPromotion({ cartId: ref.props.cartId, interactionId: ref.recordId, queryParams: 'limit=50&offset=0&channel=' + channelName + '&productType=' + prodType + '&promoType=abp' })
            .then((result) => {
                BwcUtils.log('inside Success in helper ');
                if (result != null && result != undefined) {
                    let response = result;
                    BwcUtils.log(' AIA Tender Promotion result data' + JSON.stringify(response));
                    if (response.httpCode >= 400) {
                        ref.showAiaTenderInfo = false;
                        ref.showAiaReadToCust = false;
                    }
                    else {
                        let bannarMessage = '';
                        let bankAccountMsg = '';
                        let debitCardMsg = '';
                        let creditCardMsg = '';

                        let promotionsList = response?.promotionsResponse;
                        promotionsList.forEach(promotion => {
                            let promotionCharacteristicsList = promotion?.promotionCharacteristics;
                            let amount = 0;
                            if(promotionCharacteristicsList && promotionCharacteristicsList.length > 0){
                            BwcUtils.log('promotionCharacteristicsList', JSON.stringify(promotionCharacteristicsList));
                            promotionCharacteristicsList.forEach(promotionCharacteristic => {
                                if (promotionCharacteristic.name == 'amount') {
                                    amount = promotionCharacteristic.value;
                                }
                                else if (promotionCharacteristic.name == 'TenderType') {

                                    let tederTypeArrayvalue = promotionCharacteristic.value;
                                    if (tederTypeArrayvalue == 'ACH') {
                                        bankAccountMsg = 'ACH $' + amount + ' | ';
                                    }
                                    if (tederTypeArrayvalue == 'DebitCard' || tederTypeArrayvalue == 'Debit Card') {                  
                                        debitCardMsg = 'Debit Card $' + amount + ' | ';
                                    }
                                    if (tederTypeArrayvalue == 'CreditCard' || tederTypeArrayvalue == 'Credit Card') {
                                        creditCardMsg = 'Credit Card $' + amount + ' | ';
                                    }
                                }
                            });
                            }
                        });

                        bannarMessage = 'Receive Discount with ABP + Paperless Bill on ' + bankAccountMsg + debitCardMsg + creditCardMsg;
                        bannarMessage = bannarMessage.slice(0, -3);
                        ref.AIADiscountInfo = bannarMessage;
                        ref.showAiaTenderInfo = true;
                        ref.showAiaReadToCust = true;
                        BwcUtils.log('Info banner msg ==> ' + bannarMessage);
                    }
                }
            })
            .catch((error) => {
                BwcUtils.log('inside error in helper ' + JSON.stringify(error));
                BwcUtils.nebulaLogger(ref.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'getAIATenderPromotionCallout', error); //nebula logger
                ref.showAiaTenderInfo = false;
                ref.showAiaReadToCust = false;
          })  
    }
export const helper_verifyCVVHandler = async(ref, event)=>{
    var pattern = new RegExp(/^[0-9]*$/);
        let matchval = pattern.test(ref.rcZip);
        if(!ref.rcZip || ref.rcZip.length !== 5 || !matchval){
            const errorToast = ref.makeToastErrorEvent('Error!', 'Please enter a valid zip code', 'error');
            const { event } = errorToast;
            ref.dispatchEvent(event);
            return;
        }
    ref.showLoadingSpinner = true;
    let peripheralProcessingResponse;
    let individualId = ref.props.customer.interactionDetails?.individualId;
    let cartId = ref.props.cartId;
    let cartUUID = ref.props.uuId;
    let placeId = ref.props.customer.serviceAddress?.placeId;
    let keyId = PRIPHERALDEVICE_KEYID;
    let merchantId= await getMerchantId();
    let activePeripheralKey = await peripheralService.getActivePeriphKey();
    let cardInformation = ref.peripheralParameters.paymentCardInformation ? ref.peripheralParameters.paymentCardInformation : ref.peripheralParameters.accNum;
    let paymentMethod = {
        "type": "CARD",
        "card": {
            "cardReaderData": cardInformation,
            "cardReaderKid": activePeripheralKey.KID__c,
            "securityCode": ref.rcCvv ? await ref.maskData(ref.rcCvv) : ref.rcCvv,
            "merchantId": merchantId,
            "billingAddress": {
                "zipCode": ref.rcZip
            },
            "verifyCardIndicator": true
        }
    }
    ref.paymentProfile.paymentMethod = paymentMethod;
    ref.paymentProfile.individualId = individualId;

    try {
        if (ref.peripheralParameters.cardInputMethod === 'E' && ref.peripheralParameters.paymentPromptType === 'BOTH') {
            //Insted of individaulID send flowstate as ref.flowStateRes Data CDEX-382816
            
           
            peripheralProcessingResponse = await peripheralService.makePeripheralCallouts(ref.peripheralParameters, ref.flowStateRes, ref.recordId, cartId, cartUUID, ref.paymentProfile, activePeripheralKey.KID__c);
            
            if (peripheralProcessingResponse?.authorizationId) {
                await FlowState.upsertAuthorizationIds(ref.recordId, ref.peripheralParameters.journeyName, ref.peripheralParameters.serviceAddressId, peripheralProcessingResponse.authorizationId);
            }
            if(peripheralProcessingResponse?.paymentProfileResponse?.content?.message === 'SUCCESS') {
                ref.peripheralPaymentIdRC = peripheralProcessingResponse?.paymentProfileId;
            }
            let token = await ref.createSecondTripHelperAppJWT(peripheralProcessingResponse, placeId);
            peripheralService.navigateToHelperApp(ref, NavigationMixin, token, false, ref.peripheralParameters.paymentPromptType, ref.recordId, placeId);
        }
        else {
            //Insted of individaulID send flowstate as ref.flowStateRes Data CDEX-382816
            
            peripheralProcessingResponse = await peripheralService.makePeripheralCallouts(ref.peripheralParameters, ref.flowStateRes, ref.recordId, cartId, cartUUID, ref.paymentProfile, activePeripheralKey.KID__c);
       
        }
        if(peripheralProcessingResponse?.authorizationId){
            ref.peripheralAuthorizationId = peripheralProcessingResponse?.authorizationId;
            await FlowState.upsertAuthorizationIds(ref.recordId, ref.peripheralParameters.journeyName, ref.peripheralParameters.serviceAddressId, peripheralProcessingResponse.authorizationId);
        }
        if ((ref.peripheralParameters.paymentPromptType === 'RC' || ref.peripheralParameters.paymentPromptType === 'BOTH') && peripheralProcessingResponse?.paymentProfileResponse?.content?.message === 'SUCCESS') {
            ref.isDisableUseCardReadRC = true;
            ref.isContinueButtonDisable = false;
            if(ref.prePaymentCharges && ref.prePaymentCharges != null && ref.prePaymentCharges > 0.00)
            {
                ref.isContinueButtonDisable = true;
            }      
            if (ref.peripheralParameters.paymentPromptType === 'BOTH') {
                ref.isDisabled = true;
                //ref.isContinueButtonDisable = true; //CDEX-297121 //Commented this line 
            }
            let jslog = {'message':JSON.stringify(peripheralProcessingResponse)};
            BwcUtils.nebulaLogger(ref.recordId, 'Test`LWC', 'wbbPaymentDetailCmpCollapsible', 'VerifyCVVHandler-peripheralProcessingResponse', jslog);
            //let cardDetails = peripheralProcessingResponse?.paymentProfileResponse?.content?.paymentProfiles?.paymentProfilesList[0].card;
            //let paymentMethodId = peripheralProcessingResponse?.paymentProfileResponse?.content?.paymentProfiles?.paymentProfilesList[0]?.paymentMethodId;
            let paymentMethodId = peripheralProcessingResponse?.paymentProfileId;
            let paymentProfile = peripheralProcessingResponse?.paymentProfileResponse?.content?.paymentProfiles?.paymentProfilesList.find(paymentMethod=>{
                return paymentMethod.paymentMethodId == paymentMethodId;
            }) 
            
            let cardDetails = paymentProfile.card;
            ref.paymentMethodId = paymentMethodId;
            //Collapsible_Peripheral - adding third parameter as per flat view
            ref.setRCVerifiedUI(cardDetails, paymentMethodId, ref.peripheralAuthorizationId);
            ref.peripheralPaymentIdRC = paymentMethodId;
            ref.peripheralCardDataRC = peripheralService.getCardDataFromProfile(peripheralProcessingResponse?.paymentProfileResponse, ref.peripheralPaymentIdRC);
            ref.updateReduxOnVerify(true);
        }
        if(peripheralProcessingResponse?.paymentProfileResponse?.code === 400)
        {           
            handleError(ref, peripheralProcessingResponse?.paymentProfileResponse, 'WBB_Add_Payment_Profile', 'RC');
        }
        if (peripheralProcessingResponse?.authorizeResponse?.content?.decision === 'ERROR') {
            handleError(ref, peripheralProcessingResponse?.authorizeResponse?.content, peripheralProcessingResponse?.authorizeResponse?.content?.apiName, 'RC');
        }
        ref.showLoadingSpinner = false;
    } catch (error) {
        ref.showLoadingSpinner = false;
        ref.isDisableUseCardReadRC = false;
        let errorMessage = JSON.parse(JSON.parse(error.message));
        BwcUtils.nebulaLogger(ref.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'helper_verifyCVVHandler', error); //nebula logger
        await handleError(ref, errorMessage, errorMessage?.apiName, 'RC');
        if (ref.peripheralParameters.cardInputMethod === 'E' && ref.peripheralParameters.paymentPromptType === 'BOTH') {
            ref.peripheralCardDataRC = null;
            let peripheralProcessingResponse = { error: ref.peripheralErrorMsg };
            let token = await ref.createSecondTripHelperAppJWT(peripheralProcessingResponse, placeId);
            peripheralService.navigateToHelperApp(ref, NavigationMixin, token, false, ref.peripheralParameters.paymentPromptType, ref.recordId, placeId);
        }
    }
}

export const helper_verifyOTPHandler = async(ref) => {
    ref.showLoadingSpinnerOTP = true;
    let peripheralProcessingResponse;
    let individualId = ref.props.customer.interactionDetails?.individualId;
    let cartId = ref.props.cartId;
    let cartUUID = ref.props.uuId;
    let placeId = ref.props.customer.serviceAddress?.placeId;
    let keyId = PRIPHERALDEVICE_KEYID;
    let activePeripheralKey = await peripheralService.getActivePeriphKey();
    let cardInformation = ref.peripheralParameters.paymentCardInformation ? ref.peripheralParameters.paymentCardInformation : ref.peripheralParameters.accNum;
    let paymentMethod = {
        "type": "CARD",
        "card": {
            "cardReaderData": cardInformation,
            "cardReaderKid": activePeripheralKey.KID__c,
            "securityCode": ref.ocCvv ? await ref.maskData(ref.ocCvv) : ref.ocCvv,
            "merchantId": "SFORCECC-CON",
            "billingAddress": {
                "zipCode": ref.props.customer.serviceAddress?.address?.postcode
            },
            "verifyCardIndicator": true
        }
    }
    ref.paymentProfile.paymentMethod = paymentMethod;
    ref.paymentProfile.individualId = individualId;
    
    try {
        if (ref.peripheralParameters.cardInputMethod === 'E') {
            //Insted of individaulID send flowstate as ref.flowStateRes Data CDEX-382816
            
            peripheralProcessingResponse = await peripheralService.makePeripheralCallouts(ref.peripheralParameters, ref.flowStateRes, ref.recordId, cartId, cartUUID, ref.paymentProfile, activePeripheralKey.KID__c,ref.useCaseCredit);
            
            let jslog = {'message':JSON.stringify(peripheralProcessingResponse)};
            BwcUtils.nebulaLogger(ref.recordId, 'Test`LWC', 'wbbPaymentDetailCmpCollapsible', 'VerifyCOTPHandler-peripheralProcessingResponse', jslog);
            if (peripheralProcessingResponse?.authorizationId) {
                await FlowState.upsertAuthorizationIds(ref.recordId, ref.peripheralParameters.journeyName, ref.peripheralParameters.serviceAddressId, peripheralProcessingResponse.authorizationId);
            }
            let token = await ref.createSecondTripHelperAppJWT(peripheralProcessingResponse, placeId);
            peripheralService.navigateToHelperApp(ref, NavigationMixin, token, false, ref.peripheralParameters.paymentPromptType, ref.recordId, placeId);
        } else {
            //Insted of individaulID send flowstate as ref.flowStateRes Data CDEX-382816
            
            peripheralProcessingResponse = await peripheralService.makePeripheralCallouts(ref.peripheralParameters, ref.flowStateRes, ref.recordId, cartId, cartUUID, ref.paymentProfile, activePeripheralKey.KID__c,ref.useCaseCredit);
            
            let jslogs = {'message':JSON.stringify(peripheralProcessingResponse)};
            BwcUtils.nebulaLogger(ref.recordId, 'Test LWC', 'wbbPaymentDetailCmpCollapsible', 'VerifyCOTPHandler-peripheralProcessingResponse-else', jslogs);
            }
        let ocCardData;
        if (peripheralProcessingResponse?.authorizationId) {
            ref.peripheralAuthorizationId = peripheralProcessingResponse.authorizationId;
            await FlowState.upsertAuthorizationIds(ref.recordId, ref.peripheralParameters.journeyName, ref.peripheralParameters.serviceAddressId, peripheralProcessingResponse.authorizationId);
        }
        
        if(peripheralProcessingResponse?.authorizeResponse?.content){
            ocCardData = peripheralService.getCardDataFromAuth(peripheralProcessingResponse.authorizeResponse);
        }
        if(peripheralProcessingResponse.error){
            let jslogError = {'message':JSON.stringify(peripheralProcessingResponse)};
            BwcUtils.nebulaLogger(ref.recordId, 'Test error', 'wbbPaymentDetailCmpCollapsible', 'VerifyCOTPHandler-peripheralProcessingResponse-error', jslogError);
            ref.peripheralErrorMsg = ref.label.Card_Information_Save_Error;
            ref.showPeripheralErrorOTP = true;
        }
        if (peripheralProcessingResponse?.paymentProfileResponseOC?.content?.message === 'SUCCESS') {
            
            let paymentMethodId = peripheralProcessingResponse?.paymentProfileIdOC;
             let paymentProfile = peripheralProcessingResponse?.paymentProfileResponseOC?.content?.paymentProfiles?.paymentProfilesList.find(paymentMethod=>{
                return paymentMethod.paymentMethodId == paymentMethodId;
            }) 

            ref.paymentMethodIdOtp = paymentMethodId;
            ref.peripheralPaymentIdOC =paymentMethodId;
            
            if(!ocCardData){
                ocCardData = peripheralService.getCardDataFromProfile(peripheralProcessingResponse.paymentProfileResponseOC)
            }
        }
        if (peripheralProcessingResponse?.authorizeResponse?.content?.decision === 'ERROR') {
            let errorMessage = peripheralProcessingResponse?.authorizeResponse?.content;
            handleError(ref, errorMessage, errorMessage.apiName);
        }else if(ocCardData){
            ref.updateReduxOnVerify(true);
            ref.isDisableUseCardRead = true;
            ref.isContinueButtonDisable = false;
            ref.setOTPVerifiedUI(JSON.parse(ocCardData), ref.peripheralAuthorizationId, ref.peripheralPaymentIdOC);
            ref.peripheralCardDataOC = ocCardData;
            ref.oneTimeCardData = ocCardData;
        }
        ref.isDisableCheckbox = true;
        if(ref.hideCVV){
            ref.hideVerifyBtn = true;
        }
        ref.showLoadingSpinnerOTP = false;
    } catch (error) {
        ref.showLoadingSpinnerOTP = false;
        ref.isDisableUseCardRead = false;
        let errorMessage = JSON.parse(JSON.parse(error.message));
        BwcUtils.nebulaLogger(ref.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'helper_verifyOTPHandler', error); //nebula logger
        await handleError(ref, errorMessage, errorMessage?.apiName, 'OC');
        if (ref.peripheralParameters.cardInputMethod === 'E' && ref.peripheralParameters.paymentPromptType === 'OC') {
            ref.peripheralCardDataOC = null;
            let peripheralProcessingResponse = { error: ref.peripheralErrorMsg };
            let token = await ref.createSecondTripHelperAppJWT(peripheralProcessingResponse, placeId);
            peripheralService.navigateToHelperApp(ref, NavigationMixin, token, false, ref.peripheralParameters.paymentPromptType, ref.recordId, placeId);
        }
    }

}
//Removed handleError by Naga Kiran

export function setCVVUI(ref){
    let reducerAuthorization = ref.props.buyFlowPaymentMethod?.oneTimePaymentAuthorization;
    if(reducerAuthorization?.paymentProfileId || ref.peripheralParameters.paymentProfileIdOC){
        ref.peripheralPaymentIdOC = reducerAuthorization?.paymentProfileId ? reducerAuthorization.paymentProfileId : ref.peripheralParameters.paymentProfileIdOC;
    }
    if(reducerAuthorization?.paymentNumber || ref.peripheralParameters.cardDataOC){
        ref.peripheralCardDataOC = reducerAuthorization?.paymentNumber ? ref.getCardDataFromReducer(reducerAuthorization) : ref.peripheralParameters.cardDataOC;
    }
    if(reducerAuthorization?.paymentAuthorizationId || ref.peripheralParameters.paymentAuthorizationId){
        ref.peripheralAuthorizationId = reducerAuthorization?.paymentAuthorizationId ? reducerAuthorization.paymentAuthorizationId : ref.peripheralParameters.paymentAuthorizationId;
    }
    if ((ref.peripheralPaymentIdOC || ref.peripheralCardDataOC)) {
        let cardDetails;
        if(ref.peripheralPaymentIdOC && ref.profileListDetails) {
            let selectedPaymentProfile = ref.profileListDetails.find(profile => {
                return profile.paymentMethodId === ref.peripheralPaymentIdOC;
            });

            if(selectedPaymentProfile) {
                cardDetails = selectedPaymentProfile.card;
            }
        }
        if (!cardDetails && ref.peripheralCardDataOC) {
            cardDetails = JSON.parse(ref.peripheralCardDataOC);
        }
        if (cardDetails) {
            ref.setOTPVerifiedUI(cardDetails, ref.peripheralAuthorizationId, ref.peripheralPaymentIdOC);
        } else {
            ref.isContinueButtonDisable = true; 
        }
    }

    if(ref.enrollInAutoPaycheckbox){ //CDEX-368974

    let reducerPaymentProfile = ref.props.buyFlowPaymentMethod?.defaultPaymentProfile;
    if(reducerPaymentProfile?.paymentMethodId || ref.peripheralParameters.paymentProfileId){
        ref.peripheralPaymentIdRC = reducerPaymentProfile?.paymentMethodId ? reducerPaymentProfile.paymentMethodId : ref.peripheralParameters.paymentProfileId;
    }

    if(reducerPaymentProfile?.paymentNumber || ref.peripheralParameters.cardDataRC){
        ref.peripheralCardDataRC = reducerPaymentProfile?.paymentNumber ? ref.getCardDataFromReducer(reducerPaymentProfile) : ref.peripheralParameters.cardDataRC;
    }
    if ((ref.peripheralPaymentIdRC || ref.peripheralCardDataRC)) {            
        let cardDetails;
        if (ref.peripheralPaymentIdRC && ref.profileListDetails) {
            let selectedPaymentProfile = ref.profileListDetails.find(profile => {
                return profile.paymentMethodId === ref.peripheralPaymentIdRC;
            });
            if (selectedPaymentProfile) {
                cardDetails = selectedPaymentProfile.card;
            }
        }
        if (!cardDetails && ref.peripheralCardDataRC) {
            cardDetails = JSON.parse(ref.peripheralCardDataRC);
        }
        if (cardDetails) {
            ref.setRCVerifiedUI(cardDetails, ref.peripheralPaymentIdRC,ref.peripheralAuthorizationId);
        }
    } else {
            ref.isContinueButtonDisable = true;
            }
    }
}
export const helper_updateBan = async(ref) => {
    if(ref.pageRef && ref.pageRef.state && ref.pageRef.state.c__ban){
        ref.props.customer.interactionDetails.BAN = ref.pageRef.state.c__ban;
        let jslog = {'message':JSON.stringify(ref.props.customer.interactionDetails.BAN)};
            BwcUtils.nebulaLogger(ref.recordId, 'LWC', 'paymentDetailCmpCollapsible', 'ref.props.customer.interactionDetails.BAN', jslog);
            ref.props.updateBAN(ref.props.customer);
    }
    
}
//method to set the tender fields in flowState
export const  handleTenderCardInFlowState = async(ref, cardData)=>
{
    try 
    {
        if(!hasPeripheralAccess)
        {
            await updateTenderVariables(ref, cardData);
        }
    }
    catch (error) 
    {
        BwcUtils.log('Error in Updating Tender Values in Flow State' + JSON.stringify(error));
    }
}

export const updateTenderVariables = async(ref, cardData)=>
{
            if(ref.enrollInAutoPaycheckbox)
            {
                ref.autoPayStatus =  WbbConstants.TenderCardValidate.AUTO_PAY_STATUS.value;
                ref.isAutoBillPaySet = true;
            }
            if(!cardData.isCard)
            {
                ref.tenderType  = WbbConstants.TenderCardValidate.TENDER_TYPE_BANK_ACCOUNT.value;
                //Sending provider type as blank in the case of tender type ACH or Debit Card
                 ref.provideType = '';
                updateTenderValuesInFlowState(ref);
            }
            else
            {
                //Calling Validate api for the CARD
                await getValidateCard(ref, cardData);
            }
}

export const getValidateCard = async(ref, cardData)=>
{
    buildRequestBody(ref, cardData)
    .then((result) => {
        BwcUtils.log("getValidateCard Request:"+ result);
        const res = handleValidateCard(ref, result);   
    })
    .catch((error) => {
        BwcUtils.log("Error in building Request Body "+ JSON.stringify(error));
        BwcUtils.nebulaLogger(ref.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'getValidateCard', error); //nebula logger
    }); 
}
// method to build the request body for Validate Card
export const buildRequestBody = async(ref, cardData)=>
{
    let timeStamp = await getTimeStamp(ref);
    let cardNumber = cardData.cardNumberToken ? cardData.cardNumberToken: cardData.cardNumber;
    ref.merchantRefId = 'SF'+ '-' + timeStamp + '-'+ ref.recordId;
    var reqbody = '{'+
        '"commonData": {'+
            '"appName": "'+WbbConstants.TenderCardValidate.TENDER_APP_NAME.value+'"},'+
        '"paySource": {'+
            '"sourceUser": "'+ref.agentId+'",'+
            '"sourceSystem": "'+WbbConstants.TenderCardValidate.TENDER_SOURCE_SYSTEM.value+'",'+
            '"sourceLocation": "'+WbbConstants.TenderCardValidate.TENDER_SOURCE_LOCATION.value+'"'+
        '},'+
        '"merchantRefCode": "'+ref.merchantRefId+'",'+
        '"paymentMethod": {'+
            '"type": "'+WbbConstants.TenderCardValidate.TENDER_PAYMENT_TYPE.value+'",'+
            '"card": {'+
            '"cardNumber": "'+cardNumber+'"'+
            '}'+
        '}'+
        '}';
    return new Promise((result)=>{
        result(reqbody);
    });
}
//method to call Validate Card API 
export const handleValidateCard = async(ref, jsonRequest)=>
{
    validateCard({recordId: ref.recordId, jsonBody: jsonRequest})
    .then((result) => {
        BwcUtils.log("getValidateCard Response: "+JSON.stringify(result));
            let response = JSON.parse(result);
        //update tenderType
        if(response.content.creditType == 'PD' || response.content.creditType == 'CK')
            {
                ref.tenderType = WbbConstants.TenderCardValidate.TENDER_TYPE_DEBIT_CARD.value;
                ref.updateTenderFlowState = true;
            }
            else if(response.content.creditType == 'CC')
            {
                ref.tenderType = WbbConstants.TenderCardValidate.TENDER_TYPE_CREDIT_CARD.value;
                ref.updateTenderFlowState = true;
            }
            //Update Provide type
            if(response.content.cobrandIndicator ==  WbbConstants.TenderCardValidate.CITY_CARD_INDICATOR_NODE_VALUE.value)
            {
                ref.provideType =  WbbConstants.TenderCardValidate.COBRANDED.value;
            }
            else
            {
                ref.provideType = WbbConstants.TenderCardValidate.NON_COBRANDED.value;
            }
            ref.isAutoBillPaySet = true;
            //call flowstate method to update the Tender fields 
          //Sending provider type as blank in the case of tender type ACH or Debit Card
        if(ref.tenderType ==WbbConstants.TenderCardValidate.TENDER_TYPE_DEBIT_CARD.value)
        {
             ref.provideType = '';
        }


            if(ref.updateTenderFlowState)
            {
                updateTenderValuesInFlowState(ref);
            }
        })
        .catch((error) => {
        BwcUtils.log('getValidateCard Error catch'+ JSON.stringify(error));
        BwcUtils.nebulaLogger(ref.recordId, COMPONENT_TYPE, COMPONENT_NAME, 'handleValidateCard', error); //nebula logger
    });
}
    
export const getTimeStamp = async(ref)=>
{
    // Get the current date and time
    const now = new Date();
    // Format the date and time as yyyyMMddHHmmss
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
    return timestamp;
}

export const showErrorToast = async(ref, msg)=>
{
    const evt = new ShowToastEvent({
        title: "Error",
        message: msg,
        variant: "error",
        mode: "dismissable"
    });
    ref.dispatchEvent(evt);
}

export const updateTenderValuesInFlowState = async(ref)=>
{
    FlowState.upsertFlowStateTenderValue(ref.recordId, ref.tenderType, ref.provideType, ref.autoPayStatus, ref.isAutoBillPaySet);
}

//updating Tender values in Flow state for Existing card
export const  handleTenderCardInFlowStateForExist = async(ref, cardData,paymentMethodType)=>
{
    if(!hasPeripheralAccess)
    {
        if(paymentMethodType.toLowerCase() ==='bankaccount'){
             ref.tenderType = WbbConstants.TenderCardValidate.TENDER_TYPE_BANK_ACCOUNT.value;

        }else{
        BwcUtils.log("Selected card Information ABP: "+cardData);
        if(cardData.trueCreditCardIndicator)
        {
            ref.tenderType =  WbbConstants.TenderCardValidate.TENDER_TYPE_CREDIT_CARD.value;
        }
        else
        {
            ref.tenderType =  WbbConstants.TenderCardValidate.TENDER_TYPE_DEBIT_CARD.value;
        }
        
        if(cardData.cobrandIndicator == WbbConstants.TenderCardValidate.CITY_CARD_INDICATOR_NODE_VALUE.value)
        {
            ref.provideType = WbbConstants.TenderCardValidate.COBRANDED.value;
        }
        else
        {
            ref.provideType = WbbConstants.TenderCardValidate.NON_COBRANDED.value;
            
        }
        }

         //Sending provider type as blank in the case of tender type ACH or Debit Card
        if(ref.tenderType == WbbConstants.TenderCardValidate.TENDER_TYPE_BANK_ACCOUNT.value || ref.tenderType ==WbbConstants.TenderCardValidate.TENDER_TYPE_DEBIT_CARD.value)
        {
             ref.provideType = '';
        }


        if(ref.enrollInAutoPaycheckbox)
        {
            ref.autoPayStatus = WbbConstants.TenderCardValidate.AUTO_PAY_STATUS.value;
            ref.isAutoBillPaySet = true;
        }
        //calling method to update the tender changes into Flowstate
        updateTenderValuesInFlowState(ref);
    }
}
export const handleError = async(ref, error, apiName, section) =>
    {
        let errorCode = error.message ? error.message : error.reasonCode ? error.reasonCode : error.message;
        let errorDetails =await peripheralError(errorCode, apiName);            
        let errorObj = JSON.parse(errorDetails);        
        ref.peripheralErrorMsg = errorObj[0]?.Error_Message__c ? errorObj[0].Error_Message__c : errorObj;
        if (section === 'RC') {
            ref.showPeripheralError = true;
        }
        else {
            ref.showPeripheralErrorOTP = true;
        }

        // Start 290774 RB263, 09/24
        if(!errorCode.match("MSPMT_E")){
            const errorToast = ref.makeToastErrorEvent('Error!', ref.peripheralErrorMsg, 'error');
            const { event } = errorToast;
            ref.dispatchEvent(event);
        }
         // END 290774 RB263, 09/24
    }
    
    export const updatePaymentObject = (ref, data, isDefault) => {
        let paymentProfile = isDefault ? ref.buyFlowPaymentMethod.defaultPaymentProfile : ref.buyFlowPaymentMethod.oneTimePaymentProfile;
        if(paymentProfile === undefined || paymentProfile ==undefined){
            paymentProfile = {};
        }
        let paymentMethodId = (typeof ref.payMethodId === 'string') ? ref.payMethodId : ref.payMethodId?.value;
        if (data.paymentMethodType.toLowerCase() === 'card') {
            const cardData = data.card;
            paymentProfile.paymentType = cardData.cardType || '';
            paymentProfile.paymentNumber = cardData.cardNumber ? cardData.cardNumber.substring(cardData.cardNumber.length - 4) : '';
            paymentProfile.name = cardData.cardHolderName;
            paymentProfile.autoPay = isDefault ? true : false;
            paymentProfile.paymentMethodId = isDefault ? paymentMethodId : ref.OcPayMethodId;
        } else if (data.paymentMethodType.toLowerCase() === 'bankaccount') {
            const bankAccountData = data.bankAccount;
            paymentProfile.paymentType = bankAccountData.accountType || '';
            paymentProfile.paymentNumber = bankAccountData.bankAccountNumber ? bankAccountData.bankAccountNumber.substring(bankAccountData.bankAccountNumber.length - 4) : bankAccountData.accountNumber ? bankAccountData.accountNumber.substring(bankAccountData.accountNumber.length - 4) : '';
            paymentProfile.name = bankAccountData.accountHolderName;
            paymentProfile.autoPay = isDefault ? true : false;
            paymentProfile.paymentMethodId = isDefault ? paymentMethodId : ref.OcPayMethodId;
        }
        return paymentProfile;
         
    }  
//START SPTSLSATT-20214 Call from Connected Callback in Periperal PS
export const setperipheralValueOnLoad = (ref) => {
    if (ref.peripheralParameters && ref.peripheralParameters.paymentPromptType == 'OC' && ref.peripheralParameters.storeOCProfile != 'true') {
        ref.cardInfo = false;
        ref.veriedDisabledOTP = false;
        ref.cvvClass = 'cvvTo';
    }
    if(ref.peripheralParameters.cardDataOC){
        ref.isDisableUseCardRead = true;
    }

    else if(ref.peripheralParameters.cardDataRC){
        ref.isDisableUseCardReadRC = true;
    }

    if ((ref.showPeripheralCard || ref.showPeripheralOcCheck) && !ref.props.peripheralParameters.validateError && !ref.cardCaptured) { //CDEX-308265 ak4124 11/19/24
        const errorObj = ref.makeToastErrorEvent('Success', 'The customer\'s card information was successfully captured.', 'success');
        const { event } = errorObj;
        ref.dispatchEvent(event);
        ref.cardCaptured =true;//CDEX-308265 ak4124 11/19/24 
    }

    if (ref.peripheralParameters?.paymentError == BwcConstants.WBB_PAYMENT_DETAILS_VARIABLE.TRANSCATION_CANCELLED) {
        ref.isDisabled = false;
    }
    if(ref.peripheralParameters && ref.prePaymentCharges != null && ref.prePaymentCharges > 0.00 && (ref.peripheralParameters.paymentPromptType == 'OC' || ref.peripheralParameters.paymentPromptType == 'RC')){
        ref.otp = true;
        ref.isChecked = true;
    }

        ref.isStoreDetailCheckBoxRequiredOtp=false;
        ref.cvvInputSize = ref.peripheralParameters.paymentPromptType == 'RC' ? 3 : 2;
        ref.authButtonSize = ref.peripheralParameters.paymentPromptType == 'RC' ? 3 : 4;
        //ref.changeButtonColourOneTime('card');
        ref.activeTabValueOTP = 'CARDOTP';
        //START	SPTSLSATT-20214

        if(ref.showPeripheralCard || !ref.isRetailBankEnabled)//SPTSLSATT-20214
        {
           //ref.changeButtonColour('card');
           ref.activeTabValue = 'CARD' ;
           ref.cardListValue = false;
           ref.hasPaymentMethod= false;
           ref.isBankSectionRender = false;
        }

        ref.cardListValueOneTime = false;
        ref.accountSelectionOneTimeDisabled=true;
        ref.isStoreOneTimePaymentProfile = (ref.props.peripheralParameters?.storeOCProfile == "true") ? true : false;
        if(!ref.isStoreOneTimePaymentProfile){  
            ref.hideCVV = true;
        }
        if (ref.peripheralParameters && (ref.peripheralParameters.paymentPromptType === 'RC' || ref.peripheralParameters.paymentPromptType === 'OC')) {
            ref.verifyLabel = 'Verify';
            ref.verifyOTPLabel = 'Authorize & Charge Card';
        } else if (ref.peripheralParameters && ref.peripheralParameters.paymentPromptType === 'BOTH') {
            ref.verifyLabel = 'Authorize & Charge Card';
        }

        if(ref.peripheralParameters && ref.peripheralParameters.paymentPromptType)
        {
            setCVVUI(ref);
        }
        if (ref.peripheralParameters && ref.props.peripheralParameters.validateError && ref.peripheralParameters.paymentPromptType !== 'RC') {
            ref.showPeripheralCard = false;
            ref.showPeripheralOcCheck = false;
            let errorMsg = JSON.parse(ref.peripheralParameters.validateError);
            let screenName = ref.peripheralParameters.paymentPromptType === 'BOTH' ? 'RC' : 'OC';
            handleError(ref, errorMsg, errorMsg.apiName, screenName);
        }

        if(ref.isBankSectionRender && (ref.prePaymentCharges>0.00) || (ref.boolProratedCharges)){//SPTSLSATT-20214
            ref.isDisabled=true;
        }
}
//END SPTSLSATT-20214