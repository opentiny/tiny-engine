<!-- code -->
Invoke-WebRequest -Uri "http://localhost:3001/api/material/import" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{
    "componentDir": "D:\\OSPP\\element-plus\\packages\\components\\badge",
    "sourceType": "code",
    "outputDir": "../complete-schema-log",
    "apiLogDir": "../raw-api-log",
    "schemaLogDir": "../schema-log"
  }'


<!-- npm -->
Invoke-WebRequest -Uri "http://localhost:3001/api/material/import" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{
    "componentDir": "C:\\Users\\zyun\\Desktop\\LowCode-Material-Import\\node_modules\\element-plus\\es\\components\\affix",
    "sourceType": "npm",
    "outputDir": "../complete-schema-log",
    "apiLogDir": "../raw-api-log",
    "schemaLogDir": "../schema-log"
  }'


<!-- url -->
Invoke-WebRequest -Uri "http://localhost:3001/api/material/import" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{
    "url": "https://element-plus.org/zh-CN/component/button",
    "config": "{
      \"basicInfo\": {
        \"name\": \"h1\",
        \"description\": \"h1 + p\",
        \"version\": \"span.el-tag__content\"
      },
      \"commonSelectors\": {
        \"tableRow\": \"tbody tr\",
        \"tableHeader\": \"thead th, tr:first-child th\"
      },
      \"tooltipInteraction\": {
        \"triggerButton\": \"button.el-button.el-tooltip__trigger\",
        \"tooltipContainer\": \".el-popper\",
        \"tooltipContent\": \".m-1 > code\"
      },
      \"components\": [
        {
          \"name\": \"Button\",
          \"tables\": {
            \"properties\": {
              \"selector\": \"h3#button-attributes + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"\u5C5E\u6027\u540D\",
                \"description\": \"\u8BF4\u660E\",
                \"type\": \"\u7C7B\u578B\",
                \"default\": \"\u9ED8\u8BA4\u503C\"
              }
            },
            \"slots\": {
              \"selector\": \"h3#button-slots + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"\u62E6\u622A\u540D\",
                \"description\": \"\u8BF4\u660E\"
              }
            }
          }
        },
        {
          \"name\": \"ButtonGroup\",
          \"tables\": {
            \"properties\": {
              \"selector\": \"h3#buttongroup-attributes + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"\u5C5E\u6027\u540D\",
                \"description\": \"\u8BF4\u660E\",
                \"type\": \"\u7C7B\u578B\",
                \"default\": \"\u9ED8\u8BA4\u503C\"
              }
            },
            \"events\": {
              \"selector\": \"h3#buttongroup-slots + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"\u4E8B\u4EF6\u540D\",
                \"description\": \"\u8BF4\u660E\",
                \"subLabel\": \"\u5B50\u6807\u7B7E\"
              }
            }
          }
        }
      ]
    }",
    "outputDir": "../complete-schema-log",
    "apiLogDir": "../raw-api-log",
    "schemaLogDir": "../schema-log"
  }'

<!-- 中文会显示为？, 在 PowerShell 或 HTTP 请求中，若中文未正确编码为 Unicode 转义字符，会导致后端解析时中文丢失，显示为 “???”（乱码的一种表现）。-->
Invoke-WebRequest -Uri "http://localhost:3001/api/material/import" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{
    "url": "https://element-plus.org/zh-CN/component/button",
    "config": "{
      \"basicInfo\": {
        \"name\": \"h1\",
        \"description\": \"h1 + p\",
        \"version\": \"span.el-tag__content\"
      },
      \"commonSelectors\": {
        \"tableRow\": \"tbody tr\",
        \"tableHeader\": \"thead th, tr:first-child th\"
      },
      \"tooltipInteraction\": {
        \"triggerButton\": \"button.el-button.el-tooltip__trigger\",
        \"tooltipContainer\": \".el-popper\",
        \"tooltipContent\": \".m-1 > code\"
      },
      \"components\": [
        {
          \"name\": \"Button\",
          \"tables\": {
            \"properties\": {
              \"selector\": \"h3#button-attributes + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"属性名\",
                \"description\": \"说明\",
                \"type\": \"类型\",
                \"default\": \"默认值\"
              }
            },
            \"slots\": {
              \"selector\": \"h3#button-slots + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"插槽名\",
                \"description\": \"说明\"
              }
            }
          }
        },
        {
          \"name\": \"ButtonGroup\",
          \"tables\": {
            \"properties\": {
              \"selector\": \"h3#buttongroup-attributes + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"属性名\",
                \"description\": \"说明\",
                \"type\": \"类型\",
                \"default\": \"默认值\"
              }
            },
            \"events\": {
              \"selector\": \"h3#buttongroup-slots + div.vp-table\",
              \"fieldMapping\": {
                \"name\": \"事件名\",
                \"description\": \"说明\",
                \"subLabel\": \"子标签\"
              }
            }
          }
        }
      ]
    }",
    "outputDir": "../complete-schema-log",
    "apiLogDir": "../raw-api-log",
    "schemaLogDir": "../schema-log"
  }'