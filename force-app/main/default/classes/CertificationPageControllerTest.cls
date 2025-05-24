@isTest
public class CertificationPageControllerTest {

    @isTest
    static void testControllerMethods() {
        // Create test data
        String token = 'test-token-123';
        List<User_Access_Review__c> reviews = new List<User_Access_Review__c>();
        for (Integer i = 0; i < 3; i++) {
            reviews.add(new User_Access_Review__c(
                First_Name__c = 'First' + i,
                Last_Name__c = 'Last' + i,
                Federation_Identifier__c = 'FID' + i,
                Att_Email__c = 'user' + i + '@test.com',
                Manager_Name__c = 'Manager',
                Certification_Status__c = 'Pending',
                Certification_Token__c = token
            ));
        }
        insert reviews;

        // Mock token in page parameters
        Test.setCurrentPage(Page.UserAccessReviewPage); // Dummy VF page
        ApexPages.currentPage().getParameters().put('token', token);

        // Instantiate controller
        CertificationPageController controller = new CertificationPageController();

        System.assertEquals(3, controller.reportees.size(), 'Should load all reportees');
        System.assertEquals('Manager', controller.managerName, 'Manager name should be set');

        // Test certifySingle()
        controller.selectedRecordId = reviews[0].Id;
        controller.certifySingle();
        User_Access_Review__c updated1 = [SELECT Certification_Status__c FROM User_Access_Review__c WHERE Id = :reviews[0].Id];
        System.assertEquals('Certified', updated1.Certification_Status__c, 'Single certify failed');

        // Test uncertifySingle()
        controller.selectedRecordId = reviews[1].Id;
        controller.uncertifySingle();
        User_Access_Review__c updated2 = [SELECT Certification_Status__c FROM User_Access_Review__c WHERE Id = :reviews[1].Id];
        System.assertEquals('Rejected', updated2.Certification_Status__c, 'Single reject failed');

        // Select two records for bulkCertify
        controller.selectedReporteeIds.put(reviews[0].Id, true);
        controller.selectedReporteeIds.put(reviews[2].Id, true);
        controller.bulkCertify();
        List<User_Access_Review__c> bulkCerts = [SELECT Certification_Status__c FROM User_Access_Review__c WHERE Id IN :new List<Id>{reviews[0].Id, reviews[2].Id}];
        for (User_Access_Review__c r : bulkCerts) {
            System.assertEquals('Certified', r.Certification_Status__c, 'Bulk certify failed');
        }

        // Select one record for bulkUncertify
        controller.selectedReporteeIds.clear();
        controller.selectedReporteeIds.put(reviews[2].Id, true);
        controller.bulkUncertify();
        User_Access_Review__c finalRec = [SELECT Certification_Status__c FROM User_Access_Review__c WHERE Id = :reviews[2].Id];
        System.assertEquals('Rejected', finalRec.Certification_Status__c, 'Bulk uncertify failed');
    }

    @isTest
    static void testNoRecordsSelectedBulkActions() {
        String token = 'empty-select-token';
        User_Access_Review__c rec = new User_Access_Review__c(
            First_Name__c = 'Test',
            Last_Name__c = 'User',
            Federation_Identifier__c = 'FIDX',
            Att_Email__c = 'testuser@test.com',
            Manager_Name__c = 'Manager X',
            Certification_Status__c = 'Pending',
            Certification_Token__c = token
        );
        insert rec;

        Test.setCurrentPage(Page.UserAccessReviewPage);
        ApexPages.currentPage().getParameters().put('token', token);
        CertificationPageController controller = new CertificationPageController();

        // No record selected, expect error message
        controller.bulkCertify();
        controller.bulkUncertify();
        System.assertNotEquals(0, ApexPages.getMessages().size(), 'Expected error messages for no selections');
    }
}