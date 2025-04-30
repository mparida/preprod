public without sharing class CertificationPageController {
    public String token {
        get {
            if(token == null) {
                // First check URL parameters (initial load)
                token = ApexPages.currentPage().getParameters().get('token');

                // Then check hidden field (postbacks)
                if(String.isBlank(token)) {
                    token = ApexPages.currentPage().getParameters().get('hiddenToken');
                }
            }
            return token;
        }
        set;
    }
    public String managerName { get; set; }
    public List<User_Access_Review__c> reportees { get; set; }
    public Map<Id, Boolean> selectedReporteeIds { get; set; }
    public Id selectedRecordId { get; set; }

    // Track record states
    public Map<Id, Boolean> isCertifiedMap { get; private set; }
    public Map<Id, Boolean> isRejectedMap { get; private set; }

    public CertificationPageController() {
        selectedReporteeIds = new Map<Id, Boolean>();
        //token = ApexPages.currentPage().getParameters().get('token');
        isCertifiedMap = new Map<Id, Boolean>();
        isRejectedMap = new Map<Id, Boolean>();
        String tempToken = token;
        loadReportees();

        if(!reportees.isEmpty()) {
            managerName = reportees[0].Manager_Name__c;
        }
    }

    private void loadReportees() {
        reportees = [
                SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c,
                        Att_Email__c, Manager_Name__c, Certification_Status__c
                FROM User_Access_Review__c
                WHERE Certification_Token__c = :token
                AND Certification_Status__c IN ('Pending', 'Certified', 'Rejected')
                ORDER BY Last_Name__c, First_Name__c
        ];

        // Reset maps
        isCertifiedMap.clear();
        isRejectedMap.clear();
        selectedReporteeIds.clear();

        for(User_Access_Review__c uar : reportees) {
            selectedReporteeIds.put(uar.Id, false);
            isCertifiedMap.put(uar.Id, uar.Certification_Status__c == 'Certified');
            isRejectedMap.put(uar.Id, uar.Certification_Status__c == 'Rejected');
        }
    }

    public void certifySingle() {
        update new User_Access_Review__c(
                Id = selectedRecordId,
                Certification_Status__c = 'Certified',
                Last_Review_Date__c = System.now()
        );
        loadReportees();
        ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'Access has been kept.'));
    }

    public void uncertifySingle() {
        update new User_Access_Review__c(
                Id = selectedRecordId,
                Certification_Status__c = 'Rejected',
                Last_Review_Date__c = System.now()
        );
        loadReportees();
        ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'Access has been removed.'));
    }
    public void bulkCertify() {
        List<User_Access_Review__c> toUpdate = new List<User_Access_Review__c>();
        for(Id recordId : selectedReporteeIds.keySet()) {
            if(selectedReporteeIds.get(recordId)) {
                toUpdate.add(new User_Access_Review__c(
                        Id = recordId,
                        Certification_Status__c = 'Certified',
                        Last_Review_Date__c = System.now()
                ));
            }
        }

        if(!toUpdate.isEmpty()) {
            update toUpdate;
            loadReportees();
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO,
                    'Selected users have been certified.'));
        } else {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR,
                    'No records selected for bulk action.'));
        }
    }

    public void bulkUncertify() {
        List<User_Access_Review__c> toUpdate = new List<User_Access_Review__c>();
        for(Id recordId : selectedReporteeIds.keySet()) {
            if(selectedReporteeIds.get(recordId)) {
                toUpdate.add(new User_Access_Review__c(
                        Id = recordId,
                        Certification_Status__c = 'Rejected',
                        Last_Review_Date__c = System.now()
                ));
            }
        }

        if(!toUpdate.isEmpty()) {
            update toUpdate;
            loadReportees();
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO,
                    'Selected users have been rejected.'));
        } else {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR,
                    'No records selected for bulk action.'));
        }
    }
}