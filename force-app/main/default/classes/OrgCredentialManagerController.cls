public with sharing class OrgCredentialManagerController {
    public String selectedOrgName { get; set; }
    public String existingUsername { get; set; }
    public String existingPassword { get; set; }
    public Boolean hasExistingCredential { get; private set; }
    public List<SelectOption> orgOptions { get; private set; }
    private Org_Credential__c currentCredential;

    public String newOrgName { get; set; }
    public String newUsername { get; set; }
    public String newPassword { get; set; }

    public OrgCredentialManagerController() {
        loadOrgOptions();
        clearExistingCredentialFields();
    }

    private void loadOrgOptions() {
        orgOptions = new List<SelectOption>();
        orgOptions.add(new SelectOption('', '-- Select Org --'));
        for (Org_Credential__c cred : [SELECT Name FROM Org_Credential__c ORDER BY Name]) {
            orgOptions.add(new SelectOption(cred.Name, cred.Name));
        }
    }

    public void loadSelectedCredential() {
        if (String.isBlank(selectedOrgName)) {
            clearExistingCredentialFields();
            return;
        }
        List<Org_Credential__c> creds = [
            SELECT Id, EncryptedUserName__c, EncryptedPassword__c
            FROM Org_Credential__c
            WHERE Name = :selectedOrgName
            LIMIT 1
        ];
        if (!creds.isEmpty()) {
            currentCredential = creds[0];
            try {
                existingUsername = CredentialEncryptionUtil.decrypt(currentCredential.EncryptedUserName__c);
                existingPassword = CredentialEncryptionUtil.decrypt(currentCredential.EncryptedPassword__c);
                hasExistingCredential = true;
            } catch (Exception e) {
                ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error decrypting credentials.'));
                clearExistingCredentialFields();
            }
        } else {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'No credentials found for selected Org.'));
            clearExistingCredentialFields();
        }
    }

    public PageReference saveExistingCredential() {
        if (String.isBlank(selectedOrgName)) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Please select an Org to update.'));
            return null;
        }
        if (String.isBlank(existingUsername) ||
                (String.isBlank(existingPassword) && !hasExistingCredential)) {
            ApexPages.addMessage(new ApexPages.Message(
                    ApexPages.Severity.ERROR,
                    'Username cannot be empty, and password is required for new credentials'));
            return null;
        }
        if (currentCredential == null) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Credential record not found.'));
            return null;
        }
        try {
            currentCredential.EncryptedUserName__c = CredentialEncryptionUtil.encrypt(existingUsername);
            currentCredential.EncryptedPassword__c = CredentialEncryptionUtil.encrypt(existingPassword);
            update currentCredential;
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'Credentials updated successfully.'));
            loadSelectedCredential(); // Refresh decrypted values
        } catch (Exception e) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error updating credentials: ' + e.getMessage()));
        }
        return null;
    }

    public PageReference createNewCredential() {
        if (String.isBlank(newOrgName)) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Please enter Org Name for new credential.'));
            return null;
        }
        if (String.isBlank(newUsername) || String.isBlank(newPassword)) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Username and Password cannot be empty.'));
            return null;
        }
        Integer countExisting = [SELECT COUNT() FROM Org_Credential__c WHERE Name = :newOrgName];
        if (countExisting > 0) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Org Name already exists. Please select it from the dropdown to update.'));
            return null;
        }
        Org_Credential__c newCred = new Org_Credential__c();
        newCred.Name = newOrgName;
        newCred.EncryptedUserName__c = CredentialEncryptionUtil.encrypt(newUsername);
        newCred.EncryptedPassword__c = CredentialEncryptionUtil.encrypt(newPassword);
        try {
            insert newCred;
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'New credential created successfully.'));
            loadOrgOptions();  // Refresh dropdown options
            newOrgName = null;
            newUsername = null;
            newPassword = null;
        } catch (Exception e) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error creating credential: ' + e.getMessage()));
        }
        return null;
    }

    private void clearExistingCredentialFields() {
        existingUsername = null;
        existingPassword = null;
        hasExistingCredential = false;
        currentCredential = null;
    }

    public String passwordDisplay {
        get {
            if(currentCredential != null && currentCredential.EncryptedPassword__c != null) {
                try {
                    return CredentialEncryptionUtil.decrypt(currentCredential.EncryptedPassword__c);
                } catch(Exception e) {
                    return '[DECRYPTION ERROR]';
                }
            }
            return '';
        }
        set;
    }
}