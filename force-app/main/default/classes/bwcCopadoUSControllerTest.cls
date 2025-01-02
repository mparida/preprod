@isTest
public class bwcCopadoUSControllerTest {

    private static final String IT_TRACK_US_KEY_1 = 'US-123';
    private static final String IT_TRACK_US_SUMMARY_1 = 'Summary of US-123';
    private static final String IT_TRACK_US_ASSIGNEE_UID_1 = 'UID-123';
    private static final String IT_TRACK_US_FIX_VERSION_NAME_1 = 'Fix Version 1';
    private static final String COPADO_US_TITLE_1 = 'Copado User Story 1';
    private static final String FEDERATION_IDENTIFIER_1 = 'FID-123';

    @testSetup
    static void setup() {
        // Create a copado project
        copado__Project__c copadoProject = new copado__Project__c();
        copadoProject.Name = 'Copado Project';
        insert copadoProject;

        Itrack_Board__c board = new Itrack_Board__c(Name = 'POS-Abilities', Itrack_Board_Number__c = '12345');
        insert board;
    }

    @isTest
    public static void testBoardCreation() {
        Itrack_Board__c board = [SELECT Id, Name, Itrack_Board_Number__c  FROM Itrack_Board__c LIMIT 1 ];
        bwcCopadoUSController.getBoardNameValues();
    }

    @isTest
    public static void testCreateCopadoUserStories() {
        // Create an iTrack US

        BWC_Copado_US.Status status= new BWC_Copado_US.Status();
        status.name = 'Accepted';
        
        BWC_Copado_US.Team team= new BWC_Copado_US.Team();
        team.value = 'SPT-ACC-ServiceSupportMgmt';
        team.id = '68568';
        
        BWC_Copado_US.SprintDetail spr= new BWC_Copado_US.SprintDetail();
        spr.name = 'Test 17 spr';
        spr.id = '00068568';
        spr.state = 'test';
        
        BWC_Copado_US.issue iTrackUS1 = new BWC_Copado_US.issue();
        BWC_Copado_US.Field field = new BWC_Copado_US.Field();
        field.customfield_10970 = 'SPTSFDCSPT-29923';
        field.customfield_10970 = 'SPTSFDCSPT-29923';
        field.fixVersions = null;
        field.project = null;
        field.status = status;
        field.customfield_16473 = team;
        field.customfield_10552 = new BWC_Copado_US.Severity();
        field.customfield_10552.value = 'Critical';
        field.customfield_16474 = new BWC_Copado_US.Phase();
        field.customfield_16474.value = 'Production';
               
        iTrackUS1.id = '';
        iTrackUS1.key = IT_TRACK_US_KEY_1;
        iTrackUS1.copadoId = '';
        iTrackUS1.copadoStory = '';
        iTrackUS1.summary = IT_TRACK_US_SUMMARY_1;
        iTrackUS1.assigneeUID = IT_TRACK_US_ASSIGNEE_UID_1;
        iTrackUS1.assigneeName = '';
        iTrackUS1.fixVersionName = IT_TRACK_US_FIX_VERSION_NAME_1;
		iTrackUS1.fields = field;
        iTrackUS1.fields.sprint = new BWC_Copado_US.SprintDetail();
        iTrackUS1.fields.sprint.id = '81143';
        // Create a list of iTrack USs
        List<BWC_Copado_US.issue> iTrackUSList = new List<BWC_Copado_US.issue>();
        iTrackUSList.add(iTrackUS1);

        // Create a sprint
        copado__Sprint__c sprint = new copado__Sprint__c();
        sprint.Itrack_Sprint__c = '81143';
        insert sprint;

        // Call copado US method
        List<copado__User_Story__c> copadoUSList = bwcCopadoUSController.createCopadoUserStories(iTrackUSList, sprint.Itrack_Sprint__c);

        List<copado__User_Story__c> copadoUSList1 = bwcCopadoUSController.createCopadoUserStories(iTrackUSList, '');
        // Assert that the copado US is created
        System.assertEquals(1, copadoUSList.size());

        // Assert that the copado US has the correct values
        copado__User_Story__c copadoUS = copadoUSList[0];
        System.assertEquals(IT_TRACK_US_KEY_1, copadoUS.iTrack_US__c);
    }

    @isTest
    public static void testItrackFields() {

    }
}