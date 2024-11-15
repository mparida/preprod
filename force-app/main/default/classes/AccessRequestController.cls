public with sharing class AccessRequestController {

    // Variable to store the new access request record
    public ACC_Environment_Access__c accessRequest { get; set; }
    public String selectedEnvironmentId { get; set; }

    // Constructor to initialize the access request object
    public AccessRequestController() {
        accessRequest = new ACC_Environment_Access__c();
    }

    // Method to get the available Environment options from the lookup field (Environment_Name__c)
    public List<SelectOption> getEnvironmentOptions() {
        System.debug('getEnvironmentOptions');
        List<SelectOption> options = new List<SelectOption>();
        options.add(new SelectOption('Select', 'Select'));
        Map<String, Access_Mgmt_Envs__mdt > envMap = Access_Mgmt_Envs__mdt.getAll();
    	for (Access_Mgmt_Envs__mdt  env : envMap.values()) {
        	options.add(new SelectOption(env.MasterLabel, env.DeveloperName));
    	}
        
        return options;
    }

    // Method to save the access request with form inputs
    public PageReference saveAccessRequest() {
        System.debug('SUBMIT SITES');
        if(validateFields()){
            try {
            copado__Org__c org = [SELECT Id from copado__Org__c  WHERE NAME =: selectedEnvironmentId];
            accessRequest.Environment_Name__c = org.Id;
            // Insert the new access request record
            insert accessRequest;
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'Access Request Submitted Successfully!'));

            // Clear the form after successful save
            accessRequest = new ACC_Environment_Access__c();
            return null;
            } catch (Exception e) {
                System.debug('Error in saveAccessRequest: ' + e.getStackTraceString ());
                System.debug('Error in saveAccessRequest: ' + e.getMessage());  // Log any errors during insert
                ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error: ' + e.getMessage()));
                return null;
            }
        }else {
        	System.debug('Validation Failed');  // Log if validation fails
    	}
        return null;
    }
    
    private Boolean validateFields() {
        Boolean isValid = true;

        if (selectedEnvironmentId == null || selectedEnvironmentId == 'Select') { // Check selectedEnvironmentId instead of lookup field
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Environment is required.'));
            isValid = false;
        }
        if (String.isBlank(accessRequest.ATT_UID__c)) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'User Name is required.'));
            isValid = false;
        }
        if (accessRequest.Profile_Access__c == null) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Profile is required.'));
            isValid = false;
        }
        if (accessRequest.Access_Given_For__c == null) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Duration for Access is required.'));
            isValid = false;
        }
        
        return isValid;
    }
}