// const mysql = require('mysql')
import mysql from 'mysql'

class MysqlConnection {
  constructor(config) {
    const { host = 'localhost', port = '3306', user = 'root', password = 'yao8yun5!', database = '' } = config || {}
    // 是否连接上了数据库
    this.connected = false

    this.connection = mysql.createConnection({
      host, // 主机名（服务器地址）
      port, // 端口号
      user, // 用户名
      password, // 密码
      database // 数据库名称
    })

    this.connection.connect((error) => {
      if (error) {
        console.log('连接数据库失败：', error)
      } else {
        console.log('连接数据库成功')
        this.connected = true
      }
    })
  }

  /**
   * 执行sql语句，更新数据库
   * @param {string} sql sql语句
   * @param {string} componentName 组件名称
   */
  connectQuery(sql, componentName) {
    this.connection.query(sql, (error) => {
      if (error) {
        console.log(`组件 ${componentName} 执行sql失败：${error}`)
      }
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
    return str.replace(/'/g, "\\'")
  }

  /**
   * 生成更新组件的sql语句
   * @param {object} component 组件数据
   * @returns 更新组件的sql语句
   */
  updateComponent(component) {
    const values = []
    let sqlContent = 'update user_components set '

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

    this.connectQuery(sqlContent, component.component)
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
    '${component_metadata}',
    '${tenant}',
    '${library}',
    '${createBy}',
    '${updatedBy}',
  );`

    const sqlContent = `INSERT INTO user_components (version, name, component, icon, description, doc_url,
       screenshot, tags, keywords, dev_mode, npm, \`group\`, \`category\`, priority, snippets,
        schema_fragment, configure, \`public\`, framework, isOfficial, isDefault, tiny_reserved,
         component_metadata, tenant, library, createdBy, updatedBy) VALUES ${values}\n`.replace(/\n/g, '')

    this.connectQuery(sqlContent, componentName)
  }

  /**
   * 初始化数据库数据，判断是否已存在组件，不存在时执行新增组件
   * @param {object} component 组件数据
   */
  initDB(component) {
    this.connection.query(
      `SELECT * FROM components.user_components WHERE component = '${component.component}'`,
      (error, result) => {
        if (error) {
          console.log(`查询组件 ${component.component} 失败：`, error)

          return
        }

        if (!result.length) {
          this.insertComponent(component)
        }
      }
    )
  }
}

export default MysqlConnection
