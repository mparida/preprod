import { XMLParser } from 'fast-xml-parser';
import * as _ from 'lodash';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

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

const SFDX_PROJECT_CONFIG = process.argv[4] || './sfdx-project.json';

const loadSfdxProject = () => {
  try {
    const config = JSON.parse(fs.readFileSync(SFDX_PROJECT_CONFIG, 'utf-8'));
    return config.packageDirectories.find((dir: any) => dir.default)?.path || 'force-app';
  } catch (e) {
    return 'force-app';
  }
};

const PACKAGE_ROOT = loadSfdxProject();

const analyzeMetadata = (filePath: string, content: string): MetadataChange => {
  const type = filePath.split('/').find(part => part === 'classes' || part === 'triggers' || part === 'objects') || 'Unknown';
  const name = path.basename(filePath).replace(/\..*$/, '');
  let dependencies: string[] = [];

  if (filePath.endsWith('.xml')) {
    try {
      const parser = new XMLParser();
      const parsed = parser.parse(content);
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

const extractXmlDependencies = (parsed: any, type: string): string[] => {
  const dependencies = new Set<string>();
  // Add your dependency extraction logic here
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
