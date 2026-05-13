import { visit } from 'unist-util-visit'

// 配合 `@expressive-code/plugin-line-numbers`: 单行默认不显示行号
export default function remarkSingleLineNoLineNumbers() {
    return (tree) => {
        visit(tree, 'code', (node) => {
            const lines = node.value.split('\n')

            // 单行
            if (lines.length !== 1) return

            const meta = node.meta ?? ''

            // 用户显式指定了就不要改
            if (
                /\bshowLineNumbers(?:=true|=false)?\b/.test(meta)
            ) {
                return
            }

            node.meta = meta
                ? `${meta} showLineNumbers=false`
                : 'showLineNumbers=false'
        })
    }
}