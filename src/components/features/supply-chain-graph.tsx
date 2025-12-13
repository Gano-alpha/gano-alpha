'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { cn } from '@/lib/utils'

// Custom node component for stocks
function StockNode({ data, selected }: { data: any; selected: boolean }) {
  const isCenter = data.isCenter
  const nodeType = data.type // 'supplier', 'customer', 'center'

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border-2 shadow-lg transition-all duration-200',
        isCenter
          ? 'bg-gradient-to-br from-indigo-500 to-teal-500 border-transparent min-w-[120px]'
          : nodeType === 'supplier'
          ? 'bg-surface border-indigo-200 hover:border-indigo-400'
          : 'bg-surface border-teal-200 hover:border-teal-400',
        selected && !isCenter && 'ring-2 ring-indigo-500 ring-offset-2'
      )}
    >
      <div className={cn('text-center', isCenter ? 'text-white' : '')}>
        <p className={cn(
          'font-bold',
          isCenter ? 'text-xl' : 'text-base text-primary'
        )}>
          {data.ticker}
        </p>
        <p className={cn(
          'text-xs mt-0.5 truncate max-w-[100px]',
          isCenter ? 'text-white/80' : 'text-secondary'
        )}>
          {data.name}
        </p>
        {!isCenter && data.confidence && (
          <div className={cn(
            'mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block',
            nodeType === 'supplier' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'
          )}>
            {Math.round(data.confidence * 100)}%
          </div>
        )}
      </div>
    </div>
  )
}

// Custom edge component with labels
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: any) {
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY} ${targetX - 50} ${targetY} ${targetX} ${targetY}`

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={data?.type === 'supplier' ? '#6366F1' : '#14B8A6'}
        fill="none"
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 10, fill: '#64748B' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  )
}

const nodeTypes = {
  stock: StockNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

interface SupplyChainNode {
  id: string
  ticker: string
  name: string
  type: 'supplier' | 'customer' | 'center'
  relation?: string
  confidence?: number
}

interface SupplyChainGraphProps {
  centerTicker: string
  centerName: string
  suppliers: SupplyChainNode[]
  customers: SupplyChainNode[]
  onNodeClick?: (node: SupplyChainNode) => void
  className?: string
}

export function SupplyChainGraph({
  centerTicker,
  centerName,
  suppliers,
  customers,
  onNodeClick,
  className,
}: SupplyChainGraphProps) {
  // Calculate node positions
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Center node
    const centerX = 400
    const centerY = 300

    nodes.push({
      id: 'center',
      type: 'stock',
      position: { x: centerX - 60, y: centerY - 40 },
      data: {
        ticker: centerTicker,
        name: centerName,
        isCenter: true,
        type: 'center',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    })

    // Supplier nodes (left side)
    const supplierSpacing = Math.min(120, 500 / Math.max(suppliers.length, 1))
    const supplierStartY = centerY - ((suppliers.length - 1) * supplierSpacing) / 2

    suppliers.forEach((supplier, index) => {
      const nodeId = `supplier-${supplier.id}`
      nodes.push({
        id: nodeId,
        type: 'stock',
        position: { x: 50, y: supplierStartY + index * supplierSpacing - 30 },
        data: {
          ...supplier,
          type: 'supplier',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })

      edges.push({
        id: `edge-${nodeId}`,
        source: nodeId,
        target: 'center',
        type: 'custom',
        animated: true,
        data: {
          label: supplier.relation,
          type: 'supplier',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366F1',
        },
        style: { stroke: '#6366F1' },
      })
    })

    // Customer nodes (right side)
    const customerSpacing = Math.min(120, 500 / Math.max(customers.length, 1))
    const customerStartY = centerY - ((customers.length - 1) * customerSpacing) / 2

    customers.forEach((customer, index) => {
      const nodeId = `customer-${customer.id}`
      nodes.push({
        id: nodeId,
        type: 'stock',
        position: { x: 700, y: customerStartY + index * customerSpacing - 30 },
        data: {
          ...customer,
          type: 'customer',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })

      edges.push({
        id: `edge-${nodeId}`,
        source: 'center',
        target: nodeId,
        type: 'custom',
        animated: true,
        data: {
          label: customer.relation,
          type: 'customer',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#14B8A6',
        },
        style: { stroke: '#14B8A6' },
      })
    })

    return { nodes, edges }
  }, [centerTicker, centerName, suppliers, customers])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.id === 'center') return

      const nodeData = node.data as SupplyChainNode
      onNodeClick?.(nodeData)
    },
    [onNodeClick]
  )

  return (
    <div className={cn('w-full h-full bg-slate-50 rounded-xl', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Background color="#E2E8F0" gap={20} size={1} />
        <Controls
          className="bg-surface border border-slate-200 rounded-lg shadow-sm"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm rounded-lg border border-slate-200 p-3 shadow-sm">
        <p className="text-xs font-medium text-primary mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span>Suppliers (Upstream)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <div className="w-3 h-3 rounded bg-teal-500" />
            <span>Customers (Downstream)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
