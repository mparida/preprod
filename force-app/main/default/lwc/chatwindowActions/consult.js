import {
      DISABLE_COACHING_REQUEST, 
      ENABLE_COACHING_REQUEST,
      DISABLE_ONGOING_CONSULT_REQUEST,
      ENABLE_ONGOING_CONSULT_REQUEST} from 'c/chatwindowConstant';
export const disableCoachingRequest = ()=> {
    return {
       type: DISABLE_COACHING_REQUEST
    }
 }
 export const enableCoachingRequest = () => {
    return {
       type: ENABLE_COACHING_REQUEST
    }
 }


 export const disableOngoingConsultRequest = () => {
   return {
      type: DISABLE_ONGOING_CONSULT_REQUEST
   }
 }
 export const enableOngoingConsultRequest = () => {
   return {
      type: ENABLE_ONGOING_CONSULT_REQUEST
   }
 }