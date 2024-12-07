/**
 * Created by mp1863 on 06/12/24.
 */

@isTest
public class CopadoUserStoryTriggerTest {
    // Static variables to hold reusable IDs
    static Id copadoOrgId;
    static Id parentUserStoryId;

    @testSetup
    static void setupData() {
        // Create copado__Org__c record
        copado__Org__c copadoOrg = new copado__Org__c(
                Name = 'Test Org'
        );
        insert copadoOrg;
        copadoOrgId = copadoOrg.Id;

        // Create a parent User Story for cloning
        copado__User_Story__c parentUserStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = 'ITrack123'
        );
        insert parentUserStory;
        parentUserStoryId = parentUserStory.Id;
    }

    @isTest
    static void testPerformUSTVersioning() {
        // Clone the parent User Story (mocking cloning behavior)
        copado__User_Story__c clonedUserStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = null
        );
        insert clonedUserStory;

        // Mock cloning by manually setting the getCloneSourceId behavior
        Test.startTest();
        clonedUserStory = [SELECT Id FROM copado__User_Story__c WHERE Id = :clonedUserStory.Id];
        clonedUserStory.put('getCloneSourceId', parentUserStoryId); // Mock the clone source
        update clonedUserStory;
        Test.stopTest();

        // Verify the iTrack_US__c field is correctly versioned
        clonedUserStory = [SELECT Id, iTrack_US__c FROM copado__User_Story__c WHERE Id = :clonedUserStory.Id];
        System.assert(clonedUserStory.iTrack_US__c.startsWith('ITrack123_v'), 'The iTrack_US__c should be versioned correctly.');
    }

    @isTest
    static void testAssignParent() {
        // Clone another User Story (mocking cloning behavior)
        copado__User_Story__c clonedUserStory = new copado__User_Story__c(
                copado__Org_Credential__c = copadoOrgId,
                iTrack_US__c = null
        );
        insert clonedUserStory;

        // Mock cloning by manually setting the getCloneSourceId behavior
        Test.startTest();
        clonedUserStory = [SELECT Id FROM copado__User_Story__c WHERE Id = :clonedUserStory.Id];
        clonedUserStory.put('getCloneSourceId', parentUserStoryId); // Mock the clone source
        update clonedUserStory;
        Test.stopTest();

        // Verify that the Team Dependency is created correctly
        List<copado__Team_Dependency__c> dependencies = [
                SELECT Id, copado__Provider_User_Story__c, copado__Dependent_User_Story__c
                FROM copado__Team_Dependency__c
                WHERE copado__Dependent_User_Story__c = :clonedUserStory.Id
        ];

        System.assertEquals(1, dependencies.size(), 'There should be one Team Dependency created.');
        System.assertEquals(parentUserStoryId, dependencies[0].copado__Provider_User_Story__c, 'The Provider User Story should match the parent.');
        System.assertEquals(clonedUserStory.Id, dependencies[0].copado__Dependent_User_Story__c, 'The Dependent User Story should match the cloned User Story.');
    }
}
