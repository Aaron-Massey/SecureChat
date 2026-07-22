export interface CryptoDerivationSettings {
  salt: string;
  iterations: number;
}

const parseIterations = (value: string | undefined) => {
  const iterations = Number.parseInt(value ?? '', 10);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    throw new Error('VITE_KEY_DERIVATION_ITERATIONS must be a positive integer.');
  }

  return iterations;
};

export const getCryptoDerivationSettings = (): CryptoDerivationSettings => {
  const salt = import.meta.env.VITE_KEY_DERIVATION_SALT;

  if (!salt || salt.trim().length === 0) {
    throw new Error('VITE_KEY_DERIVATION_SALT must be configured in config.json.');
  }

  return {
    salt,
    iterations: parseIterations(import.meta.env.VITE_KEY_DERIVATION_ITERATIONS)
  };
};
