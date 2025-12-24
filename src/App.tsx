import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Group } from "three";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { Table } from "./models/table";
import { PictureFrame } from "./models/pictureFrame";
import { Fireworks } from "./components/Fireworks";
import { BirthdayCard } from "./components/BirthdayCard";

import "./App.css";

/* ---------------- utils ---------------- */

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------------- scene config ---------------- */

const TABLE_SLIDE_DURATION = 0.7;

const ORBIT_TARGET = new Vector3(0, 0.8, 0);
const ORBIT_INITIAL_RADIUS = 4;
const ORBIT_INITIAL_HEIGHT = 2;
const ORBIT_INITIAL_AZIMUTH = Math.PI / 2;
const ORBIT_MIN_DISTANCE = 1.2;
const ORBIT_MAX_DISTANCE = 7;
const ORBIT_MIN_POLAR = 0;
const ORBIT_MAX_POLAR = Math.PI / 2.1;



/* ---------------- typed intro ---------------- */

const TYPED_LINES = [
  "> ved",
  "> today is your birthday",
  "...",
  "> so i made you this computer program",
  "...",
  "٩(◕‿◕)۶ ٩(◕‿◕)۶ ٩(◕‿◕)۶",
];

const TYPED_CHAR_DELAY = 100;
const POST_TYPING_SCENE_DELAY = 1000;
const CURSOR_BLINK_INTERVAL = 580;

/* ---------------- cards ---------------- */

type BirthdayCardConfig = {
  id: string;
  image: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

const BIRTHDAY_CARDS: ReadonlyArray<BirthdayCardConfig> = [
  {
    id: "card-1",
    image: "/card.png",
    position: [.6, 0.081, -0.2],
    rotation: [-Math.PI / 2, 0, Math.PI / 3],
  },
  {
    id: "card-2",
    image: "/card1.png",
    position: [2.5, 0.081, -2],
    rotation: [-Math.PI / 2, 0, Math.PI / 3],
  },
  {
    id: "card-3",
    image: "/card2.png",
    position: [1.4, 0.081, 2],
    rotation: [-Math.PI / 2, 0, -Math.PI / 3],
  },
  {
    id: "card-4",
    image: "/card3.png",
    position: [2.9, 0.081, 2.4],
    rotation: [-Math.PI / 2, 0, Math.PI / 3],
  },
];

/* ---------------- animated scene ---------------- */

type AnimatedSceneProps = {
  isPlaying: boolean;
  onBackgroundFadeChange?: (opacity: number) => void;
  cards: ReadonlyArray<BirthdayCardConfig>;
  activeCardId: string | null;
  onToggleCard: (id: string) => void;
};

function AnimatedScene({
  isPlaying,
  onBackgroundFadeChange,
  cards,
  activeCardId,
  onToggleCard,
}: AnimatedSceneProps) {
  const tableGroup = useRef<Group>(null);
  const animationStartRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const table = tableGroup.current;
    if (!table) return;

    if (!isPlaying) {
      animationStartRef.current = null;
      onBackgroundFadeChange?.(1);
      return;
    }

    if (animationStartRef.current === null) {
      animationStartRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - animationStartRef.current;
    const progress = clamp(elapsed / TABLE_SLIDE_DURATION, 0, 1);
    const eased = easeOutCubic(progress);

    table.position.set(0, 0, 0);
    table.rotation.set(0, 0, 0);

    onBackgroundFadeChange?.(1 - eased);
  });

  return (
    <group ref={tableGroup}>
      <Table />

      <PictureFrame image="/frame1.jpg" position={[-1, 1.1, 3]} rotation={[0, 5.2, 0]} scale={1.1} />
      <PictureFrame image="/frame2.jpg" position={[0.3, 0.735, 3]} rotation={[0, 5.2, 0]} scale={0.8} />
      <PictureFrame image="/frame222.jpg" position={[2, 1.2, 4.1]} rotation={[0, 6.1, 0]} scale={1.4} />
      <PictureFrame image="/frame21.jpg" position={[0.15, 0.5, 1.5]} rotation={[0, 4.3, 0]} scale={0.55} />
      <PictureFrame image="/frame3.jpg" position={[-1.5, 0.92, -1.7]} rotation={[0, 4.5, 0]} scale={1} />
      <PictureFrame image="/frame11.jpg" position={[0, 1.4, -4.5]} rotation={[0, 3.6, 0]} scale={1.5} />
      <PictureFrame image="/frame101.jpg" position={[2.5, 1, -4.5]} rotation={[0, 3, 0]} scale={1.1} />
      <PictureFrame image="/frame4.jpg" position={[0, 0.735, -2.5]} rotation={[0, 4.5, 0]} scale={0.8} />
      <PictureFrame image="/frame5.jpg" position={[-3, 1.5, -0.3]} rotation={[0, 4.6, 0]} scale={1.51} />
      <PictureFrame image="/frame6.jpg" position={[-3, 1.5, 2.8]} rotation={[0, 5, 0]} scale={1.51} />
      <PictureFrame image="/frame7.jpg" position={[-2.3, 1.5, -3.1]} rotation={[0, 4.3, 0]} scale={1.51} />
      <PictureFrame image="/frame71.jpg" position={[-1.8, 0.7, 0.9]} rotation={[0, 4.9, 0]} scale={0.7} />

      {cards.map((card) => (
        <BirthdayCard
          key={card.id}
          id={card.id}
          image={card.image}
          tablePosition={card.position}
          tableRotation={card.rotation}
          isActive={activeCardId === card.id}
          onToggle={onToggleCard}
        />
      ))}
    </group>
  );
}

/* ---------------- camera ---------------- */

function ConfiguredOrbitControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const offset = new Vector3(
      Math.sin(ORBIT_INITIAL_AZIMUTH) * ORBIT_INITIAL_RADIUS,
      ORBIT_INITIAL_HEIGHT,
      Math.cos(ORBIT_INITIAL_AZIMUTH) * ORBIT_INITIAL_RADIUS
    );
    camera.position.copy(ORBIT_TARGET.clone().add(offset));
    camera.lookAt(ORBIT_TARGET);

    controlsRef.current?.target.copy(ORBIT_TARGET);
    controlsRef.current?.update();
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={ORBIT_MIN_DISTANCE}
      maxDistance={ORBIT_MAX_DISTANCE}
      minPolarAngle={ORBIT_MIN_POLAR}
      maxPolarAngle={ORBIT_MAX_POLAR}
    />
  );
}

/* ---------------- app ---------------- */

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [sceneStarted, setSceneStarted] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/music.mp3");
    audio.loop = true;
    backgroundAudioRef.current = audio;
    return () => audio.pause();
  }, []);

  const playMusic = useCallback(() => {
    backgroundAudioRef.current?.play().catch(() => {});
  }, []);

  /* ✅ TOGGLE LOGIC (THIS FIXES STICKING) */
  const handleToggleCard = useCallback((id: string) => {
    setActiveCardId((current) => (current === id ? null : id));
  }, []);

  /* ✅ CLICK OUTSIDE TO CLOSE CARD */
  useEffect(() => {
    const close = () => setActiveCardId(null);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  const typingComplete = currentLineIndex >= TYPED_LINES.length;

  const typedLines = useMemo(() => {
    return TYPED_LINES.map((line, i) => {
      if (typingComplete || i < currentLineIndex) return line;
      if (i === currentLineIndex) return line.slice(0, currentCharIndex);
      return "";
    });
  }, [currentCharIndex, currentLineIndex, typingComplete]);

  useEffect(() => {
    if (!hasStarted) return;

    if (typingComplete && !sceneStarted) {
      const t = setTimeout(() => setSceneStarted(true), POST_TYPING_SCENE_DELAY);
      return () => clearTimeout(t);
    }

    const line = TYPED_LINES[currentLineIndex] ?? "";
    const t = setTimeout(() => {
      if (currentCharIndex < line.length) {
        setCurrentCharIndex((v) => v + 1);
      } else {
        setCurrentLineIndex((v) => v + 1);
        setCurrentCharIndex(0);
      }
    }, TYPED_CHAR_DELAY);

    return () => clearTimeout(t);
  }, [hasStarted, currentCharIndex, currentLineIndex, typingComplete, sceneStarted]);

  useEffect(() => {
    const t = setInterval(() => setCursorVisible((v) => !v), CURSOR_BLINK_INTERVAL);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (!hasStarted) {
        playMusic();
        setHasStarted(true);
        setFireworksActive(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasStarted, playMusic]);

  return (
    <div className="App">
      <div className="background-overlay" style={{ opacity: backgroundOpacity }}>
        <div className="typed-text">
          {typedLines.map((line, i) => (
            <span key={i} className="typed-line">
              {line || "\u00a0"}
              {cursorVisible && i === currentLineIndex && !typingComplete && (
                <span className="typed-cursor">_</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <Canvas gl={{ alpha: true }} style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <AnimatedScene
            isPlaying={hasStarted && sceneStarted}
            onBackgroundFadeChange={setBackgroundOpacity}
            cards={BIRTHDAY_CARDS}
            activeCardId={activeCardId}
            onToggleCard={handleToggleCard}
          />
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 10, 0]} intensity={0.5} />
          <Environment files={["/city.hdr"]} background />
          <Fireworks isActive={fireworksActive} origin={[0, 10, 0]} />
          <ConfiguredOrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
