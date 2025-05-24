@isTest
private class CertificationEmailHandlerTest {

    @isTest
    static void testSendCertificationEmails() {
        // Step 1: Insert mock User_Access_Review__c records
        List<User_Access_Review__c> reviews = new List<User_Access_Review__c>();
        for (Integer i = 0; i < 3; i++) {
            reviews.add(new User_Access_Review__c(
                First_Name__c = 'First' + i,
                Last_Name__c = 'Last' + i,
                Federation_Identifier__c = 'FID' + i,
                Att_Email__c = 'att' + i + '@test.com',
                Intl_Email__c = 'intl' + i + '@test.com',
                Manager_Name__c = 'Manager One',
                Manager_Email__c = 'manager1@test.com',
                Certification_Status__c = 'Pending'
            ));
        }
        insert reviews;

        // Step 2: Start test context
        Test.startTest();
        CertificationEmailHandler.sendCertificationEmails();
        Test.stopTest();

        // Step 3: Assert tokens were generated
        List<User_Access_Review__c> updatedReviews = [
            SELECT Certification_Token__c FROM User_Access_Review__c WHERE Certification_Status__c = 'Pending'
        ];
        for (User_Access_Review__c ur : updatedReviews) {
            System.assertNotEquals(null, ur.Certification_Token__c, 'Token should be generated');
            System.assert(ur.Certification_Token__c.length() <= 255, 'Token length should be capped at 255');
        }
    }

    @isTest
    static void testEmailQueueableExecution() {
        // Set up data for 3 managers
        Map<String, List<User_Access_Review__c>> testMap = new Map<String, List<User_Access_Review__c>>();
        for (Integer j = 1; j <= 3; j++) {
            List<User_Access_Review__c> listForManager = new List<User_Access_Review__c>();
            for (Integer i = 0; i < 2; i++) {
                listForManager.add(new User_Access_Review__c(
                    First_Name__c = 'First' + i,
                    Last_Name__c = 'Last' + i,
                    Federation_Identifier__c = 'FID' + i,
                    Att_Email__c = 'att' + i + '@test.com',
                    Intl_Email__c = 'intl' + i + '@test.com',
                    Manager_Name__c = 'Manager ' + j,
                    Manager_Email__c = 'manager' + j + '@test.com',
                    Certification_Token__c = 'dummyToken' + j,
                    Certification_Status__c = 'Pending'
                ));
            }
            testMap.put('manager' + j + '@test.com', listForManager);
        }

        // Execute the queueable job
        Test.startTest();
        System.enqueueJob(new CertificationEmailHandler.CertificationEmailQueueable(testMap));
        Test.stopTest();

        // No exception means success; you could add more assertions if needed
        System.assert(true);
    }
}