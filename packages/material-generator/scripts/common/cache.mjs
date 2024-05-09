import fs from 'fs';
import path from 'path';
  
class LocalCache {  
    constructor(cacheDir = './cache') {  
        this.cacheDir = path.resolve(cacheDir);  
        if (!fs.existsSync(this.cacheDir)) {  
            fs.mkdirSync(this.cacheDir);  
        }  
    }  
  
    get(key) {  
        const filePath = path.join(this.cacheDir, `${key}.json`);  
        try {  
            const data = fs.readFileSync(filePath, 'utf8');  
            return JSON.parse(data);  
        } catch (error) {  
            // 如果文件不存在或者解析出错，返回null或者抛出自定义错误  
            return null;  
        }  
    }  
  
    set(key, value, ttl = 0) {  
        const filePath = path.join(this.cacheDir, `${key}.json`);  
        const data = JSON.stringify(value, null, 2);  
        fs.writeFileSync(filePath, data);  
  
        // 如果设置了ttl，则使用setTimeout在ttl后删除缓存  
        if (ttl > 0) {  
            setTimeout(() => {  
                try {  
                    fs.unlinkSync(filePath);  
                } catch (error) {  
                    // 忽略删除失败的情况，可能文件已经被其他操作删除了  
                }  
            }, ttl);  
        }  
    }  
}  
export default LocalCache
// // 使用示例：  
// const cache = new LocalCache();  
  
// // 设置缓存  
// cache.set('myKey', { myData: 'some data' }, 60000); // 缓存60秒  
  
// // 获取缓存  
// const data = cache.get('myKey');  
// console.log(data); // 输出：{ myData: 'some data' }