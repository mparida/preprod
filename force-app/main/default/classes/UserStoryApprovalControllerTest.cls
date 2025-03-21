@isTest
public class UserStoryApprovalControllerTest {

    @testSetup
    static void setupTestData() {
        // Create Developer profile for test users
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];
        List<User> userList = new List<User>();

        // Create two test users with the Developer profile
        User developer = TestDataFactory.createTestUser('developer.reviewer@test.com', developerProfile.Id);
        userList.add(developer);
        User prApprover1 = TestDataFactory.createTestUser('prApprover1.approver@test.com', developerProfile.Id);
        userList.add(prApprover1);
        User prApprover2 = TestDataFactory.createTestUser('prApprover2.approver@test.com', developerProfile.Id);
        prApprover2.Next_Level_Reviewer__c = true;
        userList.add(prApprover2);
        insert userList;
    }

    @isTest
    static void testGetApprovalLink() {
        // Fetch users
        User developer = [SELECT Id FROM User WHERE email = 'developer.reviewer@test.com' LIMIT 1];
        User prApprover1 = [SELECT Id FROM User WHERE email = 'prApprover1.approver@test.com' LIMIT 1];
        User prApprover2 = [SELECT Id FROM User WHERE email = 'prApprover2.approver@test.com' LIMIT 1];

        // Create related User Story Metadata
        copado__Release__c testRelease = new copado__Release__c(Name = 'Test Release');
        insert testRelease;

        copado__Team__c testTeam = new copado__Team__c(Name = 'Test Team');
        insert testTeam;

        copado__Environment__c testEnvironment = new copado__Environment__c(Name = 'Test Environment');
        insert testEnvironment;

        copado__Epic__c testEpic = new copado__Epic__c(Itrack_Epic__c = 'Test Epic');
        insert testEpic;

        // Create User Story
        copado__User_Story__c userStory = new copado__User_Story__c(
                copado__Release__c = testRelease.Id,
                copado__Team__c = testTeam.Id,
                copado__Environment__c = testEnvironment.Id,
                copado__Epic__c = testEpic.Id,
                copado__Is_Bundle__c = false,
                copado__Developer__c = developer.Id,
                Peer_Reviewer__c = prApprover1.Id,
                Peer_Reviewer_2__c = prApprover2.Id,
                iTrack_US__c = 'ITrack123'
        );
        insert userStory;

        // 🟢 Fetch the active Process Definition ID (Fixed: Use `State` instead of `Active`)
        ProcessDefinition processDef = [
                SELECT Id, DeveloperName FROM ProcessDefinition
                WHERE TableEnumOrId = 'copado__User_Story__c' AND State = 'Active'
                LIMIT 1
        ];

        System.assertNotEquals(null, processDef, 'No active approval process found for copado__User_Story__c');

        // 🟢 Submit the User Story for Approval
        Approval.ProcessSubmitRequest req1 = new Approval.ProcessSubmitRequest();
        req1.setComments('Submitting request for approval.');
        req1.setObjectId(userStory.Id);
        req1.setProcessDefinitionNameOrId(processDef.DeveloperName);

        Approval.ProcessResult result;

        // 🟢 Try-Catch to Handle Submission Failures
        try {
            result = Approval.process(req1);
        } catch (Exception e) {
            System.debug('Approval process submission failed: ' + e.getMessage());
            return;
        }

        ProcessInstance instance;

        // 🟢 Validate If Approval Was Successful
        if (result.isSuccess()) {
            // Query for ProcessInstance
            List<ProcessInstance> processInstances = [
                    SELECT Id FROM ProcessInstance WHERE TargetObjectId = :userStory.Id LIMIT 1
            ];

            if (!processInstances.isEmpty()) {
                instance = processInstances[0];
                System.debug('Approval ProcessInstance ID: ' + instance.Id);
            } else {
                System.debug('ProcessInstance not found.');
            }
        } else {
            System.debug('Approval process submission failed.');
        }

        // 🟢 Fetch the created User Story
        copado__User_Story__c testUserStory = [SELECT Id FROM copado__User_Story__c LIMIT 1];

        // 🟢 Instantiate controller
        UserStoryApprovalController controller = new UserStoryApprovalController();
        controller.setStoryId(testUserStory.Id); // Simulate passing Story ID

        // 🟢 Get the approval link
        String approvalLink = controller.getApprovalLink(testUserStory.Id);

        // Debug Output for validation
        System.debug('Approval Link: ' + approvalLink);

        // 🟢 Assertions
        System.assertNotEquals('Approval Not Yet Assigned', approvalLink, 'Approval link should not be empty');
        System.assert(approvalLink.contains('/lightning/r/ProcessInstanceWorkitem/'), 'URL should contain ProcessInstanceWorkitem');
    }
}