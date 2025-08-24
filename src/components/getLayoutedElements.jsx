import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export async function getLayoutedElements(nodes, edges, options = {}) {
  const graph = {
    id: "root",
    layoutOptions: {
      'elk.algorithm': 'layered',  // เหมาะกับ graph พวก prerequisite/corequisite
      'elk.direction': 'DOWN',     // จัดจากบนลงล่าง
      'elk.spacing.nodeNode': '50', // ระยะห่างระหว่าง nodes
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      ...options,
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 200,
      height: 70,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);
  const layoutedNodes = nodes.map((node) => {
    const n = layout.children.find((c) => c.id === node.id);
    return { ...node, position: { x: n.x, y: n.y } };
  });

  return { nodes: layoutedNodes, edges };
};