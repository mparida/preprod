@isTest
public class VeracodeCallbackTest {
    
    @testSetup
    public static void setup() {
        copado__JobExecution__c je = new copado__JobExecution__c();        
        je.copado__DataJson__c = '{  "scanType": "User_Story" }';
        insert je;
        copado__JobStep__c js = new copado__JobStep__c();
        js.copado__JobExecution__c = je.Id;
        js.copado__Type__c = 'Function';
        insert js;
        copado__Result__c rs = new copado__Result__c();
        rs.copado__JobStep__c = js.Id;
        rs.copado__Job_Type__c = 'Integration';
        insert rs;
        
        
        String sampleResponse = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
                    '<detailedreport account_id="91406" build_id="25102310" app_id="1697673" analysis_id="25073426" static_analysis_unit_id="25089076" sandbox_id="5273924">' +
                    '  <severity level="4">' +
                    '    <category categoryid="19" categoryname="SQL Injection">' +
                    '      <cwe cwename="Improper Neutralization of Special Elements in Data Query Logic" >' +        
                    '        <staticflaws>' +
                    '          <flaw sourcefile="Suppliers.cls" line="284" description="Sample (https://cwe.mitre.org/data/definitions/943.html)&#13;&#10;&#13;&#10;"  />' +
                    '        </staticflaws>' +
                    '      </cwe>' +
                    '    </category>' +
                    '  </severity>' +
                    '</detailedreport>';
        
        ContentVersion content=new ContentVersion(); 
        content.Title='detailedreport.xml'; 
        content.PathOnClient='/' + content.Title + '.xml'; 
        Blob bodyBlob=Blob.valueOf(sampleResponse); 
        content.VersionData=bodyBlob; 
        content.FirstPublishLocationId = rs.Id;
        content.origin = 'H';
        insert content;       
    }
	
    @isTest
    public static void testSimpleDetailedReport(){
        copado__Result__c rs = [SELECT Id, copado__JobStep__c FROM copado__Result__c LIMIT 1];
        Test.startTest();
        VeracodeCallback vc = new VeracodeCallback();
        vc.execute(null, rs, 'Success');
        Test.stopTest();
    }
}