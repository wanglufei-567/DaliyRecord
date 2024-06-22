import { linter, Diagnostic } from '@codemirror/lint'
import { MODE } from '../constants'

const parserText = (_text, dialect) => {
    if (!dialect) return []
    const text = _text.replace(/\n+$/, '')
    try {
        window.sqlFormatter.format(text, {
            language: dialect,
        })
        return null
    } catch (error) {
        return error
    }
}

export const lint = ({ mode, dialect }) =>
    linter(view => {
        const diagnostics: Diagnostic[] = []
        let text = view.state.doc.toString()
        if (!text) return diagnostics

        if (mode === MODE.formula) {
            text = `select\n${text}`
        }
        const errors = parserText(text, dialect)
        errors.forEach(error => {
            const { startLine: _startLine, endLine: _endLine, startColumn, endColumn, message } = error
            const startLine = view.state.doc.line(_startLine)
            const endLine = view.state.doc.line(_endLine)

            let { from } = startLine
            if (startColumn <= startLine.text.length) {
                from += startColumn - 1
            } else {
                from += startLine.text.length
            }

            let to = endLine.from
            if (endColumn <= endLine.text.length) {
                to += endColumn - 1
            } else {
                to += endLine.text.length
            }

            let _message = message
            if (mode === MODE.formula) {
                _message = _message.replace(/select\\n/, '')
            }

            diagnostics.push({
                from,
                to,
                severity: 'warning',
                message: _message,
            })
        })
        return diagnostics
    })
