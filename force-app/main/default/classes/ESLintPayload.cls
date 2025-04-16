/**
 * Created by mp1863 on 04/04/25.
 */

public class ESLintPayload {
    public String userStoryId;
    public String userStoryCommitId;
    public String commitId;
    public String run_id;
    public List<ViolationWrapper> violations;

    public class ViolationWrapper {
        public String filePath;
        public List<MessageWrapper> messages;
    }

    public class MessageWrapper {
        public String ruleId;
        public String severity;
        public String message;
        public String line;
        public String endLine;
        public String messageId;
        public List<Suggestion> suggestions;
    }

    public class Suggestion {
        public String description;
    }
}