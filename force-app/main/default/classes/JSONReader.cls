global with sharing class JSONReader {
    public String instructions;
    public List<Parameters> parameters;
    public Boolean runOnValidationDeployment;

    public class Parameters {
        public String name;
        public String value;
    }
    @InvocableMethod(label = 'Read JSON')
    global static List<copado__JobStep__c> readJson(List<Id> ids){
        List<copado__JobStep__c> jobStepList = new List<copado__JobStep__c>([Select id, copado__ConfigJson__c from copado__JobStep__c where Id =: ids.get(0)]);
        copado__JobStep__c  jobStep;
        if(jobStepList != null && jobStepList.size() > 0){
            jobStep = jobStepList.get(0);
        }
        JSONReader jsonRead = (JSONReader)JSON.deserialize(jobStep.copado__ConfigJson__c, JSONReader.class);
        if(!String.isEmpty(jsonRead.instructions)){
            jobStep.Steps_to_execute__c = jsonRead.instructions;
        }
        try {
            upsert jobStepList;
        } catch (DmlException e) {
            return jobStepList;
        }
        return jobStepList;
    }
}