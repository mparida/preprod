@isTest
public class TargetOrgAccessManagerTest {
    
    @testSetup
    static void setup() {
        // Setup test data
        copado__Org__c org = new copado__Org__c(Name = 'ACCUAT');
        insert org;

        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
            ATT_UID__c = 'testuser@domain.com',
            Profile_Access__c = 'System Administrator',
            Access_Given_For__c = '5',
            Environment_Name__c = org.Id
        );
        insert accessRecord;
    }
    
    @isTest
    static void testGetUserByFederationIdentifier() {
        // Apply the mock before making any callouts
        Test.setMock(HttpCalloutMock.class, new TargetOrgAccessManagerMock());

        Test.startTest();
        HttpResponse res = TargetOrgAccessManager.getUserByFederationIdentifier1('ACCUAT', 'testuser@domain.com');
        Test.stopTest();

        //System.assertEquals('005000000000001', userId, 'Expected user ID to match mocked response');
    }
    
    /*@isTest
    static void testGetProfileIdByName() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new AccessProvisioningMock());

        String profileId = TargetOrgAccessManager.getProfileIdByName('ACCUAT', 'System Administrator');
        Test.stopTest();

        System.assertEquals('00e000000000001', profileId, 'Expected profile ID to match mocked response');
    }
    
    @isTest
    static void testGetUserProfileAndPermissions() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new AccessProvisioningMock());

        Map<String, Object> userInfo = TargetOrgAccessManager.getUserProfileAndPermissions('ACCUAT', '005000000000001');
        Test.stopTest();

        System.assertEquals('0PS000000000001', userInfo.get('PermissionSetIds'), 'Expected PermissionSetIds to match mocked response');
        System.assertEquals('00e000000000001', userInfo.get('ProfileId'), 'Expected ProfileId to match mocked response');
    }
    
    @isTest
    static void testSetUserProfileAndPermissions() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new AccessProvisioningMock());

        TargetOrgAccessManager.setUserProfileAndPermissions('ACCUAT', '005000000000001', '00e000000000001', '0PS000000000001');
        Test.stopTest();

        // No exception expected and mock should handle responses
        System.assert(true, 'The method completed successfully with mock responses');
    }*/
}