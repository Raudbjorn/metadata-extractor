interface TagConfig {
  key: string;
  label: string;
  category: string;
}

interface AppConfig {
  tags: TagConfig[];
}

let configPromise: Promise<AppConfig> | null = null;

export const getConfig = (): Promise<AppConfig> => {
  if (!configPromise) {
    configPromise = fetch('/exiftool_config.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error("Failed to load application configuration:", error);
        configPromise = null; // Allow retrying
        throw error;
      });
  }
  return configPromise;
};
