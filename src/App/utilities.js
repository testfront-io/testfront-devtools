import DiffMatchPatch from 'diff-match-patch'

const DMP = new DiffMatchPatch()
const getDiff = DMP.diff_main.bind(DMP)
const getPrettyHtml = DMP.diff_prettyHtml.bind(DMP)

export {
  getDiff,
  getPrettyHtml
}
