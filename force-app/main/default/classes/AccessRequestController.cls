public with sharing class AccessRequestController {
    public ACC_Environment_Access__c accessRequest { get; set; }
    public String selectedEnvironmentId { get; set; }

    public AccessRequestController() {
        accessRequest = new ACC_Environment_Access__c();
    }

    public List<SelectOption> getEnvironmentOptions() {
        List<SelectOption> options = new List<SelectOption>();
        options.add(new SelectOption('Select', 'Select'));
        Map<String, Access_Mgmt_Envs__mdt> envMap = Access_Mgmt_Envs__mdt.getAll();
        for (Access_Mgmt_Envs__mdt env : envMap.values()) {
            options.add(new SelectOption(env.MasterLabel, env.DeveloperName));
        }
        return options;
    }

    public PageReference saveAccessRequest() {
        try {
            if (validateFields()) {
                copado__Org__c org = [SELECT Id FROM copado__Org__c WHERE Name = :selectedEnvironmentId];
                accessRequest.Environment_Name__c = org.Id;
                insert accessRequest;
                ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'Access Request Submitted Successfully!'));
                accessRequest = new ACC_Environment_Access__c();
            }
        } catch (Exception e) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error: ' + e.getMessage()));
        }
        return null;
    }

    public PageReference saveCreateAccessRequest() {
        try {
            if (validateCreateAccessFields()) {
                copado__Org__c org = [SELECT Id FROM copado__Org__c WHERE Name = :selectedEnvironmentId];
                accessRequest.Environment_Name__c = org.Id;
                accessRequest.RecordTypeId = Schema.SObjectType.ACC_Environment_Access__c.getRecordTypeInfosByDeveloperName().get('Create_Access').getRecordTypeId();
                insert accessRequest;
                ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'User Created Successfully!'));
                accessRequest = new ACC_Environment_Access__c();
            }
        } catch (Exception e) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error: ' + e.getMessage()));
        }
        return null;
    }

    private Boolean validateFields() {
        return selectedEnvironmentId != null && !selectedEnvironmentId.equals('Select') && accessRequest.ATT_UID__c != null && accessRequest.Profile_Access__c != null;
    }

    private Boolean validateCreateAccessFields() {
        return selectedEnvironmentId != null && !selectedEnvironmentId.equals('Select') &&
                accessRequest.First_Name__c != null && accessRequest.Last_Name__c != null &&
                accessRequest.ATT_Email__c != null && accessRequest.Replicate_UserName__c != null;
    }
}
