# 数据源管理

## 修改数据源

<a id=修改数据源> </a>

### 基本信息

**Path：** /app-center/api/sources/update/:id

**Method：** POST

**接口描述：**


### 请求参数

**Headers**

| 参数名称     | 参数值           | 是否必须 | 示例 | 备注 |
| ------------ | ---------------- | -------- | ---- | ---- |
| Content-Type | application/json | 是       |      |      |

**路径参数**

| 参数名称 | 示例 | 备注     |
| -------- | ---- | -------- |
| id       | 2    | 数据源ID |

**Body**

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源数据</span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@string</span></p></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> tpl</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">必须为app所关联的tpl id</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> created_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updated_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@string</span></p></td></tr><tr key=0-1><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5></td></tr>
               </tbody>
              </table>


### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源基本信息</span></td><td key=5></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源id</span></td><td key=5></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> tpl</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源模板id</span></td><td key=5></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> app</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源所属appid</span></td><td key=5></td></tr><tr key=0-0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> created_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">创建时间</span></td><td key=5></td></tr><tr key=0-0-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updated_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">更新时间</span></td><td key=5></td></tr><tr key=0-0-7><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源描述</span></td><td key=5></td></tr>
               </tbody>
              </table>


## 创建数据源

<a id=创建数据源> </a>

### 基本信息

**Path：** /app-center/api/sources/create

**Method：** POST

**接口描述：**


### 请求参数

**Headers**

| 参数名称     | 参数值           | 是否必须 | 示例 | 备注 |
| ------------ | ---------------- | -------- | ---- | ---- |
| Content-Type | application/json | 是       |      |      |

**Body**

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> name</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5></td></tr><tr key=0-1><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> app</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">应用ID</span></td><td key=5></td></tr><tr key=0-2><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> tpl</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">模板ID</span></td><td key=5></td></tr><tr key=0-3><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源描述</span></td><td key=5></td></tr><tr key=0-4><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源数据</span></td><td key=5></td></tr><tr key=0-4-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> key</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr>
               </tbody>
              </table>


### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-0-0><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> key</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@string</span></p></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> tpl</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源模板ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> app</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源所属应用ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> created_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">创建时间</span></td><td key=5></td></tr><tr key=0-0-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updated_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">更新时间</span></td><td key=5></td></tr><tr key=0-0-7><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源描述</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@string</span></p></td></tr>
               </tbody>
              </table>


## 删除数据源

<a id=删除数据源> </a>

### 基本信息

**Path：** /api/sources/delete/:id

**Method：** GET

**接口描述：**


### 请求参数

**路径参数**

| 参数名称 | 示例 | 备注     |
| -------- | ---- | -------- |
| id       | 2    | 数据源id |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源id</span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源json数据</span></td><td key=5></td></tr><tr key=0-0-2-0><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> columns</span></td><td key=1><span>object []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-0-2-0-0><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-1><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> title</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-2><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> field</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-3><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> type</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> format</span></td><td key=1><span>object</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-0><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> required</span></td><td key=1><span>boolean</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-1><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> stringType</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-2><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> min</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-3><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> max</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-4><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> dateTime</span></td><td key=1><span>boolean</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-1><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>string []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>string</span></p></td></tr><tr key=array-197><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> </span></td><td key=1><span></span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-2><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> type</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> tpl</span></td><td key=1><span>null</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源模板id</span></td><td key=5></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> app</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源所属appid</span></td><td key=5></td></tr><tr key=0-0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>null</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源描述</span></td><td key=5></td></tr><tr key=0-0-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> created_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">创建时间</span></td><td key=5></td></tr><tr key=0-0-7><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updated_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">更新时间</span></td><td key=5></td></tr><tr key=0-1><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> locale</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr>
               </tbody>
              </table>


## 删除数据源模板

<a id=删除数据源模板> </a>

### 基本信息

**Path：** /api/source_tpl/delete/:id

**Method：** GET

**接口描述：**


### 请求参数

**路径参数**

| 参数名称 | 示例 | 备注 |
| -------- | ---- | ---- |
| id       |      |      |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">名称</span></td><td key=5></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">描述</span></td><td key=5></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据</span></td><td key=5></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> platform</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">设计器</span></td><td key=5></td></tr>
               </tbody>
              </table>


## 查询应用下的数据源列表

<a id=查询应用下的数据源列表> </a>

### 基本信息

**Path：** /app-center/api/sources/list/:appId

**Method：** GET

**接口描述：**


### 请求参数

**路径参数**

| 参数名称 | 示例 | 备注   |
| -------- | ---- | ------ |
| appId    | 2    | 应用id |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称</span></td><td key=5></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源json数据</span></td><td key=5></td></tr><tr key=0-0-2-0><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> columns</span></td><td key=1><span>object []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-0-2-0-0><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-1><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> title</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-2><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> field</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-3><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> type</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> format</span></td><td key=1><span>object</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-0><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> required</span></td><td key=1><span>boolean</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-1><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> stringType</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-2><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> min</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-3><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> max</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-0-4-4><td key=0><span style="padding-left: 80px"><span style="color: #8c8a8a">├─</span> dateTime</span></td><td key=1><span>boolean</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-1><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>string []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>string</span></p></td></tr><tr key=array-198><td key=0><span style="padding-left: 60px"><span style="color: #8c8a8a">├─</span> </span></td><td key=1><span></span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-2-2><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> type</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> tpl</span></td><td key=1><span>null</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源模板id</span></td><td key=5></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> app</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源所属appid</span></td><td key=5></td></tr><tr key=0-0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>null</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源描述</span></td><td key=5></td></tr><tr key=0-0-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> created_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">创建时间</span></td><td key=5></td></tr><tr key=0-0-7><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updated_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">更新时间</span></td><td key=5></td></tr><tr key=0-1><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> locale</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr>
               </tbody>
              </table>


## 查询数据源模板

<a id=查询数据源模板> </a>

### 基本信息

**Path：** /app-center/api/source_tpl

**Method：** GET

**接口描述：**

<p>未启用&nbsp; 预留接口</p>


### 请求参数

**Query**

| 参数名称 | 是否必须 | 示例 | 备注 |
| -------- | -------- | ---- | ---- |
| id       | 否       |      |      |
| name     | 否       |      |      |
| platform | 否       |      |      |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">名称</span></td><td key=5></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">描述</span></td><td key=5></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据</span></td><td key=5></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> platform</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">设计器</span></td><td key=5></td></tr>
               </tbody>
              </table>


## 根据id查询数据源

<a id=根据id查询数据源> </a>

### 基本信息

**Path：** /app-center/api/sources/detail/:id

**Method：** GET

**接口描述：**


### 请求参数

**路径参数**

| 参数名称 | 示例 | 备注 |
| -------- | ---- | ---- |
| id       | 10   |      |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> data</span></td><td key=1><span>object</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5></td></tr><tr key=0-0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> name</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源名称： 字母下划线开头，只包含英文字母数字下划线，长度200以内</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@string</span></p></td></tr><tr key=0-0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源的数据json串</span></td><td key=5></td></tr><tr key=0-0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> tpl</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源模板ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> app</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源所属应用ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer</span></p></td></tr><tr key=0-0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> desc</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">数据源描述</span></td><td key=5></td></tr><tr key=0-0-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> created_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">创建时间</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@time</span></p></td></tr><tr key=0-0-7><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updated_at</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">更新时间</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@time</span></p></td></tr>
               </tbody>
              </table>

