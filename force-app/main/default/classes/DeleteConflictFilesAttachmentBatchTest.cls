@IsTest(SeeAllData=true)
public class DeleteConflictFilesAttachmentBatchTest {
	static testMethod void testDeleteAttachmentsBatch() {
		List<copado__Git_Repository__c> gitList = new List<copado__Git_Repository__c>([Select id from copado__Git_Repository__c 
                                                                                  where name = 'ACC_SFDC']);
        System.debug('Size of git list:'+gitList.size());
        id gitId;
        if(gitList.size() > 0){
            gitId = gitList[0].Id;
            System.debug('Git id is :'+gitId);
        }
        Attachment attachment = new Attachment(
            Name = 'Test.conflict',
            ParentId = gitId,
            Body = Blob.valueOf('Test attachment content')
        );
        insert attachment;

        Attachment attachment2 = new Attachment(
            Name = 'OtherFile.conflict',
            ParentId = gitId,
            Body = Blob.valueOf('Test attachment content')
        );
        insert attachment2;

        Test.startTest();        
        DeleteConflictFilesBatchSchedule schedulable = new DeleteConflictFilesBatchSchedule();
        String jobId = System.schedule('Test Delete Attachments Schedulable', '0 0 * * * ?', schedulable);
        System.assertNotEquals(null, jobId);
        Test.stopTest();

    }
}