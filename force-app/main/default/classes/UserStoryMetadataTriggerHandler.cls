/**
 * Created by mp1863 on 23/10/24.
 */

public class UserStoryMetadataTriggerHandler {

    public static void adErrorIfCommittedFromCLIAndNotify(List<copado__User_Story_Metadata__c> newList){
        List <NotificationEvent__e> listEbents = new List <NotificationEvent__e>();
        Id currentUserId = UserInfo.getUserId();
        for(copado__User_Story_Metadata__c ustMeta : newList){
            NotificationEvent__e event = new NotificationEvent__e(
                    UserId__c = currentUserId,
                    Title__c = 'CLI Commit Error',
                    Message__c = 'Attention!! \n' +
                            'The metadata cannot be saved since it ' +
                            'was comitted from CLI : \n' +
                            ''+ustMeta.Name,
                    Variant__c = 'Error'
            );
            listEbents.add(event);
            //ustMeta.addError('The metadata cannot be saved since it was comitted from CLI');
        }
        NotificationService.sendBulkNotification(listEbents);
        for(copado__User_Story_Metadata__c ustMeta : newList){
            ustMeta.addError('The metadata cannot be saved since it was comitted from CLI');
        }
    }
}