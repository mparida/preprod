import { CHAT_STATUS } from "c/chatwindowConstant";

const initialState = { 
    chatStatus : null,
}


const chat = (state = initialState, action) =>{
    switch (action.type)
    {
        case CHAT_STATUS.COMPLETE:
            return {
                ...state,
                chatStatus: CHAT_STATUS.COMPLETE
            }
        case CHAT_STATUS.INPROGRESS:
            return {
                ...state,
                chatStatus: CHAT_STATUS.INPROGRESS
            }
        default: return state;
    }
}
export default chat;