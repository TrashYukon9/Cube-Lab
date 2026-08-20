import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  ContactShadows,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";

import * as THREE from "three";
import confetti from "canvas-confetti";

import type { GameMode } from "../types/game";
import { MoveHistory } from "./MoveHistory";


type Position = [
  number,
  number,
  number,
];

type Axis = "x" | "y" | "z";

interface StickerProps {
  position: Position;
  rotation: Position;
  color: string;
}

interface MoveConfiguration {
  axis: Axis;
  layer: number;
  angle: number;
  label: string;
}

interface MoveCommand
  extends MoveConfiguration {
  id: number;
}

interface MoveRecord
  extends MoveConfiguration {}

interface QueuedMove
  extends MoveConfiguration {
  record: boolean;
}

interface ActiveMove {
  axis: Axis;
  targetAngle: number;
  selectedPieces: THREE.Group[];
}

interface GameRecords {
  bestTime: number | null;
  bestMoves: number | null;
  solvedCubes: number;
}

interface DragInformation {
  startX: number;
  startY: number;
  piece: THREE.Group;
  faceNormal: THREE.Vector3;
}

interface CubieProps {
  id: string;
  originalPosition: Position;

  registerPiece: (
    id: string,
    object: THREE.Group | null,
  ) => void;

  onDragStart: (
    piece: THREE.Group,
    event: ThreeEvent<PointerEvent>,
  ) => void;
}

interface RubiksCubeProps {
  command: MoveCommand | null;
  dragEnabled: boolean;

  onGestureMove: (
    move: MoveConfiguration,
  ) => void;

  onDragStateChange: (
    dragging: boolean,
  ) => void;

  onMoveFinished: (
    cubeIsSolved: boolean,
  ) => void;
}

interface CubeSceneProps {
  mode: GameMode;
  onBack: () => void;
}

const COLORS = {
  right: "#d93832",
  left: "#ff7a18",
  top: "#f4d447",
  bottom: "#f2f0e8",
  front: "#2dbd72",
  back: "#2879df",
};

const BUTTON_MOVES: MoveConfiguration[] = [
  {
    axis: "y",
    layer: 1,
    angle: -Math.PI / 2,
    label: "U",
  },
  {
    axis: "y",
    layer: 1,
    angle: Math.PI / 2,
    label: "U′",
  },
  {
    axis: "y",
    layer: -1,
    angle: Math.PI / 2,
    label: "D",
  },
  {
    axis: "y",
    layer: -1,
    angle: -Math.PI / 2,
    label: "D′",
  },
  {
    axis: "x",
    layer: -1,
    angle: Math.PI / 2,
    label: "L",
  },
  {
    axis: "x",
    layer: -1,
    angle: -Math.PI / 2,
    label: "L′",
  },
  {
    axis: "x",
    layer: 1,
    angle: -Math.PI / 2,
    label: "R",
  },
  {
    axis: "x",
    layer: 1,
    angle: Math.PI / 2,
    label: "R′",
  },
  {
    axis: "z",
    layer: 1,
    angle: -Math.PI / 2,
    label: "F",
  },
  {
    axis: "z",
    layer: 1,
    angle: Math.PI / 2,
    label: "F′",
  },
  {
    axis: "z",
    layer: -1,
    angle: Math.PI / 2,
    label: "B",
  },
  {
    axis: "z",
    layer: -1,
    angle: -Math.PI / 2,
    label: "B′",
  },
];

function formatTime(seconds: number) {
  const minutes = Math.floor(
    seconds / 60,
  );

  const remainingSeconds =
    seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function getAxisVector(axis: Axis) {
  if (axis === "x") {
    return new THREE.Vector3(1, 0, 0);
  }

  if (axis === "y") {
    return new THREE.Vector3(0, 1, 0);
  }

  return new THREE.Vector3(0, 0, 1);
}

function getDominantAxis(
  vector: THREE.Vector3,
): Axis {
  const x = Math.abs(vector.x);
  const y = Math.abs(vector.y);
  const z = Math.abs(vector.z);

  if (x >= y && x >= z) {
    return "x";
  }

  if (y >= z) {
    return "y";
  }

  return "z";
}

function createMoveLabel(
  axis: Axis,
  layer: number,
  angle: number,
) {
  const positive = angle > 0;

  if (axis === "x") {
    if (layer === 1) {
      return positive ? "R′" : "R";
    }

    if (layer === -1) {
      return positive ? "L" : "L′";
    }

    return positive ? "M′" : "M";
  }

  if (axis === "y") {
    if (layer === 1) {
      return positive ? "U′" : "U";
    }

    if (layer === -1) {
      return positive ? "D" : "D′";
    }

    return positive ? "E" : "E′";
  }

  if (layer === 1) {
    return positive ? "F′" : "F";
  }

  if (layer === -1) {
    return positive ? "B" : "B′";
  }

  return positive ? "S′" : "S";
}

function Sticker({
  position,
  rotation,
  color,
}: StickerProps) {
  return (
    <mesh
      position={position}
      rotation={rotation}
    >
      <planeGeometry
        args={[0.82, 0.82]}
      />

      <meshStandardMaterial
        color={color}
        roughness={0.45}
      />
    </mesh>
  );
}

function Cubie({
  id,
  originalPosition,
  registerPiece,
  onDragStart,
}: CubieProps) {
  const pieceRef =
    useRef<THREE.Group>(null);

  const [x, y, z] =
    originalPosition;

  return (
    <group
      position={originalPosition}
      ref={(object) => {
        pieceRef.current = object;
        registerPiece(id, object);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();

        if (!pieceRef.current) {
          return;
        }

        onDragStart(
          pieceRef.current,
          event,
        );
      }}
    >
      <RoundedBox
        args={[0.94, 0.94, 0.94]}
        radius={0.08}
        smoothness={3}
      >
        <meshStandardMaterial
          color="#101612"
          roughness={0.35}
          metalness={0.05}
        />
      </RoundedBox>

      {x === 1 && (
        <Sticker
          position={[0.476, 0, 0]}
          rotation={[
            0,
            Math.PI / 2,
            0,
          ]}
          color={COLORS.right}
        />
      )}

      {x === -1 && (
        <Sticker
          position={[-0.476, 0, 0]}
          rotation={[
            0,
            -Math.PI / 2,
            0,
          ]}
          color={COLORS.left}
        />
      )}

      {y === 1 && (
        <Sticker
          position={[0, 0.476, 0]}
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          color={COLORS.top}
        />
      )}

      {y === -1 && (
        <Sticker
          position={[0, -0.476, 0]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
          color={COLORS.bottom}
        />
      )}

      {z === 1 && (
        <Sticker
          position={[0, 0, 0.476]}
          rotation={[0, 0, 0]}
          color={COLORS.front}
        />
      )}

      {z === -1 && (
        <Sticker
          position={[0, 0, -0.476]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
          color={COLORS.back}
        />
      )}
    </group>
  );
}

function checkCubeSolved(
  pieces: Map<string, THREE.Group>,
) {
  for (const [id, piece] of pieces) {
    const [
      originalX,
      originalY,
      originalZ,
    ] = id
      .split(",")
      .map(Number);

    const correctPosition =
      Math.round(piece.position.x) ===
        originalX &&
      Math.round(piece.position.y) ===
        originalY &&
      Math.round(piece.position.z) ===
        originalZ;

    if (!correctPosition) {
      return false;
    }

    const identityQuaternion =
      new THREE.Quaternion();

    const orientationDifference =
      piece.quaternion.angleTo(
        identityQuaternion,
      );

    if (
      orientationDifference > 0.01
    ) {
      return false;
    }
  }

  return true;
}

function RubiksCube({
  command,
  dragEnabled,
  onGestureMove,
  onDragStateChange,
  onMoveFinished,
}: RubiksCubeProps) {
  const { camera } = useThree();

  const cubeRef =
    useRef<THREE.Group>(null);

  const pivotRef =
    useRef<THREE.Group>(null);

  const piecesRef =
    useRef<Map<string, THREE.Group>>(
      new Map(),
    );

  const activeMoveRef =
    useRef<ActiveMove | null>(null);

  const dragRef =
    useRef<DragInformation | null>(
      null,
    );

  const dragEnabledRef =
    useRef(dragEnabled);

  const gestureCallbackRef =
    useRef(onGestureMove);

  const dragStateCallbackRef =
    useRef(onDragStateChange);

  useEffect(() => {
    dragEnabledRef.current =
      dragEnabled;
  }, [dragEnabled]);

  useEffect(() => {
    gestureCallbackRef.current =
      onGestureMove;
  }, [onGestureMove]);

  useEffect(() => {
    dragStateCallbackRef.current =
      onDragStateChange;
  }, [onDragStateChange]);

  const positions =
    useMemo<Position[]>(() => {
      const result: Position[] = [];

      for (let x = -1; x <= 1; x += 1) {
        for (
          let y = -1;
          y <= 1;
          y += 1
        ) {
          for (
            let z = -1;
            z <= 1;
            z += 1
          ) {
            result.push([x, y, z]);
          }
        }
      }

      return result;
    }, []);

  function registerPiece(
    id: string,
    object: THREE.Group | null,
  ) {
    if (object) {
      piecesRef.current.set(
        id,
        object,
      );
    } else {
      piecesRef.current.delete(id);
    }
  }

  function startDrag(
    piece: THREE.Group,
    event: ThreeEvent<PointerEvent>,
  ) {
    if (
      !dragEnabledRef.current ||
      !cubeRef.current
    ) {
      return;
    }

    const cube =
      cubeRef.current;

    const localHitPoint =
      cube.worldToLocal(
        event.point.clone(),
      );

    const hitDifference =
      localHitPoint.sub(
        piece.position,
      );

    const faceAxis =
      getDominantAxis(
        hitDifference,
      );

    const faceNormal =
      getAxisVector(faceAxis);

    if (
      hitDifference[faceAxis] < 0
    ) {
      faceNormal.multiplyScalar(-1);
    }

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      piece,
      faceNormal,
    };

    dragStateCallbackRef.current(
      true,
    );
  }

  useEffect(() => {
    function handlePointerMove(
      event: PointerEvent,
    ) {
      const drag =
        dragRef.current;

      const cube =
        cubeRef.current;

      if (
        !drag ||
        !cube ||
        !dragEnabledRef.current
      ) {
        return;
      }

      const dragX =
        event.clientX -
        drag.startX;

      const dragY =
        event.clientY -
        drag.startY;

      const dragDistance =
        Math.sqrt(
          dragX * dragX +
            dragY * dragY,
        );

      // Ignora cliques e pequenos
      // movimentos involuntários.
      if (dragDistance < 25) {
        return;
      }

      // Limpa imediatamente para
      // gerar apenas um giro.
      dragRef.current = null;

      dragStateCallbackRef.current(
        false,
      );

      const cameraRight =
        new THREE.Vector3(
          1,
          0,
          0,
        ).applyQuaternion(
          camera.quaternion,
        );

      const cameraUp =
        new THREE.Vector3(
          0,
          1,
          0,
        ).applyQuaternion(
          camera.quaternion,
        );

      const worldDirection =
        cameraRight
          .multiplyScalar(dragX)
          .add(
            cameraUp.multiplyScalar(
              -dragY,
            ),
          )
          .normalize();

      const cubeQuaternion =
        new THREE.Quaternion();

      cube.getWorldQuaternion(
        cubeQuaternion,
      );

      const localDirection =
        worldDirection.applyQuaternion(
          cubeQuaternion
            .clone()
            .invert(),
        );

      // Mantém a direção do gesto
      // dentro do plano da face.
      const normalProjection =
        drag.faceNormal
          .clone()
          .multiplyScalar(
            localDirection.dot(
              drag.faceNormal,
            ),
          );

      localDirection
        .sub(normalProjection)
        .normalize();

      if (
        localDirection.lengthSq() <
        0.01
      ) {
        return;
      }

      const rawRotationAxis =
        drag.faceNormal
          .clone()
          .cross(
            localDirection,
          );

      const rotationAxis =
        getDominantAxis(
          rawRotationAxis,
        );

      const direction =
        rawRotationAxis[
          rotationAxis
        ] >= 0
          ? 1
          : -1;

      const layer = Math.round(
        drag.piece.position[
          rotationAxis
        ],
      );

      const angle =
        direction *
        (Math.PI / 2);

      gestureCallbackRef.current({
        axis: rotationAxis,
        layer,
        angle,
        label: createMoveLabel(
          rotationAxis,
          layer,
          angle,
        ),
      });
    }

    function handlePointerUp() {
      if (!dragRef.current) {
        return;
      }

      dragRef.current = null;

      dragStateCallbackRef.current(
        false,
      );
    }

    function handleWindowBlur() {
      dragRef.current = null;

      dragStateCallbackRef.current(
        false,
      );
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove,
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp,
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp,
    );

    window.addEventListener(
      "blur",
      handleWindowBlur,
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp,
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerUp,
      );

      window.removeEventListener(
        "blur",
        handleWindowBlur,
      );
    };
  }, [camera]);

  useEffect(() => {
    if (
      !command ||
      !cubeRef.current ||
      !pivotRef.current ||
      activeMoveRef.current
    ) {
      return;
    }

    const selectedPieces =
      Array.from(
        piecesRef.current.values(),
      ).filter((piece) => {
        return (
          Math.round(
            piece.position[
              command.axis
            ],
          ) === command.layer
        );
      });

    selectedPieces.forEach(
      (piece) => {
        pivotRef.current?.attach(
          piece,
        );
      },
    );

    activeMoveRef.current = {
      axis: command.axis,
      targetAngle: command.angle,
      selectedPieces,
    };
  }, [command]);

  useFrame(() => {
    const activeMove =
      activeMoveRef.current;

    const pivot =
      pivotRef.current;

    const cube =
      cubeRef.current;

    if (
      !activeMove ||
      !pivot ||
      !cube
    ) {
      return;
    }

    const {
      axis,
      targetAngle,
      selectedPieces,
    } = activeMove;

    const currentAngle =
      pivot.rotation[axis];

    const difference =
      targetAngle -
      currentAngle;

    pivot.rotation[axis] +=
      difference * 0.18;

    if (
      Math.abs(difference) >
      0.002
    ) {
      return;
    }

    pivot.rotation[axis] =
      targetAngle;

    selectedPieces.forEach(
      (piece) => {
        cube.attach(piece);

        piece.position.set(
          Math.round(
            piece.position.x,
          ),
          Math.round(
            piece.position.y,
          ),
          Math.round(
            piece.position.z,
          ),
        );

        const euler =
          new THREE.Euler()
            .setFromQuaternion(
              piece.quaternion,
              "XYZ",
            );

        const quarterTurn =
          Math.PI / 2;

        euler.set(
          Math.round(
            euler.x /
              quarterTurn,
          ) * quarterTurn,

          Math.round(
            euler.y /
              quarterTurn,
          ) * quarterTurn,

          Math.round(
            euler.z /
              quarterTurn,
          ) * quarterTurn,
        );

        piece.quaternion
          .setFromEuler(euler)
          .normalize();
      },
    );

    pivot.rotation.set(0, 0, 0);

    activeMoveRef.current = null;

    onMoveFinished(
      checkCubeSolved(
        piecesRef.current,
      ),
    );
  });

  return (
    <group
      ref={cubeRef}
      rotation={[
        0.35,
        -0.55,
        0.08,
      ]}
    >
      {positions.map(
        (position) => {
          const id =
            position.join(",");

          return (
            <Cubie
              key={id}
              id={id}
              originalPosition={
                position
              }
              registerPiece={
                registerPiece
              }
              onDragStart={
                startDrag
              }
            />
          );
        },
      )}

      <group ref={pivotRef} />
    </group>
  );
}

function launchVictoryConfetti() {
  const isMobile =
    window.matchMedia(
      "(max-width: 680px)",
    ).matches;

  const particleCount =
    isMobile ? 45 : 80;

  const colors = [
    "#4ee58b",
    "#ecf7f0",
    "#f4d447",
    "#2dbd72",
    "#2879df",
  ];

  confetti({
    particleCount,
    angle: 60,
    spread: 75,
    startVelocity: 42,
    gravity: 0.9,
    ticks: 220,
    origin: {
      x: 0,
      y: 0.72,
    },
    colors,
    disableForReducedMotion: true,
    zIndex: 9998,
  });

  confetti({
    particleCount,
    angle: 120,
    spread: 75,
    startVelocity: 42,
    gravity: 0.9,
    ticks: 220,
    origin: {
      x: 1,
      y: 0.72,
    },
    colors,
    disableForReducedMotion: true,
    zIndex: 9998,
  });

  window.setTimeout(() => {
    confetti({
      particleCount:
        isMobile ? 35 : 60,

      spread: 110,
      startVelocity: 32,

      origin: {
        x: 0.5,
        y: 0.35,
      },

      colors,
      disableForReducedMotion: true,
      zIndex: 9998,
    });
  }, 180);
}

export function CubeScene({
  mode,
  onBack,
}: CubeSceneProps) {
  const [command, setCommand] =
    useState<MoveCommand | null>(
      null,
    );

  const [
    isAnimating,
    setIsAnimating,
  ] = useState(false);

  const [
    isScrambling,
    setIsScrambling,
  ] = useState(false);

  const [
    isDraggingPiece,
    setIsDraggingPiece,
  ] = useState(false);

  const [
    moveHistory,
    setMoveHistory,
  ] = useState<MoveRecord[]>([]);

  const [cubeKey, setCubeKey] =
    useState(0);

  const [seconds, setSeconds] =
    useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  const [hasWon, setHasWon] =
    useState(false);

  const [isOfficialRun, setIsOfficialRun] =
    useState(false);

  const [challengeReady, setChallengeReady] =
    useState(false);

  const [records, setRecords] = 
  useState<GameRecords>({
    bestTime: null,
    bestMoves: null,
    solvedCubes: 0,
  });

  const commandIdRef =
    useRef(0);

  const moveQueueRef =
    useRef<QueuedMove[]>([]);

  const officialRunRef = useRef(false);
  const pendingChallengeRef = useRef(false);
  const autoStartRef = useRef(false);
  const scrambleRef = useRef<() => void>(() => {});

  // Carrega os recordes uma única vez,
  // quando o componente é iniciado.
  useEffect(() => {
    const savedRecords =
      localStorage.getItem(
        "wd-cube-records",
      );

    if (!savedRecords) {
      return;
    }

    try {
      const parsedRecords =
        JSON.parse(
          savedRecords,
        ) as GameRecords;

      setRecords(parsedRecords);
    } catch {
      localStorage.removeItem(
        "wd-cube-records",
      );
    }
  }, []);

  // Controla o cronômetro separadamente.
  // Hooks nunca podem ficar dentro
  // de outros Hooks.
  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const timerId =
      window.setInterval(() => {
        setSeconds(
          (currentSeconds) =>
            currentSeconds + 1,
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timerId,
      );
    };
  }, [timerRunning]);

  function startMove(
    move: QueuedMove,
  ) {
    commandIdRef.current += 1;

    setIsAnimating(true);

    setCommand({
      axis: move.axis,
      layer: move.layer,
      angle: move.angle,
      label: move.label,
      id: commandIdRef.current,
    });

    if (move.record) {
      setTimerRunning(true);

      setMoveHistory(
        (currentHistory) => [
          ...currentHistory,
          {
            axis: move.axis,
            layer: move.layer,
            angle: move.angle,
            label: move.label,
          },
        ],
      );
    }
  }

  function updateOfficialRun(
    value: boolean,
  ) {
    officialRunRef.current = value;
    setIsOfficialRun(value);
  }

  function executeManualMove(
    move: MoveConfiguration,
  ) {
    if (
      isAnimating ||
      isScrambling
    ) {
      return;
    }

    setHasWon(false);

    if (
      mode === "timed" &&
      !officialRunRef.current
    ) {
      return;
    }

    setChallengeReady(false);

    startMove({
      ...move,
      record: true,
    });
  }

  function saveVictoryRecords(){
    setRecords((currentRecords) => {
      const currentMoves = moveHistory.length;

      const newBestTime = currentRecords.bestTime === null || seconds < currentRecords.bestTime ? seconds : currentRecords.bestTime;

      const newBestMoves = currentRecords.bestMoves === null || currentMoves < currentRecords.bestMoves ? currentMoves : currentRecords.bestMoves;

      const newRecords: GameRecords = {
        bestTime: newBestTime,
        bestMoves: newBestMoves,
        solvedCubes: currentRecords.solvedCubes + 1,
      };

      localStorage.setItem(
        "wd-cube-records",
        JSON.stringify(newRecords),
      );
      return newRecords;
    });
  }

function finishMove(
  cubeIsSolved: boolean,
) {
  const nextMove =
    moveQueueRef.current.shift();

  if (nextMove) {
    window.setTimeout(() => {
      startMove(nextMove);
    }, 60);

    return;
  }

  setIsAnimating(false);
  setIsScrambling(false);

  if (
    pendingChallengeRef.current
  ) {
    pendingChallengeRef.current =
      false;

    updateOfficialRun(true);

    setChallengeReady(true);
    setMoveHistory([]);
    setSeconds(0);
    setTimerRunning(false);

    return;
  }

  if (
    cubeIsSolved &&
    moveHistory.length > 0
  ) {
    launchVictoryConfetti();

    setHasWon(true);
    setTimerRunning(false);

    if (
      mode === "timed" &&
      officialRunRef.current
    ) {
      updateOfficialRun(false);
      setChallengeReady(false);
      saveVictoryRecords();
    }
  }
}

  function scrambleCube(
    official = mode === "timed",
  ) {
    if (
      isAnimating ||
      isScrambling
    ) {
      return;
    }

    const scrambleMoves:
      QueuedMove[] = [];

    let previousFace = "";

    for (
      let index = 0;
      index < 18;
      index += 1
    ) {
      const availableMoves =
        BUTTON_MOVES.filter(
          (move) =>
            move.label.replace(
              "′",
              "",
            ) !== previousFace,
        );

      const randomMove =
        availableMoves[
          Math.floor(
            Math.random() *
              availableMoves.length,
          )
        ];

      previousFace =
        randomMove.label.replace(
          "′",
          "",
        );

      scrambleMoves.push({
        ...randomMove,
        record: false,
      });
    }

    const firstMove =
      scrambleMoves.shift();

    if (!firstMove) {
      return;
    }

    updateOfficialRun(false);
    pendingChallengeRef.current = official;
    setChallengeReady(false);
    setHasWon(false);
    setMoveHistory([]);
    setSeconds(0);
    setTimerRunning(false);
    setIsScrambling(true);

    moveQueueRef.current =
      scrambleMoves;

    startMove(firstMove);
  }

  function undoLastMove() {
    if (
      isAnimating ||
      isScrambling ||
      moveHistory.length === 0
    ) {
      return;
    }

    if (
      mode === "timed" &&
      !officialRunRef.current
    ) {
      return;
    }

    const lastMove =
      moveHistory[
        moveHistory.length - 1
      ];

    const inverseAngle =
      -lastMove.angle;

    setHasWon(false);

    setMoveHistory(
      (currentHistory) =>
        currentHistory.slice(0, -1),
    );

    startMove({
      axis: lastMove.axis,
      layer: lastMove.layer,
      angle: inverseAngle,

      label: createMoveLabel(
        lastMove.axis,
        lastMove.layer,
        inverseAngle,
      ),

      record: false,
    });
  }

  function resetCube() {
    moveQueueRef.current = [];
    pendingChallengeRef.current = false;

    commandIdRef.current += 1;

    setCommand(null);
    setMoveHistory([]);
    setSeconds(0);
    setTimerRunning(false);
    setIsAnimating(false);
    setIsScrambling(false);
    setIsDraggingPiece(false);
    setChallengeReady(false);
    setHasWon(false);
    updateOfficialRun(false);

    setCubeKey(
      (currentKey) =>
        currentKey + 1,
    );
  }

  useEffect(() => {
    scrambleRef.current = () => {
      scrambleCube(true);
    };
  });

  useEffect(() => {
    if (
      mode !== "timed" ||
      autoStartRef.current
    ) {
      return;
    }

    autoStartRef.current = true;

    const timeoutId = window.setTimeout(() => {
      scrambleRef.current();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mode]);

  return (
    <div className="cubeExperience">
      <div
        className={`canvasArea ${
          isDraggingPiece
            ? "draggingPiece"
            : ""
        }`}
      >
        <Canvas
          camera={{
            position: [
              6,
              4.5,
              7,
            ],
            fov: 35,
          }}
          dpr={[1, 1.7]}
        >
          <ambientLight
            intensity={1.5}
          />

          <directionalLight
            position={[4, 8, 6]}
            intensity={4}
          />

          <pointLight
            position={[-5, 1, 3]}
            intensity={2}
            color="#4ee58b"
          />

          <RubiksCube
            key={cubeKey}
            command={command}
            dragEnabled={
              !isAnimating &&
              !isScrambling &&
              (
                mode === "free" ||
                isOfficialRun
              )
            }
            onGestureMove={
              executeManualMove
            }
            onDragStateChange={
              setIsDraggingPiece
            }
            onMoveFinished={
              finishMove
            }
          />

          <ContactShadows
            position={[0, -2.1, 0]}
            opacity={0.3}
            scale={8}
            blur={2.5}
            far={4}
            color="#051a10"
          />

          <OrbitControls
            enablePan={false}
            enableRotate={
              !isAnimating &&
              !isDraggingPiece
            }
            minDistance={7}
            maxDistance={13}
            rotateSpeed={0.65}
          />
        </Canvas>

        <p className="gestureHint">
          Segure uma peça e arraste
          para girar uma camada
        </p>
      </div>

      <div className="movePanel">
        <div className="currentMode">
          <div>
            <span>Modo atual</span>
            <strong>
              {mode === "free"
                ? "Livre"
                : "Contra o tempo"}
            </strong>
          </div>

          <button
            type="button"
            disabled={
              isAnimating ||
              isScrambling
            }
            onClick={onBack}
          >
            Voltar ao menu
          </button>
        </div>

        {mode === "timed" && (
          <div className="recordsPanel">
            <div>
              <span>Melhor tempo</span>
              <strong>
                {records.bestTime === null
                  ? "--:--"
                  : formatTime(records.bestTime)}
              </strong>
            </div>

            <div>
              <span>Menos movimentos</span>
              <strong>
                {records.bestMoves ?? "--"}
              </strong>
            </div>

            <div>
              <span>Resolvidos</span>
              <strong>
                {records.solvedCubes}
              </strong>
            </div>
          </div>
        )}
        <div className="moveInformation">
          <div>
            <span>Movimentos</span>

            <strong>
              {moveHistory.length}
            </strong>
          </div>

          <div>
            <span>Tempo</span>

            <strong>
              {formatTime(seconds)}
            </strong>
          </div>

          <div>
            <span>Status</span>

            <p>
              {hasWon
                ? mode === "timed"
                  ? "Desafio concluído!"
                  : "Cubo resolvido!"
                : isScrambling
                  ? mode === "timed"
                    ? "Preparando desafio..."
                    : "Embaralhando..."
                  : challengeReady
                    ? "Comece quando estiver pronto!"
                    : isAnimating
                      ? "Movimentando..."
                      : isDraggingPiece
                        ? "Arraste a peça..."
                        : mode === "timed" &&
                            !isOfficialRun
                          ? "Aguardando nova partida"
                          : moveHistory.length > 0
                            ? moveHistory
                                .slice(-6)
                                .map(
                                  (move) => move.label,
                                )
                                .join("  ")
                            : "Pronto para jogar"}
            </p>
          </div>
        </div>

        {hasWon && (
          <div className="victoryMessage">
            <span>
              Desafio concluído
            </span>

            <strong>
              Cubo resolvido em{" "}
              {formatTime(seconds)}
            </strong>

            <p>
              Você utilizou{" "}
              {moveHistory.length}{" "}
              movimentos.
            </p>
          </div>
        )}

        <div className="controlTitle">
          Controles alternativos
        </div>

        <div className="turnControls">
          {BUTTON_MOVES.map(
            (move) => (
              <button
                key={move.label}
                className="turnButton"
                type="button"
                disabled={
                  isAnimating ||
                  isScrambling ||
                  (
                    mode === "timed" &&
                    !isOfficialRun
                  )
                }
                onClick={() =>
                  executeManualMove(
                    move,
                  )
                }
              >
                <span>
                  {move.label}
                </span>
              </button>
            ),
          )}
        </div>

        <MoveHistory
  moves={moveHistory.map(
    (move) => move.label,
  )}
/>

        <div className="gameActions">
          <button
            className="scrambleButton"
            type="button"
            disabled={
              isAnimating ||
              isScrambling
            }
            onClick={() => {
              scrambleCube(
                mode === "timed",
              );
            }}
          >
            {isScrambling
              ? "Embaralhando..."
              : mode === "timed"
                ? "Nova partida"
                : "Embaralhar"}
          </button>

          <button
            className="undoButton"
            type="button"
            disabled={
              isAnimating ||
              isScrambling ||
              moveHistory.length === 0 ||
              (
                mode === "timed" &&
                !isOfficialRun
              )
            }
            onClick={
              undoLastMove
            }
          >
            Desfazer
          </button>

          <button
            className="resetButton"
            type="button"
            onClick={resetCube}
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}