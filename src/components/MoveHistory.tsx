interface MoveHistoryProps {
  moves: string[];
  onClear?: () => void;
}

export function MoveHistory({
  moves,
  onClear,
}: MoveHistoryProps) {
  async function copyMoves() {
    if (moves.length === 0) {
      return;
    }

    const sequence = moves.join(" ");

    try {
      await navigator.clipboard.writeText(
        sequence,
      );
    } catch {
      console.error(
        "Não foi possível copiar os movimentos.",
      );
    }
  }

  return (
    <section className="moveHistory">
      <div className="moveHistoryHeader">
        <div>
          <span>Sequência realizada</span>

          <strong>
            {moves.length}{" "}
            {moves.length === 1
              ? "movimento"
              : "movimentos"}
          </strong>
        </div>

        <div className="moveHistoryActions">
          <button
            type="button"
            disabled={moves.length === 0}
            onClick={copyMoves}
          >
            Copiar
          </button>

          {onClear && (
            <button
              type="button"
              disabled={moves.length === 0}
              onClick={onClear}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="moveHistoryList">
        {moves.length === 0 ? (
          <p>
            Seus movimentos aparecerão aqui.
          </p>
        ) : (
          moves.map((move, index) => (
            <div
              className="moveHistoryItem"
              key={`${move}-${index}`}
            >
              <small>{index + 1}</small>
              <span>{move}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}