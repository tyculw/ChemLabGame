import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { fetchMoleculeStructure } from '../services/ai-service'
import type { MoleculeStructure } from '../services/ai-service'

interface MoleculeViewerPageProps {
  formula: string
  onBack: () => void
}

// --- Constants & Data ---
const COLORS = {
  proton: 0xff3333,
  neutron: 0x3333ff,
  electron: 0x00ffff,
  quarkU: 0xffd700, // Up quark (Gold)
  quarkD: 0x00ff00, // Down quark (Green)
  bond: 0xaaaaaa,
  atomColors: {
    'H': 0xffffff, 'O': 0xff0000, 'Na': 0xab5cf2, 'Cl': 0x00ff00, 'C': 0x555555,
    'N': 0x3050F8, 'S': 0xFFFF30, 'P': 0xFFA500, 'F': 0x90E050, 'Br': 0xA62929, 'I': 0x940094
  } as Record<string, number>
}

// Element data: Atomic number (p), Neutron count (n - estimated for most common isotope)
const ELEMENTS: Record<string, { p: number, n: number, radius: number, cn: string, en: string }> = {
  'H': { p: 1, n: 0, radius: 1.0, cn: '氢', en: 'Hydrogen' },
  'He': { p: 2, n: 2, radius: 1.0, cn: '氦', en: 'Helium' },
  'Li': { p: 3, n: 4, radius: 1.2, cn: '锂', en: 'Lithium' },
  'Be': { p: 4, n: 5, radius: 1.3, cn: '铍', en: 'Beryllium' },
  'B': { p: 5, n: 6, radius: 1.4, cn: '硼', en: 'Boron' },
  'C': { p: 6, n: 6, radius: 1.4, cn: '碳', en: 'Carbon' },
  'N': { p: 7, n: 7, radius: 1.45, cn: '氮', en: 'Nitrogen' },
  'O': { p: 8, n: 8, radius: 1.5, cn: '氧', en: 'Oxygen' },
  'F': { p: 9, n: 10, radius: 1.4, cn: '氟', en: 'Fluorine' },
  'Ne': { p: 10, n: 10, radius: 1.3, cn: '氖', en: 'Neon' },
  'Na': { p: 11, n: 12, radius: 1.8, cn: '钠', en: 'Sodium' },
  'Mg': { p: 12, n: 12, radius: 1.7, cn: '镁', en: 'Magnesium' },
  'Al': { p: 13, n: 14, radius: 1.6, cn: '铝', en: 'Aluminum' },
  'Si': { p: 14, n: 14, radius: 1.5, cn: '硅', en: 'Silicon' },
  'P': { p: 15, n: 16, radius: 1.5, cn: '磷', en: 'Phosphorus' },
  'S': { p: 16, n: 16, radius: 1.5, cn: '硫', en: 'Sulfur' },
  'Cl': { p: 17, n: 18, radius: 1.7, cn: '氯', en: 'Chlorine' },
  'K': { p: 19, n: 20, radius: 2.0, cn: '钾', en: 'Potassium' },
  'Ca': { p: 20, n: 20, radius: 1.9, cn: '钙', en: 'Calcium' },
  'Fe': { p: 26, n: 30, radius: 1.8, cn: '铁', en: 'Iron' },
  'Cu': { p: 29, n: 34, radius: 1.7, cn: '铜', en: 'Copper' },
  'Zn': { p: 30, n: 35, radius: 1.7, cn: '锌', en: 'Zinc' },
  'Ag': { p: 47, n: 60, radius: 1.9, cn: '银', en: 'Silver' },
  'Au': { p: 79, n: 118, radius: 2.0, cn: '金', en: 'Gold' },
  'I': { p: 53, n: 74, radius: 1.9, cn: '碘', en: 'Iodine' },
  'Br': { p: 35, n: 44, radius: 1.8, cn: '溴', en: 'Bromine' },
}

// Helper to get element data with fallback
const getElementData = (symbol: string) => {
  return ELEMENTS[symbol] || { p: 6, n: 6, radius: 1.4, cn: symbol, en: symbol } // Default to Carbon-like
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

export const MoleculeViewerPage: React.FC<MoleculeViewerPageProps> = ({ formula, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for multi-scale navigation
  const [level, setLevel] = useState(0) // 0: Molecule, 1: Atom, 2: Nucleus, 3: Quark
  const [selectedAtomElement, setSelectedAtomElement] = useState<string>('O')
  const [selectedNucleonType, setSelectedNucleonType] = useState<'proton' | 'neutron'>('proton')
  const [hoveredObject, setHoveredObject] = useState<string | null>(null)
  const [presentElements, setPresentElements] = useState<string[]>([])

  // Refs for Three.js objects to access inside callbacks/effects without triggering re-renders
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const mainGroupRef = useRef<THREE.Group | null>(null)
  const animatorsRef = useRef<(() => void)[]>([])
  const moleculeStructureRef = useRef<MoleculeStructure | null>(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

  // --- Level Builders ---

  const buildMoleculeLevel = useCallback(() => {
    const group = mainGroupRef.current
    const structure = moleculeStructureRef.current
    if (!group || !structure) return

    // 1. Atoms
    const positions: THREE.Vector3[] = []

    // Calculate scale to fit
    const rawPositions = structure.atoms.map(a => new THREE.Vector3(a.x, a.y, a.z))
    const box = new THREE.Box3().setFromPoints(rawPositions)
    const size = box.getSize(new THREE.Vector3()).length() || 1
    const scale = 6 / size

    structure.atoms.forEach((atom) => {
      const elData = getElementData(atom.element)
      const color = COLORS.atomColors[atom.element] || 0xcccccc

      const geo = new THREE.SphereGeometry(elData.radius * 0.4, 32, 32) // Slightly smaller for visual clarity
      const mat = new THREE.MeshPhysicalMaterial({
        color: color, metalness: 0.2, roughness: 0.3,
        clearcoat: 1.0, clearcoatRoughness: 0.1
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(atom.x * scale, atom.y * scale, atom.z * scale)

      mesh.userData = { level: 0, type: 'atom', element: atom.element }
      mesh.name = "Interactable"

      group.add(mesh)
      positions.push(mesh.position)
    })

    // 2. Bonds
    structure.bonds.forEach(b => {
      const ai = Math.max(0, Math.min(positions.length - 1, b.a))
      const bi = Math.max(0, Math.min(positions.length - 1, b.b))
      const p1 = positions[ai]
      const p2 = positions[bi]

      const dist = p1.distanceTo(p2)
      const cylinderGeo = new THREE.CylinderGeometry(0.15, 0.15, dist, 16)
      const cylinderMat = new THREE.MeshStandardMaterial({ color: COLORS.bond })
      const bond = new THREE.Mesh(cylinderGeo, cylinderMat)

      // Position and Rotation
      bond.position.copy(p1).lerp(p2, 0.5)
      bond.lookAt(p2)
      bond.rotateX(Math.PI / 2)

      group.add(bond)
    })

    // Animation
    animatorsRef.current.push(() => {
      if (group) group.rotation.y += 0.002
    })
  }, [])

  const buildAtomLevel = useCallback(() => {
    const group = mainGroupRef.current
    if (!group) return

    const elData = getElementData(selectedAtomElement)
    const pCount = elData.p

    // 1. Nucleus (Distant view)
    const nucleusGeo = new THREE.SphereGeometry(0.5, 16, 16)
    const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat)
    nucleus.userData = { level: 1, type: 'nucleus' }
    nucleus.name = "Interactable"

    const glowGeo = new THREE.SphereGeometry(0.7, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    nucleus.add(glow)
    group.add(nucleus)

    // 2. Electron Cloud
    let numShells = 1
    if (pCount > 2) numShells = 2
    if (pCount > 10) numShells = 3
    if (pCount > 18) numShells = 4

    const particleCount = 2000 * numShells
    const posArray = new Float32Array(particleCount * 3)
    const colorArray = new Float32Array(particleCount * 3)
    const baseColor = new THREE.Color(COLORS.electron)

    for (let i = 0; i < particleCount; i++) {
      const shellIndex = Math.floor(Math.random() * numShells)
      const baseRadius = 3.0 + (shellIndex * 2.5)
      const spread = 0.6 + (shellIndex * 0.2)

      const normalRand = (Math.random() + Math.random() + Math.random() + Math.random() - 2.0)
      let r = baseRadius + normalRand * spread
      if (r < 1.0) r = 1.0

      const theta = Math.random() * Math.PI * 2
      const phiInput = 2 * Math.random() - 1
      const phi = Math.acos(clamp(phiInput, -1, 1))

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      posArray[i * 3] = x
      posArray[i * 3 + 1] = y
      posArray[i * 3 + 2] = z

      const intensity = 1.0 - (shellIndex * 0.2)
      const layerColor = baseColor.clone().multiplyScalar(intensity)
      if (shellIndex === 0) layerColor.lerp(new THREE.Color(1, 1, 1), 0.3)

      colorArray[i * 3] = layerColor.r
      colorArray[i * 3 + 1] = layerColor.g
      colorArray[i * 3 + 2] = layerColor.b
    }

    const particlesGeo = new THREE.BufferGeometry()
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

    const particlesMat = new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    })

    const cloud = new THREE.Points(particlesGeo, particlesMat)
    group.add(cloud)

    animatorsRef.current.push(() => {
      cloud.rotation.y -= 0.001
      const scale = 1 + Math.sin(Date.now() * 0.002) * 0.05
      nucleus.scale.setScalar(scale)
    })
  }, [selectedAtomElement])

  const buildNucleusLevel = useCallback(() => {
    const group = mainGroupRef.current
    if (!group) return

    const elData = getElementData(selectedAtomElement)
    const pCount = elData.p
    const nCount = elData.n
    const total = pCount + nCount

    const spheres: { mesh: THREE.Mesh, basePos: THREE.Vector3, phase: number }[] = []
    const phi = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < total; i++) {
      const pos = new THREE.Vector3(0, 0, 0)
      if (total > 1) {
        const y = 1 - (i / (total - 1)) * 2
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
        const theta = phi * i
        const x = Math.cos(theta) * radiusAtY
        const z = Math.sin(theta) * radiusAtY
        pos.set(x, y, z).multiplyScalar(Math.pow(total, 1 / 3) * 1.3)
      }

      let isProton = false
      if (total === 1 && pCount === 1) isProton = true
      else if (pCount > 0 && nCount > 0) isProton = Math.random() > 0.5
      else if (pCount > 0) isProton = true

      const geo = new THREE.SphereGeometry(1.0, 32, 32)
      const mat = new THREE.MeshPhysicalMaterial({
        color: isProton ? COLORS.proton : COLORS.neutron,
        roughness: 0.4, metalness: 0.1, clearcoat: 0.5
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      mesh.userData = { level: 2, type: isProton ? 'proton' : 'neutron' }
      mesh.name = "Interactable"

      group.add(mesh)
      spheres.push({ mesh, basePos: pos.clone(), phase: Math.random() * 100 })
    }

    animatorsRef.current.push(() => {
      const time = Date.now() * 0.002
      group.rotation.y += 0.002
      spheres.forEach(obj => {
        obj.mesh.position.copy(obj.basePos).addScalar(Math.sin(time + obj.phase) * 0.05)
      })
    })
  }, [selectedAtomElement])

  const buildQuarkLevel = useCallback(() => {
    const group = mainGroupRef.current
    if (!group) return

    const types = selectedNucleonType === 'proton' ? ['u', 'u', 'd'] : ['u', 'd', 'd']
    const quarkGroup = new THREE.Group()
    const positions = [
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(-1.3, -1, 0),
      new THREE.Vector3(1.3, -1, 0)
    ]

    const quarkMeshes: { mesh: THREE.Mesh, base: THREE.Vector3, phase: number }[] = []

    // 1. Quarks
    types.forEach((type, i) => {
      const color = type === 'u' ? COLORS.quarkU : COLORS.quarkD
      const geo = new THREE.SphereGeometry(0.6, 32, 32)
      const mat = new THREE.MeshStandardMaterial({
        color: color, emissive: color, emissiveIntensity: 0.8
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(positions[i])
      quarkGroup.add(mesh)
      quarkMeshes.push({ mesh, base: positions[i], phase: i * 2 })
    })

    // 2. Gluons (Lines)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    const lineGeo = new THREE.BufferGeometry()
    const lineObj = new THREE.Line(lineGeo, lineMat)
    quarkGroup.add(lineObj)

    // 3. Confinement Shell
    const shellGeo = new THREE.SphereGeometry(3.5, 32, 32)
    const shellMat = new THREE.MeshBasicMaterial({
      color: selectedNucleonType === 'proton' ? COLORS.proton : COLORS.neutron,
      wireframe: true, transparent: true, opacity: 0.1
    })
    const shell = new THREE.Mesh(shellGeo, shellMat)
    quarkGroup.add(shell)

    group.add(quarkGroup)

    animatorsRef.current.push(() => {
      const time = Date.now() * 0.01

      const currentPoints: number[] = []
      quarkMeshes.forEach(q => {
        q.mesh.position.x = q.base.x + Math.sin(time * 3 + q.phase) * 0.3
        q.mesh.position.y = q.base.y + Math.cos(time * 2 + q.phase) * 0.3
        q.mesh.position.z = q.base.z + Math.sin(time * 4 + q.phase) * 0.3
        currentPoints.push(q.mesh.position.x, q.mesh.position.y, q.mesh.position.z)
      })

      if (currentPoints.length >= 9) {
        currentPoints.push(currentPoints[0], currentPoints[1], currentPoints[2])
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(currentPoints, 3))
      }

      quarkGroup.rotation.z += 0.01
      shell.rotation.y -= 0.005
    })
  }, [selectedNucleonType])

  // --- Main Logic ---

  const loadLevel = useCallback((lvl: number) => {
    if (!sceneRef.current) return

    // Cleanup
    if (mainGroupRef.current) {
      sceneRef.current.remove(mainGroupRef.current)
      // Optional: Dispose geometries/materials to avoid leaks
    }
    animatorsRef.current = []

    const newGroup = new THREE.Group()
    mainGroupRef.current = newGroup
    sceneRef.current.add(newGroup)

    switch (lvl) {
      case 0: buildMoleculeLevel(); break;
      case 1: buildAtomLevel(); break;
      case 2: buildNucleusLevel(); break;
      case 3: buildQuarkLevel(); break;
    }

    // Entrance animation
    newGroup.scale.set(0.1, 0.1, 0.1)
    let s = 0.1
    const targetScale = 1
    const grow = () => {
      s += (targetScale - s) * 0.1
      newGroup.scale.set(s, s, s)
      if (Math.abs(targetScale - s) > 0.01) requestAnimationFrame(grow)
    }
    grow()

  }, [buildMoleculeLevel, buildAtomLevel, buildNucleusLevel, buildQuarkLevel])

  // Initial Setup
  useEffect(() => {
    if (!containerRef.current) return

    setLoading(true)

    // Scene Setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#050505')
    scene.fog = new THREE.FogExp2(0x050505, 0.02)
    sceneRef.current = scene

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 15
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 50
    controlsRef.current = controls

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)
    const blueLight = new THREE.PointLight(0x0088ff, 2, 20)
    blueLight.position.set(-5, 0, 5)
    scene.add(blueLight)

    // Fetch Data
    fetchMoleculeStructure(formula).then(structure => {
      if (structure && structure.atoms && structure.atoms.length > 0) {
        moleculeStructureRef.current = structure

        // Extract unique elements for legend
        const elements = Array.from(new Set(structure.atoms.map(a => a.element)))
        setPresentElements(elements)

        loadLevel(0) // Start at molecule level
        setLoading(false)
      } else {
        setError('无法获取分子结构')
        setLoading(false)
      }
    })

    // Animation Loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      animatorsRef.current.forEach(fn => fn())
      renderer.render(scene, camera)
    }
    animate()

    // Resize Handler
    const onResize = () => {
      if (!containerRef.current || !renderer || !camera) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
    }
  }, [formula]) // Only re-run if formula changes

  // React to level changes
  useEffect(() => {
    if (!loading && !error) {
      loadLevel(level)
    }
  }, [level, loading, error, loadLevel])

  // Interaction Handlers
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!cameraRef.current || !mainGroupRef.current) return

    // Calculate mouse position in normalized device coordinates
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    mouseRef.current.set(x, y)
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

    const intersects = raycasterRef.current.intersectObjects(mainGroupRef.current.children, true)

    if (intersects.length > 0) {
      const obj = intersects[0].object
      if (obj.userData.level !== undefined) {
        if (level === 0 && obj.userData.type === 'atom') {
          setSelectedAtomElement(obj.userData.element)
          setLevel(1)
        } else if (level === 1 && obj.userData.type === 'nucleus') {
          setLevel(2)
        } else if (level === 2 && (obj.userData.type === 'proton' || obj.userData.type === 'neutron')) {
          setSelectedNucleonType(obj.userData.type)
          setLevel(3)
        }
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cameraRef.current || !mainGroupRef.current) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    mouseRef.current.set(x, y)
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

    const intersects = raycasterRef.current.intersectObjects(mainGroupRef.current.children, true)

    if (intersects.length > 0 && intersects[0].object.name === "Interactable") {
      document.body.style.cursor = 'pointer'
      setHoveredObject("点击查看详情")
    } else {
      document.body.style.cursor = 'default'
      setHoveredObject(null)
    }
  }

  return (
    <div className="relative w-full h-full bg-black text-white overflow-hidden font-sans select-none">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full py-4 pl-4 pr-32 bg-black/60 backdrop-blur-sm border-b border-gray-800 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-blue-400 uppercase">
            {level === 0 && `分子层级: ${formula}`}
            {level === 1 && `原子层级: ${selectedAtomElement} 元素`}
            {level === 2 && `原子核层级: ${selectedAtomElement} 原子`}
            {level === 3 && `基本粒子: ${selectedNucleonType === 'proton' ? '质子' : '中子'}内部`}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {level === 0 && "化学键将原子结合在一起。点击原子可进入内部。"}
            {level === 1 && "电子以概率云的形式存在。中心发光点是原子核。"}
            {level === 2 && "质子和中子被强核力紧紧束缚。"}
            {level === 3 && "夸克被胶子禁闭。无法单独观测到夸克。"}
          </p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">
          返回
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />

      {/* Loading/Error Overlays */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-blue-400 text-xl animate-pulse">正在加载微观模型...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-red-500 text-xl">{error}</div>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-800 rounded">返回</button>
        </div>
      )}

      {/* Hover Hint */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${hoveredObject ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="bg-black/70 border border-blue-400 px-4 py-2 rounded-full text-white text-sm">
          {hoveredObject}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-24 right-32 bg-black/50 p-4 rounded text-base text-right space-y-2 pointer-events-none">
        {level === 0 && (
          <>
            {presentElements.map(el => {
              const elData = getElementData(el);
              const col = COLORS.atomColors[el] || 0xcccccc;
              return (
                <div key={el} className="flex items-center justify-end">
                  <span className="mr-2">{el} {elData.cn} ({elData.en})</span>
                  <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: `#${col.toString(16).padStart(6, '0')}` }}></span>
                </div>
              );
            })}
          </>
        )}
        {level === 1 && (
          <>
            <div className="flex items-center justify-end"><span className="mr-2">电子云</span><span className="inline-block w-4 h-4 rounded-full bg-cyan-400"></span></div>
            <div className="flex items-center justify-end"><span className="mr-2">原子核</span><span className="inline-block w-4 h-4 rounded-full bg-white"></span></div>
          </>
        )}
        {level === 2 && (
          <>
            <div className="flex items-center justify-end"><span className="mr-2">质子 (+)</span><span className="inline-block w-4 h-4 rounded-full bg-red-500"></span></div>
            <div className="flex items-center justify-end"><span className="mr-2">中子 (0)</span><span className="inline-block w-4 h-4 rounded-full bg-blue-600"></span></div>
          </>
        )}
        {level === 3 && (
          <>
            <div className="flex items-center justify-end"><span className="mr-2">上夸克 (u)</span><span className="inline-block w-4 h-4 rounded-full bg-yellow-400"></span></div>
            <div className="flex items-center justify-end"><span className="mr-2">下夸克 (d)</span><span className="inline-block w-4 h-4 rounded-full bg-green-500"></span></div>
          </>
        )}
      </div>

      {/* Bottom Controls (Slider) */}
      <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between mt-2 text-base text-gray-500 font-mono">
            <span
              onClick={() => setLevel(0)}
              className={`cursor-pointer transition-colors ${level === 0 ? 'text-white font-bold scale-110' : 'hover:text-gray-300'}`}
            >
              分子<br />Molecule
            </span>
            <span
              onClick={() => setLevel(1)}
              className={`cursor-pointer transition-colors ${level === 1 ? 'text-white font-bold scale-110' : 'hover:text-gray-300'}`}
            >
              原子<br />Atom
            </span>
            <span
              onClick={() => setLevel(2)}
              className={`cursor-pointer transition-colors ${level === 2 ? 'text-white font-bold scale-110' : 'hover:text-gray-300'}`}
            >
              原子核<br />Nucleus
            </span>
            <span
              onClick={() => setLevel(3)}
              className={`cursor-pointer transition-colors ${level === 3 ? 'text-white font-bold scale-110' : 'hover:text-gray-300'}`}
            >
              夸克<br />Quark
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoleculeViewerPage
