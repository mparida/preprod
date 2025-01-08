/**
 * Created by mp1863 on 23/10/24.
 */

public class UserStoryMetadataTriggerHandler {

    public static void adErrorIfCommittedFromCLIAndNotify(List<copado__User_Story_Metadata__c> newList){
        List <NotificationEvent__e> listEbents = new List <NotificationEvent__e>();
        List <copado__User_Story_Metadata__c> addErrorList = new List <copado__User_Story_Metadata__c>();
        Id currentUserId = UserInfo.getUserId();
        for(copado__User_Story_Metadata__c ustMeta : newList){
            Boolean hasDisallowedPattern = false;
            for (String pattern : Bwc_Constants.disallowedPatterns) {
                if (ustMeta.copado__ModuleDirectory__c != null &&
                        ustMeta.copado__ModuleDirectory__c.contains(pattern)) {
                    hasDisallowedPattern = true;
                    break;
                }
            }
            if(hasDisallowedPattern && !ustMeta.copado__ModuleDirectory__c.contains(Bwc_Constants.requiredPhrase)){
                System.debug(ustMeta.copado__Metadata_API_Name__c + '---'+ustMeta.copado__ModuleDirectory__c );
                NotificationEvent__e event = new NotificationEvent__e(
                        UserId__c = currentUserId,
                        RecordId__c = ustMeta.copado__User_Story__c,
                        Title__c = 'CLI Commit Error',
                        Message__c = 'A restricted metadata type was mistakenly committed through the CLI : \n' +
                                'User Story Name: ' + ustMeta.User_Story_Name__c + '\n' +
                                'Metadata Name : '+ustMeta.Name,
                        Variant__c = 'Error'
                );
                listEbents.add(event);
                addErrorList.add(ustMeta);
            }
        }
        NotificationService.sendBulkNotification(listEbents);
        for(copado__User_Story_Metadata__c ustMeta : addErrorList){
            ustMeta.Wrong_CLI_Commit__c = true;
            //ustMeta.addError('The metadata cannot be saved since it was comitted from CLI');
        }
    }
}