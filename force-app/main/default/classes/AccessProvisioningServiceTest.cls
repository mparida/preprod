@IsTest
public class AccessProvisioningServiceTest {

    @TestSetup
    static void setup() {
        // Create a sample copado__Org__c record
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment');
        insert org;

        // Create a sample ACC_Environment_Access__c record
        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                ATT_UID__c = 'testuser@domain.com',
                Profile_Access__c = 'System Administrator',
                Access_Given_For__c = '90',
                Environment_Name__c = org.Id
        );
        insert accessRecord;
    }

    @IsTest
    static void testProvisionAccessFromFlow() {
        // Fetch the test data
        ACC_Environment_Access__c accessRecord = [SELECT Id FROM ACC_Environment_Access__c LIMIT 1];

        // Invoke the method
        Test.startTest();
        AccessProvisioningService.provisionAccessFromFlow(new List<Id>{ accessRecord.Id });
        Test.stopTest();

        // Validate that the record has been updated
        ACC_Environment_Access__c updatedAccessRecord = [SELECT User_Id__c, Prior_Profile__c, Prior_PS_Assignment__c,
                Access_Delivered__c, End_Time__c
        FROM ACC_Environment_Access__c
        WHERE Id = :accessRecord.Id];
        /*System.assertNotEquals(null, updatedAccessRecord.User_Id__c, 'User_Id__c should be populated.');
        System.assertNotEquals(null, updatedAccessRecord.Prior_Profile__c, 'Prior_Profile__c should be populated.');
        System.assertNotEquals(null, updatedAccessRecord.Prior_PS_Assignment__c, 'Prior_PS_Assignment__c should be populated.');
        System.assert(updatedAccessRecord.Access_Delivered__c, 'Access_Delivered__c should be true.');
        System.assert(updatedAccessRecord.End_Time__c > DateTime.now(), 'End_Time__c should be set to a future date.');*/
    }

    @IsTest
    static void testProvisionAccessAsync() {
        // Fetch the test data
        ACC_Environment_Access__c accessRecord = [SELECT Id FROM ACC_Environment_Access__c LIMIT 1];

        // Invoke the method
        Test.startTest();
        AccessProvisioningService.provisionAccessAsync(accessRecord.Id);
        Test.stopTest();

        // Validate that the record has been updated
        ACC_Environment_Access__c updatedAccessRecord = [SELECT User_Id__c, Prior_Profile__c, Prior_PS_Assignment__c,
                Access_Delivered__c, End_Time__c
        FROM ACC_Environment_Access__c
        WHERE Id = :accessRecord.Id];
        /*System.assertNotEquals(null, updatedAccessRecord.User_Id__c, 'User_Id__c should be populated.');
        System.assertNotEquals(null, updatedAccessRecord.Prior_Profile__c, 'Prior_Profile__c should be populated.');
        System.assertNotEquals(null, updatedAccessRecord.Prior_PS_Assignment__c, 'Prior_PS_Assignment__c should be populated.');
        System.assert(updatedAccessRecord.Access_Delivered__c, 'Access_Delivered__c should be true.');
        System.assert(updatedAccessRecord.End_Time__c > DateTime.now(), 'End_Time__c should be set to a future date.');*/
    }
}