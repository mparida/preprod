@RestResource(urlMapping='/AccountService/*')
global class AccountService {

    @HttpPost
    global static String createAccount(String name, String industry, String phone) {
        // Ensure user has the necessary permission to create accounts
        if (!Schema.sObjectType.Account.isCreateable()) {
            throw new SalesforceAccessDeniedException('User does not have permission to create Accounts.');
        }

        // Create an account
        Account acc = new Account();
        acc.Name = name;
        acc.Industry = industry;
        acc.Phone = phone;

        try {
            insert acc;
            return 'Account created successfully with ID: ' + acc.Id;
        } catch (Exception e) {
            throw new UserStoryException('Error creating account: ' + e.getMessage());
        }
    }
    
    // Custom exception for better error handling
    global class SalesforceAccessDeniedException extends Exception {}
}