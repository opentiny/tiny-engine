import create from 'zustand'
export const testState = create((set) => ({
  name: 'testName',
  license: "''",
  age: 18,
  food: ['apple', 'orange', 'banana', 19],
  desc: { description: 'hello world', money: 100, other: '', rest: ['a', 'b', 'c', 20] },
  setAge: () =>
    set((state) => {
      function setAge(age) {
        state.age = age
      }
    }),
  setName: () =>
    set((state) => {
      function setName(name) {
        state.name = name
      }
    })
}))
