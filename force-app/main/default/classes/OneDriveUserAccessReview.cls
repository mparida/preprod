public with sharing class OneDriveUserAccessReview {
    // Method to generate and upload the CSV file
    public static void generateAndUploadCSV() {
        try {
            // Step 1: Query Users
            List<User> users = [
                SELECT FirstName, LastName, FederationIdentifier
                FROM User
                WHERE IsActive = true
                AND FederationIdentifier != null
                AND Profile.Name IN ('System Administrator', 'Developer') LIMIT 1
            ];

            if (users.isEmpty()) {
                System.debug('No users found matching the criteria.');
                return;
            }

            // Step 2: Generate CSV Content
            String csvContent = 'First Name,Last Name,FederationIdentifier,Att Email,Intl Email|'; // Header

            for (User user : users) {
                String federationId = user.FederationIdentifier;
                String attEmail = federationId + '@att.com';
                String intlEmail = federationId + '@intl.att.com';

                csvContent += user.FirstName + ',' +
                              user.LastName + ',' +
                              federationId + ',' +
                              attEmail + ',' +
                              intlEmail + '|';
            }
			csvContent = csvContent.removeEnd('|');
            System.debug('Generated CSV Content: \n' + csvContent);

            // Step 3: Upload File to OneDrive
            uploadCSVToOneDrive(System.Label.One_Drive_ACC_Copado_Folder, 'UserAccessReview.csv', csvContent);

        } catch (Exception e) {
            System.debug('Error in generateAndUploadCSV: ' + e.getMessage());
        }
    }

    // Method to upload the CSV file to OneDrive
    private static void uploadCSVToOneDrive(String folderName, String fileName, String fileContent) {
        try {
            // Step 3.1: URL Encode the folder name
            String encodedFolderName = EncodingUtil.urlEncode(folderName, 'UTF-8');
            String encodedFileName = EncodingUtil.urlEncode(fileName, 'UTF-8');

            // Check if the folder exists
            HttpRequest checkFolderReq = new HttpRequest();
            checkFolderReq.setEndpoint('callout:OneDrive_API/v1.0/me/drive/root:/' + encodedFolderName);
            checkFolderReq.setMethod('GET');

            Http http = new Http();
            HttpResponse checkFolderRes = http.send(checkFolderReq);

            if (checkFolderRes.getStatusCode() == 404) {
                //throw new System.Exception('The folder "' + folderName + '" does not exist in OneDrive.');
            } else if (checkFolderRes.getStatusCode() != 200) {
                //throw new System.Exception('Failed to check folder existence. Status Code: ' + checkFolderRes.getStatusCode());
            }

            System.debug('Folder "' + folderName + '" exists.');

            // Step 3.2: Upload the file to the folder
            HttpRequest uploadFileReq = new HttpRequest();
            uploadFileReq.setEndpoint('callout:OneDrive_API/v1.0/me/drive/root:/' + encodedFolderName + '/' + encodedFileName + ':/content');
            uploadFileReq.setMethod('PUT');
            uploadFileReq.setHeader('Content-Type', 'text/csv');
            uploadFileReq.setBody(fileContent);

            HttpResponse uploadFileRes = http.send(uploadFileReq);

            if (uploadFileRes.getStatusCode() == 201 || uploadFileRes.getStatusCode() == 200) {
                System.debug('File uploaded successfully: ' + uploadFileRes.getBody());
            } else {
                //throw new System.Exception('Failed to upload file. Status Code: ' + uploadFileRes.getStatusCode());
            }
        } catch (Exception e) {
            System.debug('Error in uploadCSVToOneDrive: ' + e.getMessage());
        }
    }
}