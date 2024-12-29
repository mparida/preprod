/**
 * Created by mp1863 on 29/12/24.
 */

@isTest(seeAllData=true)
public class BackPromotionReportControllerTest {

    @isTest
    static void testUpdateApproverInJobStep() {
        List<String> e = new List<String>();
        e.add(System.Label.TestOrgForBackPromo);
        List<List<copado__User_Story__c>> listUst = BackPromotionReportController.getUSTListForBackDeploy(e);
    }
}
