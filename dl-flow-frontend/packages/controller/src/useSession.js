export const useSession = () => {
    const get = (key) => {
        sessionStorage.getItem(key);
        return true;
    }
    const set = (key, value) => {
        sessionStorage.setItem(key, value);
        return true;
    }
    return {get, set}
}