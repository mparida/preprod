public class DeleteConflictFilesBatch implements Database.Batchable<sObject>{
    
    public Database.QueryLocator start(Database.BatchableContext context) {
        Integer queryLimit = Integer.valueOf(Label.AttachmentQueryLimit);
        String query = 'SELECT Id FROM Attachment WHERE Name LIKE \'%.conflict\' LIMIT ' + queryLimit;
        return Database.getQueryLocator(query);
    }

    public void execute(Database.BatchableContext context, List<sObject> scope) {
        List<Attachment> attachmentsToDelete = (List<Attachment>) scope;
        if (attachmentsToDelete.size() > 0) {
            delete attachmentsToDelete;
        }
    }

    public void finish(Database.BatchableContext context) {
    }

}