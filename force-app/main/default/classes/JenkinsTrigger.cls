public class JenkinsTrigger {
    public static void triggerJenkinsJob(String cityName) {
        // Encode city name for URL (e.g., replace spaces with %20)
        String encodedCity = EncodingUtil.urlEncode(cityName, 'UTF-8');

        // Jenkins job URL with the CITY parameter
        String jenkinsUrl = 'callout:Jenkins_Auth/job/Weather%20Pipeline/buildWithParameters?CITY_NAME=' + encodedCity;

        HttpRequest req = new HttpRequest();
        req.setEndpoint(jenkinsUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');

        Http http = new Http();
        HttpResponse res = http.send(req);
        
        System.debug('print response:::'+res);

        if (res.getStatusCode() == 201) {
            System.debug('🎉 Jenkins job triggered successfully for city: ' + cityName);
        } else {
            System.debug('Failed to trigger Jenkins for ' + cityName + ': ' + res.getBody());
        }
    }
}