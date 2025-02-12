/**
 * Created by mp1863 on 26/01/25.
 */

public class AccessRetrievalController {

    @InvocableMethod(label='Get User Details' description='Returns the details of replicate User.' category='user')
    public static void getProfileNameOfReplicateUser(List<String> usernames) {
        String params = usernames.get(0);
        System.debug('PRINT VAR IDs :'+params);
        String[] VarIds;
        if(params != null && params.contains('#')) {
            VarIds = params.split('#');
        }
        String userName = VarIds[0];
        String namedCredentialName = VarIds[1];
        String id  =VarIds[2];
        String groupId  =VarIds[3];
        getProfileName(id, namedCredentialName, userName, groupId);

    }

    @future(callout=true)
    public static void getProfileName(String accessRecordId, String namedCredentialName, String replicateUserName, String groupId){
        System.debug('accessRecordId:::'+accessRecordId);
        Map<String, String> accessDetails = NewUserAccessProvisioningManager.getUserAccessDetails(namedCredentialName, replicateUserName);
        System.debug('accessDetails::::'+accessDetails);
        String profileName = !String.isEmpty(accessDetails.get('ProfileName') ) ?  accessDetails.get('ProfileName') : '';
        System.debug('Test callout error::'+profileName);
        try {
            ACC_Environment_Access__c record = [SELECT Id, Replicate_User_Profile__c FROM ACC_Environment_Access__c WHERE Id = :accessRecordId LIMIT 1];
            record.Replicate_User_Profile__c = profileName;
            record.OwnerId = groupId;
            update record;
        } catch (Exception e) {
            System.debug('Exception in  getProfileName:'+e.getMessage());
        }
    }
}