/**
 * 
 * @param {string} path 
 * @returns {URLSearchParams}
 */
const useSearchParam = (path) => {
    return new URLSearchParams(path)
}

export default useSearchParam;