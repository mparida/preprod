/**
 * Created by mp1863 on 16/12/24.
 */

public with sharing class MultiSelectLookupController {
    //This method retrieves the data from database table. It search input is '*', then retrieve all records
    @AuraEnabled (cacheable=true)
    public static List<SObjectQueryResult> retrieveRecords(String objectName,
            String fieldAPINames,
            String filterFieldAPIName,
            String strInput){

        List<SObjectQueryResult> lstReturnResult = new List<SObjectQueryResult>();
        if(strInput.equals('*')){
            strInput = '';
        }
        String str = strInput + '%';
        String strQueryField = '';
        List<String> fieldList = fieldAPINames.split(',');

        //check if Id is already been passed
        if(!objectName.equalsIgnoreCase('copado__User_Story_Metadata__c')) {
            if (!fieldList.contains('Id')) {
                fieldList.add('Id');
                strQueryField = String.join(fieldList, ',');
            } else {
                strQueryField = fieldAPINames;
            }
        }
        String strQuery;
        if(!objectName.equalsIgnoreCase('copado__User_Story_Metadata__c')) {
            strQuery = 'SELECT ' + String.escapeSingleQuotes(strQueryField)
                    + ' FROM '
                    + String.escapeSingleQuotes(objectName)
                    + ' WHERE ' + filterFieldAPIName + '  LIKE \'' + str + '%\''
                    + ' ORDER BY ' + filterFieldAPIName
                    + ' LIMIT 50';
        }else{
            strQuery = 'SELECT copado__Metadata_API_Name__c FROM copado__User_Story_Metadata__c WHERE '
                    + filterFieldAPIName +  ' LIKE \'' + str + '%\''
                    + 'GROUP BY copado__Metadata_API_Name__c';
        }


        System.debug('strQuery=' + strQuery);

        if(!objectName.equalsIgnoreCase('copado__User_Story_Metadata__c')) {
            List<SObject> lstResult = database.query(strQuery);
            //create list of records that can be easily be parsable at js controller.
            for (String strField : fieldList) {
                for (SObject sobj : lstResult) {
                    if (strField != 'Id') {
                        SObjectQueryResult result = new SObjectQueryResult();
                        result.recordId = (String) sobj.get('Id');
                        result.recordName = (String) sobj.get(strField);
                        lstReturnResult.add(result);
                    }
                }
            }
        }else{
            AggregateResult[] groupedResults = database.query(strQuery);
            for (AggregateResult ar : groupedResults)  {
                SObjectQueryResult result = new SObjectQueryResult();
                result.recordId = (String) ar.get('copado__Metadata_API_Name__c');
                result.recordName = (String) ar.get('copado__Metadata_API_Name__c');
                lstReturnResult.add(result);
            }
        }
        return lstReturnResult;
    }

    public class SObjectQueryResult {
        @AuraEnabled
        public String recordId;

        @AuraEnabled
        public String recordName;
    }
}