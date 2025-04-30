/**
 * Created by mp1863 on 28/4/25.
 */
public with sharing class CertificationEmailHandler {

    @InvocableMethod(label='Send Certification Emails' description='Send emails to managers to certify their reportees.')
    public static void sendCertificationEmails() {
        // Step 1: Query all managers and their reportees
        List<User_Access_Review__c> reviews = [
            SELECT Id, First_Name__c, Last_Name__c, Federation_Identifier__c, Att_Email__c, Intl_Email__c,
                   Manager_Name__c, Manager_Email__c, Certification_Token__c
            FROM User_Access_Review__c
            WHERE Certification_Status__c = 'Pending'
        ];

        // Step 2: Organize reportees by manager
        Map<String, List<User_Access_Review__c>> managerToReportees = new Map<String, List<User_Access_Review__c>>();
        for (User_Access_Review__c review : reviews) {
            if (!managerToReportees.containsKey(review.Manager_Email__c)) {
                managerToReportees.put(review.Manager_Email__c, new List<User_Access_Review__c>());
            }
            managerToReportees.get(review.Manager_Email__c).add(review);
        }

        // Step 3: Generate tokens and update records
        for (String managerEmail : managerToReportees.keySet()) {
            String uniqueToken = generateUniqueToken();
            for (User_Access_Review__c reportee : managerToReportees.get(managerEmail)) {
                reportee.Certification_Token__c = uniqueToken;
            }
        }

        try {
            update reviews; // Save the tokens to the records
        } catch (DmlException ex) {
            System.debug('Error updating tokens: ' + ex.getMessage());
            throw new UserAccessException('Failed to update certification tokens.');
        }

        // Step 4: Send emails to managers
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (String managerEmail : managerToReportees.keySet()) {
            // Generate the secure link
            String secureLink = 'https://accdevops23--preprod.sandbox.my.salesforce-sites.com/AccessReview?token=' +
                                managerToReportees.get(managerEmail)[0].Certification_Token__c;

            // Build reportee table for the email
            String reporteesTable = '';
            for (User_Access_Review__c reportee : managerToReportees.get(managerEmail)) {
                reporteesTable += '<tr><td>' + reportee.First_Name__c + '</td><td>' + reportee.Last_Name__c + '</td><td>' 
                                  + reportee.Federation_Identifier__c + '</td><td>' + reportee.Att_Email__c + '</td><td>' 
                                  + reportee.Intl_Email__c + '</td></tr>';
            }

            // Build the email
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new List<String>{managerEmail});
            email.setSubject('Certify Your Reportees');
            email.setHtmlBody(
                '<p>Dear ' + managerToReportees.get(managerEmail)[0].Manager_Name__c + ',</p>' +
                '<p>Please review the following reportees:</p>' +
                '<table border="1" style="border-collapse: collapse;">' +
                '<thead><tr><th>First Name</th><th>Last Name</th><th>Federation Identifier</th><th>Att Email</th><th>Intl Email</th></tr></thead>' +
                '<tbody>' + reporteesTable + '</tbody></table>' +
                '<p><a href="' + secureLink + '">Certify Reportees</a></p>' +
                '<p>Thank you,<br>The Certification Team</p>'
            );

            emails.add(email);
        }

        Messaging.sendEmail(emails);
    }

    private static String generateUniqueToken() {
        // Generate cryptographically secure random bytes
        Blob randomBlob = Crypto.generateAesKey(256); // 256-bit random data
        String base64Token = EncodingUtil.base64Encode(randomBlob);

        // Make URL-safe and trim to exactly 255 characters
        String safeToken = base64Token
                .replace('+', '-')
                .replace('/', '_')
                .replace('=', '')
                .left(255);

        return safeToken;
    }

}