public class AccessRemovalService {

    @InvocableMethod(label='Complete Access Provisioning' description='Method to revert Access')
    public static void revertAccessForUser(List<Id> accessRecordIds) {
        for (Id accessRecordId : accessRecordIds) {
            revertAccessForUserAsyn(accessRecordId);
        }
    }

    @future(callout=true)
    public static void revertAccessForUserAsyn(Id accessRecordId) {
        revertAccessForUser(accessRecordId);
    }

    public static void revertAccessForUser(String accessRecordId) {
        ACC_Environment_Access__c accessRecord;
        try{
            accessRecord = [SELECT User_Id__c, Prior_Profile__c, Prior_PS_Assignment__c , Environment_Name__r.name, Access_Provisioning_Complete__c 
                                                      FROM ACC_Environment_Access__c WHERE Id = :accessRecordId];
    
            String namedCredentialName = accessRecord.Environment_Name__r.name;
            TargetOrgAccessManager.setUserProfileAndPermissions(namedCredentialName, accessRecord.User_Id__c, accessRecord.Prior_Profile__c,accessRecord.Prior_PS_Assignment__c );
            accessRecord.Access_Provisioning_Complete__c = true;
            update accessRecord;
            //Approval.LockResult lockResult = Approval.lock(accessRecord);
        }catch(Exception e){
            System.debug('Exception message: ' + e.getMessage());
            System.debug('Exception thrown while reverting User access: ' + e.getStackTraceString());
            throw new UserStoryException('Exception while reverting the user access for the user');
        }
    }
}