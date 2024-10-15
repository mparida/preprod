public class Utilities {
    public static String getObjectNameFromId(Id recordId) {
        // Get the prefix from the ID
        String prefix = String.valueOf(recordId).substring(0, 3);

        // Get the map of all sObject types described
        Map<String, Schema.SObjectType> sObjectTypes = Schema.getGlobalDescribe();

        for (String objectName : sObjectTypes.keySet()) {
            Schema.SObjectType sObjectType = sObjectTypes.get(objectName);
            if (sObjectType.getDescribe().getKeyPrefix() == prefix) {
                return sObjectType.getDescribe().getName();
            }
        }
        return null;
    }

}