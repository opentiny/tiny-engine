export const logDiffResult = (result) => {
  console.log(
    'Statistics - equal entries: %s, distinct entries: %s, left only entries: %s, right only entries: %s, differences: %s',
    result.equal,
    result.distinct,
    result.left,
    result.right,
    result.differences
  )

  result.diffSet.forEach((dif) => {
    // diff 结果相等
    if (dif.state === 'equal') {
      return
    }

    // diff 结果不相等
    if (dif.state === 'distinct') {
      console.log(`Difference on ${dif.relativePath} ${dif.name1} please compare two files detail.`)
      return
    }

    // diff 结果多余文件
    if (dif.state === 'right') {
      console.log(`unexpected extra file ${dif.path} ${dif.name2}.`)

      return
    }
    // diff 结果缺失文件
    console.log(`expect file: ${dif.path} ${dif.name1}, but result is missing.`)
  })
}
