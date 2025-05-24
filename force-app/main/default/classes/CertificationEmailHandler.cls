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

        // Step 4: Queue the email sending process
        System.enqueueJob(new CertificationEmailQueueable(managerToReportees));
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

    public class CertificationEmailQueueable implements Queueable, Database.AllowsCallouts {
        private Map<String, List<User_Access_Review__c>> managerToReportees;

        public CertificationEmailQueueable(Map<String, List<User_Access_Review__c>> managerToReportees) {
            this.managerToReportees = managerToReportees;
        }

        public void execute(QueueableContext context) {
            List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
            List<String> managerEmails = new List<String>(managerToReportees.keySet());

            // Process up to 10 emails (governor limit)
            for(Integer i = 0; i < Math.min(10, managerEmails.size()); i++) {
                String managerEmail = managerEmails[i];
                emails.add(createCertificationEmail(managerEmail, managerToReportees.get(managerEmail)));
                managerToReportees.remove(managerEmail); // Remove processed managers
            }

            // Send the current batch
            if(!emails.isEmpty() && System.Label.Send_Email_On_for_user_review.equals('Y')) {
                try {
                    Messaging.sendEmail(emails);
                } catch (Exception e) {
                    System.debug('Error sending emails: ' + e.getMessage());
                }
            }

            // Chain next job if more managers remain
            if(!managerToReportees.isEmpty()) {
                System.enqueueJob(new CertificationEmailQueueable(managerToReportees));
            }
        }

        private Messaging.SingleEmailMessage createCertificationEmail(String managerEmail, List<User_Access_Review__c> reportees) {
            String secureLink = System.Label.SecureLink  +
                    reportees[0].Certification_Token__c;

            String reporteesTable = '';
            for(User_Access_Review__c reportee : reportees) {
                reporteesTable += '<tr><td>' + reportee.First_Name__c + '</td><td>' + reportee.Last_Name__c + '</td><td>'
                        + reportee.Federation_Identifier__c + '</td><td>' + reportee.Att_Email__c + '</td>'
                        + '</tr>';
            }

            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new List<String>{managerEmail});
            email.setSubject('Certify Your Reportees');
            email.setHtmlBody(
                    '<p>Dear ' + reportees[0].Manager_Name__c + ',</p>' +
                            '<p>Please review Copado access for the following reportees. Please note that users who are not certified will be automatically deactivated after one week.</p>' +
                            '<table border="1" style="border-collapse: collapse;">' +
                            '<thead><tr><th>First Name</th><th>Last Name</th><th>Federation Identifier</th><th>Att Email</th></tr></thead>' +
                            '<tbody>' + reporteesTable + '</tbody></table>' +
                            '<p><a href="' + secureLink + '">Certify Reportees</a></p>' +
                            '<p>Thank you,<br>The Certification Team</p>'
            );
            return email;
        }
    }
}