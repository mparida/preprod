const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const branches = JSON.parse(process.argv[2]);
const baseBranch = 'origin/main';
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'output');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const storyMap = {}; // { branch: { modifies: Set, calls: Set } }

function extractSymbols(diff) {
  const modifies = new Set();
  const calls = new Set();

  const lines = diff.split('\n');
  for (const line of lines) {
    const clean = line.trim();
    if (clean.startsWith('+') || clean.startsWith('-')) {
      // Very naive parsing to catch method or class usage
      const matchClass = clean.match(/class\s+(\w+)/);
      const matchMethod = clean.match(/(\w+)\s*\(/);
      const methodCall = clean.match(/(\w+)\.(\w+)\(/);
      
      if (matchClass) modifies.add(matchClass[1]);
      if (methodCall) calls.add(`${methodCall[1]}.${methodCall[2]}`);
      else if (matchMethod && !clean.includes('class')) modifies.add(matchMethod[1]);
    }
  }
  return { modifies, calls };
}

branches.forEach(branch => {
  console.log(`\n🔍 Analyzing branch: ${branch}`);

  try {
    execSync(`git fetch origin ${branch}`, { stdio: 'inherit' });
    const changedFiles = execSync(`git diff --name-only ${baseBranch}..origin/${branch}`)
      .toString()
      .split('\n')
      .filter(f => f.match(/\.(cls|cmp|js|page|xml|html)$/i));

    const modifies = new Set();
    const calls = new Set();

    for (const file of changedFiles) {
      if (!file) continue;
      const diff = execSync(`git diff ${baseBranch}..origin/${branch} -- ${file}`).toString();
      const result = extractSymbols(diff);
      result.modifies.forEach(m => modifies.add(m));
      result.calls.forEach(c => calls.add(c));
    }

    storyMap[branch] = { modifies, calls };
  } catch (err) {
    console.error(`Error analyzing branch ${branch}:`, err.message);
  }
});

const edges = [];
branches.forEach(source => {
  branches.forEach(target => {
    if (source === target) return;
    for (let called of storyMap[target]?.calls || []) {
      if (storyMap[source]?.modifies?.has(called)) {
        edges.push([source, target]);
      }
    }
  });
});

function topologicalSort(branches, edges) {
  const inDegree = Object.fromEntries(branches.map(b => [b, 0]));
  const graph = Object.fromEntries(branches.map(b => [b, []]));

  edges.forEach(([from, to]) => {
    graph[from].push(to);
    inDegree[to]++;
  });

  const queue = branches.filter(b => inDegree[b] === 0);
  const result = [];

  while (queue.length) {
    const current = queue.shift();
    result.push(current);
    for (const neighbor of graph[current]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return result;
}

const sorted = topologicalSort(branches, edges);

fs.writeFileSync(
  path.join(outputDir, 'dependency-graph.json'),
  JSON.stringify({ storyMap, edges, sorted }, null, 2)
);

console.log('\n✅ Dependency graph created at ./output/dependency-graph.json');
