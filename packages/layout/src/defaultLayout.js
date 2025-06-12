import { META_APP } from '@opentiny/tiny-engine-meta-register'

export default {
  plugins: {
    left: {
      top: [
        META_APP.Materials,
        META_APP.OutlineTree,
        META_APP.AppManage,
        META_APP.BlockManage,
        META_APP.Collections,
        META_APP.Bridge,
        META_APP.I18n,
        META_APP.Page,
        META_APP.State
      ],
      bottom: [META_APP.Schema, META_APP.Help, META_APP.Robot]
    },
    right: {
      top: [META_APP.Props, META_APP.Styles, META_APP.Event]
    }
  },
  toolbars: {
    left: [META_APP.Breadcrumb, META_APP.Lock, META_APP.Logo],
    center: [META_APP.Media],
    right: [
      [META_APP.ThemeSwitch, META_APP.RedoUndo, META_APP.Clean],
      [META_APP.Preview],
      [META_APP.GenerateCode, META_APP.Save]
    ],
    collapse: [
      [META_APP.Collaboration],
      [META_APP.Refresh, META_APP.Fullscreen],
      [META_APP.Lang],
      [META_APP.ViewSetting]
    ]
  }
}
