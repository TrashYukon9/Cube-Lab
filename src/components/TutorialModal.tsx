import {
  useEffect,
  useRef,
  type MouseEvent,
} from "react";

import "./TutorialModal.css";

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    number: "01",
    title: "Gire uma camada",
    description:
      "Segure uma peça colorida e arraste na direção desejada para movimentar uma camada do cubo.",
  },
  {
    number: "02",
    title: "Explore os ângulos",
    description:
      "Arraste uma área vazia ao redor do cubo para observar outras faces e encontrar novos movimentos.",
  },
  {
    number: "03",
    title: "Acompanhe a sequência",
    description:
      "Cada giro é registrado no histórico. Você pode desfazer jogadas ou copiar toda a sequência realizada.",
  },
  {
    number: "04",
    title: "Escolha seu desafio",
    description:
      "Pratique sem pressão no modo livre ou resolva um embaralhamento oficial no modo contra o tempo.",
  },
];

export function TutorialModal({
  open,
  onClose,
}: TutorialModalProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleBackdropClick(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="tutorialBackdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="tutorialModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="tutorialTop">
          <div>
            <span>Guia de interação</span>

            <h2 id="tutorial-title">
              Como jogar
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            className="tutorialClose"
            type="button"
            aria-label="Fechar tutorial"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="tutorialIntroduction">
          Domine os controles básicos antes de
          começar sua primeira resolução.
        </p>

        <div className="tutorialSteps">
          {TUTORIAL_STEPS.map((step) => (
            <article
              className="tutorialStep"
              key={step.number}
            >
              <span>{step.number}</span>

              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="tutorialModes">
          <div>
            <span>Livre</span>
            <p>
              Pratique, embaralhe, desfaça e
              reinicie quando quiser.
            </p>
          </div>

          <div>
            <span>Cronometrado</span>
            <p>
              O desafio começa embaralhado e salva
              seus melhores resultados.
            </p>
          </div>
        </div>

        <div className="tutorialFooter">
          <small>
            Pressione Esc ou clique fora para fechar
          </small>

          <button
            type="button"
            onClick={onClose}
          >
            Entendi, vamos jogar
          </button>
        </div>
      </section>
    </div>
  );
}