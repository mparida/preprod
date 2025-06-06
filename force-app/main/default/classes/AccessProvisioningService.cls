public with sharing class AccessProvisioningService {

    @InvocableMethod(label='Provision Access' description='Provision access for a given access record')
    public static void provisionAccessFromFlow(List<Id> accessRecordIds) {
        for (Id accessRecordId : accessRecordIds) {
            provisionAccessAsync(accessRecordId);
        }
    }
    
    @future(callout=true)
    public static void provisionAccessAsync(Id accessRecordId) {
        provisionAccess(accessRecordId);
provisionAccess(accessRecordId);
    }

    public static void provisionAccess(String accessRecordId) {
        ACC_Environment_Access__c accessRecord = [SELECT ATT_UID__c, Profile_Access__c, Access_Given_For__c , Environment_Name__r.name
                                                  FROM ACC_Environment_Access__c WHERE Id = :accessRecordId];

        String namedCredentialName = accessRecord.Environment_Name__r.name;
        System.debug(namedCredentialName+ '---'+accessRecord.ATT_UID__c);
        Map<String, String> userDetails = new Map<String, String>();
        if(!Test.isRunningTest()){
            userDetails = TargetOrgAccessManager.getUserByFederationIdentifier(namedCredentialName, accessRecord.ATT_UID__c);
        }
        if (userDetails == null) {
            System.debug('Error: User with Federation Identifier not found in target org.');
            return;
        }
        String userId = userDetails.get('Id');
        String userEmail = userDetails.get('Email');
        String profileId = '';
        if(!Test.isRunningTest()){
            profileId  = TargetOrgAccessManager.getProfileIdByName(namedCredentialName, accessRecord.Profile_Access__c);
        }
        if (profileId == null) {
            System.debug('Error: Profile with specified name not found in target org.');
            return;
        }
        Map<String, Object> priorInfo = new Map<String, Object>();
        if(!Test.isRunningTest()){
            priorInfo  = TargetOrgAccessManager.getUserProfileAndPermissions(namedCredentialName, userId);
        }

        String priorProfileId =  priorInfo.get('ProfileId') != null ? (String)priorInfo.get('ProfileId') : '';
        String priorPermissionSets = (String) priorInfo.get('PermissionSetIds');
        String priorPermissionSetGroup = (String) priorInfo.get('PermissionSetGroupIds');
        String priorPermissionSetLicenses = (String) priorInfo.get('PermissionSetLicenseIds');
        if(!Test.isRunningTest()){
            //TargetOrgAccessManager.setUserProfileAndPermissions(namedCredentialName, userId, profileId, priorPermissionSets);
            TargetOrgAccessManager.changeProfile(namedCredentialName, userId, profileId);
        }
        accessRecord.User_Id__c = userId;
        accessRecord.Prior_Profile__c = priorProfileId;
        accessRecord.Prior_PS_Assignment__c = priorPermissionSets;
        accessRecord.Prior_PSG_Assigments__c = priorPermissionSetGroup;
        accessRecord.Prior_PSLicense_Assignment_Ids__c = priorPermissionSetLicenses;
        accessRecord.Access_Delivered__c = true;
        Decimal days = Decimal.valueOf(accessRecord.Access_Given_For__c);
        DateTime now = DateTime.now();
        DateTime futureDateTime = days < 1.0 ? now.addHours (Integer.valueOf(days*24)): now.addDays(Integer.valueOf(accessRecord.Access_Given_For__c) );
        //accessRecord.End_Time__c  = futureDateTime;
        accessRecord.End_Time__c = DateTime.now().addMinutes(1);
        accessRecord.ATT_Email__c = userEmail;
        if(!Test.isRunningTest()){
            update accessRecord;
        }
    }
}
