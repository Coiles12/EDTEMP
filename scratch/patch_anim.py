with open('public/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add backdrop animation and improve modal-card animation
old_modal = """.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* Le conteneur interne agit comme la "feuille" qui monte du bas */
.modal-card {
  background-color: var(--bg-card);
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 1.5rem;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.15);
  animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}"""

new_modal = """.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Le conteneur interne agit comme la "feuille" qui monte du bas */
.modal-card {
  background-color: var(--bg-card);
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 1.5rem;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.15);
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards; /* Effet rebond doux */
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0.8; }
  to { transform: translateY(0); opacity: 1; }
}"""

css = css.replace(old_modal, new_modal)

with open('public/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
