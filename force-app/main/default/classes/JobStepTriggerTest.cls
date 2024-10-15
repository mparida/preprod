@isTest
public class JobStepTriggerTest {
    @testSetup
    static void setupTestData() {
        // Create test data: User
        Profile p = [SELECT Id FROM Profile WHERE Name='Developer' LIMIT 1];
        User testUser = new User(Alias = 'standt', Email='attdeveloperuser@att.com',
                                  EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US',
                                  LocaleSidKey='en_US', ProfileId = p.Id,
                                  TimeZoneSidKey='America/Los_Angeles', UserName='attdeveloperuser@att.com');
        insert testUser;
    }
    @isTest
    static void testUpdateApproverInJobStep() {
        User user1 = [SELECT Id FROM User WHERE UserName='attdeveloperuser@att.com'];
        // Create test data: JobStep
        copado__User_Story__c userStory = new copado__User_Story__c();
        insert userStory;

        copado__JobStep__c jobStep = new copado__JobStep__c(copado__UserStory__c  = userStory.Id, copado__ExecutionSequence__c = 'after',
                                                            copado__Type__c = 'Function',
                                                            copado__ConfigJson__c = '{"instructions":"Test instructions","parameters":[{"name":"Param1","value":"Value1"}],"runOnValidationDeployment":true}');
        insert jobStep;
        
        Approval.ProcessSubmitRequest req1 = new Approval.ProcessSubmitRequest();
        req1.setComments('Submitting request for approval.');
        req1.setObjectId(jobStep.id);
        req1.setProcessDefinitionNameOrId('ATT_Service_PD_Steps_Approval');
        Approval.ProcessResult result = Approval.process(req1);
        ProcessInstance instance;
        if(result.isSuccess()) {
            // Query for ProcessInstance
            List<ProcessInstance> processInstances = [SELECT Id FROM ProcessInstance WHERE TargetObjectId = :jobStep.Id LIMIT 1];
            if(!processInstances.isEmpty()) {
                instance = processInstances[0];
            } else {
                System.debug('ProcessInstance not found.');
            }
        } else {
            System.debug('Approval process submission failed.');
        }
        
        // Call the method to be tested
        Test.startTest();
        JobStepTriggerHandler.updateApproverInJobStep(new List<Id>{jobStep.Id});
        Test.stopTest();
    }
    
    @isTest
    static void testJobStepTrigger() {
        copado__User_Story__c userStory = new copado__User_Story__c();
        insert userStory;

        copado__JobStep__c jobStep = new copado__JobStep__c(copado__UserStory__c  = userStory.Id, copado__ExecutionSequence__c = 'after',copado__Type__c = 'Function',
                                                            Record_Approved__c = true,
                                                            copado__ConfigJson__c = '{"instructions":"Test instructions","parameters":[{"name":"Param1","value":"Value1"}],"runOnValidationDeployment":true}');
        insert jobStep;
        Test.startTest();
        Test.stopTest();
        jobStep = [SELECT Deployment_Step_Approver__c FROM copado__JobStep__c WHERE Id = :jobStep.Id];
    }
}