export const setFeatureFlags = (component, message) => {
    component.showDetailsTab = message.features.details;
    component.isDisplayManualRedactButton = message.features.manualredaction ?? false;
    component.transferFlag = message.features.transfer ?? false;
    component.consultFlag = message.features.consult ?? false;
    component.conferenceFlag = message.features.conference ?? false;
    component.agentStatsFlag = message.features.statistics ?? false;


    component.transferNotesFlag = message.features.transfernote ?? false;
    component.queueWaitingTimeFlag = message.features.waittime ?? false;
    component.agentqueuecount = message.features.agentqueuecount ?? false;
    component.profanityFlag = message.features.profanityfilter ?? false;
    component.profaneWordsFlag = message.features.showProfaneWords ?? false;
    component.isSupervisorNameFlag = message.features.supervisorname ?? false;
    component.isAgentNameFlag = message.features.permitagenttransfer ?? false;
    component.displayTransferReasons = message.features.displayTransferReasons ?? false;

    component.subjectPosition = message.features.subjectPosition ?? 'inchat';

     //resizeable textarea
     component.resizeableTextAreaFlag = message.features.resizeableTextArea ?? false;

     //twoway coaching 
     component.twoWayCoachingMode = message.features.twowaycoaching ?? false;
     component.twoWayConsultFlag = message.features.twowayconsult ?? false;

     //Apple Business Chat and Async flag for chatTypeIcon and asyncDisplaySummary LWC
     component.asyncChatFlag = message.features.asyncChatFlag ?? false;
     
}