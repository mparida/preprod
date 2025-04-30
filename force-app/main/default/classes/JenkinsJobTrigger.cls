public class JenkinsJobTrigger {
    
    public static String triggerJenkinsJob(
        String jobName, 
        String environment, 
        String branch, 
        String traceId,
        String productType,
        Boolean captureScreenshot
    ) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Mulesoft_RTF1/qa-jenkins-integration-e/api/v1/jobs/trigger');
        req.setMethod('POST');
        req.setTimeout(120000);
        req.setHeader('Content-Type', 'application/json');
        //req.setHeader('idp-trace-id', traceId);
        
        // Prepare the request body
        Map<String, Object> requestBody = new Map<String, Object>{
            'jobName' => jobName,
            'buildParameters' => new Map<String, Object>{
                'environment' => environment,
                'branch' => String.isNotBlank(branch) ? branch : '',
                'logLevel' => 'INFO',
                'productType' => String.isNotBlank(productType) ? productType : '',
                'track' => '', // Explicit empty string
                'captureScreenshot' => captureScreenshot != null ? String.valueOf(captureScreenshot) : ''
            },
            'triggeredBy' => 'Manoj123-34'
        };
        
        req.setBody(JSON.serialize(requestBody, true)); // Pretty print for debugging
        System.debug('PRINT rquest::'+req.getBody());
        
        try {
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            System.debug('Response Status: ' + res.getStatus());
            System.debug('Response Body: ' + res.getBody());
            
            if (res.getStatusCode() == 201) {
                Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
                return 'Job triggered successfully. Build Number: ' + responseMap.get('buildNumber');
            } else {
                // Try to parse error response
                try {
                    Map<String, Object> errorResponse = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
                    throw new CalloutException(
                        'HTTP ' + res.getStatusCode() + ' - ' + 
                        (errorResponse.containsKey('description') ? 
                         errorResponse.get('description') : res.getStatus())
                    );
                } catch(Exception e) {
                    throw new CalloutException('HTTP ' + res.getStatusCode() + ' - ' + res.getBody());
                }
            }
        } catch(Exception e) {
            System.debug('Callout error: ' + e.getMessage());
            throw new CalloutException('Failed to trigger job: ' + e.getMessage());
        }
    }
}