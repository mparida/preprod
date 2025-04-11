import json
import networkx as nx
from typing import Dict, List, Set, Tuple
from collections import defaultdict
import webbrowser
import os

class DependencyAnalyzer:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.metadata_map: Dict[str, Set[str]] = defaultdict(set)  # metadata_ref -> set of branches
        self.cross_metadata_deps: Dict[Tuple[str, str], Set[str]] = defaultdict(set)  # (type, name) -> set of dependent types

    def load_changes(self) -> List[Dict]:
        with open('change_sets.json', 'r') as f:
            return json.load(f)

    def analyze_dependencies(self, change_sets: List[Dict]):
        # First pass: build metadata ownership
        for change in change_sets:
            branch = change['branch']
            self.graph.add_node(branch)
            
            for file_change in change['changes']:
                metadata_ref = f"{file_change['type']}.{file_change['name']}"
                self.metadata_map[metadata_ref].add(branch)
                
                # Track cross-metadata type dependencies
                for dep in file_change['dependencies']:
                    dep_type = dep.split('.')[0]
                    self.cross_metadata_deps[(file_change['type'], dep_type)].add(branch)

        # Second pass: build dependency graph
        for change in change_sets:
            branch = change['branch']
            
            for file_change in change['changes']:
                for dep in file_change['dependencies']:
                    # Find branches that own the dependency
                    for owner_branch in self.metadata_map.get(dep, set()):
                        if owner_branch != branch:
                            self.graph.add_edge(owner_branch, branch)
                
                # Add cross-type dependencies
                file_type = file_change['type']
                for (src_type, dst_type), branches in self.cross_metadata_deps.items():
                    if src_type == file_type and dst_type != file_type:
                        for other_branch in branches:
                            if other_branch != branch:
                                self.graph.add_edge(other_branch, branch)

    def generate_plan(self) -> Tuple[List[str], Dict]:
        try:
            deployment_order = list(nx.topological_sort(self.graph))
        except nx.NetworkXUnfeasible:
            print("Warning: Circular dependencies detected")
            deployment_order = list(self.graph.nodes())
        
        # Prepare visualization data
        nodes = [{"id": n, "group": 1} for n in self.graph.nodes()]
        links = [{"source": u, "target": v, "value": 1} for u, v in self.graph.edges()]
        
        return deployment_order, {"nodes": nodes, "links": links}

    def generate_report(self, graph_data: Dict):
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Salesforce Dependency Analysis</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <style>
                .node text {{ font: 12px sans-serif; }}
                .link {{ stroke: #999; stroke-opacity: 0.6; }}
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .container {{ display: flex; }}
                .graph {{ flex: 2; }}
                .details {{ flex: 1; padding: 20px; }}
            </style>
        </head>
        <body>
            <h1>Salesforce Deployment Dependency Analysis</h1>
            <div class="container">
                <div class="graph" id="graph"></div>
                <div class="details">
                    <h2>Deployment Order</h2>
                    <ol id="order"></ol>
                    <h2>Key</h2>
                    <div id="key"></div>
                </div>
            </div>
            <script>
                const data = {json.dumps(graph_data)};
                
                const width = 800, height = 600;
                const color = d3.scaleOrdinal(d3.schemeCategory10);
                
                const svg = d3.select("#graph")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height);
                
                const simulation = d3.forceSimulation(data.nodes)
                    .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("x", d3.forceX(width / 2))
                    .force("y", d3.forceY(height / 2));
                
                const link = svg.append("g")
                    .selectAll("line")
                    .data(data.links)
                    .join("line")
                    .attr("class", "link")
                    .attr("stroke-width", d => Math.sqrt(d.value)));
                
                const node = svg.append("g")
                    .selectAll("circle")
                    .data(data.nodes)
                    .join("circle")
                    .attr("r", 10)
                    .attr("fill", d => color(d.group))
                    .call(drag(simulation)));
                
                node.append("title")
                    .text(d => d.id);
                
                const label = svg.append("g")
                    .selectAll("text")
                    .data(data.nodes)
                    .join("text")
                    .attr("dy", -15)
                    .text(d => d.id);
                
                simulation.on("tick", () => {{
                    link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);
                    
                    node
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y);
                    
                    label
                        .attr("x", d => d.x)
                        .attr("y", d => d.y);
                }});
                
                function drag(simulation) {{
                    function dragstarted(event, d) {{
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    }}
                    
                    function dragged(event, d) {{
                        d.fx = event.x;
                        d.fy = event.y;
                    }}
                    
                    function dragended(event, d) {{
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    }}
                    
                    return d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended);
                }}
                
                // Populate deployment order
                const order = {json.dumps(self.generate_plan()[0])};
                const ol = d3.select("#order");
                order.forEach(branch => {{
                    ol.append("li").text(branch);
                }});
            </script>
        </body>
        </html>
        """
        
        with open('dependency_report.html', 'w') as f:
            f.write(html)

def main():
    analyzer = DependencyAnalyzer()
    change_sets = analyzer.load_changes()
    analyzer.analyze_dependencies(change_sets)
    
    deployment_order, graph_data = analyzer.generate_plan()
    
    # Save outputs
    with open('deployment_plan.json', 'w') as f:
        json.dump(deployment_order, f, indent=2)
    
    with open('dependency_graph.json', 'w') as f:
        json.dump({
            "nodes": list(analyzer.graph.nodes()),
            "edges": list(analyzer.graph.edges()),
            "metadata_dependencies": analyzer.cross_metadata_deps
        }, f, indent=2)
    
    analyzer.generate_report(graph_data)

if __name__ == "__main__":
    main()
