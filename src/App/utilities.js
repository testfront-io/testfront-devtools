import DiffMatchPatch from 'diff-match-patch'

const DMP = new DiffMatchPatch()

const getDiffs = (text1, text2) => {
  const diffs = DMP.diff_main(text1, text2)

  DMP.diff_cleanupSemantic(diffs)

  return diffs
}

const getPrettyHtml = (diffs) => {
  const DIFF_DELETE = -1
  const DIFF_INSERT = 1
  const DIFF_EQUAL = 0
  const html = []
  const pattern_amp = /&/g
  const pattern_lt = /</g
  const pattern_gt = />/g
  const pattern_para = /\n/g

  for (let x = 0; x < diffs.length; x++) {
    const op = diffs[x][0]
    const data = diffs[x][1]
    const text = data
      .replace(pattern_amp, `&amp`)
      .replace(pattern_lt, `&lt`)
      .replace(pattern_gt, `&gt`)
      .replace(pattern_para, `&para<br>`)

    switch (op) {
      case DIFF_INSERT:
        html[x] = `<ins>${text}</ins>`
        break

      case DIFF_DELETE:
        html[x] = `<del>${text}</del>`
        break

      case DIFF_EQUAL:
        html[x] = `<span>${text}</span>`
        break

      default:
        break
    }
  }
  return html.join(``)
}

export {
  getDiffs,
  getPrettyHtml
}
