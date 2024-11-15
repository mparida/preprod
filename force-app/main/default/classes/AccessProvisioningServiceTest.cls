@isTest
public class AccessProvisioningServiceTest {
    
    @testSetup
    static void setup() {
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
    static void testProvisionAccessFromFlow() {
        // Set up the mock
        Test.setMock(HttpCalloutMock.class, new AccessProvisioningMock());

        // Collect test record ID
        List<Id> accessRecordIds = new List<Id>();
        for (ACC_Environment_Access__c record : [SELECT Id FROM ACC_Environment_Access__c LIMIT 1]) {
            accessRecordIds.add(record.Id);
        }

        Test.startTest();
        AccessProvisioningService.provisionAccessFromFlow(accessRecordIds);
        Test.stopTest();

        // Verify updates
        ACC_Environment_Access__c updatedRecord = [SELECT Access_Delivered__c, End_Time__c FROM ACC_Environment_Access__c LIMIT 1];
        System.assertEquals(true, updatedRecord.Access_Delivered__c, 'Expected Access_Delivered__c to be true');
        System.assertNotEquals(null, updatedRecord.End_Time__c, 'Expected End_Time__c to be set');
    }
}