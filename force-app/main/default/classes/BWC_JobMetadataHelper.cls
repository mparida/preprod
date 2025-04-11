/**
 * Created by mp1863 on 21/02/25.
 */

public class BWC_JobMetadataHelper {

    public class BuildParameters {
        public String branch;
        public String environment;
        public String logLevel;
    }

    public class JobMetadata {
        public String jobName;
        public BuildParameters buildParameters;
        public String triggeredBy;
    }

    public static String getSerializedJobMetadata(String jobName, String accEnv) {
        // Fetch metadata record
        Jenkins_Job_Config__mdt jobConfig = [
                SELECT Job_Name__c, Branch__c, Environment__c, Log_Level__c, Triggered_By__c
                FROM Jenkins_Job_Config__mdt
                WHERE Job_Name__c = :jobName AND
                Acc_Environment__c =: accEnv
                LIMIT 1
        ];

        // Populate Apex classes
        JobMetadata jobMetadata = new JobMetadata();
        jobMetadata.jobName = jobConfig.Job_Name__c;
        jobMetadata.triggeredBy = jobConfig.Triggered_By__c;

        BuildParameters params = new BuildParameters();
        params.branch = jobConfig.Branch__c;
        params.environment = jobConfig.Environment__c;
        params.logLevel = jobConfig.Log_Level__c;
        jobMetadata.buildParameters = params;

        // Convert to JSON
        return JSON.serialize(jobMetadata);
    }
}