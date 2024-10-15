global class DeleteConflictFilesBatchSchedule implements Schedulable{
    global void execute(SchedulableContext sc) {
        DeleteConflictFilesBatch batchJob = new DeleteConflictFilesBatch();
        Database.executeBatch(batchJob);
    }
}