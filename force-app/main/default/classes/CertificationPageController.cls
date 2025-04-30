public without sharing class CertificationPageController {
    public String token {
        get {
            if (token == null) {
                // Check URL only on initial load
                token = ApexPages.currentPage().getParameters().get('token');
            }
            return token;
        }
        set;
    }
    public String managerName {
        get;
        set;
    }
    public List < User_Access_Review__c > reportees {
        get;
        set;
    }
    public Map < Id, Boolean > selectedReporteeIds {
        get;
        set;
    }
    public Id selectedRecordId {
        get;
        set;
    }

    @RemoteAction
    public static void storeToken(String inputToken) {
        // Not needed for this approach, but kept for compatibility
    }

    public CertificationPageController() {
        selectedReporteeIds = new Map < Id, Boolean > ();
        token = ApexPages.currentPage().getParameters().get('token');

        System.debug('Page Parameters: ' + ApexPages.currentPage().getParameters());
        System.debug('Retrieved Token: ' + token);
        reportees = [
            SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c, Att_Email__c, Intl_Email__c, Manager_Name__c, Certification_Status__c
            FROM User_Access_Review__c
            WHERE Certification_Token__c =: token AND(Certification_Status__c = 'Pending'
                OR Certification_Status__c = 'Certified'
                OR Certification_Status__c = 'Rejected')
        ];

        for (User_Access_Review__c ua: reportees) {
            System.debug(ua.First_Name__c);
            System.debug(ua.Last_Name__c);
            System.debug(ua.Federation_Identifier__c);

            selectedReporteeIds.put(ua.Id, false);
        }
        if (!reportees.isEmpty()) {
            managerName = reportees[0].Manager_Name__c;
        }
    }
    public void certifySingle() {
        User_Access_Review__c record = [SELECT Id, Certification_Status__c FROM User_Access_Review__c WHERE Id =: selectedRecordId];
        record.Certification_Status__c = 'Certified';
        record.Last_Review_Date__c = System.now();
        update record;
        
        reportees = [
            SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c, Att_Email__c, Intl_Email__c, Manager_Name__c, Certification_Status__c
            FROM User_Access_Review__c
            WHERE Certification_Token__c =: token AND(Certification_Status__c = 'Pending'
                OR Certification_Status__c = 'Certified'
                OR Certification_Status__c = 'Rejected')
        ];
        ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'User has been certified.'));
    }
    public void uncertifySingle() {
        User_Access_Review__c record = [SELECT Id, Certification_Status__c FROM User_Access_Review__c WHERE Id =: selectedRecordId];
        record.Certification_Status__c = 'Rejected';
        record.Last_Review_Date__c = System.now();
        update record;
		
        // Refresh the reportees list to reflect the updated status
        reportees = [
            SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c, Att_Email__c, Intl_Email__c, Manager_Name__c, Certification_Status__c
            FROM User_Access_Review__c
            WHERE Certification_Token__c =: token AND(Certification_Status__c = 'Pending'
                OR Certification_Status__c = 'Certified'
                OR Certification_Status__c = 'Rejected')
        ];
        if(!reportees.isEmpty())
        	ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'User has been Uncertified.'));
    }
    public void bulkCertify() {
        List < User_Access_Review__c > recordsToCertify = new List < User_Access_Review__c > ();
        for (Id recordId: selectedReporteeIds.keySet()) {
            if (selectedReporteeIds.get(recordId) == true) { // If checkbox is selected
                User_Access_Review__c record = new User_Access_Review__c(Id = recordId, Certification_Status__c = 'Certified', Last_Review_Date__c = System.now());
                recordsToCertify.add(record);
            }
        }
        if (!recordsToCertify.isEmpty()) {
            update recordsToCertify;
        }else{
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No records selected for bulk action.'));
        }
        reportees = [
            SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c, Att_Email__c, Intl_Email__c, Manager_Name__c, Certification_Status__c
            FROM User_Access_Review__c
            WHERE Certification_Token__c =: token AND(Certification_Status__c = 'Pending'
                OR Certification_Status__c = 'Certified'
                OR Certification_Status__c = 'Rejected')
        ];
        if (!recordsToCertify.isEmpty())
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'Selected users have been certified.'));
    }
    public void bulkUncertify() {
        List < User_Access_Review__c > recordsToUncertify = new List < User_Access_Review__c > ();
        for (Id recordId: selectedReporteeIds.keySet()) {
            if (selectedReporteeIds.get(recordId) == true) { // If checkbox is selected
                User_Access_Review__c record = new User_Access_Review__c(Id = recordId, Certification_Status__c = 'Rejected', Last_Review_Date__c = System.now());
                recordsToUncertify.add(record);
            }
        }
        if (!recordsToUncertify.isEmpty()) {
            update recordsToUncertify;
        }else{
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No records selected for bulk action.'));
        }
        reportees = [
            SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c, Att_Email__c, Intl_Email__c, Manager_Name__c, Certification_Status__c
            FROM User_Access_Review__c
            WHERE Certification_Token__c =: token AND(Certification_Status__c = 'Pending'
                OR Certification_Status__c = 'Certified'
                OR Certification_Status__c = 'Rejected')
        ];
        if (!recordsToUncertify.isEmpty())
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'Selected users have been uncertified.'));
    }
}