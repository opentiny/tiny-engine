// const mysql = require('mysql')
import mysql from 'mysql'
import logger from './logger.mjs'

const componentsTableName = 'user_components'
class MysqlConnection {
  constructor(config) {
    this.config = config || {
      host: 'localhost', // 主机名（服务器地址）
      port: '3306', // 端口号
      user: 'root', // 用户名
      password: 'password', // 密码
      database: 'components' // 数据库名称
    }
    // 是否连接上了数据库
    this.connected = false
    this.connection = mysql.createConnection(this.config)
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.connection.connect((error) => {
        if (error) {
          logger.warn('连接数据库失败')
          reject()
        } else {
          logger.success('连接数据库成功')
          this.connected = true
          resolve()
        }
      })
    })
  }

  /**
   * 执行sql语句，更新数据库
   * @param {string} sql sql语句
   * @param {string} componentName 组件名称
   */
  query(sql) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * 组件字段映射
   * @param {string} field 字段名
   * @returns 映射后的字段名
   */
  fieldTransform(field) {
    const fieldMap = {
      docUrl: 'doc_url',
      devMode: 'dev_mode',
      schema: 'schema_fragment'
    }

    return fieldMap[field] || field
  }

  /**
   * 格式化单引号
   * @param {string} str 待格式化的字符串
   * @returns 格式化后的字符串
   */
  formatSingleQuoteValue(str) {
    if (typeof str !== 'string') {
      return str
    }

    return str.replace(/'/g, "\\'")
  }

  /**
   * 生成更新组件的sql语句
   * @param {object} component 组件数据
   * @returns 更新组件的sql语句
   */
  updateComponent(component) {
    const values = []
    let sqlContent = `update ${componentsTableName} set `

    Object.keys(component).forEach((key) => {
      const { [key]: value } = component
      const field = this.fieldTransform(key)
      let updateContent = ''

      if (['id', 'component'].includes(field)) {
        return
      }

      if (typeof value === 'string') {
        const formatValue = this.formatSingleQuoteValue(value)

        updateContent = `\`${field}\` = '${formatValue}'`
      } else if (typeof field === 'number' || field === null) {
        updateContent = `\`${field}\` = ${value}`
      } else {
        const formatValue = this.formatSingleQuoteValue(JSON.stringify(value))

        updateContent = `\`${field}\` = '${formatValue}'`
      }

      values.push(updateContent)
    })

    sqlContent += values.join()
    sqlContent += ` where component = '${component.component}';`

    this.query(sqlContent, component.component)
      .then(() => {
        logger.success(`更新组件 ${component.component} 成功`)
      })
      .catch((error) => {
        logger.success(`更新组件 ${component.component} 失败：${error}`)
      })
  }

  /**
   * 生成新增组件的sql语句
   * @param {object} component 组件数据
   * @returns 新增组件的sql语句
   */
  insertComponent(component) {
    const {
      version,
      name,
      component: componentName,
      icon,
      description,
      docUrl,
      screenshot,
      tags,
      keywords,
      devMode,
      npm,
      group,
      category,
      priority = 1,
      snippets,
      schema,
      configure,
      public: publicRight = 0,
      framework = 'vue',
      isOfficial = 0,
      isDefault = 0,
      tiny_reserved = 0,
      component_metadata = null,
      tenant = null,
      library = null,
      createBy = 86,
      updatedBy = 86
    } = component
    const values = `('${version}',
    '${this.formatSingleQuoteValue(JSON.stringify(name))}',
    '${componentName}',
    '${icon}',
    '${this.formatSingleQuoteValue(description)}',
    '${docUrl}',
    '${screenshot}',
    '${tags}',
    '${keywords}',
    '${devMode}',
    '${this.formatSingleQuoteValue(JSON.stringify(npm))}',
    '${group}',
    '${category}',
    '${priority}',
    '${this.formatSingleQuoteValue(JSON.stringify(snippets))}',
    '${this.formatSingleQuoteValue(JSON.stringify(schema))}',
    '${this.formatSingleQuoteValue(JSON.stringify(configure))}',
    '${publicRight}',
    '${framework}',
    '${isOfficial}',
    '${isDefault}',
    '${tiny_reserved}',
    '${tenant}',
    '${createBy}',
    '${updatedBy}'
  );`

    const sqlContent = `INSERT INTO ${componentsTableName} (version, name, component, icon, description, doc_url,
       screenshot, tags, keywords, dev_mode, npm, \`group\`, \`category\`, priority, snippets,
        schema_fragment, configure, \`public\`, framework, isOfficial, isDefault, tiny_reserved,
         tenant, createdBy, updatedBy) VALUES ${values}`.replace(/\n/g, '')

    this.query(sqlContent, componentName)
      .then(() => {
        logger.success(`新增组件 ${component.component} 成功`)
      })
      .catch((error) => {
        logger.success(`新增组件 ${component.component} 失败：${error}`)
      })
  }

  /**
   * 初始化数据库数据，判断是否已存在组件，不存在时执行新增组件
   * @param {object} component 组件数据
   */
  initDB(component) {
    const selectSqlContent = `SELECT * FROM ${this.config.database}.${componentsTableName} WHERE component = '${component.component}'`

    this.query(selectSqlContent)
      .then((result) => {
        if (!result.length) {
          this.insertComponent(component)
        }
      })
      .catch((error) => {
        logger.success(`查询组件 ${component.component} 失败：${error}`)
      })
  }

  /**
   * 创建组件表
   * @returns promise
   */
  createUserComponentsTable() {
    const sqlContent = `
      CREATE TABLE ${componentsTableName}  (
        id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        version varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        name longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        component varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        icon varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        description varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        doc_url varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        screenshot varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        tags varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        keywords varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        dev_mode varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        npm longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        \`group\` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        category varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
        priority int(11) NULL DEFAULT NULL,
        snippets longtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
        schema_fragment longtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
        configure longtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
        createdBy int(11) NULL DEFAULT NULL,
        updatedBy int(11) NULL DEFAULT NULL,
        created_by int(11) NULL DEFAULT NULL,
        updated_by int(11) NULL DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        public int(11) NULL DEFAULT NULL,
        framework varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        isOfficial tinyint(1) NULL DEFAULT NULL,
        isDefault tinyint(1) NULL DEFAULT NULL,
        tiny_reserved tinyint(1) NULL DEFAULT NULL,
        tenant int(11) NULL DEFAULT NULL,
        component_metadata longtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
        library int(11) NULL DEFAULT NULL,
        PRIMARY KEY (id) USING BTREE,
        UNIQUE INDEX unique_component(createdBy, framework, component, version) USING BTREE
      ) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = DYNAMIC;
    `.replace(/\n/g, '')

    return new Promise((resolve, reject) => {
      this.query(sqlContent, (error, result) => {
        if (error) {
          logger.success(`创建表 ${componentsTableName} 失败：${error}`)
          reject(error)
        } else {
          logger.success(`创建表 ${componentsTableName} 成功`)
          resolve(result)
        }
      })
    })
  }

  /**
   * 初始化组件表
   * @returns promise
   */
  initUserComponentsTable() {
    return new Promise((resolve, reject) => {
      // 查询是否已存在表
      this.query(`SHOW TABLES LIKE '${componentsTableName}'`)
        .then((result) => {
          if (result.length) {
            // 已存在
            resolve()
          } else {
            this.createUserComponentsTable()
              .then(() => {
                resolve()
              })
              .catch((err) => {
                reject(err)
              })
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}

export default MysqlConnection
