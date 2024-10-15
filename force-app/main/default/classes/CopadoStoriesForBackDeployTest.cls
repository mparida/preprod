@isTest(seeAllData=true)
public class CopadoStoriesForBackDeployTest {
	@isTest
    static void testUpdateApproverInJobStep() {
        List<String> e = new List<String>();
        e.add(System.Label.DEVHY_Back_Promotion);
        List<Report_Back_Promotion_Master__c> listUst = CopadoStoriesForBackDeploy.getUSTListForBackDeploy(e);
    }
}