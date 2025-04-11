public class UserStoryApprovalController {
    public String approvalLink { get; set; }
    public Id storyId ;

    public Id getStoryId() {
        return storyId;
    }
    public void setStoryId(Id userStoryId) {
        this.storyId = userStoryId;
        System.debug('Setting storyId: ' + storyId);
        approvalLink = getApprovalLink(storyId);
    }
    public UserStoryApprovalController() {
        approvalLink = getApprovalLink(storyId);
    }

    // Method to fetch the correct approval link
    public String getApprovalLink(Id storyId) {
        try {
            // Get the latest Approval Process Instance
            ProcessInstance processInstance = [
                    SELECT Id FROM ProcessInstance
                    WHERE TargetObjectId =: storyId
                    ORDER BY CreatedDate DESC
                    LIMIT 1
            ];

            if (processInstance == null) return 'Approval Not Yet Assigned';

            // Fetch the related ProcessInstanceWorkItem (Approval Step)
            ProcessInstanceWorkItem workItem = [
                    SELECT Id FROM ProcessInstanceWorkItem
                    WHERE ProcessInstanceId = :processInstance.Id
                    ORDER BY CreatedDate DESC
                    LIMIT 1
            ];

            if (workItem == null) return 'Approval Not Yet Assigned';

            // Construct the Approval URL
            return URL.getOrgDomainUrl().toExternalForm() + '/lightning/r/ProcessInstanceWorkitem/' + workItem.Id+'/view';
        } catch (Exception e) {
            return 'Approval Not Yet Assigned';
        }
    }
}