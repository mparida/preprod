/**
 * Created by mp1863 on 11/02/25.
 */

public with sharing class JenkinsJobService {

    public static Map<String, Object> triggerJenkinsJob(String jobName, Map<String, String> parameters) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance('Default_Settings').Is_Mock_Enabled__c;

        if (isMockEnabled) {
            System.debug('Mock Mode ON - Returning Stored Header Response');
            Map<String, Object> mockResponse =  getMockResponsePOST(jobName);
            //return mockResponse;
            System.debug((String) mockResponse.get('jobUrl'));
            System.debug((Decimal) mockResponse.get('statusCode'));
            Decimal status = (Decimal) mockResponse.get('statusCode');
            Map<String, Object> queueMap = getJenkinsJobStatus((String) mockResponse.get('jobUrl'));
            if(status == 201){
                queueMap.put('JobTriggerStatus', 'SUCCESS');
            }else{
                queueMap.put('JobTriggerStatus', 'FAIL');
            }
            //return getJenkinsJobStatus((String) mockResponse.get('jobUrl')); // Call GET after POST
            return queueMap;
        } else {
            System.debug('Mock Mode OFF - Calling Real Jenkins API');
            Map<String, Object> realResponse = initiateJenkinsJob(jobName, parameters);
            return getJenkinsJobStatus((String) realResponse.get('jobUrl')); // Call GET after POST
        }
    }

    // Fetch Mock Response from Salesforce
    private static Map<String, Object> getMockResponsePOST(String jobName) {
        Mock_Jenkins_Response__c mockData = [
                SELECT Location_URL__c, Status_Code__c FROM Mock_Jenkins_Response__c
                WHERE Job_Name__c = :jobName
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
        String endpoint = 'callout:Mulesoft_RTF1/job/' + EncodingUtil.urlEncode(jobName, 'UTF-8') + '/buildWithParameters';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        //req.setHeader('Authorization', 'Basic XXXXXX');  // Use Named Credentials ideally
        req.setBody(constructUrlEncodedParams(parameters)); // Proper URL encoding

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 201) {
            Map<String, Object> response = new Map<String, Object>();
            response.put('message', 'Job triggered successfully');
            response.put('queueId', extractQueueId(res.getHeader('Location')));
            response.put('jobUrl', res.getHeader('Location'));
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

    // Fetch Job Status from Jenkins (Real or Mock)
    public static Map<String, Object> getJenkinsJobStatus(String locationUrl) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance('Default_Settings').Is_Mock_Enabled__c;
        String apiUrl = locationUrl + '/api/json'; // Append /api/json

        if (isMockEnabled) {
            System.debug('Mock Mode ON - Returning Stored GET Response');
            return getMockJobStatus(apiUrl);
        } else {
            System.debug('Mock Mode OFF - Calling Real Jenkins API');
            return callRealJenkinsGetAPI(apiUrl);
        }
    }

    // Fetch Mock GET Response from Salesforce
    private static Map<String, Object> getMockJobStatus(String apiUrl) {
        System.debug('*********'+apiUrl);
        Mock_Jenkins_Response__c mockData = [
                SELECT Response_JSON__c FROM Mock_Jenkins_Response__c
                WHERE Method__c = 'GET' AND Location_URL__c = :apiUrl
                LIMIT 1
        ];

        if (mockData == null) {
            throw new CalloutException('Mock GET response not found for URL: ' + apiUrl);
        }
                Map<String, Object> resM = (Map<String, Object>)JSON.deserializeUntyped(mockData.Response_JSON__c);
        System.debug('resM::'+resM);
        return resM;
        //return (Map<String, Object>) JSON.deserializeUntyped(mockData.Response_JSON__c);
    }

    // Call Real Jenkins GET API Using Named Credentials
    private static Map<String, Object> callRealJenkinsGetAPI(String apiUrl) {
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


    //================GET JOB STATUS
    @InvocableMethod(label='Jenkins Test Execution Status' description='Get Status after 30 mins')
    public static void getJenkinsTestRunStatus(List<Id> scriptIds) {
        Id id;
        if(scriptIds!=null && scriptIds.size() > 0){
            id = scriptIds[0];
        }else{
            return;
        }

        if(id != null){
            getJenkinsJobStepStatusAsyn(id);


        }

    }
    @future(callout=true)
    public static void getJenkinsJobStepStatusAsyn(Id id) {
        Map<String, Object> response;
        Promotion_Test_Script__c pts ;
        pts = [
                SELECT id, Test_Script__r.Jenkins_Test_Suite_Name__c from Promotion_Test_Script__c WHERE Id =: id
        ];
        response = getJenkinsJobStepStatus(pts.Test_Script__r.Jenkins_Test_Suite_Name__c);
        if(response.containsKey('buildResult') ){
            pts.Job_Run_Status__c = (String)response.get('buildResult');
        }
        update pts;
    }
    public static Map<String, Object> getJenkinsJobStepStatus(String jobName) {
        Boolean isMockEnabled = Jenkins_Settings__mdt.getInstance('Default_Settings').Is_Mock_Enabled__c;

        // Construct API URL using Named Credentials
        String apiUrl = 'callout:Mulesoft_RTF1/job/' + EncodingUtil.urlEncode(jobName, 'UTF-8') + '/111/api/json';

        Map<String, Object> response;
        if (isMockEnabled) {
            System.debug('Mock Mode ON - Returning Stored Job Step Response');
            response = getMockJobStepStatus(jobName);
        } else {
            System.debug('Mock Mode OFF - Calling Real Jenkins API');
            response = callRealJenkinsJobStepAPI(apiUrl);
        }

        // Extract required fields
        Map<String, Object> extractedData = new Map<String, Object>();
        extractedData.put('buildNumber', response.containsKey('number') ? response.get('number') : null);
        extractedData.put('queueId', response.containsKey('queueId') ? response.get('queueId') : null);
        extractedData.put('buildResult', response.containsKey('result') ? response.get('result') : 'IN_PROGRESS'); // Default to IN_PROGRESS if null

        System.debug('Extracted Job Status: ' + extractedData);
        return extractedData;
    }

    // Fetch Mock GET Response for Job Step Status from Salesforce
    private static Map<String, Object> getMockJobStepStatus(String jobName) {
        Mock_Jenkins_Response__c mockData = [
                SELECT Response_JSON__c FROM Mock_Jenkins_Response__c
                WHERE Build__c = '111' AND Job_Name__c = :jobName
                LIMIT 1
        ];

        if (mockData == null) {
            throw new CalloutException('Mock GET response not found for Job Name: ' + jobName);
        }

        return (Map<String, Object>) JSON.deserializeUntyped(mockData.Response_JSON__c);
    }

    // Call Real Jenkins API Using Named Credentials
    private static Map<String, Object> callRealJenkinsJobStepAPI(String apiUrl) {
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
}