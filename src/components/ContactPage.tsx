import {
    FaEnvelope,
    FaGithub,
    FaInstagram,
    FaLinkedin,
    FaPaperPlane,
    FaWhatsapp,
    FaXTwitter,
    FaGlobe,
} from "react-icons/fa6";

import type {
  FormEvent,
} from "react";

export function ContactPage() {
  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget,
    );

    const name =
      String(formData.get("name") ?? "");

    const email =
      String(formData.get("email") ?? "");

    const subject =
      String(formData.get("subject") ?? "");

    const message =
      String(formData.get("message") ?? "");

    const emailBody = `
Nome: ${name}
Email: ${email}

Mensagem:
${message}
    `.trim();

    const emailLink =
      `mailto:winidrk@gmail.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(emailBody)}`;

    window.location.href = emailLink;
  }

  return (
    <div className="contactPage">
      <section className="contactSection">
        <div className="contactHeading">
          <p className="eyebrow">
       
            Entre em contato
          </p>

          <h1>
            Vamos criar algo
            <strong> incrível!</strong>
          </h1>

          <p>
            Tem alguma sugestão para o projeto,
            encontrou um problema ou simplesmente
            deseja conversar? Envie uma mensagem.
          </p>
        </div>

        <form
          className="contact-form"
          id="contact-form"
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="contact-name">
                Seu nome
              </label>

              <input
                type="text"
                id="contact-name"
                name="name"
                placeholder="Digite seu nome"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-email">
                Seu e-mail
              </label>

              <input
                type="email"
                id="contact-email"
                name="email"
                placeholder="Digite seu e-mail"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="contact-subject">
              Assunto
            </label>

            <input
              type="text"
              id="contact-subject"
              name="subject"
              placeholder="Sobre o que deseja conversar?"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="contact-message">
              Mensagem
            </label>

            <textarea
              id="contact-message"
              name="message"
              placeholder="Escreva sua mensagem..."
              rows={6}
              required
            />
          </div>

          <button
            type="submit"
            className="contact-submit"
          >
            <FaPaperPlane
              className="fa-solid fa-paper-plane"
              aria-hidden="true"
            />

            Enviar mensagem
          </button>
        </form>

        <div className="contact-socials">

            <a
         href="https://trashyukon9.github.io/DanielWn.site/"
         target="_blank"
         rel="noopener noreferrer"
         className="contact-social-link"
            >
         <FaGlobe aria-hidden="true" />
            <span>Meu site</span>
            </a>

          <a
            href="mailto:winidrk@gmail.com"
            className="contact-social-link"
          >
            <FaEnvelope
              className="fa-solid fa-envelope"
              aria-hidden="true"
            />

            <span>E-mail</span>
          </a>

          <a
            href="https://linkedin.com/in/winicius-daniel-89b4a7279"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-social-link"
          >
            <FaLinkedin
              className="fa-brands fa-linkedin"
              aria-hidden="true"
            />

            <span>LinkedIn</span>
          </a>

          <a
            href="https://github.com/Trashyukon9"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-social-link"
          >
            <FaGithub
              className="fa-brands fa-github"
              aria-hidden="true"
            />

            <span>GitHub</span>
          </a>

          <a
            href="https://instagram.com/tyk.daniwn"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-social-link"
          >
            <FaInstagram
              className="fa-brands fa-instagram"
              aria-hidden="true"
            />

            <span>Instagram</span>
          </a>
        </div>
      </section>

      <footer className="contactFooter">
        <div className="footer-top">
          <div>
            <h3>
              © {new Date().getFullYear()}
              {" — "}
              Winicius Daniel
            </h3>

            <p>
              Criando experiências digitais com
              código, criatividade e atenção aos
              detalhes.
            </p>
          </div>

          <div className="social-icons">
            <a
              href="https://instagram.com/tyk.daniwn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram
                className="fa-brands fa-instagram"
                aria-hidden="true"
              />
            </a>

            <a
              href="https://wa.me/5511984316278"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp
                className="fa-brands fa-whatsapp"
                aria-hidden="true"
              />
            </a>

            <a
              href="https://twitter.com/TrashYukon9"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
            >
              <FaXTwitter
                className="fa-brands fa-x-twitter"
                aria-hidden="true"
              />
            </a>

            <a
              href="https://linkedin.com/in/winicius-daniel-89b4a7279"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedin
                className="fa-brands fa-linkedin"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}