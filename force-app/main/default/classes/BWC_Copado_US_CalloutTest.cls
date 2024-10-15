@isTest
public class BWC_Copado_US_CalloutTest {

    @isTest
    public static void testMakeSampleCallout() {
        
        // Set mock callout class 
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
 
        // Call method to test.
        List<BWC_Copado_US.issue> issuesList = BWC_Copado_US_Callout.makeSampleCallout('81142','');

        // Assert that the correct number of issues were returned
        System.assertEquals(1, issuesList.size());

        // Assert that the first issue has the correct key and summary
        System.assertEquals('SPTSFDCSPT-310Test', issuesList[0].key);
    }

    
    @isTest
    public static void testGetActiveSprintDetails() {
       
        // Set mock callout class 
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
         
        // Call the getActiveSprintDetails method
        List<BWC_Copado_US.values> values = BWC_Copado_US_Callout.getActiveSprintDetails('13866');

        // Assert that the correct number of values were returned
        System.assertEquals(1, values.size());

        // Assert that the first value has the correct id and name
        System.assertEquals(81132, values[0].id);
    }
}