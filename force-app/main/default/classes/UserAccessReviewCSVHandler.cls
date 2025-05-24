/**
 * Created by mp1863 on 28/4/25.
 * Class which will fetch the CSV file from OneDrive and process it to create the User_Access_Review__c records
 */
public with sharing class UserAccessReviewCSVHandler {

    @InvocableMethod(label='Process User Access Review CSV' description='Fetches and processes the CSV file from OneDrive.')
    public static void processCSV() {
        makeCallOut();
    }
    @future(callout=true)
    public static void makeCallOut(){
        // Step 1: Fetch the file from OneDrive
        String csvContent = fetchCSVFromOneDrive();
        System.debug('csvContent:::'+csvContent);

        // Step 2: Parse the CSV content
        if (String.isNotBlank(csvContent)) {
            List<User_Access_Review__c> recordsToUpsert = parseCSV(csvContent);

            // Step 3: Upsert records
            if (!recordsToUpsert.isEmpty()) {
                try {
                    upsert recordsToUpsert User_Access_Review__c.Federation_Identifier__c;
                } catch (DmlException ex) {
                    System.debug('Error during upsert: ' + ex.getMessage());
                    throw new UserAccessException('Failed to upsert records: ' + ex.getMessage());
                }
            }
        } else {
            throw new UserAccessException('CSV content is empty.');
        }
    }

    private static String fetchCSVFromOneDrive() {
        // Build the OneDrive API URL for the specific folder and file
        String folderName = System.Label.One_Drive_ACC_Copado_Folder_Output;
        String fileName = System.Label.One_Drive_ACC_Copado_Folder_Output_File;
        String apiEndpoint = 'callout:OneDrive_API/v1.0/me/drive/root:/' + folderName + '/' + fileName + ':/content';

        // Make the HTTP GET request
        HttpRequest req = new HttpRequest();
        req.setEndpoint(apiEndpoint);
        req.setMethod('GET');

        Http http = new Http();
        HttpResponse res = http.send(req);

        // Check if the response is a redirect (302 Status Code)
        if (res.getStatusCode() == 302) {
            // Extract the redirect URL from the response headers
            String redirectUrl = res.getHeader('Location');
            System.debug('Redirect URL: ' + redirectUrl);

            if (String.isNotBlank(redirectUrl)) {
                // Make another HTTP GET request to the redirect URL
                HttpRequest redirectReq = new HttpRequest();
                redirectReq.setEndpoint(redirectUrl);
                redirectReq.setMethod('GET');

                HttpResponse redirectRes = http.send(redirectReq);

                if (redirectRes.getStatusCode() == 200) {
                    return redirectRes.getBody(); // Return the CSV content
                } else {
                    throw new UserAccessException('Failed to fetch file from redirected URL. Status: ' + redirectRes.getStatusCode());
                }
            } else {
                throw new UserAccessException('Redirect URL is empty. Unable to fetch file.');
            }
        } else if (res.getStatusCode() == 200) {
            return res.getBody(); // Return the CSV content directly
        } else {
            System.debug('Failed to fetch file. Status: ' + res.getStatusCode() + ', Response: ' + res.getBody());
            throw new UserAccessException('Failed to fetch file from OneDrive. Status: ' + res.getStatusCode());
        }
    }

    private static List<User_Access_Review__c> parseCSV(String csvContent) {
        List<User_Access_Review__c> records = new List<User_Access_Review__c>();
        List<String> rows = csvContent.split('\n');

        for (Integer i = 1; i < rows.size(); i++) { // Skip the header row
            List<String> columns = rows[i].split(',');

            // Handle Manager Name with double quotes
            String managerName = columns[6].replace('"', '');

            // Create a new record
            records.add(new User_Access_Review__c(
                Federation_Identifier__c = columns[2],
                First_Name__c = columns[0],
                Last_Name__c = columns[1],
                Att_Email__c = columns[3],
                Intl_Email__c = columns[4],
                Manager_Name__c = managerName,
                Manager_Email__c = columns[7],
                Certification_Status__c  = 'Pending',
                User__c = columns[5]
            ));
        }

        return records;
    }
}