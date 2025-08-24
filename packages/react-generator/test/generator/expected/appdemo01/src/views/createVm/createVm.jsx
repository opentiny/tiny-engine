import React from 'react'
import './createVm.css'
import { Button, Input, Form, Select, Table, Row, Col, Steps, Radio, Typography } from 'antd'
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons'

const CreateVm = (props = {}) => {
  const [state, setState] = React.useState({
    dataDisk: [1, 2, 3],
    formData: {
      zone: '1',
      cpu: '1',
      cpuArch: '1',
      memory: '1',
      storageType: '1',
      storageSize: '40',
      diskType: '1',
      diskSize: '100',
      networkType: '1',
      bandwidth: '1',
      instanceType: '1',
      instanceCount: '1'
    },
    inputValues: { diskLabel: '', systemDisk: '', dataDiskSize: '', networkConfig: '' }
  })

  const utils = {}

  return (
    <>
      <div>
        <div style={{ paddingBottom: '10px', paddingTop: '10px' }}>
          <Steps
            current={1}
            items={[{ title: '基础配置' }, { title: '网络配置' }, { title: '高级配置' }, { title: '确认配置' }]}
            direction="horizontal"
            style={{ borderRadius: '0px' }}
          ></Steps>
        </div>
        <div
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '4px',
            borderColor: '#fff',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
            backgroundColor: '#fff',
            marginBottom: '10px'
          }}
        >
          <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ borderRadius: '0px' }}>
            <Form.Item label="计费模式">
              <Radio.Group
                options={[
                  { label: '包年/包月', value: '1' },
                  { label: '按需计费', value: '2' }
                ]}
                value={state.formData.storageType}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, formData: { ...prev.formData, storageType: e.target.value } }))
                }
              ></Radio.Group>
            </Form.Item>
            <Form.Item label="区域">
              <Radio.Group
                options={[{ label: '乌兰察布二零一', value: '1' }]}
                value="1"
                style={{ borderRadius: '0px', marginRight: '10px' }}
              ></Radio.Group>
              <Typography.Text
                children="温馨提示：页面左上角切换区域"
                style={{ color: '#8a8e99', fontSize: '12px' }}
              ></Typography.Text>
              <Typography.Text
                children="不同区域的云服务产品之间内网互不相通；请就近选择靠近您业务的区域，可减少网络时延，提高访问速度"
                style={{ display: 'block', color: '#8a8e99', borderRadius: '0px', fontSize: '12px' }}
              ></Typography.Text>
            </Form.Item>
            <Form.Item label="可用区" style={{ borderRadius: '0px' }}>
              <Radio.Group
                options={[
                  { label: '可用区1', value: '1' },
                  { label: '可用区2', value: '2' },
                  { label: '可用区3', value: '3' }
                ]}
                value={state.formData.zone}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, formData: { ...prev.formData, zone: e.target.value } }))
                }
              ></Radio.Group>
            </Form.Item>
          </Form>
        </div>
        <div
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '4px',
            borderColor: '#fff',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
            backgroundColor: '#fff',
            marginBottom: '10px'
          }}
        >
          <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ borderRadius: '0px' }}>
            <Form.Item label="CPU架构">
              <Radio.Group
                options={[
                  { label: 'x86计算', value: '1' },
                  { label: '鲲鹏计算', value: '2' }
                ]}
                value={state.formData.cpuArch}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, formData: { ...prev.formData, cpuArch: e.target.value } }))
                }
              ></Radio.Group>
            </Form.Item>
            <Form.Item label="区域">
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                  <Typography.Text children="vCPUs" style={{ width: '80px' }}></Typography.Text>
                  <Select
                    value={state.formData.cpu}
                    onChange={(e) => setState((prev) => ({ ...prev, formData: { ...prev.formData, cpu: e } }))}
                    placeholder="请选择"
                    options={[
                      { value: '1', label: '1 vCPU' },
                      { value: '2', label: '2 vCPU' }
                    ]}
                  ></Select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                  <Typography.Text children="内存" style={{ width: '80px', borderRadius: '0px' }}></Typography.Text>
                  <Select
                    value={state.formData.memory}
                    onChange={(e) => setState((prev) => ({ ...prev, formData: { ...prev.formData, memory: e } }))}
                    placeholder="请选择"
                    options={[
                      { value: '1', label: '黄金糕' },
                      { value: '2', label: '双皮奶' }
                    ]}
                  ></Select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography.Text children="规格名称" style={{ width: '120px' }}></Typography.Text>
                  <Input.Search
                    placeholder="输入关键词"
                    value={state.inputValues.diskLabel}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, inputValues: { ...prev.inputValues, diskLabel: e.target.value } }))
                    }
                  ></Input.Search>
                </div>
              </div>
              <div style={{ borderRadius: '0px' }}>
                <Radio.Group
                  options={[
                    { label: '通用计算型', value: '1' },
                    { label: '通用计算增强型', value: '2' },
                    { label: '内存优化型', value: '3' },
                    { label: '内存优化型', value: '4' },
                    { label: '磁盘增强型', value: '5' },
                    { label: '超高I/O型', value: '6' },
                    { label: 'GPU加速型', value: '7' }
                  ]}
                  value={state.formData.instanceType}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, formData: { ...prev.formData, instanceType: e.target.value } }))
                  }
                  style={{ borderRadius: '0px', marginTop: '12px' }}
                ></Radio.Group>
                <Table
                  editConfig={{ trigger: 'click', mode: 'cell', showStatus: true }}
                  columns={[
                    { type: 'radio', width: 60 },
                    { field: 'employees', title: '规格名称' },
                    { field: 'created_date', title: 'vCPUs | 内存(GiB)', sortable: true },
                    { field: 'city', title: 'CPU', sortable: true },
                    { title: '基准 / 最大带宽\t', sortable: true },
                    { title: '内网收发包', sortable: true }
                  ]}
                  options={[
                    {
                      id: '1',
                      name: 'GFD科技有限公司',
                      city: '福州',
                      employees: 800,
                      created_date: '2014-04-30 00:56:00',
                      boole: false
                    },
                    {
                      id: '2',
                      name: 'WWW科技有限公司',
                      city: '深圳',
                      employees: 300,
                      created_date: '2016-07-08 12:36:22',
                      boole: true
                    }
                  ]}
                  style={{ marginTop: '12px', borderRadius: '0px' }}
                  auto-resize={true}
                ></Table>
                <div style={{ marginTop: '12px', borderRadius: '0px' }}>
                  <Typography.Text
                    children="当前规格"
                    style={{ width: '150px', display: 'inline-block' }}
                  ></Typography.Text>
                  <Typography.Text
                    children="通用计算型 | Si2.large.2 | 2vCPUs | 4 GiB"
                    style={{ fontWeight: '700' }}
                  ></Typography.Text>
                </div>
              </div>
            </Form.Item>
          </Form>
        </div>
        <div
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '4px',
            borderColor: '#fff',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
            backgroundColor: '#fff',
            marginBottom: '10px'
          }}
        >
          <Form
            labelCol="80px"
            layout={false}
            label-position="left "
            label-width="150px"
            style={{ borderRadius: '0px' }}
          >
            <Form.Item label="镜像" style={{ borderRadius: '0px' }}>
              <Radio.Group
                options={[
                  { label: '公共镜像', value: '1' },
                  { label: '私有镜像', value: '2' },
                  { label: '共享镜像', value: '3' }
                ]}
                value={state.formData.imageType}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, formData: { ...prev.formData, imageType: e.target.value } }))
                }
              ></Radio.Group>
              <div style={{ display: 'flex', marginTop: '12px', borderRadius: '0px' }}>
                <Select
                  value={state.formData.storageType}
                  onChange={(e) => setState((prev) => ({ ...prev, formData: { ...prev.formData, storageType: e } }))}
                  placeholder="请选择"
                  options={[
                    { value: '1', label: '黄金糕' },
                    { value: '2', label: '双皮奶' }
                  ]}
                  style={{ width: '170px', marginRight: '10px' }}
                ></Select>
                <Select
                  value={state.formData.storageSize}
                  onChange={(e) => setState((prev) => ({ ...prev, formData: { ...prev.formData, storageSize: e } }))}
                  placeholder="请选择"
                  options={[
                    { value: '1', label: '黄金糕' },
                    { value: '2', label: '双皮奶' }
                  ]}
                  style={{ width: '340px' }}
                ></Select>
              </div>
              <div style={{ marginTop: '12px' }}>
                <Typography.Text label="请注意操作系统的语言类型。" style={{ color: '#e37d29' }}></Typography.Text>
              </div>
            </Form.Item>
          </Form>
        </div>
        <div
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '4px',
            borderColor: '#fff',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
            backgroundColor: '#fff',
            marginBottom: '10px'
          }}
        >
          <Form
            labelCol="80px"
            layout={false}
            label-position="left "
            label-width="150px"
            style={{ borderRadius: '0px' }}
          >
            <Form.Item label="系统盘" style={{ borderRadius: '0px' }}>
              <div style={{ display: 'flex' }}>
                <Select
                  value={state.formData.storageType}
                  onChange={(e) => setState((prev) => ({ ...prev, formData: { ...prev.formData, storageType: e } }))}
                  placeholder="请选择"
                  options={[
                    { value: '1', label: '黄金糕' },
                    { value: '2', label: '双皮奶' }
                  ]}
                  style={{ width: '200px', marginRight: '10px' }}
                ></Select>
                <Input
                  placeholder="请输入"
                  value={state.inputValues.systemDisk}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, inputValues: { ...prev.inputValues, systemDisk: e.target.value } }))
                  }
                  style={{ width: '120px', marginRight: '10px' }}
                ></Input>
                <Typography.Text
                  label="GiB   
IOPS上限240，IOPS突发上限5,000"
                  style={{ color: '#575d6c', fontSize: '12px' }}
                ></Typography.Text>
              </div>
            </Form.Item>
          </Form>
          <Form
            labelCol="80px"
            layout={false}
            label-position="left "
            label-width="150px"
            style={{ borderRadius: '0px' }}
          >
            <Form.Item label="数据盘" style={{ borderRadius: '0px' }}>
              {state.dataDisk.map((item) => (
                <div style={{ marginTop: '12px', display: 'flex' }}>
                  <DatabaseOutlined style={{ marginRight: '10px', width: '16px', height: '16px' }}></DatabaseOutlined>
                  <Select
                    value={state.formData.diskType}
                    onChange={(e) => setState((prev) => ({ ...prev, formData: { ...prev.formData, diskType: e } }))}
                    placeholder="请选择"
                    options={[
                      { value: '1', label: '黄金糕' },
                      { value: '2', label: '双皮奶' }
                    ]}
                    style={{ width: '200px', marginRight: '10px' }}
                  ></Select>
                  <Input
                    placeholder="请输入"
                    value={state.inputValues.dataDiskSize}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        inputValues: { ...prev.inputValues, dataDiskSize: e.target.value }
                      }))
                    }
                    style={{ width: '120px', marginRight: '10px' }}
                  ></Input>
                  <Typography.Text
                    label="GiB   
IOPS上限600，IOPS突发上限5,000"
                    style={{ color: '#575d6c', fontSize: '12px', marginRight: '10px' }}
                  ></Typography.Text>
                  <Input
                    placeholder="请输入"
                    value={state.inputValues.diskLabel}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, inputValues: { ...prev.inputValues, diskLabel: e.target.value } }))
                    }
                    style={{ width: '120px' }}
                  ></Input>
                </div>
              ))}
              <div style={{ display: 'flex', marginTop: '12px', borderRadius: '0px' }}>
                <PlusOutlined style={{ width: '16px', height: '16px', marginRight: '10px' }}></PlusOutlined>
                <Typography.Text
                  label="增加一块数据盘"
                  style={{ fontSize: '12px', borderRadius: '0px', marginRight: '10px' }}
                ></Typography.Text>
                <Typography.Text
                  label="您还可以挂载 21 块磁盘（云硬盘）"
                  style={{ color: '#8a8e99', fontSize: '12px' }}
                ></Typography.Text>
              </div>
            </Form.Item>
          </Form>
        </div>
        <div
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#ffffff',
            paddingTop: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
            backgroundColor: '#fff',
            position: 'fixed',
            inset: 'auto 0% 0% 0%',
            height: '80px',
            lineHeight: '80px',
            borderRadius: '0px'
          }}
        >
          <Row style={{ borderRadius: '0px', height: '100%' }}>
            <Col span="16">
              <Row style={{ borderRadius: '0px' }}>
                <Col span="6">
                  <Typography.Text children="购买量" style={{ marginRight: '10px' }}></Typography.Text>
                  <Input
                    placeholder="请输入"
                    value={state.formData.instanceCount}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, formData: { ...prev.formData, instanceCount: e.target.value } }))
                    }
                    style={{ width: '120px', marginRight: '10px' }}
                  ></Input>
                  <Typography.Text children="台"></Typography.Text>
                </Col>
                <Col span="7">
                  <div>
                    <Typography.Text children="配置费用" style={{ fontSize: '12px' }}></Typography.Text>
                    <Typography.Text
                      children="¥1.5776"
                      style={{ paddingLeft: '10px', color: '#de504e' }}
                    ></Typography.Text>
                    <Typography.Text children="/小时" style={{ fontSize: '12px' }}></Typography.Text>
                  </div>
                  <div>
                    <Typography.Text
                      children="参考价格，具体扣费请以账单为准。"
                      style={{ fontSize: '12px', borderRadius: '0px' }}
                    ></Typography.Text>
                    <Typography.Text
                      children="了解计费详情"
                      style={{ fontSize: '12px', color: '#344899' }}
                    ></Typography.Text>
                  </div>
                </Col>
              </Row>
            </Col>
            <Col
              span="8"
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                borderRadius: '0px',
                height: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}
            >
              <Button
                type="primary"
                style={{ maxWidth: 'unset' }}
                danger={true}
                onClick={function handleFormSubmit() {
                  console.log('Form submitted with data:', state.formData)
                  alert('Form submitted successfully!')
                }}
              >
                下一步: 网络配置
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    </>
  )
}

export default CreateVm
