import {
  useEffect,
  useRef,
  useState,
} from "react";

import { ContactPage } from "./components/ContactPage";
import { CubeScene } from "./components/CubeScene";
import { TutorialModal } from "./components/TutorialModal";

import type { GameMode } from "./types/game";

import "./App.css";

type Screen =
  | GameMode
  | "contact"
  | null;

const TRANSITION_DURATION = 320;

function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>(null);

  const [screenVisible, setScreenVisible] =
    useState(true);

  const [isSwitching, setIsSwitching] =
    useState(false);

  const [tutorialOpen, setTutorialOpen] =
    useState(false);

  const transitionTimerRef =
    useRef<number | null>(null);

  useEffect(() => {
    const tutorialWasSeen =
      localStorage.getItem(
        "wd-cube-tutorial-seen",
      );

    if (!tutorialWasSeen) {
      setTutorialOpen(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (
        transitionTimerRef.current !== null
      ) {
        window.clearTimeout(
          transitionTimerRef.current,
        );
      }
    };
  }, []);

  function changeScreen(
    nextScreen: Screen,
  ) {
    if (
      isSwitching ||
      nextScreen === currentScreen
    ) {
      return;
    }

    setIsSwitching(true);
    setScreenVisible(false);

    transitionTimerRef.current =
      window.setTimeout(() => {
        setCurrentScreen(nextScreen);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        window.requestAnimationFrame(
          () => {
            window.requestAnimationFrame(
              () => {
                setScreenVisible(true);
                setIsSwitching(false);
              },
            );
          },
        );
      }, TRANSITION_DURATION);
  }

  function selectMode(
    mode: GameMode,
  ) {
    changeScreen(mode);
  }

  function returnToMenu() {
    changeScreen(null);
  }

  function openContact() {
    changeScreen("contact");
  }

  function openTutorial() {
    setTutorialOpen(true);
  }

  function closeTutorial() {
    localStorage.setItem(
      "wd-cube-tutorial-seen",
      "true",
    );

    setTutorialOpen(false);
  }

  return (
    <main className="app">
      <header className="header">
        <button
          className="logo logoButton"
          type="button"
          disabled={
            isSwitching ||
            currentScreen === null
          }
          onClick={returnToMenu}
        >
          <span className="logoMark">
            WD
          </span>

          <span>Cube Lab</span>
        </button>

        <div className="headerActions">
          <button
            className="headerNavigationButton"
            type="button"
            disabled={
              isSwitching ||
              currentScreen === "contact"
            }
            onClick={openContact}
          >
            Contato
          </button>

          <button
            className="tutorialButton"
            type="button"
            onClick={openTutorial}
          >
            <span>?</span>
            Como jogar
          </button>

          <p>
            Experiência interativa 3D
          </p>
        </div>
      </header>

      <div
        className={`screenTransition ${
          screenVisible
            ? "screenVisible"
            : "screenHidden"
        }`}
      >
        {currentScreen === null && (
          <section className="startScreen">
            <div className="startIntroduction">
              <p className="eyebrow">
                Experiência interativa 3D
              </p>

              <h1>
                Cubo mágico
                <strong>3D.</strong>
              </h1>

              <p className="description">
                Gire, embaralhe e resolva.
                Escolha um modo e desafie
                sua lógica em uma experiência
                tridimensional.
              </p>

              <div className="startInstructions">
                <span>Como jogar</span>

                <p>
                  Segure uma peça e arraste
                  para movimentar uma camada.
                  Arraste o espaço vazio para
                  explorar outros ângulos.
                </p>
              </div>
            </div>

            <div className="modeSelection">
              <div className="modeHeader">
                <span>
                  Selecione uma experiência
                </span>

                <h2>
                  Escolha seu modo
                </h2>

                <p>
                  Você poderá retornar ao menu
                  quando quiser.
                </p>
              </div>

              <button
                className="modeCard"
                type="button"
                onClick={() =>
                  selectMode("free")
                }
              >
                <span className="modeNumber">
                  01
                </span>

                <div>
                  <strong>
                    Modo livre
                  </strong>

                  <p>
                    Explore o cubo, pratique
                    movimentos e utilize todos
                    os controles sem pressão.
                  </p>
                </div>

                <span className="modeArrow">
                  →
                </span>
              </button>

              <button
                className="modeCard featuredMode"
                type="button"
                onClick={() =>
                  selectMode("timed")
                }
              >
                <span className="modeNumber">
                  02
                </span>

                <div>
                  <strong>
                    Contra o tempo
                  </strong>

                  <p>
                    Receba um cubo embaralhado,
                    resolva no menor tempo e
                    estabeleça novos recordes.
                  </p>
                </div>

                <span className="modeArrow">
                  →
                </span>
              </button>

              <div className="modeDetails">
                <div>
                  <strong>3D</strong>

                  <span>
                    Cubo interativo
                  </span>
                </div>

                <div>
                  <strong>12+</strong>

                  <span>
                    Movimentos
                  </span>
                </div>

                <div>
                  <strong>Local</strong>

                  <span>
                    Recordes salvos
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentScreen === "contact" && (
          <ContactPage />
        )}

        {(currentScreen === "free" ||
          currentScreen === "timed") && (
          <section className="gameScreen">
            <div className="gameHeading">
              <div>
                <p className="eyebrow">
                  {currentScreen === "free"
                    ? "Modo livre"
                    : "Contra o tempo"}
                </p>

                <h1>
                  Cubo mágico
                  <strong>3D.</strong>
                </h1>
              </div>

              <p className="description">
                {currentScreen === "free"
                  ? "Explore movimentos e pratique livremente."
                  : "Resolva o embaralhamento e supere seu melhor tempo."}
              </p>
            </div>

            <div className="gameArea">
              <CubeScene
                mode={currentScreen}
                onBack={returnToMenu}
              />
            </div>
          </section>
        )}
      </div>

      <TutorialModal
        open={tutorialOpen}
        onClose={closeTutorial}
      />
    </main>
  );
}

export default App;