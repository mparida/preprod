@isTest
private class JSONReaderTest {

    @isTest
    static void testReadJson() {
        // Create test data
        copado__User_Story__c userStory = new copado__User_Story__c(); // Insert any required fields for copado__User_Story__c
        insert userStory;

        copado__JobStep__c jobStep = new copado__JobStep__c(copado__UserStory__c  = userStory.Id, copado__ExecutionSequence__c = 'after',copado__Type__c = 'Function',
                                                            copado__ConfigJson__c = '{"instructions":"Test instructions","parameters":[{"name":"Param1","value":"Value1"}],"runOnValidationDeployment":true}');
        insert jobStep;

        // Call the method to be tested
        Test.startTest();
        JSONReader.readJson(new List<Id>{jobStep.Id});
        Test.stopTest();

        // Retrieve the updated job step record
        jobStep = [SELECT Steps_to_execute__c FROM copado__JobStep__c WHERE Id = :jobStep.Id];

        // Assert the changes made by the method
        System.assertEquals('Test instructions', jobStep.Steps_to_execute__c, 'Instructions should be updated');
    }

    @isTest
    static void testReadJson_DmlException() {
        // Create test data
        copado__User_Story__c userStory = new copado__User_Story__c(); // Insert any required fields for copado__User_Story__c
        insert userStory;

        copado__JobStep__c jobStep = new copado__JobStep__c(copado__UserStory__c  = userStory.Id, copado__ExecutionSequence__c = 'after',copado__Type__c = 'Function',
                                                            copado__ConfigJson__c = '{"instructions":"Test instructions","parameters":[{"name":"Param1","value":"Value1"}],"runOnValidationDeployment":true}');
        insert jobStep;

        // Cause DML exception by updating job step record with null instructions
        jobStep.Steps_to_execute__c = null;
        update jobStep;

        // Call the method to be tested
        Test.startTest();
        List<copado__JobStep__c> result = JSONReader.readJson(new List<Id>{jobStep.Id});
        Test.stopTest();

        // Assert the DML exception
        System.assertEquals(1, result.size(), 'Result size should be 1');
    }
}