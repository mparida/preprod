@IsTest
public class AccessRequestControllerTest {
    @TestSetup
    static void setup() {
        // Create test data for copado__Org__c
        copado__Org__c org = new copado__Org__c(Name = 'TestEnvironment1');
        insert org;
    }

    @IsTest
    static void testGetEnvironmentOptions() {
        AccessRequestController controller = new AccessRequestController();

        // Call the method
        List<SelectOption> options = controller.getEnvironmentOptions();
        System.assertEquals('Select', options[0].getValue(), 'First option should be Select.');
    }

    @IsTest
    static void testSaveAccessRequest() {
        AccessRequestController controller = new AccessRequestController();
        controller.selectedEnvironmentId = 'TestEnvironment1';
        controller.accessRequest.ATT_UID__c = 'testuser';
        controller.accessRequest.Profile_Access__c = 'Test Profile';
        controller.accessRequest.ATT_Email__c = 'testuser@att.com';

        Test.startTest();
        controller.saveAccessRequest();
        Test.stopTest();
    }

    @IsTest
    static void testSaveAccessRequestValidationFailure() {
        AccessRequestController controller = new AccessRequestController();
        controller.selectedEnvironmentId = 'Select'; // Invalid selection
        controller.accessRequest.ATT_UID__c = 'testuser';
        controller.accessRequest.Profile_Access__c = 'Test Profile';
        controller.accessRequest.ATT_Email__c = 'invalidemail.com'; // Invalid email

        Test.startTest();
        controller.saveAccessRequest();
        Test.stopTest();

        // Validate that errors were added to the page
        System.assertEquals(2, ApexPages.getMessages().size(), 'Validation errors should be present.');
    }

    @IsTest
    static void testSaveCreateAccessRequest() {
        AccessRequestController controller = new AccessRequestController();
        controller.selectedEnvironmentId = 'TestEnvironment1';
        controller.accessRequest.First_Name__c = 'John';
        controller.accessRequest.Last_Name__c = 'Doe';
        controller.accessRequest.ATT_Email__c = 'johndoe@att.com';
        controller.accessRequest.Replicate_UserName__c = 'replicateuser@att.com.devint';

        Test.startTest();
        controller.saveCreateAccessRequest();
        Test.stopTest();

        // Validate that the record was created
        ACC_Environment_Access__c createdRecord = [SELECT Id, Environment_Name__c FROM ACC_Environment_Access__c WHERE ATT_Email__c = 'johndoe@att.com' LIMIT 1];
        System.assertNotEquals(null, createdRecord, 'Access request for user creation should be created.');
    }

    @IsTest
    static void testSaveCreateAccessRequestValidationFailure() {
        AccessRequestController controller = new AccessRequestController();
        controller.selectedEnvironmentId = 'Select'; // Invalid selection
        controller.accessRequest.First_Name__c = 'John';
        controller.accessRequest.Last_Name__c = 'Doe';
        controller.accessRequest.ATT_Email__c = 'invalidemail.com'; // Invalid email
        controller.accessRequest.Replicate_UserName__c = 'replicateuser';

        Test.startTest();
        controller.saveCreateAccessRequest();
        Test.stopTest();

        // Validate that errors were added to the page
        System.assertEquals(3, ApexPages.getMessages().size(), 'Validation errors should be present.');
    }

    @IsTest
    static void testValidateFields() {
        AccessRequestController controller = new AccessRequestController();

        // Case: Invalid Environment
        controller.selectedEnvironmentId = 'Select';
        controller.accessRequest.ATT_UID__c = 'testuser';
        controller.accessRequest.Profile_Access__c = 'Test Profile';
        controller.accessRequest.ATT_Email__c = 'testuser@att.com';
        Test.startTest();
        controller.saveAccessRequest();
        Test.stopTest();

        // Case: Missing ATT_UID__c
        controller.selectedEnvironmentId = 'TestEnvironment1';
        controller.accessRequest.ATT_UID__c = null; // Missing
        controller.saveAccessRequest();

        // Case: Missing Profile_Access__c
        controller.accessRequest.ATT_UID__c = 'testuser';
        controller.accessRequest.Profile_Access__c = null; // Missing
        controller.saveAccessRequest();

        // Case: Invalid ATT_Email__c
        controller.accessRequest.Profile_Access__c = 'Test Profile';
        controller.accessRequest.ATT_Email__c = 'invalidemail.com'; // Invalid
        controller.saveAccessRequest();
    }
    @IsTest
    static void testValidateCreateAccessFields() {
        AccessRequestController controller = new AccessRequestController();

        // Case: Invalid Environment
        controller.selectedEnvironmentId = 'Select';
        controller.accessRequest.First_Name__c = 'John';
        controller.accessRequest.Last_Name__c = 'Doe';
        controller.accessRequest.ATT_Email__c = 'johndoe@att.com';
        controller.accessRequest.Replicate_UserName__c = 'replicateuser';
        Test.startTest();
        controller.saveCreateAccessRequest();
        Test.stopTest();
        System.assertEquals(2, ApexPages.getMessages().size(), 'Environment validation should fail.');

        // Case: Missing First_Name__c
        controller.selectedEnvironmentId = 'TestEnvironment1';
        controller.accessRequest.First_Name__c = null; // Missing
        controller.saveCreateAccessRequest();

        // Case: Missing Last_Name__c
        controller.accessRequest.First_Name__c = 'John';
        controller.accessRequest.Last_Name__c = null; // Missing
        controller.saveCreateAccessRequest();

        // Case: Invalid ATT_Email__c
        controller.accessRequest.Last_Name__c = 'Doe';
        controller.accessRequest.ATT_Email__c = 'invalidemail.com'; // Invalid
        controller.saveCreateAccessRequest();

        // Case: Missing Replicate_UserName__c
        controller.accessRequest.ATT_Email__c = 'johndoe@att.com';
        controller.accessRequest.Replicate_UserName__c = null; // Missing
        controller.saveCreateAccessRequest();
    }

    @IsTest
    public static void testIsValidUsername() {
        System.assert(AccessRequestController.isValidUsername('la3386@attone.com.accint') == true, 'Valid accint username');
        System.assert(AccessRequestController.isValidUsername('kd472h@attone.com.devint') == true, 'Valid devint username');
        System.assert(AccessRequestController.isValidUsername('cr4180@att.com.releaseqa') == true, 'Valid releaseqa username');
        System.assert(AccessRequestController.isValidUsername('ab1234@attone.com.prod') == true, 'Valid prod username');
        System.assert(AccessRequestController.isValidUsername('zz9876@attone.com.uat') == true, 'Valid uat username');
        System.assert(AccessRequestController.isValidUsername('la3386@attone.com.') == false, 'Invalid: missing suffix');
        System.assert(AccessRequestController.isValidUsername('invaliduser') == false, 'InValid username format');
    }

}