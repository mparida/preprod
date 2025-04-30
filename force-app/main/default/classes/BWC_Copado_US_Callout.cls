public with sharing class BWC_Copado_US_Callout {
    
    @AuraEnabled
    public static List<BWC_Copado_US.issue> makeSampleCallout(String sprintId,String issueKey){
        String Itrack_Mule_base = System.Label.Itrack_Mulesoft_Service;
        String endpoint = '';
        if(issueKey != ''){
            String Itrack_Endpoint = System.Label.Get_an_issue;
            String Itrack_service_fields = System.Label.Itrack_service_fields;
        	endpoint = Itrack_Mule_base+Itrack_Endpoint+issueKey+Itrack_service_fields; 
        }
        else {
            String Itrack_Endpoint = System.Label.Itrack_Endpoint;
        	endpoint = Itrack_Mule_base+ Itrack_Endpoint+sprintId+'%26issuetype%20in%20standardIssueTypes()';
        }
        system.debug('endpoint ::'+endpoint);
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        Http http = new Http();
        HttpResponse res = http.send(req);  
        if(res.getStatusCode() == 200)
        	return calloutResponse(res.getBody(),issueKey);
        return new List<BWC_Copado_US.issue>();
    }

    @AuraEnabled
    public static List<BWC_Copado_US.issue> calloutResponse(String responseString,String issueKey){
        BWC_Copado_US response = new BWC_Copado_US();
        List<BWC_Copado_US.issue> issueList = new List<BWC_Copado_US.issue>();
        List<String> itrackStoryList = new List<String>();
        if(issueKey != ''){
            BWC_Copado_US.Issue issueResp = (BWC_Copado_US.Issue) System.JSON.deserialize(responseString,BWC_Copado_US.Issue.class);
            if(issueResp != null) issueList.add(issueResp);
        } 
        else{
            response = (BWC_Copado_US) System.JSON.deserialize(responseString,BWC_Copado_US.class);
            issueList = response.issues;
        }
        
        if(issueList.size() > 0)
        {
            //Get Copado User Story Creation status for each Itrack US
            for(BWC_Copado_US.issue issue: issueList)
            {
                itrackStoryList.add(issue.key);
                issue.copadoStory = '';
            }        
        
        	List<copado__User_Story__c> createdUsList = [SELECT Id,iTrack_US__c,Name FROM copado__User_Story__c WHERE iTrack_US__c IN :itrackStoryList];
 
            for(BWC_Copado_US.issue issue: issueList)
            {
                issue.summary = issue.fields.summary;
                issue.assigneeName = issue.fields.assignee?.displayName;
                issue.assigneeUID = issue.fields.assignee?.name;
                for(copado__User_Story__c us: createdUsList){
                    if(us.iTrack_US__c == issue.key){
                        issue.copadoId = us.Id;
                        issue.copadoStory = us.Name; 
                    }
                }
                if(issue.fields.fixVersions?.size() >0)
                {
                    issue.fixVersionName = issue.fields.fixVersions[0].name.split(' ')[0];
                }
            }
        }
			
        return issueList;
    }
    
    @AuraEnabled
    public static List<BWC_Copado_US.values> getActiveSprintDetails(string boardID){
        String GetActiveSprints_Endpoint = System.Label.GetActiveSprints;
        String Itrack_Mulesoft_Service = System.Label.Itrack_Mulesoft_Service;
        HttpRequest req = new HttpRequest();
        String endPoint = '';
        endPoint = (Label.getAllSprints == 'Y') ? Itrack_Mulesoft_Service+GetActiveSprints_Endpoint + boardID+'/sprint' :
                Itrack_Mulesoft_Service+GetActiveSprints_Endpoint + boardID+'/sprint?state=active';
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        Http http = new Http();
        HttpResponse res = http.send(req);   
        System.debug('res body:'+res.getStatus());
        BWC_Copado_US response = new BWC_Copado_US();
        response = (BWC_Copado_US) System.JSON.deserialize(res.getBody(),BWC_Copado_US.class);
        List<copado__Sprint__c > itrackSprintIDList = new List<copado__Sprint__c >();
        List<copado__Sprint__c > sprintRecordsToInsert = new List<copado__Sprint__c >();
        List<String> existingIDList = new List<String>();
        List<String> newIDList = new List<String>();
        
        for(BWC_Copado_US.Values v : response.values){
            copado__Sprint__c sprint = new copado__Sprint__c();
            sprint.Itrack_Sprint__c = String.valueOf(v.id);
            sprint.Name = v.name;
            sprint.Active__c = true;
            itrackSprintIDList.add(sprint);
            newIDList.add(String.valueOf(v.id));
        }
        
        for(copado__Sprint__c copadoSprint : [SELECT id,Itrack_Sprint__c, Name FROM copado__Sprint__c WHERE Itrack_Sprint__c in :newIDList]){
            existingIDList.add(copadoSprint.Itrack_Sprint__c);
        }
        
        for(copado__Sprint__c newSprint :itrackSprintIDList){
            if(!existingIDList.contains(newSprint.Itrack_Sprint__c)){
                sprintRecordsToInsert.add(newSprint);
            }
        }
        
        if(!sprintRecordsToInsert.isEmpty())
        {
            insert sprintRecordsToInsert;
        }
          
        return response.values;
    }   
}