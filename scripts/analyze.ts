import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parse } from 'fast-xml-parser';
import glob from 'glob';
import _ from 'lodash';

interface MetadataChange {
  filePath: string;
  type: string;
  name: string;
  content: string;
  changes: string[];
  dependencies: string[];
}

interface BranchAnalysis {
  branch: string;
  changes: MetadataChange[];
}

interface MetadataType {
  name: string;
  directory: string;
  suffix: string;
}

const SFDX_PROJECT_CONFIG = process.argv[4] || './sfdx-project.json';

// Load Salesforce project configuration
const loadSfdxProject = () => {
  try {
    const config = JSON.parse(fs.readFileSync(SFDX_PROJECT_CONFIG, 'utf-8'));
    return config.packageDirectories.find((dir: any) => dir.default)?.path || 'force-app';
  } catch (e) {
    return 'force-app';
  }
};

const PACKAGE_ROOT = loadSfdxProject();

// Extended metadata types to analyze
const METADATA_TYPES: MetadataType[] = [
  { name: 'ApexClass', directory: 'classes', suffix: '.cls' },
  { name: 'ApexTrigger', directory: 'triggers', suffix: '.trigger' },
  { name: 'LightningComponent', directory: 'lwc', suffix: '' },
  { name: 'AuraDefinitionBundle', directory: 'aura', suffix: '' },
  { name: 'Flow', directory: 'flows', suffix: '.flow-meta.xml' },
  { name: 'FlowDefinition', directory: 'flowDefinitions', suffix: '.flowDefinition-meta.xml' },
  { name: 'CustomObject', directory: 'objects', suffix: '.object-meta.xml' },
  { name: 'CustomField', directory: 'fields', suffix: '.field-meta.xml' },
  { name: 'Profile', directory: 'profiles', suffix: '.profile-meta.xml' },
  { name: 'PermissionSet', directory: 'permissionsets', suffix: '.permissionset-meta.xml' },
  { name: 'Layout', directory: 'layouts', suffix: '.layout-meta.xml' },
  { name: 'FlexiPage', directory: 'flexipages', suffix: '.flexipage-meta.xml' },
  { name: 'CustomMetadata', directory: 'customMetadata', suffix: '.md' },
  { name: 'CustomLabel', directory: 'labels', suffix: '.labels-meta.xml' },
  { name: 'StaticResource', directory: 'staticresources', suffix: '.resource-meta.xml' }
];

const analyzeMetadata = (filePath: string, content: string): MetadataChange => {
  const type = METADATA_TYPES.find(t => 
    filePath.includes(`/${t.directory}/`) && 
    filePath.endsWith(t.suffix)
  )?.name || 'Unknown';

  const name = path.basename(filePath).replace(/\..*$/, '');
  let dependencies: string[] = [];

  // Parse based on metadata type
  if (type === 'ApexClass') {
    dependencies = extractApexDependencies(content);
  } else if (type === 'ApexTrigger') {
    dependencies = [`Trigger.${name}`, ...extractApexDependencies(content)];
  } else if (filePath.endsWith('.xml')) {
    try {
      const parsed = parse(content, {
        ignoreAttributes: false,
        attributeNamePrefix: ''
      });
      dependencies = extractXmlDependencies(parsed, type);
    } catch (e) {
      console.warn(`Failed to parse XML for ${filePath}`);
    }
  }

  return {
    filePath,
    type,
    name,
    content,
    changes: [],
    dependencies
  };
};

const extractApexDependencies = (content: string): string[] => {
  const dependencies = new Set<string>();
  
  // Class references
  const classRefs = content.match(/[\w\.]+(?=\s*\.\s*[\w]+\s*\()/g) || [];
  classRefs.forEach(ref => dependencies.add(`ApexClass.${ref.split('.').pop()}`));
  
  // SOQL references
  const soqlRefs = content.match(/FROM\s+([\w__]+)/gi) || [];
  soqlRefs.forEach(ref => dependencies.add(`CustomObject.${ref.replace(/FROM\s+/i, '')}`));
  
  return Array.from(dependencies);
};

const extractXmlDependencies = (parsed: any, type: string): string[] => {
  const dependencies = new Set<string>();
  
  // Generic XML analysis
  const walk = (node: any) => {
    if (!node) return;
    
    if (typeof node === 'object') {
      Object.entries(node).forEach(([key, value]) => {
        // Profile/PermissionSet references
        if (['profile', 'permissionset'].includes(type.toLowerCase())) {
          if (key === 'classAccess' && value) {
            dependencies.add(`ApexClass.${value}`);
          } else if (key === 'field' && value) {
            dependencies.add(`CustomField.${value}`);
          }
        }
        
        // Flow references
        if (type === 'Flow') {
          if (key === 'apexClass' && value) {
            dependencies.add(`ApexClass.${value}`);
          } else if (key === 'object' && value) {
            dependencies.add(`CustomObject.${value}`);
          }
        }
        
        // Recursive walk
        walk(value);
      });
    }
  };
  
  walk(parsed);
  return Array.from(dependencies);
};

const getChangedFiles = (branch: string, baseRef: string): string[] => {
  try {
    const diff = execSync(`git diff --name-only ${baseRef}...${branch} -- ${PACKAGE_ROOT}`)
      .toString()
      .trim();
    return diff.split('\n').filter(Boolean);
  } catch (e) {
    console.error(`Error getting changes for ${branch}: ${e}`);
    return [];
  }
};

const analyzeBranch = (branch: string, baseRef: string): BranchAnalysis => {
  const changes: MetadataChange[] = [];
  const changedFiles = getChangedFiles(branch, baseRef);
  
  changedFiles.forEach(filePath => {
    try {
      const content = execSync(`git show ${branch}:${filePath}`).toString();
      const change = analyzeMetadata(filePath, content);
      
      // Get line changes
      const lineChanges = execSync(`git diff --unified=0 ${baseRef}...${branch} -- ${filePath}`)
        .toString()
        .split('\n')
        .filter(l => l.startsWith('+') && !l.startsWith('+++'))
        .map(l => l.substring(1));
      
      change.changes = lineChanges;
      changes.push(change);
    } catch (e) {
      console.warn(`Failed to analyze ${filePath} in ${branch}: ${e}`);
    }
  });
  
  return { branch, changes };
};

const main = () => {
  const branches = process.argv[2].split(',');
  const baseRef = process.argv[3];
  
  const results: BranchAnalysis[] = branches.map(branch => 
    analyzeBranch(branch, baseRef)
  );
  
  fs.writeFileSync('change_sets.json', JSON.stringify(results, null, 2));
  console.log('Analysis complete. Results saved to change_sets.json');
};

main();
