/**
 * Created by mp1863 on 11/02/25.
 */

public with sharing class JenkinsJobService {

    //@InvocableMethod(label='Jenkins Test Execution Status' description='Get Status after 30 mins')
    /*public static void makeCallOutFromFromInvocableFlows(List<Id> ids, List<String> apis, List<String> jobNames){
        String api = apis[0];
        if(api != null && api == 'get build status'){
            Id id = ids[0];
            getJenkinsBuildStatusAsyn(id);
        }
    }*/
    public static void triggerJenkinsJob(Promotion_Test_Script__c pts, Map<String, String> parameters) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance('Default_Settings').Is_Mock_Enabled__c;

        if (isMockEnabled) {
            Map<String, Object> mockResponse =  getMockResponsePOST(pts.Test_Script__r.Jenkins_Test_Suite_Name__c);
            Decimal status = (Decimal) mockResponse.get('statusCode');
            if((Decimal) mockResponse.get('statusCode') == Bwc_Constants.callOutStatus_201){
                getJenkinsBuildNumberAsync((String) mockResponse.get('jobUrl'), pts.Id);
            } else{
                JenkinsJobUtil.updateJenkinJobRunStatus(pts,null, 'FAIL', null,null);
            }
        } else {
            Map<String, Object> realResponse = initiateJenkinsJob(pts.Test_Script__r.Jenkins_Test_Suite_Name__c, parameters);
            if((Decimal) realResponse.get('statusCode') == Bwc_Constants.callOutStatus_201){
                getJenkinsBuildNumberAsync((String) realResponse.get('jobUrl'), pts.Id);
            }else{
                JenkinsJobUtil.updateJenkinJobRunStatus(pts,null, 'FAIL', null, null);
            }
        }
    }

    // Fetch Mock Response from Salesforce
    private static Map<String, Object> getMockResponsePOST(String jobName) {
        Mock_Jenkins_Response__c mockData = [
                SELECT Location_URL__c, Status_Code__c FROM Mock_Jenkins_Response__c
                WHERE Job_Name__c = :jobName AND API_Name__c = 'trigger jenkins job'
                LIMIT 1
        ];

        Map<String, Object> responseMap = new Map<String, Object>();
        responseMap.put('message', 'Mock Mode: Job triggered successfully');
        responseMap.put('queueId', extractQueueId(mockData.Location_URL__c));
        responseMap.put('jobUrl', mockData.Location_URL__c);
        responseMap.put('statusCode', mockData.Status_Code__c);

        System.debug('Mock Response Sent: ' + responseMap);
        return responseMap;
    }

    // Call Real Jenkins API
    private static Map<String, Object> initiateJenkinsJob(String jobName, Map<String, String> parameters) {
        Map<String, String> authDetails = fetchJenkinsCrumbAndSession();
        //String endpoint = 'callout:'+Label.Jenkins_Named_Credential+'/job/' + EncodingUtil.urlEncode(jobName, 'UTF-8') + '/buildWithParameters?CITY_NAME=Boston';
        String endpoint = 'callout:Jenkins_Auth/job/Weather%20Pipeline/buildWithParameters?CITY_NAME=LONDON' ;
        System.debug('endpoint:'+endpoint);
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader(authDetails.get('crumbField'), authDetails.get('crumbToken'));  // Include Crumb Token
        req.setHeader('Cookie', authDetails.get('sessionCookie'));  // Include JSESSIONID Cookie
        //req.setHeader('Authorization', 'Basic XXXXXX');  // Use Named Credentials ideally
        //req.setBody(constructUrlEncodedParams(parameters)); // Proper URL encoding

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 201) {
            Map<String, Object> response = new Map<String, Object>();
            response.put('message', 'Job triggered successfully');
            response.put('queueId', extractQueueId(res.getHeader('Location')));
            response.put('jobUrl', res.getHeader('Location'));
            response.put('statusCode', 201);
            System.debug('Response from Real Post call:::'+response);
            return response;
        } else {
            throw new CalloutException('Jenkins API call failed: ' + res.getBody());
        }
    }

    // Convert Parameters Map to URL-Encoded String
    private static String constructUrlEncodedParams(Map<String, String> params) {
        List<String> paramList = new List<String>();
        for (String key : params.keySet()) {
            paramList.add(EncodingUtil.urlEncode(key, 'UTF-8') + '=' + EncodingUtil.urlEncode(params.get(key), 'UTF-8'));
        }
        return String.join(paramList,'&');
    }

    // Extract Queue ID from Jenkins Location Header
    private static String extractQueueId(String locationHeader) {
        if (locationHeader != null && locationHeader.contains('/queue/item/')) {
            return locationHeader.split('/queue/item/')[1].replaceAll('/api/json', '');
        }
        return null;
    }

    /*================================GET JOBS=================================================================*/

    @Future(Callout=true)
    public static void getJenkinsBuildNumberAsync(String locationUrl, Id promotionTestId){
        Map<String, Object> responseMap = getJenkinsBuildNumber(locationUrl);
        Integer buildNumber = null;
        if (responseMap.containsKey('executable')) {
            Map<String, Object> executableMap = (Map<String, Object>) responseMap.get('executable');
            buildNumber = executableMap.get('number')!=null ? (Integer)executableMap.get('number') : -100 ;
            System.debug('Extracted Build Number: ' + buildNumber);
        }
        JenkinsJobUtil.updateJenkinJobRunStatus(null, promotionTestId, null, null, buildNumber);
    }
    // Fetch Job Status from Jenkins (Real or Mock)
    public static Map<String, Object> getJenkinsBuildNumber(String locationUrl) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance('Default_Settings').Is_Mock_Enabled__c;
        String apiUrl = locationUrl + '/api/json'; // Append /api/json

        if (isMockEnabled) {
            System.debug('Mock Mode ON - Returning Stored GET Response');
            return getJenkinsBuildNumberMock(apiUrl);
        } else {
            System.debug('Mock Mode OFF - Calling Real Jenkins API');
            String extractedPath = JenkinsJobUtil.extractRelativePath(locationUrl);
            extractedPath = extractedPath + '/api/json'; // Append /api/json
            return getJenkinsBuildNumberFromAPI(extractedPath);
        }
    }

    // Fetch Mock GET Response from Salesforce
    private static Map<String, Object> getJenkinsBuildNumberMock(String apiUrl) {
        System.debug('*********'+apiUrl);
        Mock_Jenkins_Response__c mockData = [
                SELECT Response_JSON__c FROM Mock_Jenkins_Response__c
                WHERE Method__c = 'GET' AND API_Name__c = 'get build number'
                LIMIT 1
        ];

        if (mockData == null) {
            throw new CalloutException('Mock GET response not found for URL: ' + apiUrl);
        }
        Map<String, Object> resM = (Map<String, Object>)JSON.deserializeUntyped(mockData.Response_JSON__c);
        System.debug('resM::'+resM);
        return resM;
    }

    // Call Real Jenkins GET API Using Named Credentials
    private static Map<String, Object> getJenkinsBuildNumberFromAPI(String apiUrl) {
        String endpoint = 'callout:Mulesoft_RTF1' + apiUrl;

        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            System.debug('Jenkins GET Response: ' + res.getBody());
            return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } else {
            throw new CalloutException('Jenkins API GET call failed: ' + res.getBody());
        }
    }


    //================GET BUILD STATUS==============================================================
    @InvocableMethod(label='Jenkins Test Execution Status' description='Get Status after 30 mins')
    public static void getJenkinsBuildStatus(List<Id> scriptIds) {
        Id id;
        if(scriptIds!=null && scriptIds.size() > 0){
            id = scriptIds[0];
        }else{
            return;
        }
        if(id != null){
            getJenkinsBuildStatusAsyn(id);
        }
    }
    @future(callout=true)
    public static void getJenkinsBuildStatusAsyn(Id id) {
        Map<String, Object> response;
        Promotion_Test_Script__c pts ;
        pts = [SELECT Id, Test_Script__r.Jenkins_Test_Suite_Name__c, Job_Run_Status__c, Job_Status_Retry_Count__c
        FROM Promotion_Test_Script__c WHERE Id =: id];
        response = getJenkinsJobBuildStatus(pts.Test_Script__r.Jenkins_Test_Suite_Name__c);
        if(response.containsKey('buildResult') ){
            JenkinsJobUtil.updateJenkinJobRunStatus(pts, null, null, (String)response.get('buildResult'), null);
        }
        //JenkinsJobUtil.updateJenkinJobRunStatus(pts, null, null, (String)response.get('buildResult'), null);
        //update pts;
    }
    public static Map<String, Object> getJenkinsJobBuildStatus(String jobName) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance('Default_Settings').Is_Mock_Enabled__c;

        // Construct API URL using Named Credentials
        String apiUrl = 'callout:Mulesoft_RTF1/job/' + EncodingUtil.urlEncode(jobName, 'UTF-8') + '/111/api/json';

        Map<String, Object> response;
        if (isMockEnabled) {
            System.debug('Mock Mode ON - Returning Stored Job Step Response');
            response = getJenkinsJobBuildStatusMock(jobName);
        } else {
            System.debug('Mock Mode OFF - Calling Real Jenkins API');
            response = getJenkinsJobBuildStatusAPI(apiUrl);
        }

        // Extract required fields
        Map<String, Object> extractedData = new Map<String, Object>();
        extractedData.put('buildNumber', response.containsKey('number') ? response.get('number') : null);
        extractedData.put('queueId', response.containsKey('queueId') ? response.get('queueId') : null);
        extractedData.put('buildResult', response.containsKey('result') ? response.get('result') : 'IN_PROGRESS'); // Default to IN_PROGRESS if null

        System.debug('Extracted Job Status: ' + extractedData);
        return extractedData;
    }

    // Fetch Mock GET Response for Build Status from Salesforce
    private static Map<String, Object> getJenkinsJobBuildStatusMock(String jobName) {
        Mock_Jenkins_Response__c mockData = [
                SELECT Response_JSON__c, Build__c FROM Mock_Jenkins_Response__c
                WHERE Job_Name__c = :jobName AND API_Name__c = 'get build status'
                LIMIT 1
        ];

        if (mockData == null) {
            throw new CalloutException('Mock GET response not found for Job Name: ' + jobName);
        }

        return (Map<String, Object>) JSON.deserializeUntyped(mockData.Response_JSON__c);
    }

    // Call Real Jenkins API Using Named Credentials
    private static Map<String, Object> getJenkinsJobBuildStatusAPI(String apiUrl) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(apiUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            System.debug('Jenkins Job Step Response: ' + res.getBody());
            return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } else {
            throw new CalloutException('Jenkins API GET call failed: ' + res.getBody());
        }
    }

    public static Map<String, String> fetchJenkinsCrumbAndSession() {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setMethod('GET');
        request.setEndpoint('callout:Jenkins_Auth/crumbIssuer/api/json');  // Using Named Credential
        //request.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf('your-jenkins-username:your-api-token')));

        HttpResponse response = http.send(request);
        if (response.getStatusCode() == 200) {
            Map<String, Object> crumbResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            String crumbToken = (String) crumbResponse.get('crumb');
            String crumbField = (String) crumbResponse.get('crumbRequestField');

            // Extract JSESSIONID from response headers
            String sessionCookie;
            for (String header : response.getHeaderKeys()) {
                if (header.toLowerCase().contains('set-cookie')) {
                    String cookieValue = response.getHeader(header);
                    if (cookieValue.startsWith('JSESSIONID')) {
                        sessionCookie = cookieValue.split(';')[0];  // Extract "JSESSIONID=xxxx"
                    }
                }
            }

            return new Map<String, String>{ 'crumbToken' => crumbToken, 'crumbField' => crumbField, 'sessionCookie' => sessionCookie };
        } else {
            throw new CalloutException('Failed to get Jenkins Crumb Token: ' + response.getStatusCode());
        }
    }
}