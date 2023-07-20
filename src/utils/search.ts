export function validKeyword(keyword: string): string | false {
  if (keyword.trim().length) {
    return false
  } else {
    return '请输入搜索词'
  }
}
