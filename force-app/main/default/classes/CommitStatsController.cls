/**
 * Created by mp1863 on 08/03/25.
 */
public class CommitStatsController {
    public List<CommitRecord> committedYesterday { get; set; }
    public List<DidNotCommitRecord> didNotCommitYesterday { get; set; }
    public String reportDate { get; set; }  // Holds formatted date
    public Integer countDid { get; set; }
    public Integer countDidNot { get; set; }
    public Integer lastWeekCommits { get; set; }

    public CommitStatsController() {
        committedYesterday = new List<CommitRecord>();
        didNotCommitYesterday = new List<DidNotCommitRecord>();
        reportDate = Date.today().addDays(-1).format();
        lastWeekCommits = 0;

        // Step 1: Get all active users who committed in the last 6 months
        Map<Id, User> activeUsers = new Map<Id, User>();

        for (User u : [
                SELECT Id, Name, FederationIdentifier
                FROM User
                WHERE IsActive = TRUE AND Profile.Name = 'Developer'
                AND Id IN (SELECT CreatedById FROM copado__User_Story_Commit__c WHERE CreatedDate >= LAST_N_MONTHS:6)
        ]) {
            activeUsers.put(u.Id, u);
        }

        // Step 2: Get users who committed yesterday (with commit count)
        Map<Id, Integer> commitCounts = new Map<Id, Integer>();

        for (AggregateResult ar : [
                SELECT CreatedById, COUNT(Id) numOfCommits
                FROM copado__User_Story_Commit__c
                WHERE CreatedDate = YESTERDAY
                GROUP BY CreatedById
        ]) {
            commitCounts.put((Id) ar.get('CreatedById'), (Integer) ar.get('numOfCommits'));
        }
        //Get last weeks commit count
        for (AggregateResult ar : [
                SELECT COUNT(Id) numOfCommits
                FROM copado__User_Story_Commit__c
                WHERE CreatedDate >= LAST_WEEK
                GROUP BY CreatedById
        ]) {
            lastWeekCommits+=(Integer) ar.get('numOfCommits');
        }

        // Step 3: Fetch team names (since teams are in a related object)
        Map<Id, String> userTeams = new Map<Id, String>();

        for (copado__User_Story_Commit__c commitR : [
                SELECT CreatedById, copado__User_Story__r.copado__Team__r.Name
                FROM copado__User_Story_Commit__c
                WHERE CreatedDate = YESTERDAY
        ]) {
            if (commitR.CreatedById != null && commitR.copado__User_Story__r != null && commitR.copado__User_Story__r.copado__Team__r != null) {
                userTeams.put(commitR.CreatedById, commitR.copado__User_Story__r.copado__Team__r.Name);
            }
        }

        // Step 4: Categorize users into committed and non-committed lists
        List<CommitRecord> tempCommitList = new List<CommitRecord>();
        List<DidNotCommitRecord> tempDidNotCommitList = new List<DidNotCommitRecord>();

        for (Id userId : activeUsers.keySet()) {
            if (commitCounts.containsKey(userId)) {
                tempCommitList.add(new CommitRecord(
                        activeUsers.get(userId).Name,
                        userTeams.containsKey(userId) ? userTeams.get(userId) : 'No Team',
                        commitCounts.get(userId),
                        0 // Initial index placeholder
                ));
            } else {
                tempDidNotCommitList.add(new DidNotCommitRecord(activeUsers.get(userId).Name, 0, activeUsers.get(userId).FederationIdentifier));
            }
        }

        // Step 5: Sort committed users by number of commits in DESC order
        tempCommitList.sort(new CommitRecordSorter());

        // Step 6: Assign correct index values for proper alternating row colors
        Integer commitIndex = 0;
        for (CommitRecord record : tempCommitList) {
            record.index = commitIndex++;
        }

        Integer didNotCommitIndex = 0;
        for (DidNotCommitRecord record : tempDidNotCommitList) {
            record.index = didNotCommitIndex++;
        }

        // Assign sorted & indexed lists to the class variables
        committedYesterday = tempCommitList;
        didNotCommitYesterday = tempDidNotCommitList;
        countDid = committedYesterday.size();
        countDidNot = didNotCommitYesterday.size();
    }

    // Inner class to store commit details
    public class CommitRecord {
        public String name { get; set; }
        public String team { get; set; }
        public Integer numOfCommits { get; set; }
        public Integer index { get; set; }

        public CommitRecord(String name, String team, Integer numOfCommits, Integer index) {
            this.name = name;
            this.team = team;
            this.numOfCommits = numOfCommits;
            this.index = index;
        }
    }

    // Inner class for Did Not Commit list with an index
    public class DidNotCommitRecord {
        public String name { get; set; }
        public Integer index { get; set; }
        public String fedId { get; set; }

        public DidNotCommitRecord(String name, Integer index, String fedId) {
            this.name = name;
            this.index = index;
            this.fedId = fedId;
        }
    }

    // Custom Comparator for Sorting by Commit Count (Descending Order)
    public class CommitRecordSorter implements Comparator<CommitRecord> {
        public Integer compare(CommitRecord a, CommitRecord b) {
            return b.numOfCommits - a.numOfCommits; // Sorts in descending order
        }
    }
}