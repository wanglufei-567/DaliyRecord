import React from 'react'
import { createRoot } from 'react-dom/client'

const App = () => {
    return (
        <>
            <h1>你好, React!</h1>
        </>
    )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
