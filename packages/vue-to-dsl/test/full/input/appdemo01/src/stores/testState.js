import { defineStore } from 'pinia'
export const testState = defineStore({
  id: 'testState',
  state: () => ({
    name: 'testName',
    license: '',
    age: 18,
    food: ['apple', 'orange', 'banana', 19],
    desc: { description: 'hello world', money: 100, other: '', rest: ['a', 'b', 'c', 20] }
  }),
  getters: {
    getAge: function getAge() {
      return this.age
    },
    getName: function getName() {
      return this.name
    }
  },
  actions: {
    setAge: function setAge(age) {
      this.age = age
    },
    setName: function setName(name) {
      this.name = name
    }
  }
})
