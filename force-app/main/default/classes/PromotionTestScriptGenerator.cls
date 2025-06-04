/**
 * Created by manojparida on 01/06/25.
 */
public class PromotionTestScriptGenerator {

    public class PromotionInput {
        @InvocableVariable(Label='Promotion Id')
        public Id promotionId;
    }

    @InvocableMethod(Label='Generate Promotion Test Scripts')
    public static void generateTestScripts(List<PromotionInput> inputs) {
        System.debug('INVOKED THE PromotionTestScriptGenerator');
        if (inputs == null || inputs.isEmpty() || inputs[0].promotionId == null) return;

        Id promotionId = inputs[0].promotionId;
        generateTestScripts(promotionId);
    }

    @future(callout=true)    
    public static void generateTestScripts(Id promotionId){
        // Step 1: Query Promoted User Stories from the promotion
        List<copado__Promoted_User_Story__c> promotedUSList = [
                SELECT copado__User_Story__c
                FROM copado__Promoted_User_Story__c
                WHERE copado__Promotion__c = :promotionId
        ];

        Set<Id> userStoryIds = new Set<Id>();
        for (copado__Promoted_User_Story__c pus : promotedUSList) {
            if (pus.copado__User_Story__c != null)
                userStoryIds.add(pus.copado__User_Story__c);
        }

        if (userStoryIds.isEmpty()) return;

        // Step 2: Query User Stories to extract relevant fields
        List<copado__User_Story__c> userStories = [
                SELECT Id, Name, copado__Release__c, copado__Epic__c,
                        copado__Team__r.copado__Department__c
                FROM copado__User_Story__c
                WHERE Id IN :userStoryIds
        ];

        Set<Id> releaseIds = new Set<Id>();
        Set<Id> epicIds = new Set<Id>();
        Set<String> departments = new Set<String>();

        for (copado__User_Story__c us : userStories) {
            if (us.copado__Release__c != null) releaseIds.add(us.copado__Release__c);
            if (us.copado__Epic__c != null) epicIds.add(us.copado__Epic__c);
            if (us.copado__Team__r != null && us.copado__Team__r.copado__Department__c != null)
                departments.add(us.copado__Team__r.copado__Department__c);
        }

        // Step 3: Prepare dynamic filter flags
        Boolean filterByRelease = (Label.Filter_By_Release == 'true');
        Boolean filterByEpic = (Label.Filter_By_Epic == 'true');

        // Step 4: Build and run dynamic SOQL
        String baseQuery = 'SELECT Id, Epic__c, Release__c, copado__Test_Title__c, AiTap_Test_Tags__c, Track__c FROM copado__Test_Script__c';
        List<String> filters = new List<String>();

        if (filterByRelease && !releaseIds.isEmpty()) {
            filters.add('Release__c IN :releaseIds');
        }
        if (filterByEpic && !epicIds.isEmpty()) {
            filters.add('Epic__c IN :epicIds');
        }

        String fullQuery = baseQuery;
        if (!filters.isEmpty()) {
            fullQuery += ' WHERE ' + String.join(filters, ' AND ');
        }

        List<copado__Test_Script__c> testScripts = Database.query(fullQuery);

        // Step 5: Organize AiTap_Test_Tags__c by Track__c
        Map<String, Set<String>> trackToTagsMap = new Map<String, Set<String>>();
        for (copado__Test_Script__c ts : testScripts) {
            if (String.isBlank(ts.Track__c)) continue;

            if (!trackToTagsMap.containsKey(ts.Track__c)) {
                trackToTagsMap.put(ts.Track__c, new Set<String>());
            }
            if (!String.isBlank(ts.AiTap_Test_Tags__c)) {
                for (String tag : ts.AiTap_Test_Tags__c.split(',')) {
                    trackToTagsMap.get(ts.Track__c).add(tag.trim());
                }
            }
        }

        // Step 6: Create Promotion_Test_Script__c records
        List<Promotion_Test_Script__c> toInsert = new List<Promotion_Test_Script__c>();

        for (String track : trackToTagsMap.keySet()) {
            Set<String> tagSet = trackToTagsMap.get(track);
            String tagsCSV = String.join(new List<String>(tagSet), ',');

            Promotion_Test_Script__c newRecord = new Promotion_Test_Script__c(
                    Promotion__c = promotionId,
                    Track__c = track,
                    AiTap_Test_Tags__c = tagsCSV,
                    AiTap_GitHub_Action_Trigger_Time__c = System.now().addMinutes(1)
            );
            toInsert.add(newRecord);
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
    }
}