/**
 * Created by manojparida on 20/03/25.
 */

@IsTest
private class PromotionTest {
    @TestSetup
    static void testSetup() {
        copado__Promotion__c promotion = new copado__Promotion__c();
    }
    @IsTest
    static void testPromoCreate(){
        Profile developerProfile = [SELECT Id FROM Profile WHERE Name = 'Developer' LIMIT 1];
        List<User> userList = new List<User>();
        // Create two test users with the Developer profile
        User developer = TestDataFactory.createTestUser('developer.reviewer@test.com', developerProfile.Id);
        developer.FederationIdentifier = 'DevFed1234';
        insert developer;
        copado__Promotion__c promotion = new copado__Promotion__c();
        insert promotion;
    }
}