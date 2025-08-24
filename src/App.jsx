import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useEffect } from "react";
import { getLayoutedElements } from "./components/getLayoutedElements.jsx";
import { Dropdown } from "./components/dropdown.jsx";

// ตัวอย่าง JSON ของวิชา
import { courses } from "./assets/best.jsx";

function FlowGraph({ curriculumId, layout }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);

  useEffect(() => {
    if (!curriculumId || !layout) return;

    const nodesList = [];
    const edgesList = [];

    const colWidth = 270;
    const rowHeight = 50;
    const chainMargin = 35;

    // แบ่งตาม curriculum_id
    const curriculumMap = {};
    courses.forEach((c) => {
      if (curriculumId === c.curriculum_id) {
        if (!curriculumMap[c.curriculum_id])
          curriculumMap[c.curriculum_id] = [];
        curriculumMap[c.curriculum_id].push(c);
      }
    });
    let yOffset = 0;

    Object.entries(curriculumMap).forEach(([currId, courseList]) => {
      nodesList.push({
        id: `curriculum-${currId}`,
        data: {
          label: (
            <div>
              Curriculum Id: <br /> {currId}
            </div>
          ),
        },
        position: { x: 0, y: yOffset },
        draggable: false,
        style: {
          minWidth: 425, // ขยายความกว้าง container
          minHeight: 60, // ขยายความสูง container
          background: "#f0f4f8", // กรอบด้านหลัง
          borderRadius: 16,
          border: "2px solid #cbd5e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 20px",
          fontWeight: 600,
          fontSize: 16,
          color: "#1e293b",
        },
      });

      yOffset += 100;

      const codeMap = {};
      courseList.forEach((c) => (codeMap[c.code] = c));

      const root = courseList.filter(
        (c) =>
          (!c.prerequisite_groups || c.prerequisite_groups.length === 0) &&
          (!c.corequisite_groups || c.corequisite_groups.length === 0)
      );

      let rootAndChildCourses = [];
      let rootCourses = root;
      let newRootCourses = [];
      let index = 0;

      while (rootCourses.length !== 0) {
        rootAndChildCourses[index] = {};
        rootCourses.forEach((course) => {
          const courseKey = course.code + course.name_en;
          if (!rootAndChildCourses[index][courseKey]) {
            rootAndChildCourses[index][courseKey] = [];
          }

          courseList.forEach((c) => {
            // prerequisite
            if (c.prerequisite_groups?.length > 0) {
              c.prerequisite_groups.forEach((group) => {
                group.prerequisite_courses?.forEach((prereq) => {
                  if (prereq.prerequisite_course?.code === course.code) {
                    if (
                      !rootAndChildCourses[index][courseKey].some(
                        (cc) => cc.code === c.code
                      )
                    ) {
                      rootAndChildCourses[index][courseKey].push({
                        ...c,
                        relation: "prereq",
                      });
                      newRootCourses.push(c);
                    }
                  }
                });
              });
            }

            // corequisite
            if (c.corequisite_groups?.length > 0) {
              c.corequisite_groups.forEach((group) => {
                group.prerequisite_courses?.forEach((prereq) => {
                  if (prereq.prerequisite_course?.code === course.code) {
                    if (
                      !rootAndChildCourses[index][courseKey].some(
                        (cc) => cc.code === c.code
                      )
                    ) {
                      rootAndChildCourses[index][courseKey].push({
                        ...c,
                        relation: "coreq",
                      });
                      newRootCourses.push(c);
                    }
                  }
                });
              });
            }
          });
        });

        rootCourses = newRootCourses;
        newRootCourses = [];
        index++;
      }

      let globalYindex = 0;

      function buildGraph(root, rootAndChildCourses) {
        const graph = { nodes: [], edges: [] };
        const visited = new Set();

        function addNode(course, idx, children = []) {
          const key = course.code + course.name_en;
          if (!visited.has(key)) {
            visited.add(key);
            graph.nodes.push({
              id: key,
              data: {
                label: (
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginBottom: "4px",
                        color: "#333",
                      }}
                    >
                      {course.code}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: "1.2em",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        color: "#555",
                      }}
                    >
                      {course.name_en}
                    </div>
                  </div>
                ),
              },
              position: {
                x: colWidth * idx,
                y: yOffset + globalYindex * (rowHeight + chainMargin),
              },
              sourcePosition: "right",
              targetPosition: "left",
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 12px",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                maxWidth: "200px",
                minHeight: "75px",
              },
              draggable: false,
            });

            if (
              (children.length > 1 &&
                rootAndChildCourses[idx][key].length === 0) ||
              rootAndChildCourses[idx][key].every((child) =>
                visited.has(child.code + child.name_en)
              )
            ) {
              globalYindex++;
            }
          }
        }

        function dfs(course, idx) {
          const parentKey = course.code + course.name_en;
          addNode(course, idx);

          rootAndChildCourses.forEach((level, idxLevel) => {
            const children = level[parentKey];
            if (children) {
              children.forEach((child) => {
                const childKey = child.code + child.name_en;
                addNode(child, idxLevel + 1, children);

                graph.edges.push({
                  id: `${parentKey}-${childKey}`,
                  source: parentKey,
                  target: childKey,
                  animated: false,
                  style:
                    child.relation === "prereq"
                      ? { stroke: "#999", strokeWidth: 2 }
                      : {
                          stroke: "#0077ff",
                          strokeWidth: 2,
                          strokeDasharray: "6 4",
                        },
                  markerEnd: { type: "arrowclosed" },
                  type: "smoothstep",
                });

                dfs(child, idxLevel + 1);
              });
            }
          });
        }

        root.forEach((r) => dfs(r, 0));
        return graph;
      }

      const graph = buildGraph(root, rootAndChildCourses);
      nodesList.push(...graph.nodes);
      edgesList.push(...graph.edges);
    });

    if (layout && layout === "horizontal") {
      getLayoutedElements(nodesList, edgesList).then(({ nodes, edges }) => {
        nodes.forEach((node) => {
          if (node.id.includes("curriculum-")) {
            node.position["y"] = node.position["y"] - 100;
          }
        });
        setNodes(nodes);
        setEdges(edges);
      });
    } else if (layout && layout === "vertical") {
      setNodes(nodesList);
      setEdges(edgesList);
    }
  }, [curriculumId, layout]);

  // highlight logic
  const getHighlightedNodes = () =>
    nodes.map((node) => {
      const isActive = node.id === hoveredNodeId;

      // เช็คว่า node นี้เชื่อมกับ corequisite edge
      const connectedCoreq = edges.some(
        (e) =>
          (e.source === hoveredNodeId &&
            e.target === node.id &&
            e.style?.strokeDasharray) ||
          (e.target === hoveredNodeId &&
            e.source === node.id &&
            e.style?.strokeDasharray)
      );

      const isConnected = edges.some(
        (e) =>
          (e.source === hoveredNodeId && e.target === node.id) ||
          (e.target === hoveredNodeId && e.source === node.id)
      );

      return {
        ...node,
        style: {
          ...node.style,
          border: isActive
            ? "3px solid #ff5722"
            : connectedCoreq
            ? "3px solid #39883dff"
            : isConnected
            ? "3px solid #2196f3"
            : node.style.border,
          backgroundColor: isActive
            ? "#ffe0b2"
            : connectedCoreq
            ? "#dbf3dcff"
            : isConnected
            ? "#e3f2fd"
            : node.style.backgroundColor || "#fff",
          zIndex: isActive ? 100 : isConnected ? 100 : 0,
        },
      };
    });

  const getHighlightedEdges = () =>
    edges.map((edge) => {
      const isActive =
        edge.source === hoveredNodeId ||
        edge.target === hoveredNodeId ||
        edge.id === hoveredEdgeId;

      const isCoreq = !!edge.style?.strokeDasharray;

      const baseStyle = isCoreq
        ? { stroke: "#419affff", strokeWidth: 2, strokeDasharray: "6 4" } // coreq
        : { stroke: "#aaa", strokeWidth: 2 }; // prereq

      return {
        ...edge,
        style: {
          ...baseStyle,
          stroke: isActive ? (isCoreq ? "#005bb5" : "#444") : baseStyle.stroke,
          strokeDasharray: isCoreq ? "6 4" : undefined,
          zIndex: isActive ? 100 : 0, // ยก edge ที่ active ขึ้นบน
          pointerEvents: "all", // ให้ edge รับ hover
        },
        animated: isActive,
        strokeWidth: isActive ? 3 : baseStyle.strokeWidth,
      };
    });

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  return (
    <>
      {curriculumId && layout && (
        <ReactFlow
          nodes={getHighlightedNodes()}
          edges={getHighlightedEdges()}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          style={{ background: "#f9fafb" }}
          onNodeMouseEnter={(e, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onEdgeMouseEnter={(e, edge) => setHoveredEdgeId(edge.id)}
          onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        >
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeColor={(n) => n.style?.background || "#999"}
            nodeColor={(n) => n.style?.background || "#fff"}
            nodeBorderRadius={2}
          />
          <Background variant="cross" gap={16} size={1} color="#e2e8f0" />
        </ReactFlow>
      )}
    </>
  );
}

export default function App() {
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("");
  const curriculumIds = [...new Set(courses.map((c) => c.curriculum_id))];

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 200,
          width: "calc(100% - 32px)",
          padding: "18px 16px",
          display: "flex",
          gap: "12px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <Dropdown
          value={selectedCurriculum}
          onChange={setSelectedCurriculum}
          placeholder="-- เลือก Curriculum --"
          options={curriculumIds.map((id) => ({ value: id, label: id }))}
        />

        <Dropdown
          value={selectedLayout}
          onChange={setSelectedLayout}
          placeholder="-- เลือก Layout --"
          options={[
            { value: "vertical", label: "Vertical" },
            { value: "horizontal", label: "Horizontal" },
          ]}
        />
      </div>

      {selectedCurriculum && (
        <FlowGraph curriculumId={selectedCurriculum} layout={selectedLayout} />
      )}
    </div>
  );
}
