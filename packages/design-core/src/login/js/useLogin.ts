import { reactive } from 'vue'

const characters = `!@#$%^&*()_+-=[};":|,'<>?。`
const passwordRules = [
  {
    content: ['密码长度8-20个字符。', '密码必须包含：大写字母、小写字母、数字。'],
    rule: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,20}$/,
    pass: false
  },
  {
    content: [`密码必须包含特殊字符：${characters}`],
    rule: /^(?=.*[!@#$%^&*()_+\-=[}\]{;":|,.'<>?]).+$/,
    pass: false
  },
  {
    content: ['不能3个及以上连续相同字符。'],
    rule: /^(?!.*(.)\1\1).+$/,
    pass: false
  }
]

const LOGIN = 'login'
const REGISTER = 'register'
const FORGOT = 'forgot'
const SUCCESS = 'success'

const userState = reactive({
  publicKey: ''
})

export default () => {
  return {
    passwordRules,
    LOGIN,
    REGISTER,
    FORGOT,
    SUCCESS,
    userState
  }
}
