/**
 * Created by manojparida on 12/02/25.
 */

global  class JenkinsJobStatusScheduler implements Schedulable {
    private String jobUrl;
    private Id promotionTestId;

    public JenkinsJobStatusScheduler(String jobUrl, Id promotionTestId) {
        this.jobUrl = jobUrl;
        this.promotionTestId = promotionTestId;
    }

    global void execute(SchedulableContext sc) {
        Map<String, Object> queueMap = JenkinsJobService.getJenkinsJobStatus(jobUrl);
        System.debug('Job Status Retrieved After Delay: ' + queueMap);
    }
}