@IsTest
private class ImportPresetComplianceRulesTest {
    @IsTest
    private static void execute() {
        // Setup
        System.runAs(copadoAdmin()) {
            // Exercise
            new ImportPresetComplianceRules().execute();
        }

        // Verify
        System.assertEquals(1, [SELECT COUNT() FROM copado__Compliance_Rule_Group__c], '1 Compliance Rule Group should be created.');
        System.assertEquals(
            15,
            [SELECT COUNT() FROM copado__Compliance_Rule__c WHERE copado__Is_Valid__c = TRUE],
            '15 Valid Compliance Rules should be created'
        );
        System.assertEquals(15, [SELECT COUNT() FROM copado__Compliance_Rule_Group_Item__c], '15 Compliance Rule Group Items should be created.');
        System.assertEquals(30, [SELECT COUNT() FROM copado__Compliance_Rule_Criteria__c], '30 Compliance Rule Criterias should be created');
    }

    // HELPER

    private static User copadoAdmin() {
        User user = createUser();

        copado.GlobalAPI copadoGlobalAPI = new copado.GlobalAPI();
        copado.GlobalAPI.UserLicense userLicense = new copado.GlobalAPI.UserLicense();
        userLicense.isCCMEnabled = true;
        userLicense.isCopadoEnabled = true;
        userLicense.isCCHEnabled = true;
        userLicense.userId = user.Id;
        copadoGlobalAPI.upsertCopadoLicense(userLicense);

        return user;
    }

    public static User createUser() {
        User runAsUser = new User(
            LastName = 'UserLastName',
            Username = 'username@myemail.com',
            Email = 'username@myemail.com',
            Alias = 'MyAlias',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = UserInfo.getProfileId(),
            LanguageLocaleKey = 'en_US'
        );
        insert runAsUser;
        return runAsUser;
    }
}