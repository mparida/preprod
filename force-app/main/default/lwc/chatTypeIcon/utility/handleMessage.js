//engagement = web | apple | google
import { chatType } from "./constant";
export const setChatTypeLogo = (isAsync, engagementtype, thisLwc, action) =>
{
    
    switch (engagementtype)
    {
        case 'web':
            thisLwc.chatType = action === 'engaged' ? chatType.ASYNC_CHAT : chatType.ASYNC_CHAT_INACTIVE;
            break;
        case 'apple':
            thisLwc.chatType = action === 'engaged' ? chatType.APPLE_CHAT : chatType.APPLE_CHAT_INACTIVE;
            break;
        case chatType.SYNC_CHAT :
            thisLwc.chatType = chatType.SYNC_CHAT;
            break;
        case  chatType.SYNC_CHAT_INACTIVE :
            thisLwc.chatType = chatType.SYNC_CHAT_INACTIVE;
            break;
        default:
            thisLwc.chatType = chatType.SYNC_CHAT
            break;
    }
}