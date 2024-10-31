import { Tabs } from 'antd'
// import srcFiles from '../../srcFiles'
import './index.css'
/**
 *
 * @param {{files: {fileName: string, fileContent: string}[],  onSelectFile: () => void}} props
 * @returns
 */
export const FileSelector = (props) => {
  const { onSelectFile } = props
  return (
    <div className="button-group">
      <Tabs
        defaultActiveKey="1"
        tabPosition="top"
        style={{ height: 46, width: '100%' }}
        onTabClick={(key, event) => {
          onSelectFile(event.target?.innerText)
        }}
        // items={Object.keys(srcFiles)?.map((fileName, index) => {
        //   const id = String(index)
        //   return {
        //     label: fileName.toString(),
        //     key: id
        //     // children: `Content of tab ${id}`
        //   }
        // })}
        items={[
          {
            label: 'Main.jsx',
            key: 'Main.jsx'
          }
        ]}
      />
    </div>
  )
}
