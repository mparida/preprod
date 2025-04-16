/**
 * Created by mp1863 on 04/04/25.
 */

public class ESLintViolationService {

    public static void processPayload(ESLintPayload payload) {
        List<ESLint_Violation__c> violationsToCreate = new List<ESLint_Violation__c>();

        for(ESLintPayload.ViolationWrapper violation : payload.violations) {
            for(ESLintPayload.MessageWrapper message : violation.messages) {
                // Create unique key using run_id + filePath + line + ruleId
                /*String uniqueKey = payload.run_id + '|' + violation.filePath + '|' +
                        message.line + '|' + message.ruleId;*/

                    violationsToCreate.add(createViolationRecord(payload, violation, message));

            }
        }

        if(!violationsToCreate.isEmpty()) {
            insert violationsToCreate;
        }
    }

    private static ESLint_Violation__c createViolationRecord(ESLintPayload payload,
            ESLintPayload.ViolationWrapper violation,
            ESLintPayload.MessageWrapper message) {
        return new ESLint_Violation__c(
                User_Story__c = payload.userStoryId,
                User_Story_Commit__c = payload.userStoryCommitId,
                Run_ID__c = payload.run_id,
                Commit_ID__c = payload.commitId,
                File_Path__c = extractCleanPath(violation.filePath),
                Rule_Id__c = message.ruleId,
                Severity__c = message.severity ,//== 2 ? 'Error' : 'Warning',
                Message__c = message.message.left(255),  // Truncate if needed
                Line_Number__c = message.line,
                End_Line__c = message.endLine,
                Message_Id__c = message.messageId,
                Suggestions__c = getSuggestions(message.suggestions)
        );
    }

    private static String getSuggestions(List<ESLintPayload.Suggestion> suggestions) {
        if(suggestions == null || suggestions.isEmpty()) return null;
        List<String> descs = new List<String>();
        for(ESLintPayload.Suggestion s : suggestions) {
            descs.add(s.description);
        }
        return String.join(descs, '; ');
    }

    public static String extractCleanPath(String fullPath) {
        Integer startIndex = fullPath.indexOf('/force-app');
        if (startIndex != -1) {
            return fullPath.substring(startIndex);
        }
        return null; // or return fullPath if you want to fallback
    }
}