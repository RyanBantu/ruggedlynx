import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type GlobeProps = {
  target?: { lat: number; lon: number } | null
  highlight?: boolean
  statusLabel?: string
}

const EARTH_DAY =
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-blue-marble.jpg'
const EARTH_BUMP =
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-topology.png'
const EARTH_SPEC =
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-water.png'

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function createStarfield(count = 1400) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 18 + Math.random() * 28
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xb8c4b0,
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  })
  return new THREE.Points(geo, mat)
}

function createFresnelMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      glowColor: { value: new THREE.Color(0x6f9e78) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 2.4);
        gl_FragColor = vec4(glowColor, fresnel * 0.55);
      }
    `,
  })
}

export function Globe({ target, highlight, statusLabel }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<THREE.Mesh | null>(null)
  const earthRef = useRef<THREE.Group | null>(null)
  const ringRef = useRef<THREE.Mesh | null>(null)
  const beamRef = useRef<THREE.Mesh | null>(null)
  const targetQuatRef = useRef<THREE.Quaternion | null>(null)
  const highlightRef = useRef(highlight)
  const texturesRef = useRef<THREE.Texture[]>([])

  useEffect(() => {
    highlightRef.current = highlight
  }, [highlight])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth || 600
    const height = mount.clientHeight || 500
    let disposed = false

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 0.15, 3.55)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    const stars = createStarfield()
    scene.add(stars)

    const ambient = new THREE.AmbientLight(0x6a7a72, 0.35)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xfff2dd, 1.65)
    sun.position.set(5, 2.2, 3.5)
    scene.add(sun)
    const rim = new THREE.DirectionalLight(0x7ea88a, 0.45)
    rim.position.set(-4, -1, -2)
    scene.add(rim)

    const earthGroup = new THREE.Group()
    earthRef.current = earthGroup
    scene.add(earthGroup)

    const radius = 1.18
    const earthGeo = new THREE.SphereGeometry(radius, 96, 96)
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x7a8a7c,
      specular: new THREE.Color(0x111811),
      shininess: 8,
    })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    earthGroup.add(earth)

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')

    const loadTex = (url: string, srgb = true) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          url,
          (tex) => {
            if (srgb) tex.colorSpace = THREE.SRGBColorSpace
            tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
            texturesRef.current.push(tex)
            resolve(tex)
          },
          undefined,
          reject,
        )
      })

    void Promise.all([
      loadTex(EARTH_DAY, true),
      loadTex(EARTH_BUMP, false),
      loadTex(EARTH_SPEC, false),
    ])
      .then(([day, bump, spec]) => {
        if (disposed) return
        earthMat.map = day
        earthMat.bumpMap = bump
        earthMat.bumpScale = 0.045
        earthMat.specularMap = spec
        earthMat.specular = new THREE.Color(0x333833)
        earthMat.shininess = 14
        earthMat.color.set(0xffffff)
        earthMat.needsUpdate = true
      })
      .catch(() => {
        // Keep muted fallback if CDN textures fail
      })

    // Subtle wireframe longitude lattice for sci-fi read
    const latticeGeo = new THREE.SphereGeometry(radius * 1.012, 36, 24)
    const latticeMat = new THREE.MeshBasicMaterial({
      color: 0x8fb89a,
      wireframe: true,
      transparent: true,
      opacity: 0.045,
    })
    earthGroup.add(new THREE.Mesh(latticeGeo, latticeMat))

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.08, 64, 64),
      createFresnelMaterial(),
    )
    scene.add(atmo)

    // Orbital ring
    const orbitGeo = new THREE.TorusGeometry(radius * 1.42, 0.004, 12, 180)
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x9bb8a4,
      transparent: true,
      opacity: 0.28,
    })
    const orbit = new THREE.Mesh(orbitGeo, orbitMat)
    orbit.rotation.x = Math.PI / 2.6
    orbit.rotation.y = 0.35
    scene.add(orbit)

    const orbit2 = orbit.clone()
    orbit2.scale.setScalar(1.08)
    orbit2.rotation.x = Math.PI / 2.2
    orbit2.rotation.z = 0.5
    ;(orbit2.material as THREE.MeshBasicMaterial).opacity = 0.12
    scene.add(orbit2)

    // Target marker
    const markerGeo = new THREE.SphereGeometry(0.022, 20, 20)
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xc5e6c8,
      emissive: 0x3d8f5c,
      emissiveIntensity: 1.2,
      roughness: 0.25,
      metalness: 0.4,
    })
    const marker = new THREE.Mesh(markerGeo, markerMat)
    marker.visible = false
    markerRef.current = marker
    earthGroup.add(marker)

    const ringGeo = new THREE.RingGeometry(0.04, 0.065, 48)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa8d4b0,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.visible = false
    ringRef.current = ring
    earthGroup.add(ring)

    const beamGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.35, 8)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x9fd4aa,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
    const beam = new THREE.Mesh(beamGeo, beamMat)
    beam.visible = false
    beamRef.current = beam
    earthGroup.add(beam)

    let frame = 0
    let raf = 0
    let last = performance.now()

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      frame += 1

      stars.rotation.y += dt * 0.008
      orbit.rotation.z += dt * 0.05
      orbit2.rotation.z -= dt * 0.03

      if (targetQuatRef.current && earthRef.current) {
        earthRef.current.quaternion.slerp(targetQuatRef.current, 1 - Math.pow(0.0008, dt))
      } else if (earthRef.current) {
        earthRef.current.rotation.y += dt * 0.065
      }

      if (ringRef.current?.visible) {
        const pulse = 1 + Math.sin(frame * 0.06) * 0.18
        ringRef.current.scale.setScalar(pulse)
        ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.4 + Math.sin(frame * 0.06) * 0.25
      }

      if (markerRef.current?.visible && highlightRef.current) {
        const s = 1 + Math.sin(frame * 0.1) * 0.12
        markerRef.current.scale.setScalar(s)
      }

      if (beamRef.current?.visible) {
        ;(beamRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.2 + Math.sin(frame * 0.08) * 0.12
      }

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(animate)

    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      texturesRef.current.forEach((t) => t.dispose())
      texturesRef.current = []
      renderer.dispose()
      earthGeo.dispose()
      earthMat.dispose()
      latticeGeo.dispose()
      latticeMat.dispose()
      markerGeo.dispose()
      markerMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      beamGeo.dispose()
      beamMat.dispose()
      orbitGeo.dispose()
      orbitMat.dispose()
      stars.geometry.dispose()
      ;(stars.material as THREE.Material).dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    if (!target || !markerRef.current || !ringRef.current || !earthRef.current) {
      if (markerRef.current) markerRef.current.visible = false
      if (ringRef.current) ringRef.current.visible = false
      if (beamRef.current) beamRef.current.visible = false
      targetQuatRef.current = null
      return
    }

    const surface = latLonToVector3(target.lat, target.lon, 1.185)
    markerRef.current.position.copy(surface)
    markerRef.current.visible = true

    ringRef.current.position.copy(surface)
    ringRef.current.lookAt(0, 0, 0)
    ringRef.current.visible = true

    if (beamRef.current) {
      const outer = surface.clone().normalize().multiplyScalar(1.36)
      beamRef.current.position.copy(surface.clone().lerp(outer, 0.5))
      beamRef.current.lookAt(0, 0, 0)
      beamRef.current.rotateX(Math.PI / 2)
      beamRef.current.visible = true
    }

    const targetDir = surface.clone().normalize()
    const camDir = new THREE.Vector3(0, 0.05, 1).normalize()
    targetQuatRef.current = new THREE.Quaternion().setFromUnitVectors(targetDir, camDir)
  }, [target])

  return (
    <div className="globe-stage">
      <div className="globe-canvas" ref={mountRef} aria-hidden="true" />
      <div className="globe-hud" aria-hidden="true">
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />
        <div className="hud-readout">
          <span className="hud-dot" />
          <span>{statusLabel ?? 'ORBITAL SCAN · IDLE'}</span>
        </div>
      </div>
    </div>
  )
}
