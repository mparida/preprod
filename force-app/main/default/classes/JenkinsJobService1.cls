/**
 * Created by mp1863 on 18/02/25.
 */

public without sharing class JenkinsJobService1 {
    @InvocableMethod(Label='Jenkins Test Execution' Description='Get Status after 30 mins')
    public static void makeCallOutFromFromInvocableFlows(List<JenkinInvocableParams> paramsList){
        List<Id> ids = paramsList[0].ids;
        List<String> apis = paramsList[0].apis;
        List<String> jobNames = paramsList[0].jobNames;
        List<String> envNames = paramsList[0].envNames;
        switch on apis[0] {
            when 'trigger jenkins job'{
                triggerJenkinsJobAsync(ids[0], jobNames[0], envNames!=null?envNames[0] : null);
            }when else {
                getJenkinsBuildStatusAsync(ids[0]);
            }
        }
        System.debug('API : '+apis[0] +'-----Job : '+jobNames[0]+'----Ids : '+ids[0]);
    }
    @Future(Callout=true)
    public static void triggerJenkinsJobAsync(Id ptsId, String jobName, String envName) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance(Bwc_Constants.metadata_defaultSettings).Is_Mock_Enabled__c;

        if (isMockEnabled) {
            Map<String, Object> mockResponse =  getMockResponsePOST(jobName);
            System.debug('build#'+mockResponse.get(Bwc_Constants.response_buildNumber));
            Integer buildNumber = Integer.valueOf(mockResponse.get(Bwc_Constants.response_buildNumber));
            JenkinsJobUtil.updateJenkinsJobRunStatus(null,ptsId, null, null,buildNumber);
        } else {
            String jobParams = BWC_JobMetadataHelper.getSerializedJobMetadata(jobName, envName);
            Map<String, Object> realResponse = initiateJenkinsJob(jobName, jobParams);
            Integer buildNumber = (Integer) realResponse.get(Bwc_Constants.response_buildNumber);
            JenkinsJobUtil.updateJenkinsJobRunStatus(null,ptsId, null, null, buildNumber);
        }
    }

    // Fetch Mock Response for Job Trigger API from Salesforce
    private static Map<String, Object> getMockResponsePOST(String jobName) {
        Mock_Jenkins_Response__c mockData = [
                SELECT Location_URL__c, Status_Code__c, Response_JSON__c FROM Mock_Jenkins_Response__c
                WHERE Job_Name__c = :jobName AND API_Name__c = 'trigger jenkins job'
                LIMIT 1
        ];
        return getResponseMap(mockData.Response_JSON__c);
    }

    // Call Real Mule~Jenkins Job Trigger API
    private static Map<String, Object> initiateJenkinsJob(String jobName, String parameters) {
        String endpoint = 'callout:Jenkins_Auth/api/v1/jobs/trigger' ;
        System.debug('endpoint:'+endpoint);
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        applyHeaders(request);
        request.setBody(parameters);

        Http http = new Http();
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == Bwc_Constants.callOutStatus_201) {
            System.debug('Response from Real Post call:::'+response.getBody());
            return getResponseMap(response.getBody());
        } else {
            throw new CalloutException('Jenkins API call failed: ' + response.getBody());
        }
    }

    private static void applyHeaders(HttpRequest httpRequest) {
        String uniqueTraceId = EncodingUtil.convertToHex(Crypto.generateAesKey(128)).left(16);
        String traceId = uniqueTraceId + ':' + uniqueTraceId + ':' + '0:0';
        setHeaderSafe(httpRequest, Bwc_Constants.HTTP_TRACE_ID_HEADER, traceId);
        httpRequest.setHeader('Content-Type', 'application/json');
    }
    private static void setHeaderSafe(HttpRequest request, String key, String value) {
        if (value != null) {
            request.setHeader(key, value);
        }
    }

    public static Map<String, Object> getResponseMap(String response){
        Map<String, Object> responseMap = new Map<String, Object>();
        responseMap = (Map<String, Object>) JSON.deserializeUntyped(response);
        return responseMap;
    }

    //================GET BUILD STATUS==============================================================
    @future(callout=true)
    public static void getJenkinsBuildStatusAsync(Id id) {
        Map<String, Object> response;
        Promotion_Test_Script__c pts ;
        pts = [SELECT Id, Name, Test_Script__r.Jenkins_Test_Suite_Name__c, Job_Run_Status__c, Job_Status_Retry_Count__c, Build__c
        FROM Promotion_Test_Script__c WHERE Id =: id];
        System.debug('PROMOTION SCRIPT : '+pts.Id + '---'+pts.name);
        System.debug('Test script name %%%%%%%%%'+pts.Test_Script__r.Jenkins_Test_Suite_Name__c);
        response = getJenkinsJobBuildStatus(pts.Test_Script__r.Jenkins_Test_Suite_Name__c, String.valueOf(pts.Build__c));
        if(response.containsKey(Bwc_Constants.response_status) ){
            JenkinsJobUtil.updateJenkinsJobRunStatus(pts, null, null, (String)response.get(Bwc_Constants.response_status), null);
        }
    }
    public static Map<String, Object> getJenkinsJobBuildStatus(String jobName, String buildNumber) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance(Bwc_Constants.metadata_defaultSettings).Is_Mock_Enabled__c;
        Map<String, Object> response;
        if (isMockEnabled) {
            System.debug('Mock Mode ON - Returning Stored Job Step Response');
            response = getJenkinsJobBuildStatusMock(jobName, buildNumber);
        } else {
            System.debug('Mock Mode OFF - Calling Real Jenkins API');
            response = getJenkinsJobBuildStatusAPI(jobName, buildNumber);
        }
        System.debug('Extracted Job Status: ' + response.get(Bwc_Constants.response_status));
        return response;
    }

    // Fetch Mock GET Response for Build Status from Salesforce
    private static Map<String, Object> getJenkinsJobBuildStatusMock(String jobName, String buildNumber) {
        System.debug('jobName : '+jobName +'  buildNumber : '+buildNumber);
        Mock_Jenkins_Response__c mockData = [
                SELECT Response_JSON__c, Build__c FROM Mock_Jenkins_Response__c
                WHERE Job_Name__c = :jobName AND API_Name__c = 'get build status'
                AND Build__c =: buildNumber
                LIMIT 1
        ];
        if (mockData == null) {
            throw new CalloutException('Mock GET response not found for Job Name: ' + jobName);
        }
        return getResponseMap(mockData.Response_JSON__c);
    }

    // Call Real Jenkins API Using Named Credentials
    private static Map<String, Object> getJenkinsJobBuildStatusAPI(String jobName, String buildNumber) {
        String endpoint = 'callout:Jenkins_Auth/api/v1/jobs/'+ jobName + '/' + buildNumber + '/status' ;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('GET');
        applyHeaders(request);

        Http http = new Http();
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == Bwc_Constants.callOutStatus_200) {
            System.debug('Jenkins Job Step Response: ' + response.getBody());
            return getResponseMap(response.getBody());
        } else {
            throw new CalloutException('Jenkins API GET call failed: ' + response.getBody());
        }
    }
}