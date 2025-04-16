/**
 * Created by mp1863 on 18/02/25.
 */

public without sharing class JenkinsJobService1 {
    @InvocableMethod(Label='Jenkins Test Execution' Description='Get Status after 30 mins' Callout=true)
    public static void makeCallOutFromFromInvocableFlows(List<JenkinInvocableParams> paramsList){
        if(paramsList == null) return;
        for(JenkinInvocableParams param : paramsList){
            switch on param.apis[0] {
                when 'trigger jenkins job'{
                    System.enqueueJob(new TriggerJenkinsJobQueueable(param.ids[0], param.jobNames[0], param.envNames[0]!=null?param.envNames[0] : null));
                }when else {
                    System.enqueueJob(new GetJenkinsBuildStatusQueueable(param.ids[0]));
                }
            }
        }
    }

    // Fetch Mock Response for Job Trigger API from Salesforce
    public static Map<String, Object> getMockResponsePOST(String jobName) {
        Mock_Jenkins_Response__c mockData = [
                SELECT Location_URL__c, Status_Code__c, Response_JSON__c FROM Mock_Jenkins_Response__c
                WHERE Job_Name__c = :jobName AND API_Name__c = 'trigger jenkins job'
                LIMIT 1
        ];
        return getResponseMap(mockData.Response_JSON__c);
    }

    // Call Real Mule~Jenkins Job Trigger API
    public static Map<String, Object> initiateJenkinsJob(String jobName, String parameters) {
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
    
    public static Map<String, Object> initiateJenkinsJobMule() {
        String endpoint = 'https://digital-internal-api-dev-w2.az.3pc.att.com/ccapi/digital/dev-jenkins-integration-e/api/v1/jobs/trigger' ;
        System.debug('endpoint:'+endpoint);
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        String jsonString = '{' +
        '"jobName": "Monitoring_API_HealthCheck",' +
        '"buildParameters": {' +
        '"branch": "develop",' +
        '"environment": "qa",' +
        '"logLevel": "INFO"' +
        '},' +
        '"triggeredBy": "ccmule"' +
        '}';
        request.setBody(jsonString);
        applyHeaders(request);
        request.setHeader('client_id','91c01cf9bf5448f9bec1b94331de527f');
        request.setHeader('client_secret','2797FA1DC0104c469B5f17d4e90B561D');
        //request.setBody(parameters);

        Http http = new Http();
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == Bwc_Constants.callOutStatus_201) {
            System.debug('Response from Real Post call:::'+response.getBody());
            return getResponseMap(response.getBody());
        } else {
            throw new CalloutException('Jenkins API call failed: ' + response.getBody());
        }
    }
}