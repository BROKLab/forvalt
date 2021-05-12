export const getPasswordFromLocalstorage = (): string | void => {
  let password = localStorage.getItem("brregPassword");
  if (!password) {
    password = prompt(
      "Passord for Brønnøysundregisteret?",
      "INGEN PASSORD SATT"
    );
  }
  if (!password) {
    return alert(
      "Kan ikke søke i Brønnøysundregisteret fordi det ikke er satt noe passord"
    );
  } else {
    localStorage.setItem("brregPassword", password);
  }

  return password;
};

export const removePassword = (): void => {
  localStorage.removeItem("brregPassword");
};
