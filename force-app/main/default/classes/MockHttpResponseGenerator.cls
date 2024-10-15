@isTest
global class MockHttpResponseGenerator implements HttpCalloutMock {
    // Implement this interface method
    global HTTPResponse respond(HTTPRequest req) {
        // Optionally, only send a mock response for a specific endpoint
        // and method.
        System.assertEquals('GET', req.getMethod());
        
        // Create a fake response
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        if(req.getEndpoint().contains('sprint?state=active')){
            res.setBody('{\"maxResults\":50,\"startAt\":0,\"isLast\":true,\"values\":[{\"id\":81132,\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/agile/1.0/sprint/81132\",\"state\":\"active\",\"name\":\"17SVCIDMGMTSPT17.2\",\"startDate\":\"2023-10-11T12:38:00.000-04:00\",\"endDate\":\"2023-10-24T14:36:00.000-04:00\",\"activatedDate\":\"2023-10-11T12:39:02.473-04:00\",\"originBoardId\":13866}]}');
        }
        else{
            res.setBody('{\"expand\":\"names,schema\",\"startAt\":0,\"maxResults\":1,\"total\":27,\"issues\":[{\"expand\":\"operations,versionedRepresentations,editmeta,changelog,renderedFields\",\"id\":\"6709684\",\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/issue/6709684\",\"key\":\"SPTSFDCSPT-310Test\",\"fields\":{\"summary\":\"DevonlyReportingandWatermarkingforemailaddressonCustomerinformationmanagement\",\"customfield_16473\":{\"value\":\"SPT-ACC-ServiceSupportMgmt\",\"id\":\"68568\"},\"description\":null,\"project\":{\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/project/38730\",\"id\":\"38730\",\"key\":\"SPTSFDCSPT\",\"name\":\"SPT-SFDCServiceandSupport\",\"projectTypeKey\":\"software\",\"avatarUrls\":{\"48x48\":\"https://itrack.web.att.com/secure/projectavatar?avatarId=24243\",\"24x24\":\"https://itrack.web.att.com/secure/projectavatar?size=small&avatarId=24243\",\"16x16\":\"https://itrack.web.att.com/secure/projectavatar?size=xsmall&avatarId=24243\",\"32x32\":\"https://itrack.web.att.com/secure/projectavatar?size=medium&avatarId=24243\"},\"projectCategory\":{\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/projectCategory/10080\",\"id\":\"10080\",\"name\":\"Agile\"}},\"fixVersions\":[{\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/version/130377\",\"id\":\"130377\",\"name\":\"23.11.1(11/5/2023-11/11/2023)\",\"archived\":false,\"released\":false,\"releaseDate\":\"2023-11-11\"}],\"assignee\":{\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/user?username=li939c\",\"name\":\"li939c\",\"key\":\"JIRAUSER115273\",\"emailAddress\":\"li939c@att.com\",\"avatarUrls\":{\"48x48\":\"https://itrack.web.att.com/secure/useravatar?avatarId=10362\",\"24x24\":\"https://itrack.web.att.com/secure/useravatar?size=small&avatarId=10362\",\"16x16\":\"https://itrack.web.att.com/secure/useravatar?size=xsmall&avatarId=10362\",\"32x32\":\"https://itrack.web.att.com/secure/useravatar?size=medium&avatarId=10362\"},\"displayName\":\"Innis,Liana(li939c)\",\"active\":true,\"timeZone\":\"America/New_York\"},\"customfield_10970\":\"SPTSFDCSPT-23017\",\"status\":{\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/status/13685\",\"description\":\"ThisstatusismanagedinternallybyJIRASoftware\",\"iconUrl\":\"https://itrack.web.att.com/\",\"name\":\"Accepted\",\"id\":\"13685\",\"statusCategory\":{\"self\":\"https://digital-api-qa.att.com/att-qa-service-jira-integration-e/api/v1/rest/api/2/statuscategory/3\",\"id\":3,\"key\":\"done\",\"colorName\":\"green\",\"name\":\"Done\"}}}}]}');
        }
        	res.setStatusCode(200);
        return res;
    }
}