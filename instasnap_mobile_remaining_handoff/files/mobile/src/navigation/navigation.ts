let currentPath = "/";

export const setCurrentPath = (path: string) => {
    currentPath = path;
};

export const getCurrentPath = () => currentPath;

export const isProtectedPath = (path: string) => {
    return !path.startsWith("/auth");
};