function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} সেট করা নেই`);
  return value;
}

export const env = {
  get backendUrl() {
    return required("BACKEND_URL", process.env.BACKEND_URL).replace(/\/+$/, "");
  },
  get googleClientId() {
    return required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
  },
  get googleClientSecret() {
    return required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
  },
};
