public class AttachmentTriggerHandler {
    
    public static void createTestFailureRecords(Attachment att){
        copado__Apex_Test_Result__c apexTest = [Select id, copado__User_Story__c, copado__Org__r.name from copado__Apex_Test_Result__c where Id =: att.parentId] ;
        if(!String.isEmpty(apexTest.copado__User_Story__c)) {
            return;
        }
        List<Apex_Test_Failure__c > testFailures = new List< Apex_Test_Failure__c >();
        ApexTestResultParser.TestResult result = ApexTestResultParser.parseAttachment(att.Id);
        System.debug('Failures: ' + result.failures);
        System.debug('Tests: ' + result.tests);
        System.debug('Time: ' + result.t);
        System.debug('Errors: ' + result.errors);
        for (String className : result.testClassResults.keySet()) { 
            ApexTestResultParser.TestClassResult testClassResult = result.testClassResults.get(className);
            //System.debug('Class: ' + testClassResult.className);
            for (ApexTestResultParser.TestMethods method : testClassResult.methods) {
                if(!method.success){
                    System.debug('testClassResult.className: '+testClassResult.className+'Method: ' + 
                                 method.name + ', Success: ' + method.success + ', Message: ' + method.message);
                    Apex_Test_Failure__c apxFailure = new Apex_Test_Failure__c(
                        Apex_Test_Result__c = apexTest.id, 
                        Class_Name__c  = testClassResult.className,
                        Method_Name__c  = method.name, 
                        Method_Message__c  = method.message);
                    testFailures.add(apxFailure);
	
                }
                	
        	}
    	}
        
        if(testFailures.size() > 0){
            insert testFailures;
        }
        
        Map<String, StoryDataWrapper> resultMap = getClassStoryData(testFailures);
        for(Apex_Test_Failure__c failure : testFailures){
            if(resultMap.containsKey(failure.Class_Name__c)){
                StoryDataWrapper styWrap = resultMap.get(failure.Class_Name__c);
                failure.Developer_Name__c = styWrap.Dev;
                failure.Environment__c = styWrap.Env;
                failure.Release__c = styWrap.Release;
                failure.Team_Name__c = styWrap.Team;
                failure.User_Story__c = styWrap.ust;
                failure.Last_Changed_Date__c  = styWrap.LastModifiedDate;
            }
        }
        Database.update( testFailures, false);
        
	}
    
    public static Map<String, StoryDataWrapper> getClassStoryData(List<Apex_Test_Failure__c> testRecords) {
        Set<String> classNames = new Set<String>();
        
        // Collect all the class names from the provided Test__c records
        for (Apex_Test_Failure__c test : testRecords) {
            classNames.add(test.Class_Name__c);
        }
        
        // Query the latest LastModifiedDate for each class name
        List<AggregateResult> latestModifiedDates = [
            SELECT copado__Metadata_API_Name__c, MAX(LastModifiedDate) lastModifiedDate 
            FROM copado__User_Story_Metadata__c 
            WHERE copado__Type__c = 'ApexClass' AND copado__Metadata_API_Name__c IN :classNames 
            GROUP BY copado__Metadata_API_Name__c
        ];
        // Store the latest LastModifiedDate in a map
        Map<String, DateTime> classLastModifiedMap = new Map<String, DateTime>();
        for (AggregateResult ar : latestModifiedDates) {
            classLastModifiedMap.put((String)ar.get('copado__Metadata_API_Name__c'), (DateTime)ar.get('lastModifiedDate'));
        }
        
        // Query the relevant Story__c IDs from StoryChild__c
        Integer days = Integer.valueOf (System.Label.DaysAgo);
        Date thirtyDaysAgo = Date.today().addDays(-1*days);
        List<copado__User_Story_Metadata__c> metadataList = [
            SELECT copado__User_Story__c, copado__Metadata_API_Name__c, createdby.name 
            FROM copado__User_Story_Metadata__c 
            WHERE copado__Metadata_API_Name__c IN :classNames 
            AND LastModifiedDate >= :thirtyDaysAgo
        ];
        
        // Create a map to store copado__Metadata_API_Name__c as the key and copado__User_Story__c as the value
        Map<String, Id> classToStoryMap = new Map<String, Id>();
        for (copado__User_Story_Metadata__c metadata : metadataList) {
            classToStoryMap.put(metadata.copado__Metadata_API_Name__c, metadata.copado__User_Story__c);
        }
        
        // Populate the map
        Map<String, List<String>> classToDevMap = new Map<String, List<String>>();
        for (copado__User_Story_Metadata__c metadata : metadataList) {
            String className = metadata.copado__Metadata_API_Name__c;
            String createdBy = metadata.createdby.name;
    
            // Check if the class name is already in the map
            if (!classToDevMap.containsKey(className)) {
                // If not, add it with a new list
                classToDevMap.put(className, new List<String>());
            }
    
            // Add the createdBy value to the list for this class
            classToDevMap.get(className).add(createdBy);
    }

        Set<Id> storyIds = new Set<Id>();
        for (copado__User_Story_Metadata__c md : metadataList) {
            storyIds.add(md.copado__User_Story__c);
        }
        
        // Query the relevant fields from Story__c
        List<copado__User_Story__c> stories = [
            SELECT Id, name, copado__Team__r.name, copado__Release__r.name, copado__Environment__r.name  
            FROM copado__User_Story__c
            WHERE Id IN : storyIds
        ];
        
        // Create a map to store the final results
        Map<String, StoryDataWrapper> resultMap = new Map<String, StoryDataWrapper>();

        // Create a map of Story__c records for easy access
        Map<Id, copado__User_Story__c> storiesMap = new Map<Id, copado__User_Story__c>();
        for (copado__User_Story__c story : stories) {
            storiesMap.put(story.Id, story);
        }
        
        // Populate the resultMap with class names as keys
        for (String className : classToStoryMap.keySet()) {
			Id StyId = classToStoryMap.get(className);
            copado__User_Story__c sty = storiesMap.get(StyId);
            DateTime lastModifiedDate = classLastModifiedMap.get(className);
            String dev = '';
            for(String devName : classToDevMap.get(className)){
                dev+=devName + ', ';
            }
			if (dev.endsWith(', ')) {
    			dev = dev.substring(0, dev.length() - 2);
			}
            if (lastModifiedDate != null) {
                if (sty != null) {
                    StoryDataWrapper wrapper = new StoryDataWrapper(
                        sty.copado__Team__r.name, 
                        sty.copado__Release__r.name, 
                        sty.copado__Environment__r.name, 
                        lastModifiedDate,
                        dev,
                        sty.name
                    );
                    resultMap.put(className, wrapper);
                }
            }
        }
        
        return resultMap;
    }
    
    public static void processJenkinsTestScriptResults(List<Attachment> jenkinsAttachments) {
    try {
        System.debug('processJenkinsTestScriptResults1');
        Set<Id> parentIds = new Set<Id>();
        Map<Id, String> attachmentBodies = new Map<Id, String>();
        
        // Collect parent IDs and attachment bodies
        for(Attachment att : jenkinsAttachments) {
            parentIds.add(att.ParentId);
            attachmentBodies.put(att.ParentId, att.Body.toString());
        }
        System.debug('processJenkinsTestScriptResults2');
        if(parentIds.isEmpty()) return;
        
        // Query Promotion Test Script records to update
        List<Promotion_Test_Script__c> scriptsToUpdate = new List<Promotion_Test_Script__c>();
        for(Promotion_Test_Script__c pts : [
            SELECT Id FROM Promotion_Test_Script__c WHERE Id IN :parentIds
        ]) {
            try {
                // Parse JSON payload
                Map<String, Object> payload = (Map<String, Object>)JSON.deserializeUntyped(
                    attachmentBodies.get(pts.Id)
                );
				System.debug('processJenkinsTestScriptResults3');                
                // Update fields
                pts.Job_Run_Status__c = (String)payload.get('JobStatus');
                pts.Test_Cases__c = Integer.valueOf(payload.get('TestPass'));
                pts.Build__c = Integer.valueOf(payload.get('TestRun'));
                pts.Test_Cases_Failed__c = Integer.valueOf(payload.get('TestFail'));
                
                scriptsToUpdate.add(pts);
            } catch(Exception e) {
                System.debug('Error processing attachment for record ' + pts.Id + ': ' + e.getMessage());
            }
        }
        
        if(!scriptsToUpdate.isEmpty()) {
            update scriptsToUpdate;
        }
    } catch(Exception e) {
        System.debug('Error in processJenkinsTestScriptResults: ' + e.getMessage());
    }
}
}