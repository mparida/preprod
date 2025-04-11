Global with sharing class VeracodeCallback implements copado.MCCallback {
    Global void execute(copado__Function__c function, copado__Result__c result, String status) {
        if(status == 'Failed') {
            // handle Error
        } else if(status == 'Success') {
            copado__JobStep__c jobStep = [select id, copado__JobExecution__c, copado__JobExecution__r.copado__ParentId__c, copado__JobExecution__r.copado__DataJson__c from copado__JobStep__c where id =: result.copado__JobStep__c WITH SECURITY_ENFORCED limit 1][0];
            Map<String, Object> jsonData = (Map<String, Object>) JSON.deserializeUntyped(jobStep.copado__JobExecution__r.copado__DataJson__c);
            String scanType = (String) jsonData.get('scanType');
            parseXMLResult(jobStep.copado__JobExecution__r.copado__ParentId__c, result.Id, scanType);
        } else {
            // handle In progress if necessary
        }
    }
    
    
    private static void parseXMLResult(Id parentId, Id resultId, String scanType){
        ContentVersion a = [SELECT Title, VersionData FROM ContentVersion WHERE  Title = 'detailedreport.xml' and FirstPublishLocationId =: resultId WITH SECURITY_ENFORCED][0];
        
        Dom.Document doc = new Dom.Document();  
        doc.load(a.VersionData.toString());         
        Dom.XMLNode detailedreportElement = doc.getRootElement(); 
                
        copado__Static_Code_Analysis_Result__c scaResult = new copado__Static_Code_Analysis_Result__c();
        if('Org'.equalsIgnoreCase(scanType)){
            scaResult.copado__Org_Credential__c = parentId;
        }else if('User_Story'.equalsIgnoreCase(scanType)){
            scaResult.copado__User_Story__c = parentId;
        }        
        scaResult.RecordTypeId = Schema.SObjectType.copado__Static_Code_Analysis_Result__c.getRecordTypeInfosByDeveloperName().get('Veracode').getRecordTypeId();
        scaResult.Veracode_Report__c = 'https://analysiscenter.veracode.com/auth/index.jsp#ViewReportsDetailedReport:'+detailedreportElement.getAttribute('account_id',null)+
            							':'+detailedreportElement.getAttribute('app_id',null)+':'+detailedreportElement.getAttribute('build_id',null)+':'+detailedreportElement.getAttribute('analysis_id',null)+
            							':'+detailedreportElement.getAttribute('static_analysis_unit_id',null)+':::::'+detailedreportElement.getAttribute('sandbox_id',null);
        if(Schema.sObjectType.copado__Static_Code_Analysis_Result__c.isCreateable()) {
            insert scaResult;
        }
        
        List<copado__Static_Code_Analysis_Violation__c> violations = new List<copado__Static_Code_Analysis_Violation__c>();
        for ( Dom.XMLNode severityElement : detailedreportElement.getChildElements() ) {
            if(severityElement.getName() == 'severity'){
                //System.debug(severityElement.getName() + ' - ' + severityElement.getAttribute('level',null));
                for ( Dom.XMLNode categoryElement : severityElement.getChildElements() ) {
                    if(categoryElement.getName() == 'category'){
                        //System.debug('>>'+categoryElement.getAttribute('categoryname',null));
                        for ( Dom.XMLNode cweElement : categoryElement.getChildElements() ) {
                            if(cweElement.getName() == 'cwe'){
                                //System.debug('>>>>'+cweElement.getAttribute('cwename',null));
                                for ( Dom.XMLNode staticflawsElement : cweElement.getChildElements() ) {
                                    if(staticflawsElement.getName() == 'staticflaws'){
                                        for ( Dom.XMLNode flawElement : staticflawsElement.getChildElements() ) {
                                            if(flawElement.getName() == 'flaw'){
                                                copado__Static_Code_Analysis_Violation__c violation = new copado__Static_Code_Analysis_Violation__c();
                                                violation.copado__Static_Code_Analysis_Result__c = scaResult.Id;
                                                violation.copado__File__c = flawElement.getAttribute('sourcefile',null);
                                                violation.copado__Line__c = decimal.valueOf(flawElement.getAttribute('line',null));
                                                violation.copado__Rule__c = categoryElement.getAttribute('categoryname',null);
                                                violation.copado__Priority__c = decimal.valueOf(severityElement.getAttribute('level',null));
                                                violation.copado__Message__c = cweElement.getAttribute('cwename',null);
                                                
                                                try{
                                                	String description = flawElement.getAttribute('description',null);
                                                	String infoUrl = description.substring(description.indexOf('https:')).substringBefore(')');
                                                	violation.copado__Info_URL__c = infoUrl;
                                                }catch(Exception ex){
                                                    System.debug(ex);
                                                }                                               
                                                
                                                violations.add(violation);
                                                //System.debug('>>>>>>'+flawElement.getAttribute('sourcefile',null)+':'+flawElement.getAttribute('line',null));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if(Schema.sObjectType.copado__Static_Code_Analysis_Violation__c.isCreateable()) {
            Database.DMLOptions opt = new Database.DMLOptions();
            opt.allowFieldTruncation = true;
            Database.insert(violations, opt);
        }
        
    }
}