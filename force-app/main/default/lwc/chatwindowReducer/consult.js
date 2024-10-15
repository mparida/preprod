import {
    DISABLE_COACHING_REQUEST, 
    ENABLE_COACHING_REQUEST,
    DISABLE_ONGOING_CONSULT_REQUEST,
    ENABLE_ONGOING_CONSULT_REQUEST} from 'c/chatwindowConstant';

const initialState = {
    disabledCoachingRequest: false,
    isConsultRequestOngoing: false,
};


const consult = (state = initialState, action) =>{
    switch (action.type)
    {
        case ENABLE_COACHING_REQUEST:
            return {
                ...state,
                disabledCoachingRequest: false
            };
        case DISABLE_COACHING_REQUEST:
            return {
                ...state,
                disabledCoachingRequest: true
            }
        case DISABLE_ONGOING_CONSULT_REQUEST:
            return {
                ...state,
                isConsultRequestOngoing:false
            }
        case ENABLE_ONGOING_CONSULT_REQUEST:
            return {
                ...state,
                isConsultRequestOngoing:true
            }
        default: return state;
    }
}
export default consult;