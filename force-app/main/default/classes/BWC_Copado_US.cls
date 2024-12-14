public with sharing class BWC_Copado_US {
    public BWC_Copado_US() {

    }
	public String expand;
	public Integer startAt;
	public Integer maxResults;
	public Integer total;
	public List<Issue> issues;
    public List<Values> values;

	public class Values {
        @AuraEnabled
		public Integer id;
		public String self;
        @AuraEnabled
		public String state;
        @AuraEnabled
		public String name;
        @AuraEnabled
		public String startDate;
        @AuraEnabled
		public String endDate;
        @AuraEnabled
		public String activatedDate;
        @AuraEnabled
		public Integer originBoardId;
	}

    public class Status {
		public String description;
        @AuraEnabled
		public String name{get;set;}
	}

	public class Assignee {
		@AuraEnabled
		public String name{get;set;}
        @AuraEnabled
		public String key{get;set;}
        @AuraEnabled
		public String emailAddress{get;set;}
		@AuraEnabled
        public String displayName{get;set;}
        @AuraEnabled
		public Boolean active;
        @AuraEnabled
		public String timeZone;
	}

	public class Issue {
        @AuraEnabled
		public String id{get;set;}
        @AuraEnabled
		public String self;
        @AuraEnabled
		public string key{get;set;}
        @AuraEnabled
		public Field fields{get;set;}
        @AuraEnabled
		public String summary{get;set;}
        @AuraEnabled
		public String copadoId{get;set;}
        @AuraEnabled
		public String copadoStory{get;set;}
        @AuraEnabled
		public String assigneeName{get;set;}
        @AuraEnabled
		public String assigneeUID{get;set;}
        @AuraEnabled
        public String fixVersionName{get;set;}       
	}

	public class Project {
		@AuraEnabled
		public String id;
        @AuraEnabled
		public String key;
        @AuraEnabled
		public String name;
	}

	public class Field {
        @AuraEnabled
		public String summary{get;set;}
        @AuraEnabled
		public String description;
        @AuraEnabled
		public Project project{get;set;}
        @AuraEnabled
		public List<FixVersion> fixVersions{get;set;}
		@AuraEnabled
		public Assignee assignee{get;set;}
        @AuraEnabled
		public Status status{get;set;}
        @AuraEnabled
        public String customfield_10970{get;set;}
        @AuraEnabled
        public Team customfield_16473{get;set;}
        @AuraEnabled
        public SprintDetail sprint{get;set;}
        @AuraEnabled
        public SprintDetail [] closedSprints{get;set;}
        @AuraEnabled
        public String customfield_10693{get;set;}//Story points
        @AuraEnabled
        public String [] customfield_16424 { get; set; }//cdex Env Logged
        @AuraEnabled
        public Severity customfield_10552{get;set;}//cdex severity
        @AuraEnabled
        public Phase customfield_16474{get;set;}//cdex Phase found In
	}

    public class Severity{
        @AuraEnabled
        public String value{get;set;}
    }
    public class Phase{
        @AuraEnabled
        public String value{get;set;}
    }

    public class SprintDetail{
        @AuraEnabled
        public String id{get;set;}
        @AuraEnabled
        public String name{get;set;}
        @AuraEnabled
        public String state{get;set;}
    }

    public class CloseSprint{
        @AuraEnabled
        public String id{get;set;}
        @AuraEnabled
        public String name{get;set;}
        @AuraEnabled
        public String state{get;set;}
    }
    
    public class Team{
        @AuraEnabled
        public String id;
        @AuraEnabled
        public String value{get;set;}
    }
    
	public class FixVersion{
        @AuraEnabled
		public String self;
        @AuraEnabled
		public String id;
        @AuraEnabled
		public String name;
        @AuraEnabled
		public Boolean archived;
        @AuraEnabled
		public Boolean released;
        @AuraEnabled
		public String releaseDate;
	}
}