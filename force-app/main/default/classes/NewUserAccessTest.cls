/**
 * Created by mp1863 on 10/12/24.
 */
@IsTest
public with sharing class NewUserAccessTest {
    @TestSetup
    static void setup() {
        // Setup test data
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment');
        insert org;

        ACC_Environment_Access__c accessRecord = new ACC_Environment_Access__c(
                ATT_Email__c = 'testuser@att.com',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
                Replicate_UserName__c = 'replicateuser@att.com',
                Environment_Name__c = org.Id
        );
        insert accessRecord;
    }
    @IsTest
    static void testProvisionAccessForNewUser() {
        // Mock HTTP responses
        //Test.setMock(HttpCalloutMock.class, new NewUserAccessProvisioningManagerMock());

        List<String> recordIds = new List<String>{
                [SELECT Id FROM ACC_Environment_Access__c LIMIT 1].Id
        };
        /*
        Test.startTest();
        //NewUserAccessProvisioningManager.provisionAccessForNEwUser(recordIds);
        Test.stopTest();

        // Validate changes to the access record
        ACC_Environment_Access__c updatedAccess = [
                SELECT Access_Delivered__c, Access_Provisioning_Complete__c, Executed_by_Devops__c
                FROM ACC_Environment_Access__c
                WHERE Id = :recordIds[0]
        ];
        System.assert(updatedAccess.Access_Delivered__c, 'Access should be marked as delivered.');
        System.assert(updatedAccess.Access_Provisioning_Complete__c, 'Access provisioning should be marked as complete.');
        System.assert(updatedAccess.Executed_by_Devops__c, 'Executed_by_Devops should be true.');*/
    }
}