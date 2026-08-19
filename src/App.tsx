import { CubeScene } from "./components/CubeScene";
import "./App.css";

function App() {
  return (
    <main className="app">
      <header className="header">
        <div className="logo">
          <span className="logoMark">
            WD
          </span>

          <span>Cube Lab</span>
        </div>

        <p>Experiência interativa 3D</p>
      </header>

      <section className="hero">
        <div className="introduction">
          <p className="eyebrow">

            Experiência interativa 3D
          </p>

          <h1>
            Cubo mágico

            <strong>3D.</strong>
          </h1>

          <p className="description">
            Gire, embaralhe e resolva. Uma
            experiência minimalista para
            desafiar sua lógica em qualquer
            tela.
          </p>
        </div>

        <div className="cubeContainer">
          <CubeScene />

          <p className="hint">

          </p>
        </div>
      </section>
    </main>
  );
}

export default App;